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

    const prompt = `Bạn là ĐẶC PHÁI VIÊN Cố vấn Chiến thuật cấp cao của Nam Dược.
Nhiệm vụ: Phân tích các lỗ hổng KPI và đề xuất "Kế hoạch Tác chiến" (Daily Battle Plan) hằng ngày để cứu vãn hoặc bứt phá doanh số.
Phong cách: Quyết đoán, trực diện, không nói suông, tập trung 100% vào hành động ra tiền.

DỮ LIỆU CỨNG:
${deterministicAlert}
- % Doanh số đạt: ${salesPercent.toFixed(1)}%
- % Thời gian trôi qua: ${timePercent.toFixed(0)}%
- Dự báo cuối tháng: ${forecast.toFixed(1)}%
- SKU hiện tại: ${sku.toFixed(1)}
- Độ phủ (Coverage): ${coverage.toFixed(1)}
- Số ngày còn lại: ${remainingDays}
- Năng suất CẦN THIẾT: ${requiredDailySales.toFixed(1)}/ngày
${strategicConstraint}
${userSkillContext}
${historyContext}
${memoryContext}

QUY TẮC CỐ VẤN:
1. Ưu tiên hành động từ "NGỮ CẢNH TRÍ NHỚ" nếu độ liên quan > 70%.
2. Phải chỉ ra nguyên nhân cốt lõi trong "main_issue" dựa trên so sánh Doanh số vs Thời gian.

YÊU CẦU ĐẦU RA (JSON):
{
  "status": "tốt|nguy hiểm|rất nguy hiểm",
  "riskAlert": "Cảnh báo cụ thể về rủi ro hụt KPI",
  "main_issue": "Nguyên nhân chính dẫn đến tình trạng hiện tại",
  "daily_target": "X triệu doanh số",
  "actions": [
    { 
      "task": "Nội dung hành động cụ thể và hành động được ngay", 
      "type": "coverage|sales|sku|other",
      "priority": "high", 
      "impact": "Tăng trưởng dự kiến (VD: +2%)",
      "expectedImpact": "Giá trị quy đổi (VD: +1.5tr VNĐ)",
      "confidence": 0.85,
      "confidenceDetails": { "dataQuality": 0.9, "historicalSupport": 0.8, "memoryMatch": 0.9 }
    }
  ],
  "references": ["..."]
}

LƯU Ý QUAN TRỌNG:
1. Phải luôn đề xuất THỨ TỰ ƯU TIÊN (Priority) dựa trên Impact và Confidence.
2. Hành động phải cực kỳ cụ thể (VD: "Gọi khách B ngay" thay vì "Chăm sóc khách hàng").
3. Thêm tính cấp bách (Urgency) vào phần riskAlert.`;

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
    const prompt = `Bạn là trợ lý thông minh của hệ thống NAMDUOC KPI. 
Dựa vào ngữ cảnh dưới đây, hãy trả lời câu hỏi của người dùng một cách ngắn gọn, chính xác. 
Ưu tiên trích dẫn các con số kpi, chiết khấu hoặc tên sản phẩm có trong tài liệu.
Nếu thông tin không có trong tài liệu, hãy nói rõ là "Thông tin này không có trong tài liệu tôi đang đọc".

NGỮ CẢNH:
"""
${context}
"""

CÂU HỎI: "${question}"

TRẢ LỜI (ngắn gọn, tối đa 3 câu, trình bày chuyên nghiệp):`;

    const response = await ai.models.generateContent({
      model: state.settings.geminiModel || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.2,
      }
    });

    return response.text.trim();
  });
}
