import { useAppStore } from '../store';
import { calc15DaysSalesKPI, calcCoverageKPI, calcSalesKPI, calcSKUKPI } from '../lib/kpi';
import { formatPercent, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, TrendingUp, Award, Download, Upload, PieChart, Activity, 
  CheckCircle2, Clock, FileSpreadsheet, AlertTriangle, Lightbulb, 
  Sparkles, Loader2, BrainCircuit, ChevronRight, X, PlusCircle, 
  Bookmark, History, Database, ShieldCheck, ArrowLeft,
  ChevronDown, BarChart3, Zap
} from 'lucide-react';
import React, { useRef, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { APP_ICONS } from './Settings';
import { getAIInsight } from '../services/aiService';
import DataEntry from './DataEntry';
import Notes from './Notes';

// --- UI COMPONENTS ---

function ProgressCircle({ percent, size = 60, strokeWidth = 6, color = "blue", status = "stable", children }: any) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  const colorMap: any = {
    blue: "stroke-blue-500",
    green: "stroke-emerald-500",
    yellow: "stroke-yellow-500",
    red: "stroke-red-500",
    purple: "stroke-purple-500"
  };

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <motion.div 
        animate={status === 'danger' ? { scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn("absolute inset-0 rounded-full blur-xl", status === 'danger' ? "bg-red-500" : " hidden")}
      />
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/5"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          className={cn("transition-all duration-1000 ease-out", colorMap[color])}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {children || <span className="text-[10px] font-black text-white">{Math.round(percent)}%</span>}
      </div>
    </div>
  );
}

function CommandMetric({ title, value, percent, status, icon: Icon, onClick }: any) {
  const statusColor = status === 'danger' ? 'red' : status === 'warning' ? 'yellow' : 'green';
  const HeatIcon = status === 'danger' ? Zap : status === 'warning' ? Activity : CheckCircle2;
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative p-5 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl group transition-all h-full flex flex-col justify-between",
        onClick ? "cursor-pointer hover:bg-slate-950 hover:border-white/10 active:scale-95 shadow-lg shadow-black/40" : ""
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-2.5 rounded-2xl",
          status === 'danger' ? "bg-red-500/10 text-red-400" : status === 'warning' ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400"
        )}>
          <HeatIcon className={cn("w-5 h-5", status === 'danger' && "animate-pulse")} />
        </div>
        <ProgressCircle percent={percent} size={44} strokeWidth={4} color={statusColor} status={status} />
      </div>
      <div>
        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-1.5 flex-wrap">
           <h4 className="text-xl font-black text-white leading-none truncate max-w-full">{value}</h4>
           <span className={cn(
             "text-[8px] font-black px-1 py-0.5 rounded uppercase tracking-tighter shrink-0",
             status === 'danger' ? "bg-red-500/10 text-red-500" : status === 'warning' ? "bg-yellow-500/10 text-yellow-500" : "bg-emerald-500/10 text-emerald-500"
           )}>
             {status === 'danger' ? 'High Heat' : status === 'warning' ? 'Rising' : 'Stable'}
           </span>
        </div>
      </div>
    </div>
  );
}


