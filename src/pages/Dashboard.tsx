import { useAppStore, DailyTask } from '../store';
import { calc15DaysSalesKPI, calcCoverageKPI, calcSalesKPI, calcSKUKPI } from '../lib/kpi';
import { formatPercent, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, TrendingUp, Award, Download, Upload, PieChart, Activity, 
  CheckCircle2, Clock, FileSpreadsheet, AlertTriangle, Lightbulb, 
  Sparkles, Loader2, BrainCircuit, ChevronRight, X, PlusCircle, 
  Bookmark, History, Database, ShieldCheck, ArrowLeft,
  ChevronDown, BarChart3, Zap, ArrowUpRight
} from 'lucide-react';
import React, { useRef, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { APP_ICONS } from './Settings';
import { getAIInsight } from '../services/aiService';
import DataEntry from './DataEntry';
import Notes from './Notes';

import { ProgressCircle } from '../components/ProgressCircle';
import { CommandMetric } from '../components/CommandMetric';
import { ActionCard } from '../components/ActionCard';


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

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="pb-40 bg-transparent min-h-screen font-sans selection:bg-blue-500/30"
    >
      
      {/* MISSION CONTROL HEADER */}
      <motion.div variants={itemVariants} className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-3xl border-b border-white/5 pt-8 pb-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div 
                  animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-blue-500 blur-xl rounded-full" 
                />
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
              <motion.select 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                value={selectedMonthIndex}
                onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-widest cursor-pointer appearance-none min-w-[80px] text-center"
              >
                {Array(12).fill(0).map((_, i) => (
                  <option key={i} value={i}>T{i + 1}</option>
                ))}
              </motion.select>
           </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-6 mt-10 space-y-12">
        
        {/* TIER 1: CRITICAL ALERT BANNER */}
        {salesStatus === 'danger' ? (
           <motion.section 
             variants={itemVariants}
             whileHover={{ scale: 1.01 }}
             className="bg-red-500/10 border border-red-500/30 rounded-[2.5rem] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl shadow-red-500/10 relative overflow-hidden group"
           >
              <div className="w-16 h-16 bg-red-500/20 rounded-3xl flex items-center justify-center shrink-0 z-10">
                 <Zap className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <div className="flex-1 text-center md:text-left z-10">
                 <h3 className="text-xl font-black text-white italic mb-1 uppercase tracking-tight">Cảnh báo Run-rate</h3>
                 <p className="text-sm text-red-500/80 font-bold max-w-xl">
                   Dự báo đạt <span className="text-white underline">{projectedSalesRatio.toFixed(1)}%</span>. 
                   Thiếu <span className="text-white">{(month.salesTarget - projectedSalesEndOfMonth).toLocaleString()}đ</span> nếu không bứt phá.
                 </p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAnalyze}
                className="px-8 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all w-full md:w-auto z-10"
              >
                Xem giải pháp
              </motion.button>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
           </motion.section>
        ) : salesRatio < timeElapsedRatio ? (
          <motion.section 
             variants={itemVariants}
             className="bg-yellow-500/10 border border-yellow-500/30 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center gap-6"
           >
              <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
                 <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1 text-center md:text-left">
                 <p className="text-sm text-yellow-500/80 font-bold">
                   Tiến độ chậm. Dự báo <span className="text-white">{projectedSalesRatio.toFixed(1)}%</span>. Cần bứt phá ngay hôm nay.
                 </p>
              </div>
              <button onClick={handleAnalyze} className="text-yellow-500 text-[10px] font-black uppercase tracking-widest hover:underline px-4 py-2 rounded-xl hover:bg-yellow-500/10 transition-colors">Phân tích</button>
          </motion.section>
        ) : null}

        {/* TIER 2: ACTION HUB */}
        <motion.section variants={itemVariants} className="relative overflow-hidden bg-slate-900/40 rounded-[3rem] border border-white/5 p-8 backdrop-blur-2xl shadow-2xl group">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
             className="absolute -top-20 -right-20 p-10 opacity-5 pointer-events-none"
           >
              <Sparkles className="w-64 h-64 text-blue-500" />
           </motion.div>
           
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <motion.div 
                  whileHover={{ rotate: 180 }}
                  className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-900/20 cursor-pointer transition-transform"
                >
                   <Zap className="w-7 h-7 text-white fill-current" />
                </motion.div>
                <div>
                   <h2 className="text-2xl font-black text-white tracking-tight uppercase">Battle Plan</h2>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Kế hoạch hành động hôm nay</p>
                </div>
              </div>

              {dailyTasks.length > 0 && (
                <div className="bg-slate-950/80 border border-white/10 px-6 py-4 rounded-3xl flex items-center gap-6 shrink-0 backdrop-blur-md">
                   <div>
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Hôm nay</p>
                      <motion.span 
                        key={lastInsight?.daily_target}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-black text-blue-400 font-mono tracking-tighter"
                      >
                        {lastInsight?.daily_target || '--'}
                      </motion.span>
                   </div>
                   <div className="w-px h-8 bg-white/10" />
                   <div>
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Tiến độ</p>
                      <span className="text-xl font-black text-white font-mono">{dailyTasks.filter(t => t.isCompleted).length}/{dailyTasks.length}</span>
                   </div>
                </div>
              )}
           </div>

           {dailyTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                 {dailyTasks.map((task, idx) => (
                    <ActionCard 
                      key={task.id}
                      task={task}
                      index={idx}
                      onToggle={toggleDailyTask}
                    />
                 ))}
              </div>
           ) : (
              <motion.div 
                whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAnalyze}
                className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] cursor-pointer transition-all group relative z-10"
              >
                 <BrainCircuit className="w-12 h-12 text-slate-800 mx-auto mb-4 group-hover:text-blue-500 group-hover:scale-110 shadow-blue-500/20 transition-all" />
                 <h3 className="text-white font-black uppercase text-xs tracking-widest mb-1 italic">Nạp chỉ thị từ AI</h3>
                 <p className="text-sm font-bold text-slate-600 italic">"Hệ thống đang đợi dữ liệu phân tích..."</p>
              </motion.div>
           )}
        </motion.section>

        {/* TIER 3: KPI RADAR */}
        <section className="space-y-8">
           <motion.div variants={itemVariants} className="flex items-center justify-between px-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Dòng chảy KPI</span>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: 48 }}
                  className="h-0.5 bg-blue-500/50 rounded-full" 
                />
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <p className="text-[8px] text-slate-600 uppercase font-black tracking-tighter">Thời gian trôi</p>
                    <p className="text-xs font-black text-white">{timeElapsedRatio.toFixed(1)}%</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] text-slate-600 uppercase font-black tracking-tighter">Dự báo đích</p>
                    <motion.p 
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={cn("text-xs font-black", projectedSalesRatio >= 100 ? "text-emerald-500" : "text-yellow-500")}
                    >
                      {projectedSalesRatio.toFixed(1)}%
                    </motion.p>
                 </div>
              </div>
           </motion.div>
           
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
                title="Năng lực" 
                value={monthTotalKPI.toFixed(1)} 
                percent={Math.min(100, monthTotalKPI)} 
                status={salesStatus === 'danger' ? 'danger' : 'success'} 
                icon={Award} 
              />
           </div>
        </section>

        {/* TIER 4: SECONDARY INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
           
           <motion.div variants={itemVariants} className="lg:col-span-8 space-y-8">
              <section className="p-8 bg-slate-900/40 rounded-[3rem] border border-white/5 relative overflow-hidden group hover:bg-slate-900/60 transition-colors">
                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                 <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                       <Lightbulb className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Strategist</h3>
                       <p className="text-[9px] text-indigo-500 uppercase font-black tracking-widest">Neural Insights</p>
                    </div>
                 </div>
                 
                 <div className="relative">
                   <AnimatePresence mode="wait">
                     <motion.p 
                       key={lastInsight?.main_issue}
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="text-sm font-bold text-slate-300 leading-relaxed italic mb-8"
                     >
                       "{lastInsight?.main_issue || 'Hệ thống đã sẵn sàng. Hãy nạp thực tế để AI Architect tính toán các bước đi tiếp theo cho bạn.'}"
                     </motion.p>
                   </AnimatePresence>
                   
                   {lastInsight?.riskAlert && (
                     <motion.div 
                       initial={{ x: -20, opacity: 0 }}
                       animate={{ x: 0, opacity: 1 }}
                       className="bg-red-500/10 border-l-4 border-red-500 p-5 rounded-r-2xl mb-6 shadow-lg shadow-red-500/5"
                     >
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 outline-none">Cảnh báo rủi ro</p>
                        <p className="text-xs font-bold text-red-200/90">{lastInsight.riskAlert}</p>
                     </motion.div>
                   )}
                 </div>

                 {lastInsight?.references && lastInsight.references.length > 0 && (
                   <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                      {lastInsight.references.map((ref, idx) => (
                        <motion.span 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + (idx * 0.1) }}
                          key={ref} 
                          className="text-[8px] text-slate-500 font-bold uppercase px-3 py-1.5 bg-white/5 rounded-lg transition-all hover:bg-white/10 hover:text-white"
                        >
                          {ref}
                        </motion.span>
                      ))}
                   </div>
                 )}
              </section>

              <motion.section 
                whileHover={{ scale: 1.01, backgroundColor: "rgba(15,23,42,0.6)" }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsMemoryOpen(true)}
                className="group p-8 bg-slate-900/40 rounded-[3rem] border border-white/5 border-dashed cursor-pointer transition-all"
              >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                       <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                         <BrainCircuit className="w-7 h-7" />
                       </div>
                       <div>
                          <h3 className="text-white font-black uppercase text-xs tracking-widest">Archives & Memory</h3>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{memories.length} bản ghi trong bộ nhớ</p>
                       </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-purple-400 group-hover:translate-x-2 transition-all duration-300" />
                  </div>
              </motion.section>
           </motion.div>

           <motion.div variants={itemVariants} className="lg:col-span-4 space-y-8">
              <section className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                 <div className="flex items-center justify-between mb-8 opacity-80">
                   <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Phân tích Gap</span>
                   <Clock className="w-3.5 h-3.5 text-slate-600" />
                 </div>
                 <div className="space-y-4">
                    {[
                      { label: 'Doanh số thiếu', value: (month.salesTarget - month.salesActual).toLocaleString() + 'đ', desc: 'Gap', status: 'danger' },
                      { label: 'Hạn mức Ngày', value: requiredDailySales.toLocaleString() + 'đ', desc: 'Quota', status: 'warning' },
                      { label: 'Số Site hoạt động', value: month.coverageActual.toString(), desc: 'Active Sites', status: 'stable' },
                    ].map((item, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + (idx * 0.1) }}
                        key={item.label} 
                        className="bg-slate-950/50 p-5 rounded-[1.5rem] border border-white/5 hover:border-white/10 transition-colors"
                      >
                         <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{item.label}</p>
                            <motion.span 
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full shadow-[0_0_10px]",
                                item.status === 'danger' ? "bg-red-500 shadow-red-500/50" : item.status === 'warning' ? "bg-yellow-500 shadow-yellow-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                              )} 
                            />
                         </div>
                         <div className="flex items-end justify-between">
                            <span className="text-lg font-black text-white font-mono leading-none tracking-tighter">{item.value}</span>
                            <span className="text-[7px] text-slate-700 font-bold uppercase tracking-widest">{item.desc}</span>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </section>

              <section className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8 group">
                 <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Database className="w-4 h-4 group-hover:text-blue-400 transition-colors" /> Cơ sở dữ liệu
                 </h3>
                 <div className="flex flex-col gap-3">
                    <motion.button 
                       whileHover={{ scale: 1.02, x: 5 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={handleExportExcel}
                       className="flex items-center justify-between w-full px-5 py-5 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 transition-all text-[9.5px] font-black uppercase tracking-[0.15em] shadow-lg shadow-emerald-950/20"
                    >
                      <span className="flex items-center gap-3"><FileSpreadsheet className="w-4.5 h-4.5" /> Báo cáo Excel</span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </motion.button>
                    <div className="grid grid-cols-2 gap-3">
                       <motion.button 
                         whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.08)" }}
                         whileTap={{ scale: 0.95 }}
                         onClick={handleBackup} 
                         className="py-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center transition-all"
                       >
                          <Download className="w-4 h-4 mb-2 text-slate-500" />
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Backup</span>
                       </motion.button>
                       <motion.button 
                         whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.08)" }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => fileInputRef.current?.click()} 
                         className="py-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center transition-all"
                       >
                          <Upload className="w-4 h-4 mb-2 text-slate-500" />
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Restore</span>
                       </motion.button>
                    </div>
                 </div>
                 <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
              </section>
           </motion.div>
        </div>
      </div>

      {/* TIER 5: MISSION CONTROL NAVIGATION */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, type: 'spring', damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-8 pt-0 pointer-events-none"
      >
         <div className="max-w-xl mx-auto flex items-center justify-between pointer-events-auto">
            
            <div className="flex bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-2.5 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.5)] scale-90 sm:scale-100 relative group overflow-hidden">
               <button onClick={() => setSelectedMonthIndex((currentMonthIndex - 1 + 12) % 12)} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors relative z-10 active:scale-90">
                  <ArrowLeft className="w-5 h-5" />
               </button>
               <div className="w-px h-8 self-center bg-white/10 relative z-10" />
               <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMemoryOpen(true)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all relative z-10",
                    isMemoryOpen ? "text-purple-400" : "text-slate-400 hover:text-white"
                  )}
                >
                  <BrainCircuit className="w-5 h-5" />
               </motion.button>
               <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsDataEntryOpen(true)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all relative z-10",
                    isDataEntryOpen ? "text-blue-400" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Database className="w-5 h-5" />
               </motion.button>
               <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex items-center gap-4">
               <motion.button 
                 whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(255,255,255,0.15)" }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setIsDataEntryOpen(true)}
                 className="h-16 px-8 bg-white text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] rounded-full shadow-2xl active:scale-95 transition-all flex items-center gap-3"
               >
                  <PlusCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Check-in</span>
               </motion.button>

               <motion.button 
                 whileHover={{ scale: 1.1, rotate: 90 }}
                 whileTap={{ scale: 0.9 }}
                 onClick={handleAnalyze}
                 disabled={isAnalyzing}
                 className={cn(
                   "w-16 h-16 rounded-full flex items-center justify-center transition-all relative overflow-hidden shadow-2xl shadow-blue-500/40",
                   isAnalyzing ? "bg-slate-800" : "bg-blue-600"
                 )}
               >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
                  {isAnalyzing ? (
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  ) : (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    >
                       <Sparkles className="w-7 h-7 text-white" />
                    </motion.div>
                  )}
               </motion.button>
            </div>

         </div>
      </motion.div>

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
