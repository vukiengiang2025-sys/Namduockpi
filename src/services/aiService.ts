import { GoogleGenAI } from '@google/genai';
import { useAppStore, AIAction, AIInsight, Memory } from '../store';

function scoreMemory(memory: Memory, status: string, salesRatio: number): number {
  let score = 0;
  const now = Date.now();
  const ageDays = (now - memory.createdAt) / (1000 * 60 * 60 * 24);

  // Expiry check: if memory is > 45 days old, it's likely obsolete for FMCG
  if (ageDays > 45) return -1;

  // Recency: newer is better (up to 1 point)
  score += Math.max(0, 1 - (ageDays / 30));

  // Relevance to status (danger vs good)
  const isDanger = status.includes('nguy hiểm');
  if (isDanger && (memory.tags.includes('nguy-hiem') || memory.tags.includes('canh-bao'))) score += 2;
  
  // Specific category matches
  if (memory.tags.includes('promotion') || memory.tags.includes('khuyen-mai')) score += 1.5;
  if (memory.tags.includes('policy') || memory.tags.includes('chinh-sach')) score += 1.2;

  // Logic: if sales are low, prioritize "push" actions
  if (salesRatio < 0.8 && memory.tags.includes('push-sales')) score += 1;

  return score;
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
  const state = useAppStore.getState();
  const apiKey = state.settings.geminiKey;
  const allMemories = state.memories || [];

  if (!apiKey) {
    throw new Error('Chưa cấu hình Gemini API Key trong phần Cài đặt.');
  }

  // Determine rough status for scoring
  const roughStatus = salesPercent < timePercent ? 'nguy hiểm' : 'tốt';

  // Score and pick top 5 memories
  const scoredMemories = allMemories
    .map(m => ({ memory: m, score: scoreMemory(m, roughStatus, salesPercent / 100) }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const ai = new GoogleGenAI({ apiKey });

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
    memoryContext = '\nNGỮ CẢNH QUAN TRỌNG (Dựa trên trí nhớ hệ thống):\n' + scoredMemories.map(({memory: m}) => 
      `- [${m.tags.join(', ')}] ${m.title}: ${m.summary}`
    ).join('\n');
  }

  const prompt = `Bạn là một chuyên gia quản lý bán hàng FMCG/Dược thông minh.
Nhiệm vụ: Phân tích dữ liệu và đề xuất "Chiến thuật đánh trận" hằng ngày (Daily Battle Plan).

DỮ LIỆU HIỆN TẠI:
- % Doanh số đạt: ${salesPercent.toFixed(1)}%
- % Thời gian trôi qua: ${timePercent.toFixed(0)}%
- Dự báo cuối tháng: ${forecast.toFixed(1)}%
- SKU hiện tại: ${sku.toFixed(1)}
- Độ phủ (Coverage): ${coverage.toFixed(1)}
- Số ngày còn lại: ${remainingDays}
- Năng suất hiện tại: ${avgDailySales.toFixed(1)}/ngày
- Năng suất CẦN THIẾT: ${requiredDailySales.toFixed(1)}/ngày
${strategicConstraint}
${userSkillContext}
${historyContext}
${memoryContext}

QUY TẮC CÁ NHÂN HOÁ:
1. Ưu tiên các task thuộc kỹ năng mạnh của người dùng (skill > 1.0).
2. Nếu người dùng yếu một kỹ năng (skill < 0.8), hãy đưa ra task cụ thể, chi tiết hơn để hỗ trợ.

YÊU CẦU ĐẦU RA:
1. Đánh giá tình trạng (status).
2. "riskAlert": Nếu dự báo < 95% hoặc có xu hướng giảm, hãy đưa ra cảnh báo sớm (ngắn gọn).
3. "Mục tiêu hôm nay": Con số doanh số cụ thể.
4. 3 hành động cụ thể. Mỗi hành động phải có:
   - "task": mô tả chi tiết.
   - "type": coverage|sales|sku|other.
   - "priority": high|medium|low.
   - "impact": Dự kiến đóng góp (vd: +2% doanh số).
   - "confidence": Điểm tin cậy (0.0 - 1.0).
   - "confidenceDetails": { "dataQuality": 0-1, "historicalSupport": 0-1, "memoryMatch": 0-1 }.
5. "references": Các Memory đã dùng.

TRẢ VỀ JSON DUY NHẤT:
{
  "status": "tốt|nguy hiểm|rất nguy hiểm",
  "riskAlert": "...",
  "main_issue": "...",
  "daily_target": "...",
  "actions": [
    { 
      "task": "...", 
      "type": "...",
      "priority": "high", 
      "target": 5, 
      "impact": "+2%", 
      "confidence": 0.9,
      "confidenceDetails": { "dataQuality": 0.9, "historicalSupport": 0.8, "memoryMatch": 0.9 }
    }
  ],
  "references": ["..."]
}`;

  try {
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
  } catch (error: any) {
    console.error('AI Insight Error:', error);
    throw new Error(error.message || 'Lỗi khi lấy đánh giá từ AI.');
  }
}
