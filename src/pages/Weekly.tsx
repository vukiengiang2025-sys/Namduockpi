import React, { useState } from 'react';
import { useAppStore, WeeklyReport } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Calendar, TrendingUp, CheckCircle2, ChevronRight, Loader2, Sparkles, AlertCircle, BarChart3, ArrowRight } from 'lucide-react';
import { generateWeeklyReport } from '../services/weeklyService';

export default function WeeklyDigest() {
  const { weeklyReports, addWeeklyReport, settings, dailySnapshots, taskLogs } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(weeklyReports[0]?.id || null);

  const selectedReport = weeklyReports.find(r => r.id === selectedReportId);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const today = new Date();
      const end = today.toISOString().split('T')[0];
      const start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const report = await generateWeeklyReport(start, end);
      addWeeklyReport(report);
      setSelectedReportId(report.id);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24"
    >
      <div className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Chiến lược & Học hỏi</span>
          </div>
        </div>
        <h1 className="text-2xl font-light text-white tracking-tight">Weekly <span className="font-bold text-purple-400">Digest</span></h1>
      </div>

      <div className="px-5 max-w-lg mx-auto space-y-6">
        {/* Action Button */}
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity rounded-3xl" />
          <div className="relative p-5 flex items-center justify-between gap-4">
            <div className="text-left">
              <h3 className="text-sm font-bold text-white mb-0.5">Tổng kết & Lập kế hoạch Tuần</h3>
              <p className="text-[10px] text-white/70">Xác định Focus & Action Plan cho 7 ngày tới</p>
            </div>
            {isGenerating ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
            )}
          </div>
        </button>

        {/* Reports History / Current View */}
        {weeklyReports.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-8 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Chưa có báo cáo tuần</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Hãy bấm nút phía trên để hệ thống AI phân tích dữ liệu 7 ngày qua của bạn.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Horizontal Tabs for History */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {weeklyReports.slice(0, 5).map(report => (
                <button 
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`px-4 py-2 rounded-2xl whitespace-nowrap text-xs font-bold transition-all border ${
                    selectedReportId === report.id 
                    ? 'bg-white text-slate-950 border-white' 
                    : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'
                  }`}
                >
                  {report.startDate}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {selectedReport && (
                <motion.div 
                  key={selectedReport.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 p-4 rounded-3xl border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Trung bình KPI</p>
                      <h4 className="text-2xl font-bold text-white">{selectedReport.stats.avgKpiScore.toFixed(1)}</h4>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-3xl border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Hoàn thành Task</p>
                      <h4 className="text-2xl font-bold text-emerald-400">{Math.round(selectedReport.stats.tasksCompletionRate * 100)}%</h4>
                    </div>
                  </div>

                  {/* Attribution Analysis */}
                  <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nguồn gốc tăng trưởng</p>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400">Tự nhiên</span>
                          <span className="text-white">{Math.round(selectedReport.stats.attribution.organic)}%</span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-700 rounded-full" style={{ width: `${selectedReport.stats.attribution.organic}%` }} />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-purple-400">Nỗ lực</span>
                          <span className="text-white">{Math.round(selectedReport.stats.attribution.effort)}%</span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${selectedReport.stats.attribution.effort}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Why it happened */}
                  <div className="p-6 rounded-[40px] bg-white/[0.02] border border-white/5 shadow-xl relative overflow-hidden">
                    {selectedReport.analysis.bestActionType && (
                      <div className="absolute top-0 right-0 p-4">
                        <div className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-md border border-emerald-500/20">
                          🏆 Best Action: {selectedReport.analysis.bestActionType}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      <BrainCircuit className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Phân tích chuyên sâu</h3>
                    </div>
                    <div className="space-y-4">
                      <p className="text-sm text-slate-200 leading-relaxed italic pr-12">"{selectedReport.analysis.why}"</p>
                      
                      <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Success Score</p>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: `${Math.round((selectedReport.stats.avgKpiScore * 0.7) + (selectedReport.stats.tasksCompletionRate * 30))}%` }} />
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-white">{Math.round((selectedReport.stats.avgKpiScore * 0.7) + (selectedReport.stats.tasksCompletionRate * 30))}</span>
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">Points</span>
                        </div>
                      </div>

                      {selectedReport.stats.topPerformers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.stats.topPerformers.map((p, i) => (
                            <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/20 font-bold">
                              #{p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Execution History Table (Compact) */}
                  {taskLogs.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-1 text-center">Tác động từ hành động thực tế</h3>
                      <div className="space-y-2">
                        {taskLogs.slice(0, 3).map(log => (
                          <div key={log.id} className="bg-white/5 p-3 rounded-2xl flex items-center justify-between gap-3 border border-white/5">
                            <div className="flex-1">
                              <p className="text-[11px] text-white font-medium mb-0.5 line-clamp-1">{log.text}</p>
                              <p className="text-[8px] text-slate-500 uppercase font-black">{new Date(log.timestamp).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-[10px] font-bold ${log.kpiAtEnd > log.kpiAtStart ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {log.kpiAtEnd > log.kpiAtStart ? '+' : ''}{(log.kpiAtEnd - log.kpiAtStart).toFixed(2)} KPI
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Move Strategy */}
                  <div className="p-1 rounded-[40px] bg-gradient-to-br from-purple-500/30 to-blue-500/30">
                    <div className="p-6 rounded-[39px] bg-slate-950/90 backdrop-blur-2xl">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Chiến thuật tuần mới</p>
                          <h3 className="text-lg font-bold text-white leading-tight">{selectedReport.analysis.focus}</h3>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {selectedReport.analysis.actionPlan.map((action, i) => (
                          <div key={i} className="flex gap-3 items-start group">
                            <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-purple-500/20 transition-all">
                              <span className="text-[10px] font-bold text-purple-400">{i + 1}</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-snug">{action}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5">
                        <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                          <span className="text-xs font-bold text-white">Quay lại Dashboard</span>
                          <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
