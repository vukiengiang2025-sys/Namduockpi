import { useAppStore, DailyTask } from '../store';
import { calc15DaysKPI, calcCoverageKPI, calcSalesKPI, calcSKUKPI, calcTotalKPI, FULL_MONTHS_VI } from '../lib/kpi';
import { formatPercent, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, TrendingUp, Award, Download, Upload, PieChart, Activity, 
  CheckCircle2, Clock, FileSpreadsheet, AlertTriangle, Lightbulb, 
  Sparkles, Loader2, BrainCircuit, ChevronRight, X, PlusCircle, 
  Bookmark, History, Database, ShieldCheck, ArrowLeft,
  ChevronDown, BarChart3, Zap, ArrowUpRight, Flame
} from 'lucide-react';
import React, { useRef, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { APP_ICONS } from './Settings';
import DataEntry from './DataEntry';
import Notes from './Notes';

import { ProgressCircle } from '../components/ProgressCircle';
import { CommandMetric } from '../components/CommandMetric';
import { ActionCard } from '../components/ActionCard';

import { saveFile } from '../lib/fileSystem';

export default function Dashboard() {
  const { 
    months, selectedMonthIndex, setSelectedMonthIndex, settings,
    dailyTasks, setDailyTasks, toggleDailyTask, notes, toggleNote,
    streak, updateDailyTaskProgress, startDailyTask
  } = useAppStore();
  
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);

  const realCurrentMonthIndex = new Date().getMonth();
  const currentMonthIndex = selectedMonthIndex;
  
  const month = months[currentMonthIndex];
  const [taskFilter, setTaskFilter] = useState('all');
  
  // Clean, non-completed notes acting as automatic reminders
  const pendingNotes = useMemo(() => notes.filter(n => !n.isCompleted), [notes]);

  // KPI Calculations & States
  const daysInMonth = new Date(new Date().getFullYear(), realCurrentMonthIndex + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const isCurrentMonth = selectedMonthIndex === realCurrentMonthIndex;

  const monthSalesKPI = useMemo(() => calcSalesKPI(month.salesActual, month.salesTarget, settings.kpiWeights), [month, settings.kpiWeights]);
  const monthCoverageKPI = useMemo(() => calcCoverageKPI(month.coverageActual, month.coverageTarget, settings.kpiWeights), [month, settings.kpiWeights]);
  const month15DaysKPI = useMemo(() => calc15DaysKPI(month.sales15DaysActual, month.salesTarget), [month]);
  const monthSKUKPI = useMemo(() => calcSKUKPI(month.skuActual, settings.skuTiers), [month, settings.skuTiers]);
  const monthTotalKPI = useMemo(() => calcTotalKPI(month, settings.kpiWeights, settings.skuTiers), [month, settings.kpiWeights, settings.skuTiers]);

  const salesRatio = useMemo(() => (month.salesTarget > 0 ? (month.salesActual / month.salesTarget) * 100 : 0), [month]);
  const coverageRatio = useMemo(() => (month.coverageTarget > 0 ? (month.coverageActual / month.coverageTarget) * 100 : 0), [month]);
  const skuRatio = (month.skuActual / 4.7) * 100;

  const timeElapsedRatio = isCurrentMonth ? (currentDay / daysInMonth) * 100 : 100;

  // Prediction Engine
  const avgDailySalesSoFar = month.salesActual / Math.max(1, currentDay);
  const remainingDays = isCurrentMonth ? Math.max(0, daysInMonth - currentDay) : 0;
  const projectedSalesEndOfMonth = isCurrentMonth ? month.salesActual + (avgDailySalesSoFar * remainingDays) : month.salesActual;
  const projectedSalesRatio = (projectedSalesEndOfMonth / (month.salesTarget || 1)) * 100;
  const requiredDailySales = isCurrentMonth ? Math.max(0, (month.salesTarget - month.salesActual) / remainingDays) : 0;

  const MilestoneBadge = ({ salesPct }: { salesPct: number }) => {
    const milestones = [];
    if (salesPct >= 120) milestones.push({ label: "🏆 XUẤT SẮC", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" });
    else if (salesPct >= 100) milestones.push({ label: "✅ ĐẠT MỤC TIÊU", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" });
    else if (salesPct >= 80) milestones.push({ label: "⚡ GẦN ĐẠT", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" });
    
    if (milestones.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {milestones.map((m, i) => (
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            key={i} 
            className={cn("text-[10px] font-black px-3 py-1 rounded-full border", m.color, m.bg, m.border)}
          >
            {m.label}
          </motion.span>
        ))}
      </div>
    );
  };

  const getStatus = (ratio: number, base: number = timeElapsedRatio) => {
    if (ratio >= base) return 'success';
    if (ratio >= base * 0.8) return 'warning';
    return 'danger';
  };

  const salesStatus = getStatus(salesRatio);
  const coverageStatus = getStatus(coverageRatio);
  const skuStatus = getStatus(skuRatio, 100);

  const handleExportExcel = () => {
    // Export full year data
    const kpiData = months.map((m, i) => {
      const salesKPI = calcSalesKPI(m.salesActual, m.salesTarget, settings.kpiWeights);
      const coverageKPI = calcCoverageKPI(m.coverageActual, m.coverageTarget, settings.kpiWeights);
      const m15DaysKPI = calc15DaysKPI(m.sales15DaysActual, m.salesTarget);
      const skuKPI = calcSKUKPI(m.skuActual, settings.skuTiers);
      const totalKPI = calcTotalKPI(m, settings.kpiWeights, settings.skuTiers);
      
      return {
        'Tháng': `Tháng ${i + 1}`,
        'Mục tiêu Doanh số': m.salesTarget,
        'Thực đạt Doanh số': m.salesActual,
        'Tỉ lệ Doanh số (%)': m.salesTarget ? ((m.salesActual / m.salesTarget) * 100).toFixed(1) : 0,
        'Điểm Doanh số': salesKPI.toFixed(2),
        'Mục tiêu Bao phủ': m.coverageTarget,
        'Thực đạt Bao phủ': m.coverageActual,
        'Điểm Bao phủ': coverageKPI.toFixed(2),
        'Thực đạt SKU': m.skuActual,
        'Điểm SKU': skuKPI.toFixed(2),
        'Doanh số 15 Ngày': m.sales15DaysActual,
        'Điểm 15 Ngày': month15DaysKPI.toFixed(2),
        'Tên chỉ tiêu riêng': m.customName,
        'Điểm riêng': m.customPoints,
        'TỔNG ĐIỂM KPI': totalKPI.toFixed(2)
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo Năm");

    // Monthly Detail sheet for current month
    const currentMonthDetail = [
       { 'Hạng mục': 'Doanh số thực đạt', 'Giá trị': month.salesActual },
       { 'Hạng mục': 'Mục tiêu tháng', 'Giá trị': month.salesTarget },
       { 'Hạng mục': 'Tiến độ doanh số (%)', 'Giá trị': salesRatio.toFixed(1) + '%' },
       { 'Hạng mục': 'Điểm doanh số', 'Giá trị': monthSalesKPI },
       { 'Hạng mục': 'Bao phủ thực đạt', 'Giá trị': month.coverageActual },
       { 'Hạng mục': 'Điểm bao phủ', 'Giá trị': monthCoverageKPI },
       { 'Hạng mục': 'SKU Focus', 'Giá trị': month.skuActual },
       { 'Hạng mục': 'Điểm SKU', 'Giá trị': monthSKUKPI },
       { 'Hạng mục': 'TỔNG ĐIỂM KPI THÁNG', 'Giá trị': monthTotalKPI.toFixed(2) }
    ];
    const wsDetail = XLSX.utils.json_to_sheet(currentMonthDetail);
    XLSX.utils.book_append_sheet(wb, wsDetail, `Chi tiết Tháng ${currentMonthIndex + 1}`);

    // Notes/Memories sheet
    const notesData = notes.map(m => ({
      'Tiêu đề': m.text,
      'Ngày nạp': new Date(m.createdAt).toLocaleDateString('vi-VN'),
      'Hình thức': m.reminderType,
      'Tags': m.tag
    }));
    const wsNotes = XLSX.utils.json_to_sheet(notesData);
    XLSX.utils.book_append_sheet(wb, wsNotes, "Ghi chú");

    XLSX.writeFile(wb, `BaoCao_NamDuoc_T${currentMonthIndex + 1}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      className="pb-40 bg-transparent min-h-screen font-sans selection:bg-blue-500/30 will-change-transform"
    >
      
      {/* MISSION CONTROL HEADER */}
      <motion.div variants={itemVariants} className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-xl border-b border-white/5 pt-8 pb-6 px-6 will-change-transform">
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
              {streak > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl shadow-lg shadow-orange-500/5">
                  <Flame className="w-4 h-4 text-orange-500 fill-current" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-orange-500 leading-none uppercase">Streak</span>
                    <span className="text-xs font-black text-white leading-none">{streak} Ngày</span>
                  </div>
                </div>
              )}
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
          </motion.section>
        ) : null}

        {/* TIER 2: ACTION HUB */}
        <motion.section variants={itemVariants} className="relative overflow-hidden bg-slate-900/40 rounded-[3rem] border border-white/5 p-6 md:p-8 backdrop-blur-2xl shadow-2xl group">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <motion.div 
                  whileHover={{ rotate: 180 }}
                  className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-900/20 cursor-pointer transition-transform"
                >
                   <Zap className="w-7 h-7 text-white fill-current" />
                </motion.div>
                <div>
                   <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">Bảng Công Việc & Lời Nhắc</h2>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Kế hoạch hàng ngày & Ghi chú tự động</p>
                </div>
              </div>

              {dailyTasks.length > 0 && (
                <div className="bg-slate-950/80 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-6 shrink-0 backdrop-blur-md">
                   <div>
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Nhiệm vụ xong</p>
                      <span className="text-lg font-black text-white font-mono">{dailyTasks.filter(t => t.isCompleted).length}/{dailyTasks.length}</span>
                   </div>
                </div>
              )}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-start">
             {/* Left Panel: Daily KPI Tasks */}
             <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4" /> Nhiệm vụ chỉ tiêu
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{dailyTasks.length} công việc</span>
                </div>

                {dailyTasks.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dailyTasks
                        .filter(t => taskFilter === 'all' || t.type === taskFilter)
                        .map((task, idx) => (
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
                     className="py-12 text-center border border-dashed border-white/10 rounded-[2rem]"
                   >
                      <Bookmark className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                      <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-1 italic">Trống nhiệm vụ</h4>
                      <p className="text-xs font-medium text-slate-500 italic">"Chưa thiết lập mục tiêu ngày..."</p>
                   </motion.div>
                )}
             </div>

             {/* Right Panel: Smart Automated Alerts from user's notes */}
             <div className="lg:col-span-4 bg-slate-950/40 border border-white/5 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                   <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400 fill-current animate-pulse" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Gợi ý từ Ghi chú</h3>
                   </div>
                   {pendingNotes.length > 0 && (
                      <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-2.5 py-0.5 rounded-full font-black font-mono animate-pulse">
                        {pendingNotes.length} LƯU Ý
                      </span>
                   )}
                </div>

                {pendingNotes.length > 0 ? (
                   <div className="space-y-3 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
                      {pendingNotes.map((note) => {
                         const tagLabel = note.tag === 'urgent' ? 'GẤP' : note.tag === 'customer' ? 'KHÁCH' : note.tag === 'meeting' ? 'HỌP' : 'LƯU Ý';
                         const tagColor = note.tag === 'urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' : note.tag === 'customer' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : note.tag === 'meeting' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-slate-800 text-slate-400 border-white/5';
                         
                         return (
                            <motion.div 
                               key={note.id}
                               whileHover={{ x: 2 }}
                               className="p-3 bg-slate-950 border border-white/5 rounded-xl hover:border-white/10 transition-all flex items-start gap-3 group relative overflow-hidden"
                            >
                               <button 
                                 onClick={() => {
                                   toggleNote(note.id);
                                 }}
                                 className="mt-0.5 w-5 h-5 rounded-lg border border-slate-700 hover:border-blue-500 flex items-center justify-center text-transparent hover:text-blue-400 transition-colors cursor-pointer shrink-0"
                               >
                                  ✓
                               </button>
                               <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-200 leading-normal break-words pr-2 group-hover:text-white transition-colors">{note.text}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                     <span className={cn("text-[8px] font-black tracking-widest border px-1.5 py-0.5 rounded-full uppercase", tagColor)}>
                                        {tagLabel}
                                     </span>
                                     {note.reminderTime && (
                                        <span className="text-[8px] text-slate-500 font-bold font-mono">⏱ {note.reminderTime}</span>
                                     )}
                                  </div>
                               </div>
                            </motion.div>
                         );
                      })}
                   </div>
                ) : (
                   <div className="py-8 text-center text-slate-600 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Hộp Thư Sạch Sẽ</p>
                      <p className="text-[11px] italic font-medium">Toàn bộ ghi chú quan trọng đã hoàn tất gọn gàng!</p>
                   </div>
                )}
                
                <p className="text-[9px] text-slate-500 leading-tight">
                  💡 Ghi chú mới viết ở tab <b>Ghi chú</b> chưa hoàn thành sẽ tự động đồng bộ về đây để đốc thúc bạn làm việc mỗi ngày.
                </p>
             </div>
           </div>
        </motion.section>

        {/* TOP LEVEL METRICS */}
        <section className="space-y-6">
           <div className="px-4">
             <MilestoneBadge salesPct={salesRatio} />
             <motion.div variants={itemVariants} className="flex items-center justify-between">
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
                title="Năng lực" 
                value={monthTotalKPI.toFixed(1)} 
                percent={Math.min(100, monthTotalKPI)} 
                status={salesStatus === 'danger' ? 'danger' : 'success'} 
                icon={Award} 
              />
           </div>
        </section>

        {/* TIER 4: DAILY STRIKE */}
        <div className="flex items-center justify-between px-4 mb-4">
           <div className="flex flex-col">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Mục tiêu & Tiến độ hôm nay</span>
             <div className="flex items-center gap-2">
                <div className="h-0.5 w-8 bg-blue-500/50 rounded-full" />
                <span className="text-[9px] font-black text-blue-500 uppercase">{dailyTasks.filter(t => t.isCompleted).length}/{dailyTasks.length} Đã xong</span>
             </div>
           </div>
           <div className="flex gap-2">
              {['all', 'sales', 'coverage', 'sku'].map(filt => (
                <button 
                  key={filt}
                  onClick={() => setTaskFilter(filt)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer active:scale-95",
                    taskFilter === filt 
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" 
                      : "bg-slate-900/50 text-slate-500 border border-white/5 hover:text-slate-300 hover:border-slate-700"
                  )}
                >
                  {filt === 'all' ? 'Tất cả' : filt === 'sales' ? 'Doanh số' : filt === 'coverage' ? 'Bao phủ' : 'SKU'}
                </button>
              ))}
           </div>
        </div>

        {/* ACTIONS & SECONDARY SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative mb-20 px-4">
           
           <motion.div variants={itemVariants} className="lg:col-span-12 space-y-8">
              <section className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-6 md:p-8 lg:w-1/2 lg:mx-auto group">
                 <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Database className="w-4 h-4 group-hover:text-blue-400 transition-colors" /> Tổng hợp dữ liệu
                 </h3>
                 <div className="flex flex-col gap-3">
                    <motion.button 
                       whileHover={{ scale: 1.02, x: 5 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={handleExportExcel}
                       className="flex items-center justify-between w-full px-5 py-5 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 transition-all text-[9.5px] font-black uppercase tracking-[0.15em] shadow-lg shadow-emerald-950/20"
                    >
                      <span className="flex items-center gap-3"><FileSpreadsheet className="w-4.5 h-4.5" /> Xuất Báo cáo Excel Năm</span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </motion.button>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <motion.button 
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         onClick={async () => {
                           const state = useAppStore.getState();
                           const backupData = JSON.stringify({
                             months: state.months,
                             quarters: state.quarters,
                             halfYears: state.halfYears,
                             notes: state.notes,
                             memories: state.memories,
                             dailySnapshots: state.dailySnapshots,
                             taskLogs: state.taskLogs,
                             strategyLogs: state.strategyLogs,
                             userProfile: state.userProfile,
                             settings: state.settings,
                             version: '1.0.0',
                             exportDate: new Date().toISOString()
                           }, null, 2);
                           await saveFile(`namduoc_kpi_backup_${new Date().toISOString().split('T')[0]}.json`, backupData, 'application/json');
                         }}
                         className="flex flex-col items-center justify-center py-4 bg-white/5 hover:bg-blue-500/10 text-blue-400 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all text-[9px] font-black uppercase tracking-widest gap-2"
                      >
                        <Download className="w-4 h-4" /> Sao lưu
                      </motion.button>
                      
                      <motion.label 
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         className="flex flex-col items-center justify-center py-4 bg-white/5 hover:bg-orange-500/10 text-orange-400 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all text-[9px] font-black uppercase tracking-widest gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" /> Khôi phục
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".json"
                          onClick={(e: any) => { e.target.value = null; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const data = JSON.parse(event.target?.result as string);
                                if (data.settings) {
                                  const store = useAppStore.getState();
                                  store.importData(data);
                                  alert('Khôi phục dữ liệu thành công! Trình duyệt sẽ tự động tải lại.');
                                  setTimeout(() => window.location.reload(), 1000);
                                } else {
                                  alert('File không hợp lệ!');
                                }
                              } catch (err) {
                                alert('Lỗi khi đọc file backup!');
                              }
                            };
                            reader.readAsText(file);
                          }}
                        />
                      </motion.label>
                    </div>
                 </div>
              </section>
           </motion.div>
        </div>
      </div>

      {/* TIER 5: MISSION CONTROL NAVIGATION */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, type: 'spring', damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-8 pt-0 pointer-events-none will-change-transform"
      >
         <div className="max-w-xl mx-auto flex items-center justify-end pointer-events-auto">
            
            <div className="flex items-center gap-4">
               <motion.button 
                 whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)" }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setIsDataEntryOpen(true)}
                 className="h-16 px-8 bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-full shadow-2xl active:scale-95 transition-all flex items-center gap-3"
               >
                  <PlusCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Cập nhật thực tế</span>
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
                 <DataEntry hideHeader={true} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
