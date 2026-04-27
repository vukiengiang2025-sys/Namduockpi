import { GoogleGenAI } from '@google/genai';
import { useAppStore, WeeklyReport, DailySnapshot } from '../store';

export async function generateWeeklyReport(
  startDate: string,
  endDate: string
): Promise<WeeklyReport> {
  const state = useAppStore.getState();
  const apiKey = state.settings.geminiKey;
  const snapshots = state.dailySnapshots.filter(s => s.date >= startDate && s.date <= endDate);
  
  if (!apiKey) {
    throw new Error('Chưa cấu hình Gemini API Key.');
  }

  if (snapshots.length < 2) {
    throw new Error('Cần ít nhất dữ liệu của 2 ngày trong tuần để phân tích xu hướng.');
  }

  // Calculate base stats
  const avgKpiScore = snapshots.reduce((acc, s) => acc + s.kpiScore, 0) / snapshots.length;
  const salesStart = snapshots[0].salesActual;
  const salesEnd = snapshots[snapshots.length - 1].salesActual;
  const salesGrowth = salesEnd - salesStart;
  const tasksCompletionRate = snapshots.reduce((acc, s) => acc + (s.tasksTotal > 0 ? s.tasksCompleted / s.tasksTotal : 0), 0) / snapshots.length;

  // Attribution calculation (Simplified)
  const startTs = snapshots[0].timestamp || new Date(snapshots[0].date).getTime();
  const endTs = snapshots[snapshots.length - 1].timestamp || new Date(snapshots[snapshots.length - 1].date).getTime() + 86400000;
  
  const taskLogs = state.taskLogs.filter(l => l.timestamp >= startTs && l.timestamp <= endTs);
  const totalEffortGain = taskLogs.reduce((acc, l) => acc + (l.kpiAtEnd - l.kpiAtStart), 0);
  const totalKpiGain = snapshots[snapshots.length - 1].kpiScore - snapshots[0].kpiScore;
  
  const effortContribution = totalKpiGain > 0 ? Math.min(100, Math.max(0, (totalEffortGain / totalKpiGain) * 100)) : 0;
  const organicContribution = 100 - effortContribution;

  const ai = new GoogleGenAI({ apiKey });
  
  const memoryContext = state.memories?.length > 0 
    ? '\nTRÍ NHỚ HỆ THỐNG:\n' + state.memories.slice(0, 5).map(m => `- ${m.title}: ${m.summary}`).join('\n')
    : '';

  const taskContext = taskLogs.length > 0
    ? '\nKẾT QUẢ CÁC HÀNH ĐỘNG ĐÃ LÀM:\n' + taskLogs.map(l => `- Task: ${l.text}, KPI tăng: ${(l.kpiAtEnd - l.kpiAtStart).toFixed(2)}`).join('\n')
    : '';

  const prompt = `Bạn là một chuyên gia phân tích dữ liệu bán hàng cấp cao.
Hãy phân tích kết quả tuần vừa qua (${startDate} đến ${endDate}) và đưa ra chiến lược cho tuần tới.

DỮ LIỆU TUẦN:
- Điểm KPI trung bình: ${avgKpiScore.toFixed(1)}/100
- Doanh số tăng trưởng trong tuần: ${salesGrowth.toFixed(1)} (đơn vị doanh số)
- Tỷ lệ hoàn thành task: ${(tasksCompletionRate * 100).toFixed(1)}%
- Phân bổ tăng trưởng: ${organicContribution.toFixed(0)}% tự nhiên, ${effortContribution.toFixed(0)}% từ nỗ lực cá nhân.
${taskContext}
${memoryContext}

YÊU CẦU:
1. Phân tích "Tại sao" (Why): Giải thích ngắn gọn về hiệu suất tuần qua (1-2 câu).
2. Trọng tâm tuần tới (Focus): Xác định 1 mục tiêu chiến lược cốt lõi.
3. Kế hoạch hành động (Action Plan): Đề xuất 3-4 hành động cụ thể cho tuần tới.
4. "bestActionType": Loại hành động hiệu quả nhất dựa trên log (vd: Mở shop, Chăm sóc khách cũ...).

TRẢ VỀ JSON DUY NHẤT:
{
  "why": "...",
  "focus": "...",
  "actionPlan": ["...", "...", "..."],
  "topPerformers": ["Tên task/chỉ số tốt nhất"],
  "bestActionType": "..."
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

    const aiData = JSON.parse(jsonStr);

    const report: WeeklyReport = {
      id: Math.random().toString(36).substring(2, 9),
      startDate,
      endDate,
      monthIndex: state.selectedMonthIndex,
      stats: {
        avgKpiScore,
        salesGrowth,
        tasksCompletionRate,
        topPerformers: aiData.topPerformers || [],
        attribution: {
          organic: organicContribution,
          effort: effortContribution
        }
      },
      analysis: {
        why: aiData.why,
        focus: aiData.focus,
        actionPlan: aiData.actionPlan,
        bestActionType: aiData.bestActionType
      },
      createdAt: Date.now()
    };

    const reportIndex = state.selectedMonthIndex;
    const successScore = Math.min(100, (avgKpiScore * 0.7) + (tasksCompletionRate * 30));

    // Save Strategy Log (Historical Success)
    state.addStrategyLog({
      focus: aiData.focus,
      successScore,
      monthIndex: reportIndex
    });

    // Update User Profile Skills (Learning)
    // If weekly KPI is high (> 60), we increment the skill associated with the best action
    if (avgKpiScore > 60) {
      const type = aiData.bestActionType?.toLowerCase() || '';
      const newSkills = { ...state.userProfile.skills };
      
      if (type.includes('coverage') || type.includes('mở shop')) newSkills.coverage = Math.min(2.0, newSkills.coverage + 0.05);
      if (type.includes('sales') || type.includes('doanh số')) newSkills.sales = Math.min(2.0, newSkills.sales + 0.05);
      if (type.includes('sku') || type.includes('hàng')) newSkills.sku = Math.min(2.0, newSkills.sku + 0.05);
      
      state.updateUserProfile({ skills: newSkills });
    }

    return report;
  } catch (error: any) {
    console.error('Weekly Report Error:', error);
    throw new Error('Lỗi khi tạo báo cáo tuần: ' + error.message);
  }
}
