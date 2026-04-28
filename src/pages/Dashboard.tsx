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

function ProgressCircle({ percent, size = 60, strokeWidth = 5, color = "blue", children }: any) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  const colorMap: any = {
    blue: "stroke-blue-500",
    green: "stroke-emerald-500",
    yellow: "stroke-yellow-500",
    red: "stroke-red-500",
    purple: "stroke-purple-500"
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
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
      <div className="absolute inset-0 flex items-center justify-center">
        {children || <span className="text-[10px] font-bold text-white">{Math.round(percent)}%</span>}
      </div>
    </div>
  );
}

function CommandMetric({ title, value, percent, status, icon: Icon, onClick }: any) {
  const statusColor = status === 'danger' ? 'red' : status === 'warning' ? 'yellow' : 'green';
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative p-5 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl group transition-all",
        onClick ? "cursor-pointer hover:bg-slate-900/60 active:scale-95" : ""
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-2.5 rounded-2xl",
          status === 'danger' ? "bg-red-500/10 text-red-400" : status === 'warning' ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <ProgressCircle percent={percent} size={48} strokeWidth={4} color={statusColor} />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">{title}</p>
        <div className="flex items-end gap-1.5">
           <h4 className="text-2xl font-black text-white leading-none">{value}</h4>
           <span className={cn(
             "text-[10px] font-bold px-1.5 py-0.5 rounded mb-0.5 uppercase",
             status === 'danger' ? "bg-red-500/10 text-red-500" : status === 'warning' ? "bg-yellow-500/10 text-yellow-500" : "bg-emerald-500/10 text-emerald-500"
           )}>
             {status === 'danger' ? 'Toang' : status === 'warning' ? 'Cần vọt' : 'Ổn'}
           </span>
        </div>
      </div>
      {status === 'danger' && (
        <div className="absolute top-2 right-2 flex gap-0.5">
           <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
        </div>
      )}
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
  const skuRatio = (month.skuActual / (settings.defaultSKUTarget || 10)) * 100;

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 bg-slate-950 min-h-screen font-sans selection:bg-blue-500/30">
      
      {/* MISSION CONTROL HEADER */}
      <div className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-3xl border-b border-white/5 pt-10 pb-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse" />
                <div className="relative w-12 h-12 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center p-2.5">
                   <AppIconNode className="w-full h-full text-blue-400" />
                </div>
              </div>
              <div className="hidden sm:block">
                 <h1 className="text-xl font-black text-white tracking-tight uppercase">Command Center</h1>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                   <ShieldCheck className="w-3 h-3 text-emerald-500" /> Hệ thống bảo mật • V2.5.1
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-2">
              <div className="bg-slate-900/80 p-1 rounded-2xl border border-white/10 flex items-center">
                 <button onClick={() => setIsDataEntryOpen(true)} className="p-2.5 hover:bg-white/5 rounded-xl transition-all">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                 </button>
                 <div className="w-[1px] h-4 bg-white/10 mx-1" />
                 <button onClick={() => setIsMemoryOpen(true)} className="p-2.5 hover:bg-white/5 rounded-xl transition-all">
                    <BrainCircuit className="w-5 h-5 text-purple-400" />
                 </button>
              </div>
              
              <div className="relative">
                 <select 
                    value={selectedMonthIndex}
                    onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                    className="appearance-none bg-slate-900 border border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-xs font-black text-white outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-widest min-w-[120px]"
                  >
                    {Array(12).fill(0).map((_, i) => (
                      <option key={i} value={i}>Tháng {i + 1}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-10 space-y-12">
        
        {/* KPI RADAR - GRID OF COMMAND METRICS */}
        <section>
           <div className="flex items-center justify-between mb-6 px-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              <span>Radar Chỉ số Trọng yếu</span>
              <span>Theo thời gian: <span className="text-white">{timeElapsedRatio.toFixed(1)}%</span></span>
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
                title="Độ bao phủ" 
                value={coverageRatio.toFixed(1) + '%'} 
                percent={coverageRatio} 
                status={coverageStatus} 
                icon={Target} 
              />
              <CommandMetric 
                title="Điểm SKU" 
                value={month.skuActual?.toFixed(2)} 
                percent={skuRatio} 
                status={skuStatus} 
                icon={PieChart} 
              />
              <CommandMetric 
                title={timeElapsedRatio < 50 ? "15 ngày đầu" : "Dự báo"} 
                value={month15DaysKPI.toFixed(1)} 
                percent={Math.min(100, (monthSalesKPI / (settings.kpiWeights?.sales || 80)) * 100)} 
                status={salesStatus} 
                icon={Activity} 
              />
           </div>
        </section>

        {/* ALERT RADAR - ONLY SHOW IF DANGER */}
        {salesStatus === 'danger' && (
           <motion.section 
             initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
             className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-6"
           >
              <div className="w-16 h-16 bg-red-500/20 rounded-3xl flex items-center justify-center animate-pulse">
                 <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex-1 text-center md:text-left">
                 <h3 className="text-xl font-black text-white italic mb-1 uppercase tracking-tight">Khu vực nguy hiểm!</h3>
                 <p className="text-sm text-red-400 font-bold max-w-xl">
                   Doanh số hiện tại đang thấp hơn tỷ lệ thời gian trôi qua ({timeElapsedRatio.toFixed(0)}%). 
                   Cần ngay lập tức vọt doanh số để tránh việc bị trừ điểm KPI nặng.
                 </p>
              </div>
              <button 
                onClick={handleAnalyze}
                className="px-8 py-3.5 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
              >
                Kích hoạt AI hỗ trợ
              </button>
           </motion.section>
        )}

        {/* MAIN BATTLE GROUND */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
           
           {/* LEFT HUB: Battle Plan & Memory Context */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* DAILY BATTLE PLAN */}
              <section className="relative overflow-hidden bg-slate-900/40 rounded-[3rem] border border-white/5 p-8 backdrop-blur-2xl">
                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Sparkles className="w-40 h-40 text-blue-500" />
                 </div>
                 
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-900/20">
                          <Zap className="w-7 h-7 text-white fill-current" />
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Battle Plan</h2>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                             Chỉ thị từ AI Advisor <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          </p>
                       </div>
                    </div>
                    <button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing}
                      className={cn(
                        "group relative px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] transition-all overflow-hidden",
                        isAnalyzing ? "bg-slate-800 text-slate-500" : "bg-white text-slate-950 hover:bg-blue-50"
                      )}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                        {isAnalyzing ? 'Đang giải mã dữ liệu...' : 'Lấy chỉ thị tác chiến'}
                      </span>
                    </button>
                 </div>

                 {dailyTasks.length > 0 ? (
                    <div className="space-y-6">
                       {lastInsight?.daily_target && (
                         <div className="bg-slate-950/60 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
                            <div>
                               <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Target doanh số hôm nay</p>
                               <span className="text-3xl font-black text-white font-mono">{lastInsight.daily_target}</span>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Mức độ tin cậy</p>
                               <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">CAO</span>
                            </div>
                         </div>
                       )}

                       <div className="grid gap-3">
                          {dailyTasks.map((task, idx) => (
                             <motion.div 
                               initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                               key={task.id} 
                               className={cn(
                                 "group flex items-center gap-4 p-5 rounded-3xl border transition-all",
                                 task.isCompleted ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-950/40 border-white/5 hover:border-blue-500/20"
                               )}
                             >
                                <button 
                                  onClick={() => toggleDailyTask(task.id)}
                                  className={cn(
                                    "w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all",
                                    task.isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/10 text-transparent hover:border-blue-500/50"
                                  )}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-0.5">
                                      <span className={cn(
                                        "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                        task.priority === 'high' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-slate-800 text-slate-400"
                                      )}>{task.priority === 'high' ? 'Khẩn cấp' : 'Bình thường'}</span>
                                      <span className="text-[8px] font-black text-blue-400 uppercase">{task.type}</span>
                                   </div>
                                   <p className={cn("text-xs font-bold leading-relaxed", task.isCompleted ? "text-slate-600 line-through" : "text-white")}>
                                     {task.text}
                                   </p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-emerald-500">{task.expectedImpact}</p>
                                   <p className="text-[8px] font-black text-slate-600 uppercase">Impact</p>
                                </div>
                             </motion.div>
                          ))}
                       </div>
                    </div>
                 ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center">
                       <BrainCircuit className="w-12 h-12 text-slate-800 mb-4" />
                       <p className="text-sm font-bold text-slate-600 italic">"Đang chờ chỉ thị tác chiến từ sở chỉ huy..."</p>
                       <p className="text-[10px] text-slate-700 mt-2 uppercase font-black tracking-widest">Kích hoạt nút Lấy chỉ thị để nhận AI Action Plan</p>
                    </div>
                 )}
              </section>

              {/* TACTICAL MEMORIES */}
              <section className="space-y-6">
                 <div className="flex items-center justify-between px-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                       <Database className="w-4 h-4" /> Kho tri thức thực chiến
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">{memories.length} Ký ức được nạp</span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {memories.slice(0, 4).map(note => (
                       <div key={note.id} className="p-6 bg-slate-900/40 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all flex flex-col">
                          <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
                             {note.tags.map(t => <span key={t} className="text-[8px] font-black text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full uppercase">#{t}</span>)}
                          </div>
                          <h4 className="text-sm font-black text-white mb-2 line-clamp-1">{note.title}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 italic mb-4">{note.summary}</p>
                          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                             <span className="text-[8px] text-slate-700 font-black uppercase">Semantic Rank: Optimal</span>
                             <button onClick={() => setIsMemoryOpen(true)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                                <ChevronRight className="w-3 h-3" />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              </section>
           </div>

           {/* RIGHT HUB: Score Analysis & Data Ops */}
           <div className="space-y-8">
              
              {/* KPI SCORE BREAKDOWN */}
              <section className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-3xl">
                 <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-8 flex items-center justify-between">
                    Phân tích Điểm KPI 
                    <Award className="w-4 h-4 text-yellow-500" />
                 </h3>
                 
                 <div className="flex flex-col items-center mb-10">
                    <ProgressCircle percent={(monthTotalKPI / 100) * 100} size={150} strokeWidth={12} color={salesStatus}>
                       <div className="text-center">
                          <span className="text-5xl font-black text-white font-mono leading-none">{monthTotalKPI.toFixed(1)}</span>
                          <p className="text-[10px] text-slate-600 font-black uppercase mt-1">/ 102.5 pt</p>
                       </div>
                    </ProgressCircle>
                 </div>

                 <div className="space-y-6">
                    {[
                      { label: 'Doanh số', score: monthSalesKPI, weight: settings.kpiWeights?.sales || 80, icon: BarChart3 },
                      { label: 'Bao phủ', score: monthCoverageKPI, weight: settings.kpiWeights?.coverage || 10, icon: Target },
                      { label: 'Tiến độ 15đ', score: month15DaysKPI, weight: settings.kpiWeights?.month15Days || 5, icon: Clock },
                      { label: 'Hệ số SKU', score: monthSKUKPI, weight: settings.kpiWeights?.sku || 7.5, icon: PieChart },
                    ].map(item => (
                      <div key={item.label} className="group cursor-default">
                         <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                               <item.icon className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                            </div>
                            <span className="text-xs font-black text-white font-mono">{item.score.toFixed(1)}<small className="text-slate-700 mx-0.5">/</small>{item.weight}</span>
                         </div>
                         <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }} animate={{ width: `${(item.score / item.weight) * 100}%` }}
                               className={cn(
                                 "h-full rounded-full",
                                 (item.score / item.weight) > 0.9 ? "bg-emerald-500" : (item.score / item.weight) > 0.7 ? "bg-blue-500" : "bg-red-500"
                               )}
                            />
                         </div>
                      </div>
                    ))}
                 </div>
              </section>

              {/* MISSION INSIGHT */}
              <section className="p-8 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <BrainCircuit className="w-24 h-24 text-blue-400" />
                 </div>
                 <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Phân tích Hệ thống</h5>
                 </div>
                 <p className="text-xs font-bold text-slate-300 leading-relaxed italic relative z-10">
                   "{lastInsight?.main_issue || 'Sẵn sàng phân tích. Hệ thống đang chờ dữ liệu mới nhất để đưa ra cố vấn chiến thuật.'}"
                 </p>
                 {lastInsight?.riskAlert && (
                   <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-red-400 leading-tight">{lastInsight.riskAlert}</p>
                   </div>
                 )}
              </section>

              {/* DATA LOGISTICS */}
              <section className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8">
                 <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Data Logistics
                 </h3>
                 <div className="grid grid-cols-1 gap-2">
                    <button 
                       onClick={handleExportExcel}
                       className="flex items-center justify-between w-full px-6 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/20 transition-all text-xs font-black uppercase tracking-tighter"
                    >
                      <span className="flex items-center gap-3"><FileSpreadsheet className="w-4 h-4" /> Export Report</span>
                      <ChevronRight className="w-4 h-4 opacity-30" />
                    </button>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                       <button onClick={() => useAppStore.getState().exportData()} className="flex flex-col items-center justify-center p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                          <Download className="w-5 h-5 mb-2 text-slate-400" />
                          <span className="text-[8px] font-black text-slate-500 uppercase">Save Local</span>
                       </button>
                       <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                          <Upload className="w-5 h-5 mb-2 text-slate-400" />
                          <span className="text-[8px] font-black text-slate-500 uppercase">Load Local</span>
                       </button>
                    </div>
                 </div>
                 <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
              </section>
           </div>
        </div>
      </div>

      {/* ERGONOMIC BOTTOM NAV OVERLAY - QUICK ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pointer-events-none">
         <div className="max-w-md mx-auto flex items-center justify-center gap-4 pointer-events-auto">
            <button 
              onClick={() => setIsDataEntryOpen(true)}
              className="flex-1 bg-white text-slate-950 h-16 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border-4 border-slate-950"
            >
               <PlusCircle className="w-6 h-6" />
               <span className="text-xs font-black uppercase tracking-widest">Nhập số</span>
            </button>
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-16 h-16 bg-blue-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center active:rotate-12 transition-all border-4 border-slate-950 disabled:opacity-50"
            >
               {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <TrendingUp className="w-6 h-6" />}
            </button>
         </div>
      </div>

      {/* SLIDE-OVER PANELS */}
      <AnimatePresence>
        {isDataEntryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDataEntryOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 border-l border-white/10 shadow-2xl z-[110] flex flex-col">
              <div className="flex items-center justify-between p-8 border-b border-white/5 bg-slate-950/30">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-2xl"><Zap className="w-6 h-6 text-blue-400" /></div>
                    <div>
                       <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">Telemetry Data</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cập nhật số liệu thực chiến</p>
                    </div>
                 </div>
                 <button onClick={() => setIsDataEntryOpen(false)} className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                 <DataEntry />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMemoryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMemoryOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full sm:w-[540px] bg-slate-900 border-l border-white/10 shadow-2xl z-[110] flex flex-col">
              <div className="flex items-center justify-between p-8 border-b border-white/5 bg-slate-950/30">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-2xl"><BrainCircuit className="w-6 h-6 text-purple-400" /></div>
                    <div>
                       <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">Intel Archives</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Kho tri thức & Ký ức AI</p>
                    </div>
                 </div>
                 <button onClick={() => setIsMemoryOpen(false)} className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                 <Notes />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
