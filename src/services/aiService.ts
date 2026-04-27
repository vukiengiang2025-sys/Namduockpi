import { GoogleGenAI } from '@google/genai';
import { useAppStore } from '../store';

export interface AIAction {
  task: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIInsight {
  status: 'tốt' | 'nguy hiểm' | 'rất nguy hiểm' | string;
  main_issue: string;
  actions: AIAction[];
  daily_target?: string;
  references?: string[]; // IDs or titles of memories used
}

function scoreMemory(memory: Memory, status: string, salesRatio: number): number {
  let score = 0;
  const now = Date.now();
  const ageDays = (now - memory.createdAt) / (1000 * 60 * 60 * 24);

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
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const ai = new GoogleGenAI({ apiKey });

  // Format memories context
  let memoryContext = '';
  if (scoredMemories.length > 0) {
    memoryContext = '\nNGỮ CẢNH QUAN TRỌNG (Dựa trên trí nhớ hệ thống):\n' + scoredMemories.map(({memory: m}) => 
      `- [${m.tags.join(', ')}] ${m.title}: ${m.summary}`
    ).join('\n');
  }

  const prompt = `Bạn là một trợ lý ảo quản lý bán hàng (FMCG/Dược) có "trí nhớ".

DỮ LIỆU HIỆN TẠI:
- % Doanh số đạt: ${salesPercent.toFixed(1)}%
- % Thời gian trôi qua: ${timePercent.toFixed(0)}%
- Dự báo cuối tháng: ${forecast.toFixed(1)}%
- SKU trung bình: ${sku.toFixed(1)}
- Độ phủ (Coverage): ${coverage.toFixed(1)}
- Số ngày còn lại: ${remainingDays}
- Năng suất hiện tại: ${avgDailySales.toFixed(1)}/ngày
- Năng suất CẦN THIẾT: ${requiredDailySales.toFixed(1)}/ngày
${memoryContext}

YÊU CẦU:
1. Đánh giá tình trạng (status).
2. "Mục tiêu hôm nay" (daily_target): Đưa ra 1 con số doanh số cụ thể cần đạt ngay hôm nay.
3. 3 hành động cụ thể (actions). Mỗi hành động phải:
   - Gắn liền với số liệu (vd: viếng thăm 5 shop, bán thêm 2tr SKU A).
   - Tận dụng thông tin từ NGỮ CẢNH (Khuyến mãi/Chính sách) nếu có.
   - Không đề xuất năng suất quá 200% hiện tại.
4. Liệt kê các "references": Tiêu đề của các Memory mà bạn đã sử dụng để đưa ra gợi ý.

TRẢ VỀ JSON DUY NHẤT:
{
  "status": "tốt|nguy hiểm|rất nguy hiểm",
  "main_issue": "...",
  "daily_target": "Bán 15.5tr doanh số ngay hôm nay",
  "actions": [
    { "task": "...", "priority": "high|medium|low" }
  ],
  "references": ["Tiêu đề memory 1", "Tiêu đề memory 2"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      }
    });

    const text = response.text();
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
