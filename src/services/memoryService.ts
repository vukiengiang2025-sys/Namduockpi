import { GoogleGenAI } from '@google/genai';
import { useAppStore, Memory } from '../store';

export async function summarizeAsMemory(text: string): Promise<Omit<Memory, 'id' | 'createdAt'>> {
  const { settings } = useAppStore.getState();
  const apiKey = settings.geminiKey;

  if (!apiKey) {
    throw new Error('Chưa cấu hình Gemini API Key trong phần Cài đặt.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Bạn là một hệ thống phân tích và quản lý tri thức cho người quản lý bán hàng.
Nhiệm vụ của bạn là đọc đoạn văn bản/văn kiện dưới đây và tóm tắt nó thành các điểm cốt lõi để lưu vào "Memory" (Trí nhớ dài hạn).

Văn bản:
"""
${text}
"""

Yêu cầu:
- Tìm một tiêu đề ngắn gọn phản ánh đúng nhất.
- Viết một tóm tắt tổng quan từ 1 đến 2 câu.
- Trích xuất 3-5 điểm mấu chốt quan trọng nhất.
- Gắn thẻ (tags). Các thẻ nên ngắn gọn, tiếng anh hoặc tiếng việt không dấu (vd: khuyen-mai, policy, kpi-rules, quy-dinh, doi-thu, mat-hang...).

Trả về ĐÚNG MỘT JSON OBJECT theo định dạng:
{
  "title": "Tiêu đề ngắn",
  "summary": "Tóm tắt 1-2 câu",
  "keyPoints": ["Điểm 1", "Điểm 2", "Điểm 3"],
  "tags": ["tag1", "tag2"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: settings.geminiModel || 'gemini-1.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      }
    });

    const outputText = response.text();
    if (!outputText) {
      throw new Error('AI không phản hồi.');
    }

    let jsonStr = outputText.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.substring(7);
      if (jsonStr.endsWith('\`\`\`')) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    }

    const data = JSON.parse(jsonStr) as Omit<Memory, 'id' | 'createdAt'>;
    return data;
  } catch (err: any) {
    console.error('AI Memory Error:', err);
    throw new Error('Lỗi khi tóm tắt văn bản bằng AI: ' + (err.message || 'Unknown error'));
  }
}