export default function Dashboard() {
  const { 
    months, selectedMonthIndex, setSelectedMonthIndex, settings,
    dailyTasks, setDailyTasks, toggleDailyTask, lastInsight, setLastInsight, memories
  } = useAppStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  const realCurrentMonthIndex = new Date().getMonth();
  const currentMonthIndex = selectedMonthIndex;
  
  const month = months[currentMonthIndex];
  
  // KPI Calculations & States
  const daysInMonth = new Date(new Date().getFullYear(), realCurrentMonthIndex + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const timeElapsedRatio = (currentDay / daysInMonth) * 100;
  
  const salesRatio = (month.salesActual / (month.salesTarget || 1)) * 100;
  const coverageRatio = (month.coverageActual / (month.coverageTarget || 1)) * 100;
  const skuRatio = (month.skuActual / 10) * 100;

  // Prediction Engine
  const avgDailySalesSoFar = month.salesActual / Math.max(1, currentDay);
  const remainingDays = Math.max(1, daysInMonth - currentDay);
  const projectedSalesEndOfMonth = month.salesActual + (avgDailySalesSoFar * remainingDays);
  const projectedSalesRatio = (projectedSalesEndOfMonth / (month.salesTarget || 1)) * 100;
  const requiredDailySales = Math.max(0, (month.salesTarget - month.salesActual) / remainingDays);

  const getStatus = (ratio: number, base: number = timeElapsedRatio) => {
    if (ratio >= base) return 'success';
    if (ratio >= base * 0.8) return 'warning';
    return 'danger';
  };

  const salesStatus = getStatus(salesRatio);
  const coverageStatus = getStatus(coverageRatio);
  const skuStatus = getStatus(skuRatio, 100);

  const monthSalesKPI = calcSalesKPI(month.salesActual, month.salesTarget);
  const monthCoverageKPI = calcCoverageKPI(month.coverageActual, month.coverageTarget);
  const month15DaysKPI = calc15DaysSalesKPI(month.sales15DaysActual, month.salesTarget);
  const monthSKUKPI = calcSKUKPI(month.skuActual);
  const monthTotalKPI = monthSalesKPI + monthCoverageKPI + month15DaysKPI + monthSKUKPI + (month.customPoints || 0);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setLastInsight(null);
    try {
      const result = await getAIInsight(
        salesRatio,
        timeElapsedRatio,
        (salesRatio / timeElapsedRatio) * 100,
        month.skuActual || 0,
        month.coverageActual || 0,
        daysInMonth - currentDay,
        month.salesActual / (currentDay || 1),
        (Math.max(0, (month.salesTarget || 0) - month.salesActual)) / (Math.max(1, daysInMonth - currentDay))
      );
      setLastInsight(result);
      if (result.actions && result.actions.length > 0) {
        setDailyTasks(result.actions.map(act => ({
          text: act.task,
          priority: act.priority,
          target: act.target,
          expectedImpact: act.impact,
          confidence: act.confidence,
          type: act.type
        })), monthTotalKPI);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportExcel = () => {
    const data = months.map((m, i) => ({
      'Tháng': `Tháng ${i + 1}`,
      'Mục tiêu Doanh số': m.salesTarget,
      'Thực đạt Doanh số': m.salesActual,
      'Tỷ lệ (%)': ((m.salesActual / (m.salesTarget || 1)) * 100).toFixed(1) + '%',
      'Mục tiêu Bao phủ': m.coverageTarget,
      'Thực đạt Bao phủ': m.coverageActual,
      'SKU': m.skuActual,
      'Điểm KPI': (calcSalesKPI(m.salesActual, m.salesTarget) + calcCoverageKPI(m.coverageActual, m.coverageTarget) + calcSKUKPI(m.skuActual)).toFixed(2)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KPI_Report");
    XLSX.writeFile(wb, `KPI_Bao_Cao_Nam_2024.xlsx`);
  };

  const handleBackup = () => {
    const data = useAppStore.getState();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namduoc_kpi_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        useAppStore.setState(content);
        alert('Đã khôi phục dữ liệu thành công!');
      } catch (err) {
        alert('Lỗi cấu trúc tệp!');
      }
    };
    reader.readAsText(file);
  };

  const AppIconNode = APP_ICONS.find(i => i.id === settings.appIcon)?.icon || APP_ICONS[0].icon;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-40 bg-slate-950 min-h-screen font-sans selection:bg-blue-500/30">
      
      {/* MISSION CONTROL HEADER */}
      <div className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-3xl border-b border-white/5 pt-8 pb-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse" />
                <div className="relative w-12 h-12 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center p-2.5 shadow-2xl">
                   <AppIconNode className="w-full h-full text-blue-400" />
                </div>
              </div>
              <div className="hidden sm:block">
                 <h1 className="text-xl font-black text-white tracking-tight uppercase">Dashboard</h1>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                   <ShieldCheck className="w-3 h-3 text-emerald-500" /> Hệ thống bảo mật
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <select 
                value={selectedMonthIndex}
                onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-widest"
              >
                {Array(12).fill(0).map((_, i) => (
                  <option key={i} value={i}>T{i + 1}</option>
                ))}
              </select>
           </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-10 space-y-12">
        
        {/* TIER 1: CRITICAL ALERT BANNER (Prediction Matrix) */}
        {salesStatus === 'danger' ? (
           <motion.section 
             initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
             className="bg-red-500/10 border border-red-500/30 rounded-[2.5rem] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl shadow-red-500/10"
           >
              <div className="w-16 h-16 bg-red-500/20 rounded-3xl flex items-center justify-center shrink-0">
                 <Zap className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <div className="flex-1 text-center md:text-left">
                 <h3 className="text-xl font-black text-white italic mb-1 uppercase tracking-tight">Cảnh báo Run-rate</h3>
                 <p className="text-sm text-red-500/80 font-bold max-w-xl">
                   Dự báo cuối tháng chỉ đạt <span className="text-white underline">{projectedSalesRatio.toFixed(1)}%</span>. 
                   Thiếu hụt <span className="text-white">{(month.salesTarget - projectedSalesEndOfMonth).toLocaleString()}đ</span> nếu không thay đổi chiến thuật.
                 </p>
              </div>
              <button 
                onClick={handleAnalyze}
                className="px-8 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all w-full md:w-auto"
              >
                Xem giải pháp cứu vãn
              </button>
           </motion.section>
        ) : salesRatio < timeElapsedRatio ? (
          <motion.section 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="bg-yellow-500/10 border border-yellow-500/30 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center gap-6"
           >
              <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
                 <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1 text-center md:text-left">
                 <p className="text-sm text-yellow-500/80 font-bold">
                   Tiến độ đang bám sát nhưng run-rate dự báo đạt <span className="text-white">{projectedSalesRatio.toFixed(1)}%</span>. Một chút bứt phá hôm nay sẽ giúp bạn về đích an toàn.
                 </p>
              </div>
              <button onClick={handleAnalyze} className="text-yellow-500 text-[10px] font-black uppercase tracking-widest hover:underline">Phân tích bứt phá</button>
           </motion.section>
        ) : null}

        {/* TIER 2: ACTION HUB (Daily Battle Plan) - MOVED UP */}
        <section className="relative overflow-hidden bg-slate-900/40 rounded-[3rem] border border-white/5 p-8 backdrop-blur-2xl shadow-2xl">
           <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Sparkles className="w-48 h-48 text-blue-500" />
           </div>
           
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-900/20">
                   <Zap className="w-7 h-7 text-white fill-current" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-white tracking-tight uppercase">Battle Plan</h2>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Cố vấn chiến thuật hằng ngày</p>
                </div>
              </div>

              {dailyTasks.length > 0 && (
                <div className="bg-slate-950/80 border border-white/10 px-6 py-4 rounded-3xl flex items-center gap-6 shrink-0">
                   <div>
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Mục tiêu hôm nay</p>
                      <span className="text-xl font-black text-blue-400 font-mono tracking-tighter">{lastInsight?.daily_target || '--'}</span>
                   </div>
                   <div className="w-px h-8 bg-white/10" />
                   <div>
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Tiến trình</p>
                      <span className="text-xl font-black text-white font-mono">{dailyTasks.filter(t => t.isCompleted).length}/{dailyTasks.length}</span>
                   </div>
                </div>
              )}
           </div>

           {dailyTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {dailyTasks.map((task, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      key={task.id} 
                      className={cn(
                        "group relative flex flex-col p-6 rounded-[2rem] border transition-all h-full",
                        task.isCompleted ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" : "bg-slate-950/60 border-white/5 hover:border-blue-500/30 hover:bg-slate-950"
                      )}
                    >
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                             <span className={cn(
                               "text-[7px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter", 
                               task.priority === 'high' ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400"
                             )}>
                               Priority: {task.priority}
                             </span>
                             <span className="text-[7px] font-black text-blue-400/60 uppercase tracking-tighter">@{task.type}</span>
                          </div>
                          <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                             {task.expectedImpact}
                          </div>
                       </div>
                       
                       <div className="flex-1 mb-6">
                          <p className={cn(
                            "text-sm font-bold leading-relaxed", 
                            task.isCompleted ? "text-slate-600 line-through" : "text-white group-hover:text-blue-200"
                          )}>
                            {task.text}
                          </p>
                       </div>

                       <div className="flex items-center gap-3 mt-auto">
                          <button 
                            onClick={() => toggleDailyTask(task.id)}
                            className={cn(
                              "flex-1 h-10 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all overflow-hidden flex items-center justify-center gap-2",
                              task.isCompleted ? "bg-emerald-500 text-white" : "bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/20"
                            )}
                          >
                             {task.isCompleted ? (
                               <>
                                 <CheckCircle2 className="w-3.5 h-3.5" />
                                 <span>Đã xong</span>
                               </>
                             ) : (
                               <>
                                 <PlusCircle className="w-3.5 h-3.5" />
                                 <span>Bắt đầu ngay</span>
                               </>
                             )}
                          </button>
                       </div>
                    </motion.div>
                 ))}
              </div>
           ) : (
              <div 
                onClick={handleAnalyze}
                className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] cursor-pointer hover:bg-white/5 transition-all group"
              >
                 <BrainCircuit className="w-12 h-12 text-slate-800 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                 <h3 className="text-white font-black uppercase text-xs tracking-widest mb-1 italic">Nạp chiến thuật chiến thuật mới</h3>
                 <p className="text-sm font-bold text-slate-600 italic">"Sẵn sàng nạp chỉ thị từ AI Advisor..."</p>
              </div>
           )}
        </section>

        {/* TIER 3: KPI RADAR (Essential Metrics) */}
        <section>
           <div className="flex items-center justify-between mb-8 px-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Radar Hệ thống</span>
                <div className="h-0.5 w-12 bg-blue-500/50 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-[8px] text-slate-600 uppercase font-black">Thời gian trôi qua</p>
                    <p className="text-xs font-black text-white">{timeElapsedRatio.toFixed(1)}%</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] text-slate-600 uppercase font-black">Dự báo kết thúc</p>
                    <p className={cn("text-xs font-black", projectedSalesRatio >= 100 ? "text-emerald-500" : "text-yellow-500")}>
                      {projectedSalesRatio.toFixed(1)}%
                    </p>
                 </div>
              </div>
           </div>
           
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <CommandMetric 
                title="Doanh số" 
                value={salesRatio.toFixed(1) + '%'} 
                percent={salesRatio} 
                status={salesStatus} 
                icon={TrendingUp}
                onClick={() => setIsDataEntryOpen(true)}
              />
              <CommandMetric 
                title="Bao phủ" 
                value={coverageRatio.toFixed(1) + '%'} 
                percent={coverageRatio} 
                status={coverageStatus} 
                icon={Target} 
              />
              <CommandMetric 
                title="SKU Focus" 
                value={month.skuActual?.toFixed(1)} 
                percent={skuRatio} 
                status={skuStatus} 
                icon={PieChart} 
              />
              <CommandMetric 
                title="Sức mạnh KPI" 
                value={monthTotalKPI.toFixed(1)} 
                percent={Math.min(100, monthTotalKPI)} 
                status={salesStatus === 'danger' ? 'danger' : 'success'} 
                icon={Award} 
              />
           </div>
        </section>

        {/* TIER 4: SECONDARY INSIGHTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           <div className="lg:col-span-8 space-y-8">
              {/* AI STRATEGIST - Compacted */}
              <section className="p-8 bg-slate-900/40 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                       <Lightbulb className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Strategist Insights</h3>
                       <p className="text-[9px] text-indigo-500 uppercase font-black">Neural Network Analysis</p>
                    </div>
                 </div>
                 
                 <div className="relative">
                   <p className="text-sm font-bold text-slate-300 leading-relaxed italic mb-8">
                     "{lastInsight?.main_issue || 'Hệ thống đã sẵn sàng. Hãy bắt đầu phân tích để nhận chỉ dẫn từ Deep Strategist.'}"
                   </p>
                   {lastInsight?.riskAlert && (
                     <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl mb-6">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Cảnh báo rủi ro</p>
                        <p className="text-xs font-bold text-red-200/80">{lastInsight.riskAlert}</p>
                     </div>
                   )}
                 </div>

                 {lastInsight?.references && lastInsight.references.length > 0 && (
                   <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                      {lastInsight.references.map(ref => (
                        <span key={ref} className="text-[8px] text-slate-600 font-black uppercase px-2 py-1 bg-white/5 rounded transition-colors hover:bg-white/10">{ref}</span>
                      ))}
                   </div>
                 )}
              </section>

              {/* Memory / Notes Quick View */}
              <section 
                onClick={() => setIsMemoryOpen(true)}
                className="group p-8 bg-slate-900/40 rounded-[3rem] border border-white/5 cursor-pointer hover:bg-slate-900/60 transition-all border-dashed"
              >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform"><BrainCircuit className="w-6 h-6" /></div>
                       <div>
                          <h3 className="text-white font-black uppercase text-xs tracking-widest">Ký ức & Ghi chú</h3>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{memories.length} bản ghi trong Archives</p>
                       </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
              </section>
           </div>

           {/* RIGHT HUB: Tactical Metrics */}
           <div className="lg:col-span-4 space-y-8">
              <section className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-3xl shadow-2xl">
                 <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-8 flex items-center justify-between">
                   <span>Tactical Gap</span>
                   <Clock className="w-3.5 h-3.5 opacity-30" />
                 </h3>
                 <div className="space-y-4">
                    {[
                      { label: 'Chênh lệch Doanh số', value: (month.salesTarget - month.salesActual).toLocaleString() + 'đ', desc: 'Gap', status: 'danger' },
                      { label: 'Doanh số Ngày cần', value: requiredDailySales.toLocaleString() + 'đ', desc: 'Quota', status: 'warning' },
                      { label: 'Độ bao phủ thực tế', value: month.coverageActual.toString(), desc: 'Active Sites', status: 'stable' },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-950 p-5 rounded-[1.5rem] border border-white/5">
                         <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{item.label}</p>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                              item.status === 'danger' ? "bg-red-500 shadow-red-500/50" : item.status === 'warning' ? "bg-yellow-500 shadow-yellow-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                            )}></span>
                         </div>
                         <div className="flex items-end justify-between">
                            <span className="text-lg font-black text-white font-mono leading-none tracking-tighter">{item.value}</span>
                            <span className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter">{item.desc}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>

              <section className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8">
                 <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Hệ thống
                 </h3>
                 <div className="flex flex-col gap-2">
                    <button 
                       onClick={handleExportExcel}
                       className="flex items-center justify-between w-full px-5 py-4 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      <span className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Excel Export</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={handleBackup} className="py-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center hover:bg-white/10 transition-colors">
                          <Download className="w-4 h-4 mb-1 text-slate-500" />
                          <span className="text-[7px] font-black text-slate-500 uppercase">Backup</span>
                       </button>
                       <button onClick={() => fileInputRef.current?.click()} className="py-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center hover:bg-white/10 transition-colors">
                          <Upload className="w-4 h-4 mb-1 text-slate-500" />
                          <span className="text-[7px] font-black text-slate-500 uppercase">Restore</span>
                       </button>
                    </div>
                 </div>
                 <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
              </section>
           </div>
        </div>
      </div>

      {/* TIER 5: MISSION CONTROL NAVIGATION (Bottom Global) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pointer-events-none">
         <div className="max-w-2xl mx-auto flex items-center justify-between pointer-events-auto">
            
            <div className="flex bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-2 rounded-[2.5rem] shadow-2xl scale-90 sm:scale-100">
               <button onClick={() => setSelectedMonthIndex((currentMonthIndex - 1 + 12) % 12)} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
               </button>
               <div className="w-px h-8 self-center bg-white/10" />
               <button 
                  onClick={() => setIsMemoryOpen(true)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isMemoryOpen ? "text-purple-400" : "text-slate-400 hover:text-white"
                  )}
                >
                  <BrainCircuit className="w-5 h-5" />
               </button>
               <button 
                  onClick={() => setIsDataEntryOpen(true)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isDataEntryOpen ? "text-blue-400" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Database className="w-5 h-5" />
               </button>
            </div>

            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsDataEntryOpen(true)}
                 className="h-16 px-8 bg-white text-slate-950 font-black text-xs uppercase tracking-widest rounded-full shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-3"
               >
                  <PlusCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Check-in</span>
               </button>

               <button 
                 onClick={handleAnalyze}
                 disabled={isAnalyzing}
                 className={cn(
                   "w-16 h-16 rounded-full flex items-center justify-center transition-all relative overflow-hidden active:scale-90",
                   isAnalyzing ? "bg-slate-800" : "bg-blue-600 shadow-2xl shadow-blue-600/40"
                 )}
               >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                  {isAnalyzing ? (
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  ) : (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}>
                       <Sparkles className="w-7 h-7 text-white" />
                    </motion.div>
                  )}
               </button>
            </div>

         </div>
      </div>


      {/* SLIDE-OVER PANELS (Refined) */}
      <AnimatePresence>
        {isDataEntryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDataEntryOpen(false)} className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 border-l border-white/10 shadow-2xl z-[110] flex flex-col">
              <div className="flex items-center justify-between p-8 border-b border-white/5 bg-slate-950/20">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-2xl shadow-inner"><BarChart3 className="w-6 h-6 text-blue-400" /></div>
                    <div>
                       <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">Nhập thực tế</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Telemetry Dashboard</p>
                    </div>
                 </div>
                 <button onClick={() => setIsDataEntryOpen(false)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 <DataEntry />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMemoryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMemoryOpen(false)} className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full sm:w-[540px] bg-slate-900 border-l border-white/10 shadow-2xl z-[110] flex flex-col">
              <div className="flex items-center justify-between p-8 border-b border-white/5 bg-slate-950/20">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-2xl shadow-inner"><BrainCircuit className="w-6 h-6 text-purple-400" /></div>
                    <div>
                       <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">Archives</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hồ sơ thông tin & Ký ức</p>
                    </div>
                 </div>
                 <button onClick={() => setIsMemoryOpen(false)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <Notes />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
