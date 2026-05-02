import { GoogleGenAI } from '@google/genai';
import { useAppStore, AIAction, AIInsight, Memory } from '../store';

// Thuật toán tính độ tương đồng Cosine giữa 2 vector số thực
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

// Hàm lấy Embedding từ Gemini
export async function getEmbedding(text: string): Promise<number[]> {
  const state = useAppStore.getState();
  const apiKey = state.settings.geminiKey;
  if (!apiKey) throw new Error('Chưa cấu hình API Key.');

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: [{ parts: [{ text }] }]
    });
    return response.embeddings[0].values;
  } catch (error) {
    console.error("Embedding Error:", error);
    return [];
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('503') || error.message?.includes('high demand'))) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function getAIInsight(
  salesPercent: number,
  timePercent: number,
  forecast: number,
  sku: number,
  coverage: number,
  remainingDays: number,
  avgDailySales: number,
  requiredDailySales: number
): Promise<AIInsight> {
  return withRetry(async () => {
    const state = useAppStore.getState();
    const apiKey = state.settings.geminiKey;
    const allMemories = state.memories || [];

    if (!apiKey) {
      throw new Error('Chưa cấu hình Gemini API Key trong phần Cài đặt.');
    }

    // --- SEMANTIC MEMORY SEARCH ENGINE ---
    let scoredMemories: { memory: Memory, score: number }[] = [];
    
    try {
      // Nhúng ngữ cảnh hiện tại thành vector để tìm kiếm
      const currentContextText = `KPI: Doanh số ${salesPercent.toFixed(1)}%, Thời gian ${timePercent}%. SKU: ${sku.toFixed(1)}, Coverage: ${coverage.toFixed(1)}.`;
      const currentQueryEmbedding = await getEmbedding(currentContextText);

      if (currentQueryEmbedding.length > 0 && allMemories.length > 0) {
        scoredMemories = allMemories
          .map(m => {
            let score = 0;
            // Nếu có embedding, dùng Cosine Similarity (Trọng số 2.0)
            if (m.embedding && m.embedding.length > 0) {
              score = cosineSimilarity(currentQueryEmbedding, m.embedding) * 2.0;
            } else {
              // Dự phòng: Nếu chưa có embedding (ký ức cũ), dùng keyword matching (Trọng số 0.5)
              const keywordMatch = m.tags.some(t => currentContextText.toLowerCase().includes(t.toLowerCase())) ? 0.5 : 0;
              score = keywordMatch;
            }
            return { memory: m, score };
          })
          .filter(m => m.score > 0) // Chỉ lấy những gì thực sự liên quan
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
      }
    } catch (err) {
      console.warn("Semantic Search failed, falling back to basic recency", err);
      scoredMemories = allMemories.slice(0, 5).map(m => ({ memory: m, score: 0.1 }));
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. DETERMINISTIC GUARD: Ép AI nhìn thẳng vào sự thật số liệu
    const gap = salesPercent - timePercent;
    const isDanger = salesPercent < timePercent;
    const deterministicAlert = isDanger 
      ? `CẢNH BÁO: Doanh số (${salesPercent.toFixed(1)}%) đang THẤP HƠN thời gian (${timePercent.toFixed(0)}%). Độ lệch âm: ${gap.toFixed(1)}%. PHẢI ưu tiên các hành động tạo ra doanh số ngay lập tức.`
      : `THÔNG BÁO: Doanh số đang đạt tiến độ tốt. Tập trung vào tối ưu SKU và Coverage để bứt phá.`;

    // Strategic Alignment: Fetch latest weekly focus
    const latestWeeklyReport = state.weeklyReports?.[0];
    const strategicConstraint = latestWeeklyReport 
      ? `\nCHIẾN LƯỢC TUẦN (BẮT BUỘC): ${latestWeeklyReport.analysis.focus}`
      : '';

    // User Profile Context
    const userProfile = state.userProfile;
    const userSkillContext = `\nĐẶC ĐIỂM NGƯỜI DÙNG:
- Kỹ năng Coverage: ${userProfile.skills.coverage.toFixed(1)}x (Baseline 1.0)
- Kỹ năng Sales: ${userProfile.skills.sales.toFixed(1)}x
- Kỹ năng SKU: ${userProfile.skills.sku.toFixed(1)}x`;

    // Historical Strategy Context
    const strategyLogs = state.strategyLogs.slice(0, 3);
    const historyContext = strategyLogs.length > 0
      ? `\nLỊCH SỬ CHIẾN LƯỢC HIỆU QUẢ:\n` + strategyLogs.map(l => `- Tập trung: ${l.focus}, Điểm thành công: ${l.successScore}/100`).join('\n')
      : '';

    // Format memories context
    let memoryContext = '';
    if (scoredMemories.length > 0) {
      memoryContext = '\nNGỮ CẢNH TRÍ NHỚ (Truy xuất bằng Semantic Search):\n' + scoredMemories.map(({memory: m, score}) => 
        `- [Độ liên quan: ${(score/2*100).toFixed(0)}%] ${m.title}: ${m.summary}\n  * Điểm mấu chốt: ${m.keyPoints.join(', ')}`
      ).join('\n');
    }

    const prompt = `Bạn là SIÊU CỐ VẤN CHIẾN LƯỢC (AI PREDICTIVE) của Nam Dược.
Nhiệm vụ: Không chỉ phân tích quá khứ, bạn phải DỰ BÁO tương lai và đưa ra các quyết định hành động để đảm bảo 100% mục tiêu.

DỮ LIỆU ĐỊNH LƯỢNG (REAL-TIME):
${deterministicAlert}
- Tiến độ Doanh số: ${salesPercent.toFixed(1)}%
- Tiến độ Thời gian: ${timePercent.toFixed(0)}% (Ngày ${new Date().getDate()}/30)
- Trend hiện tại (Run-rate): ${(salesPercent / (timePercent || 1) * 100).toFixed(1)}% so với kế hoạch
- Dự báo tự động (cơ bản): ${forecast.toFixed(1)}%
- Số ngày còn lại để "về đích": ${remainingDays} ngày
- Năng suất trung bình đang đạt: ${avgDailySales.toFixed(1)}/ngày
- Năng suất CẦN THIẾT để đạt 100%: ${requiredDailySales.toFixed(1)}/ngày
${strategicConstraint}
${userSkillContext}
${historyContext}
${memoryContext}

QUY TẮC CỐ VẤN PREDICTIVE:
1. Tính toán "Khoảng cách thiếu hụt" (Gap) tại ngày 30 nếu giữ nguyên tốc độ này.
2. Đưa ra dự báo (Estimated Finish) dựa trên run-rate và đặc điểm kỹ năng người dùng.
3. Nếu "Estimated Finish" < 100%, riskAlert phải cực kỳ gắt và chỉ đích danh "vùng trũng" (Sales, Coverage, hay SKU).
4. Hành động phải tập trung vào việc "xoay chuyển dự báo" (VD: Tập trung vào SKU tập trung có điểm KPI cao để kéo điểm tổng).

YÊU CẦU ĐẦU RA (JSON CHUẨN):
{
  "status": "tốt|nguy hiểm|rất nguy hiểm",
  "riskAlert": "Cảnh báo dự báo hụt bao nhiêu % if continue current trend",
  "main_issue": "Nguyên nhân cốt lõi khiến dự báo không đạt 100%",
  "daily_target": "Con số doanh số hằng ngày phải đạt từ mai",
  "prediction": {
    "estimatedFinish": 85.5,
    "gapToGoal": 14.5,
    "trend": "up|down|stable",
    "message": "Lời giải thích ngắn gọn về dự báo (VD: Với đà này bạn sẽ hụt 15% mục tiêu...)"
  },
  "actions": [
    { 
      "task": "Nội dung hành động cụ thể", 
      "type": "coverage|sales|sku|other",
      "priority": "high", 
      "impact": "Mức đóng góp vào việc lấp đầy Gap (VD: +3%)",
      "expectedImpact": "Giá trị quy đổi",
      "confidence": 0.85
    }
  ]
}

PHONG CÁCH: Chuyên nghiệp, sắc bén, trọng tâm vào con số dự báo.`;

    const response = await ai.models.generateContent({
      model: state.settings.geminiModel || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error('AI không phản hồi.');
    
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    }

    return JSON.parse(jsonStr) as AIInsight;
  });
}

export async function chatWithContext(context: string, question: string): Promise<string> {
  return withRetry(async () => {
    const state = useAppStore.getState();
    const apiKey = state.settings.geminiKey;

    if (!apiKey) {
      throw new Error('Chưa cấu hình Gemini API Key.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Bạn là "Cố vấn Trí tuệ Nam Dược" - Một hệ thống AI chuyên sâu về phân tích dữ liệu KPI và tài liệu doanh nghiệp.
Nhiệm vụ: Dựa trên NGỮ CẢNH được cung cấp, hãy giải đáp câu hỏi của người dùng một cách chuyên nghiệp, chính xác và có tính hành động cao.

NGỮ CẢNH DỮ LIỆU ĐÃ NẠP:
"""
${context}
"""

HƯỚNG DẪN TRẢ LỜI:
1. Trích dẫn chính xác số liệu, tên sản phẩm hoặc mốc thời gian có trong tài liệu.
2. Nếu câu hỏi yêu cầu tính toán hoặc so sánh dựa trên dữ liệu hiện có, hãy thực hiện nó một cách logic.
3. Nếu thông tin KHÔNG có trong dữ liệu trên, hãy tế nhị nói rõ: "Dữ liệu hiện tại không đề cập đến vấn đề này, tôi chỉ có thể thông tin về [liệt kê nhanh các chủ đề chính có trong tài liệu]".
4. Định dạng: Sử dụng Markdown (vạch đầu dòng, in đậm các con số quan trọng) để dễ đọc.

CÂU HỎI CỦA NGƯỜI DÙNG: "${question}"

TRẢ LỜI (ngôn ngữ tiếng Việt, ngắn gọn nhưng đầy đủ, chuyên nghiệp):`;

    const response = await ai.models.generateContent({
      model: state.settings.geminiModel || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.2, // Giữ độ chính xác cao
        topP: 0.8,
      }
    });

    return response.text.trim();
  });
}
