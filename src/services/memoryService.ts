import { GoogleGenAI } from '@google/genai';
import { useAppStore, Memory } from '../store';
import { getEmbedding } from './aiService';

export async function summarizeAsMemory(text: string): Promise<Omit<Memory, 'id' | 'createdAt'>> {
  const { settings } = useAppStore.getState();
  const apiKey = settings.geminiKey;

  if (!apiKey) {
    throw new Error('Chưa cấu hình Gemini API Key trong phần Cài đặt.');
  }

  // 1. Tạo Embedding song song với việc tóm tắt để tối ưu tốc độ
  const embeddingPromise = getEmbedding(text);

  const ai = new GoogleGenAI({ apiKey });
  const customPrompt = settings.customPrompts?.memorySummary || 'Bạn là một hệ thống phân tích và quản lý tri thức cho người quản lý bán hàng. Nhiệm vụ của bạn là đọc đoạn văn bản/văn kiện và tóm tắt thành các điểm cốt lõi.';

  const prompt = `${customPrompt}

Văn bản cần xử lý:
"""
${text}
"""

Yêu cầu định dạng đầu ra (JSON):
- title: Tiêu đề ngắn gọn.
- summary: Tóm tắt 1-2 câu quan trọng nhất.
- keyPoints: Danh sách 3-5 điểm mấu chốt, con số, điều kiện.
- tags: Gắn thẻ liên quan (vd: promotion, policy, kpi).

Trả về ĐÚNG MỘT JSON OBJECT theo định dạng:
{
  "title": "...",
  "summary": "...",
  "keyPoints": ["...", "..."],
  "tags": ["...", "..."]
}`;

  try {
    const response = await ai.models.generateContent({
      model: settings.geminiModel || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('AI không phản hồi.');
    }

    let jsonStr = outputText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7);
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    }

    const data = JSON.parse(jsonStr) as Omit<Memory, 'id' | 'createdAt'>;
    
    // 2. Lấy kết quả Embedding
    const embedding = await embeddingPromise;
    if (embedding.length > 0) {
      (data as any).embedding = embedding;
    }

    return data;
  } catch (err: any) {
    console.error('AI Memory Error:', err);
    if (err.message?.includes('503') || err.message?.includes('high demand')) {
      throw new Error('AI đang quá tải (Lỗi 503). Hãy thử lại sau vài giây.');
    }
    throw new Error('Lỗi khi tóm tắt văn bản bằng AI: ' + (err.message || 'Unknown error'));
  }
}

export async function consolidateMemories(memories: Memory[]): Promise<Omit<Memory, 'id' | 'createdAt'>> {
  const { settings } = useAppStore.getState();
  const apiKey = settings.geminiKey;

  if (!apiKey) {
    throw new Error('Vui lòng cấu hình Gemini API Key.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const allContent = memories.map(m => `--- ${m.title} ---\n${m.summary}\n${m.keyPoints.join(', ')}`).join('\n\n');
  
  // Tạo Embedding song song
  const embeddingPromise = getEmbedding(allContent);
  
  const customPrompt = settings.customPrompts?.memoryConsolidation || 'Bạn là chuyên gia tối ưu hóa dữ liệu. Hãy tổng hợp các bản ghi nhớ.';

  const prompt = `${customPrompt}
  Nhiệm vụ: Hãy tổng hợp TẤT CẢ các nội dung dưới đây thành một bản "SIÊU TÓM TẮT" duy nhất. 
  Bản này phải giữ lại toàn bộ các quy tắc, con số kpi, chiết khấu và chiến lược cốt lõi nhưng bỏ đi những từ ngữ rườm rà.
  Mục tiêu: Tạo ra một "Bộ não chiến lược" nhỏ gọn nhưng đầy đủ để AI khác có thể đọc nhanh và tư vấn chính xác.

  Trả về ĐÚNG MỘT JSON OBJECT theo định dạng:
  {
    "title": "Bộ Não Chiến Lược Tổng Hợp",
    "summary": "Nội dung tổng hợp cực kỳ chất lượng và súc tích...",
    "keyPoints": ["Điểm cốt lõi 1", "Điểm cốt lõi 2", "..."],
    "tags": ["tong-hop", "chien-luoc"]
  }

  DỮ LIỆU CẦN TỔNG HỢP:
  ${allContent}`;

  try {
    const response = await ai.models.generateContent({
      model: settings.geminiModel || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error('AI không phản hồi.');

    let jsonStr = outputText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7);
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    }

    const data = JSON.parse(jsonStr) as Omit<Memory, 'id' | 'createdAt'>;
    const embedding = await embeddingPromise;
    if (embedding.length > 0) {
      (data as any).embedding = embedding;
    }
    return data;
  } catch (error: any) {
    throw new Error('Lỗi tóm tắt gộp: ' + (error.message || 'Unknown error'));
  }
}
