import { useAppStore } from '../store';
import { calc15DaysSalesKPI, calcCoverageKPI, calcSalesKPI, calcSKUKPI } from '../lib/kpi';
import { formatPercent, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, TrendingUp, Award, Download, Upload, PieChart, Activity, 
  CheckCircle2, Clock, FileSpreadsheet, AlertTriangle, Lightbulb, 
  Sparkles, Loader2, BrainCircuit, ChevronRight, X, PlusCircle, 
  Bookmark, History, Database, ShieldCheck
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { APP_ICONS } from './Settings';
import { getAIInsight } from '../services/aiService';
import DataEntry from './DataEntry';
import Notes from './Notes';

function MetricCard({ title, value, icon: Icon, subtitle, isHighlight = false, colorParams = 'blue', onClick }: any) {
  const containerClass = isHighlight 
    ? (colorParams === 'green' ? 'bg-emerald-500/10 border-emerald-500/20' : colorParams === 'purple' ? 'bg-purple-500/10 border-purple-500/20' : colorParams === 'orange' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-blue-500/10 border-blue-500/20')
    : 'bg-white/5 border-white/10';

  const iconContainerClass = isHighlight
    ? (colorParams === 'green' ? 'bg-emerald-500/20 text-emerald-400' : colorParams === 'purple' ? 'bg-purple-500/20 text-purple-400' : colorParams === 'orange' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400')
    : 'bg-slate-800/50 text-slate-400';

  const valueClass = isHighlight
    ? (colorParams === 'green' ? 'text-emerald-400' : colorParams === 'purple' ? 'text-purple-400' : colorParams === 'orange' ? 'text-orange-400' : 'text-blue-400')
    : 'text-white';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 rounded-3xl flex items-start gap-4 backdrop-blur-md border shadow-2xl transition-all",
        onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : "cursor-default",
        containerClass
      )}
    >
      <div className={cn("p-3 rounded-2xl", iconContainerClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-medium">{title}</p>
        <h4 className={cn("text-xl font-bold font-mono", valueClass)}>{value}</h4>
        {subtitle && <p className="text-[10px] text-slate-500 mt-1 italic">{subtitle}</p>}
      </div>
      {onClick && <ChevronRight className="w-4 h-4 text-slate-600 mt-1" />}
    </div>
  );
}

export default function Dashboard() {
  const { 
    months, quarters, halfYears, selectedMonthIndex, setSelectedMonthIndex, settings,
    dailyTasks, setDailyTasks, toggleDailyTask, updateDailyTaskProgress,
    lastInsight, setLastInsight, logTask, memories
  } = useAppStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  const realCurrentMonthIndex = new Date().getMonth();
  const currentMonthIndex = selectedMonthIndex;
  const currentQuarterIndex = Math.floor(currentMonthIndex / 3);
  const currentHalfYearIndex = Math.floor(currentMonthIndex / 6);

  const month = months[currentMonthIndex];
  const quarter = quarters[currentQuarterIndex];
  const halfYear = halfYears[currentHalfYearIndex];

  // Calculations
  const monthSalesRatio = formatPercent(month.salesActual, month.salesTarget);
  const monthCoverageRatio = formatPercent(month.coverageActual, month.coverageTarget);
  const monthSalesKPI = calcSalesKPI(month.salesActual, month.salesTarget);
  const monthCoverageKPI = calcCoverageKPI(month.coverageActual, month.coverageTarget);
  const month15DaysKPI = calc15DaysSalesKPI(month.sales15DaysActual, month.salesTarget);
  const monthSKUKPI = calcSKUKPI(month.skuActual);
  const monthTotalKPI = monthSalesKPI + monthCoverageKPI + month15DaysKPI + monthSKUKPI + (month.customPoints || 0);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setLastInsight(null);
    try {
      const daysInMonth = new Date(new Date().getFullYear(), realCurrentMonthIndex + 1, 0).getDate();
      const currentDay = new Date().getDate();
      const timeElapsedRatio = currentDay / daysInMonth;
      const salesRatio = month.salesActual / (month.salesTarget || 1);
      
      const result = await getAIInsight(
        salesRatio * 100,
        timeElapsedRatio * 100,
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

  const handleExport = () => {
    const state = useAppStore.getState();
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpi_backup_${new Date().toISOString().split('T')[0]}.json`;
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
      {/* Header Sticky Container */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-6 py-6 lg:py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <AppIconNode className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block mb-0.5">KPI Insight Dashboard</span>
              <h1 className="text-2xl font-light text-white tracking-tight leading-none">Tháng <span className="font-bold">{currentMonthIndex + 1}</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setIsDataEntryOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/5 transition-all"
                >
                  <PlusCircle className="w-4 h-4 text-blue-400" /> <span className="hidden sm:inline">Nhập số</span>
                </button>
                <button 
                  onClick={() => setIsMemoryOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/5 border-l border-white/5 transition-all"
                >
                  <Bookmark className="w-4 h-4 text-purple-400" /> <span className="hidden sm:inline">Ghi nhớ</span>
                </button>
             </div>
             
             <select 
                value={selectedMonthIndex}
                onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:ring-1 focus:ring-blue-500 appearance-none min-w-[70px] text-center"
              >
                {Array(12).fill(0).map((_, i) => (
                  <option key={i} value={i}>T{i + 1}</option>
                ))}
              </select>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8 space-y-10">
        
        {/* Top Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard 
            title="Điểm KPI Tổng" 
            value={`${monthTotalKPI.toFixed(1)}`} 
            icon={Award} 
            isHighlight 
            onClick={() => setIsDataEntryOpen(true)}
            subtitle={`Tối đa: ${(settings.kpiWeights?.sales || 80) + (settings.kpiWeights?.coverage || 10) + (settings.kpiWeights?.month15Days || 5) + (settings.kpiWeights?.sku || 7.5)} điểm`}
          />
          <div className="grid grid-cols-2 gap-4">
            <MetricCard title="Hệ số SKU" value={month.skuActual?.toFixed(1) || '0.0'} icon={Activity} colorParams="purple" />
            <MetricCard title="Độ bao phủ" value={monthCoverageRatio} icon={Target} colorParams="green" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: AI Advisor & Daily Tasks */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-slate-900/40 rounded-[32px] border border-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20 shadow-inner">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                   </div>
                   <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Kế hoạch hành động</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AI Advisor</p>
                   </div>
                </div>
                <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                  Cập nhật tiến độ
                </button>
              </div>

              {dailyTasks.length > 0 ? (
                <div className="space-y-4">
                  {lastInsight?.daily_target && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-2">
                       <p className="text-[9px] text-blue-400 uppercase font-black mb-1">Mục tiêu hôm nay</p>
                       <p className="text-lg font-bold text-white">{lastInsight.daily_target}</p>
                    </div>
                  )}
                  <div className="grid gap-3">
                    {dailyTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-4 bg-slate-950/40 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                        <button 
                          onClick={() => toggleDailyTask(task.id)}
                          className={cn(
                            "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                            task.isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/20 text-transparent"
                          )}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </button>
                        <div className="flex-1 overflow-hidden">
                           <p className={cn("text-xs font-medium truncate", task.isCompleted ? "text-slate-600 line-through" : "text-slate-200")}>
                             {task.text}
                           </p>
                        </div>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                          task.priority === 'high' ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-500"
                        )}>{task.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center bg-slate-950/20 rounded-3xl border border-dashed border-white/5">
                   <p className="text-xs text-slate-500">Chưa có kế hoạch hành động. Nhấp "Cập nhật tiến độ" để AI phân tích.</p>
                </div>
              )}
            </section>

            {/* Recent Memories Widget */}
            <section className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <History className="w-3 h-3" /> Ghi nhớ gần đây
                  </h3>
                  <button onClick={() => setIsMemoryOpen(true)} className="text-[10px] text-blue-400 font-bold hover:underline">Xem thêm</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {memories.slice(0, 4).map(note => (
                    <div key={note.id} className="p-4 bg-slate-900/40 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                       <h5 className="text-[11px] font-bold text-white mb-2 truncate">{note.title}</h5>
                       <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mb-3">{note.summary}</p>
                       <div className="flex flex-wrap gap-1">
                          {note.tags.map(tag => (
                            <span key={tag} className="text-[8px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold">#{tag}</span>
                          ))}
                       </div>
                    </div>
                  ))}
                  {memories.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-[10px] text-slate-600 italic border border-dashed border-white/5 rounded-3xl">Chưa có dữ liệu ghi nhớ nào được lưu.</div>
                  )}
               </div>
            </section>
          </div>

          {/* Right Column: Calculations & Data Insights */}
          <div className="space-y-8">
             {/* KPI Breakdown */}
             <section className="bg-slate-900/40 rounded-[32px] border border-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Phân rã điểm KPI</h3>
                <div className="space-y-5">
                   {[
                     { label: 'Doanh số', score: monthSalesKPI, weight: settings.kpiWeights?.sales || 80 },
                     { label: 'Bao phủ', score: monthCoverageKPI, weight: settings.kpiWeights?.coverage || 10 },
                     { label: 'Tiến độ 15đ', score: month15DaysKPI, weight: settings.kpiWeights?.month15Days || 5 },
                     { label: 'SKU', score: monthSKUKPI, weight: settings.kpiWeights?.sku || 7.5 },
                   ].map(item => (
                     <div key={item.label} className="space-y-2">
                        <div className="flex justify-between text-xs">
                           <span className="text-slate-400 font-medium">{item.label}</span>
                           <span className="text-white font-mono font-bold">{item.score.toFixed(1)} <small className="text-slate-600">/{item.weight}</small></span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(item.score / item.weight) * 100}%` }}
                           />
                        </div>
                     </div>
                   ))}
                </div>
             </section>

             {/* System Insight Card */}
             <section className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-[32px] border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-indigo-400" />
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Lời khuyên của hệ thống</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{lastInsight?.main_issue || 'Hệ thống đang theo dõi dữ liệu của bạn. Tập trung vào những chỉ số đang yếu để tối ưu hóa điểm số cuối tháng.'}"
                </p>
             </section>

             {/* Data Management & Backup */}
             <section className="bg-slate-900/40 rounded-[32px] border border-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Database className="w-3 h-3" /> Quản lý Dữ liệu
                </h3>
                <div className="grid grid-cols-1 gap-2">
                   <button 
                      onClick={handleExportExcel}
                      className="flex items-center gap-3 w-full p-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/20 transition-all text-xs font-bold"
                   >
                     <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Xuất Excel KPI năm
                   </button>
                   <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={handleExport}
                        className="flex flex-col items-center justify-center p-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/20 transition-all text-[10px] font-bold"
                      >
                        <Download className="w-4 h-4 mb-2" /> Sao lưu JSON
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/20 transition-all text-[10px] font-bold"
                      >
                        <Upload className="w-4 h-4 mb-2" /> Khôi phục
                      </button>
                   </div>
                </div>
                <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
             </section>
          </div>
        </div>
      </div>

      {/* Slide-over Panel: Data Entry */}
      <AnimatePresence>
        {isDataEntryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDataEntryOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 border-l border-white/10 shadow-2xl z-[110] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/30">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <PlusCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Cập nhật số liệu</h2>
                 </div>
                 <button onClick={() => setIsDataEntryOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <DataEntry />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-over Panel: Memory */}
      <AnimatePresence>
        {isMemoryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMemoryOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[540px] bg-slate-900 border-l border-white/10 shadow-2xl z-[110] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/30">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-xl">
                      <Bookmark className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Trí nhớ AI & Ghi chú</h2>
                 </div>
                 <button onClick={() => setIsMemoryOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
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
