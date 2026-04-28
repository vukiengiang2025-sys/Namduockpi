import { useAppStore } from '../store';
import { calc15DaysSalesKPI, calcCoverageKPI, calcSalesKPI, calcSKUKPI } from '../lib/kpi';
import { formatPercent } from '../lib/utils';
import { motion } from 'motion/react';
import { Target, TrendingUp, Award, Download, Upload, PieChart, Activity, CheckCircle2, Clock, FileSpreadsheet, AlertTriangle, Lightbulb, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import * as XLSX from 'xlsx';
import { APP_ICONS } from './Settings';
import { getAIInsight, AIInsight } from '../services/aiService';

function MetricCard({ title, value, icon: Icon, subtitle, isHighlight = false, colorParams = 'blue' }: any) {
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
    <div className={`p-4 rounded-3xl flex items-start gap-4 backdrop-blur-md border shadow-2xl transition-all ${containerClass}`}>
      <div className={`p-3 rounded-2xl ${iconContainerClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-medium">{title}</p>
        <h4 className={`text-xl font-bold font-mono ${valueClass}`}>{value}</h4>
        {subtitle && <p className="text-[10px] text-slate-500 mt-1 italic">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { 
    months, quarters, halfYears, selectedMonthIndex, setSelectedMonthIndex, settings,
    dailyTasks, setDailyTasks, toggleDailyTask, updateDailyTaskProgress,
    lastInsight, setLastInsight, logTask
  } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const realCurrentMonthIndex = new Date().getMonth();
  const currentMonthIndex = selectedMonthIndex;
  const currentQuarterIndex = Math.floor(currentMonthIndex / 3);
  const currentHalfYearIndex = Math.floor(currentMonthIndex / 6);

  const realQuarterIndex = Math.floor(realCurrentMonthIndex / 3);
  const realHalfYearIndex = Math.floor(realCurrentMonthIndex / 6);

  const currentMonthStr = `Tháng ${currentMonthIndex + 1}`;
  const currentQuarterStr = `Quý ${currentQuarterIndex + 1}`;
  const currentHalfStr = currentHalfYearIndex === 0 ? '6 Tháng Đầu Năm' : '6 Tháng Cuối Năm';

  const month = months[currentMonthIndex];
  const quarterCustom = quarters[currentQuarterIndex];
  const halfCustom = halfYears[currentHalfYearIndex];

  // Derive Quarter from months
  const currentQuarterMonths = months.slice(currentQuarterIndex * 3, currentQuarterIndex * 3 + 3);
  const quarter = {
    salesTarget: currentQuarterMonths.reduce((sum, m) => sum + (m.salesTarget || 0), 0),
    salesActual: currentQuarterMonths.reduce((sum, m) => sum + (m.salesActual || 0), 0),
    coverageTarget: currentQuarterMonths.reduce((sum, m) => sum + (m.coverageTarget || 0), 0),
    coverageActual: currentQuarterMonths.reduce((sum, m) => sum + (m.coverageActual || 0), 0),
    custom1Name: quarterCustom.custom1Name,
    custom1Points: quarterCustom.custom1Points,
    custom2Name: quarterCustom.custom2Name,
    custom2Points: quarterCustom.custom2Points,
  };

  // Derive Half Year from months
  const currentHalfMonths = months.slice(currentHalfYearIndex * 6, currentHalfYearIndex * 6 + 6);
  const halfYear = {
    salesTarget: currentHalfMonths.reduce((sum, m) => sum + (m.salesTarget || 0), 0),
    salesActual: currentHalfMonths.reduce((sum, m) => sum + (m.salesActual || 0), 0),
    coverageTarget: currentHalfMonths.reduce((sum, m) => sum + (m.coverageTarget || 0), 0),
    coverageActual: currentHalfMonths.reduce((sum, m) => sum + (m.coverageActual || 0), 0),
    customName: halfCustom.customName,
    customPoints: halfCustom.customPoints,
  };

  // Month Calcs
  const monthSalesRatio = formatPercent(month.salesActual, month.salesTarget);
  const monthCoverageRatio = formatPercent(month.coverageActual, month.coverageTarget);
  const monthSalesKPI = calcSalesKPI(month.salesActual, month.salesTarget);
  const monthCoverageKPI = calcCoverageKPI(month.coverageActual, month.coverageTarget, 0.5);
  const month15DaysKPI = calc15DaysSalesKPI(month.sales15DaysActual, month.salesTarget);
  const monthSKUKPI = calcSKUKPI(month.skuActual);
  const monthTotalKPI = monthSalesKPI + monthCoverageKPI + month15DaysKPI + monthSKUKPI + (month.customPoints || 0);

  // Quarter Calcs
  const quarterSalesRatio = formatPercent(quarter.salesActual, quarter.salesTarget);
  const quarterCoverageRatio = formatPercent(quarter.coverageActual, quarter.coverageTarget);
  const quarterSalesKPI = calcSalesKPI(quarter.salesActual, quarter.salesTarget);
  const quarterCoverageKPI = calcCoverageKPI(quarter.coverageActual, quarter.coverageTarget, 1);
  const quarterTotalKPI = quarterSalesKPI + quarterCoverageKPI + (quarter.custom1Points || 0) + (quarter.custom2Points || 0);

  // HalfYear Calcs
  const halfSalesRatio = formatPercent(halfYear.salesActual, halfYear.salesTarget);
  const halfCoverageRatio = formatPercent(halfYear.coverageActual, halfYear.coverageTarget);
  const halfSalesKPI = calcSalesKPI(halfYear.salesActual, halfYear.salesTarget);
  const halfCoverageKPI = calcCoverageKPI(halfYear.coverageActual, halfYear.coverageTarget, 1);
  const halfTotalKPI = halfSalesKPI + halfCoverageKPI + (halfYear.customPoints || 0);

  // Insights Logic
  const currentDay = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), realCurrentMonthIndex + 1, 0).getDate();
  const timeElapsedRatio = currentDay / daysInMonth;
  const targetForSales = month.salesTarget || 1;
  const actualForSales = month.salesActual || 0;
  const salesRatio = actualForSales / targetForSales;
  const isBehind = salesRatio < timeElapsedRatio;
  const forecastedRatio = timeElapsedRatio > 0 ? salesRatio / timeElapsedRatio : 0;
  
  const avgDailySales = currentDay > 0 ? actualForSales / currentDay : 0;
  const remainingTarget = Math.max(0, targetForSales - actualForSales);
  const remainingDays = daysInMonth - currentDay;
  const requiredDailySales = remainingDays > 0 ? remainingTarget / remainingDays : 0;
  
  const insight = (month.salesTarget && month.salesActual && currentMonthIndex === realCurrentMonthIndex) ? {
    currentDay,
    daysInMonth,
    timeElapsedRatio,
    salesRatio,
    isBehind,
    forecastedRatio,
    avgDailySales,
    requiredDailySales,
    remainingDays
  } : null;

  // Auto trigger analysis if behind and no tasks exist for today
  React.useEffect(() => {
    const today = new Date().setHours(0,0,0,0);
    const hasTasksToday = dailyTasks.some(t => {
      const taskDate = new Date(t.createdAt).setHours(0,0,0,0);
      return taskDate === today;
    });

    const shouldAutoTrigger = 
      insight?.isBehind && 
      !hasTasksToday && 
      !isAnalyzing && 
      settings.geminiKey &&
      currentMonthIndex === realCurrentMonthIndex;

    if (shouldAutoTrigger) {
      handleAnalyze();
    }
  }, [insight?.isBehind, dailyTasks, settings.geminiKey]);

  const handleAnalyze = async () => {
    if (!insight) return;

    // Stability Guard: Don't re-plan if we have a very recent plan (within 2 hours)
    const latestTaskDate = dailyTasks.length > 0 ? Math.max(...dailyTasks.map(t => t.createdAt)) : 0;
    const hoursSinceLastPlan = (Date.now() - latestTaskDate) / (1000 * 60 * 60);
    
    if (dailyTasks.length > 0 && hoursSinceLastPlan < 2) {
      if (!confirm('Bạn vừa lập kế hoạch cách đây chưa đầy 2 giờ. Việc thay đổi quá thường xuyên có thể làm loãng chiến thuật. Bạn vẫn muốn lập lại?')) {
        return;
      }
    }

    setIsAnalyzing(true);
    setLastInsight(null);
    try {
      const result = await getAIInsight(
        insight.salesRatio * 100,
        insight.timeElapsedRatio * 100,
        insight.forecastedRatio * 100,
        month.skuActual || 0,
        month.coverageActual || 0,
        insight.remainingDays,
        insight.avgDailySales,
        insight.requiredDailySales
      );
      setLastInsight(result);
      if (result.actions && result.actions.length > 0) {
        setDailyTasks(result.actions.map(act => ({
          text: act.task,
          priority: act.priority,
          target: act.target,
          expectedImpact: act.impact,
          confidence: act.confidence,
          confidenceDetails: act.confidenceDetails,
          type: act.type
        })), monthTotalKPI);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Daily Snapshot Logic
  const { addDailySnapshot, dailySnapshots } = useAppStore();
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const hasSnapshot = dailySnapshots.some(s => s.date === today);
    
    // We only take snapshots for the current real month
    if (month && currentMonthIndex === realCurrentMonthIndex) {
      addDailySnapshot({
        date: today,
        timestamp: Date.now(),
        salesActual: month.salesActual,
        coverageActual: month.coverageActual,
        skuActual: month.skuActual,
        kpiScore: monthTotalKPI,
        tasksCompleted: dailyTasks.filter(t => t.isCompleted).length,
        tasksTotal: dailyTasks.length
      });
    }
  }, [month.salesActual, month.coverageActual, month.skuActual, monthTotalKPI, dailyTasks.length, dailyTasks.filter(t => t.isCompleted).length]);

  const getStatusBadge = (currentIndex: number, realIndex: number) => {
    if (currentIndex === realIndex) return <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded-full font-medium ml-2"><Clock className="w-3 h-3" />Đang diễn ra</span>;
    if (currentIndex < realIndex) return <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-500 text-[10px] px-2 py-0.5 rounded-full font-medium ml-2"><CheckCircle2 className="w-3 h-3" />Đã tổng kết</span>;
    return <span className="flex items-center gap-1 bg-slate-500/20 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-medium ml-2"><Clock className="w-3 h-3" />Chưa bắt đầu</span>;
  };

  const handleExport = async () => {
    try {
      const state = useAppStore.getState();
      const dataToSave = {
        months: state.months,
        quarters: state.quarters,
        halfYears: state.halfYears,
        settings: state.settings,
        notes: state.notes
      };
      const jsonStr = JSON.stringify(dataToSave, null, 2);
      const fileName = `kpi_backup_${new Date().toISOString().split('T')[0]}.json`;

      if (Capacitor.isNativePlatform()) {
        await Filesystem.writeFile({
          path: fileName,
          data: jsonStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        alert(`Đã lưu file ${fileName} vào thư mục Documents của màn hình điện thoại.`);
      } else {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    } catch (e: any) {
      alert('Lỗi khi lưu file: ' + e.message);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... logic
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        useAppStore.getState().importData(json);
        alert('Phục hồi dữ liệu thành công!');
      } catch (err) {
        alert('File không hợp lệ!');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportExcel = () => {
    try {
      const state = useAppStore.getState();
      const wsData = state.months.map((m, i) => ({
        'Tháng': `Tháng ${i + 1}`,
        'Chỉ tiêu DS': m.salesTarget || 0,
        'Thực hiện DS': m.salesActual || 0,
        'Tỉ lệ DS': ((m.salesActual / (m.salesTarget || 1)) * 100).toFixed(2) + '%',
        'Chỉ tiêu Phủ': m.coverageTarget || 0,
        'Thực hiện Phủ': m.coverageActual || 0,
        'Tỉ lệ CV': ((m.coverageActual / (m.coverageTarget || 1)) * 100).toFixed(2) + '%',
        'SKU': m.skuActual || 0,
        'Custom': m.customPoints || 0
      }));
      const worksheet = XLSX.utils.json_to_sheet(wsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "DuLieuNam");
      XLSX.writeFile(workbook, "BaoCaoKPI.xlsx");
      alert("Đã xuất báo cáo Excel thành công!");
    } catch (e: any) {
      alert("Lỗi khi xuất Báo cáo: " + e.message);
    }
  };

  const currentIconDef = APP_ICONS.find(i => i.id === settings.appIcon) || APP_ICONS[0];
  const AppIconNode = currentIconDef.icon;
  const isDetailsFirst = settings.dashboardLayout === 'details-first';

  const MonthHeaderStats = () => (
    <>
      <MetricCard 
        title="Điểm KPI Tháng" 
        value={`${monthTotalKPI.toFixed(1)}`} 
        icon={Award} 
        isHighlight 
        colorParams="blue"
        subtitle={`Tối đa: ${150 + 7.5 + 7.5 + 7.5 + (month.customPoints > 0 ? month.customPoints : 10)} điểm`}
      />
      <div className="grid grid-cols-2 gap-3">
        <MetricCard title="Đạt Doanh Số" value={monthSalesRatio} icon={PieChart} />
        <MetricCard title="Độ Bao Phủ" value={monthCoverageRatio} icon={Target} />
      </div>
    </>
  );

  const MonthDetailsInfo = () => (
    <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 backdrop-blur-xl mt-2 w-full">
      <h4 className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 mb-3 tracking-widest uppercase border-b border-white/5 pb-2">
        <Activity className="w-3 h-3 text-blue-400" />
        Chi tiết thành phần
      </h4>
      <ul className="space-y-2.5">
        <li className="flex justify-between items-center text-sm">
          <span className="text-slate-400 text-xs">Doanh số ({settings.kpiWeights?.sales || 80}đ)</span>
          <span className="font-mono text-white bg-slate-800/80 px-2 py-0.5 rounded text-xs border border-white/5">{monthSalesKPI.toFixed(1)}</span>
        </li>
        <li className="flex justify-between items-center text-sm">
          <span className="text-slate-400 text-xs">Bao phủ ({settings.kpiWeights?.coverage || 10}đ)</span>
          <span className="font-mono text-white bg-slate-800/80 px-2 py-0.5 rounded text-xs border border-white/5">{monthCoverageKPI.toFixed(1)}</span>
        </li>
        <li className="flex justify-between items-center text-sm">
          <span className="text-slate-400 text-xs">Tiến độ 15 ngày ({settings.kpiWeights?.month15Days || 5}đ)</span>
          <span className="font-mono text-white bg-slate-800/80 px-2 py-0.5 rounded text-xs border border-white/5">{month15DaysKPI.toFixed(1)}</span>
        </li>
        <li className="flex justify-between items-center text-sm">
          <span className="text-slate-400 text-xs">SKU ({settings.kpiWeights?.sku || 7.5}đ)</span>
          <span className="font-mono text-white bg-slate-800/80 px-2 py-0.5 rounded text-xs border border-white/5">{monthSKUKPI.toFixed(1)}</span>
        </li>
        <li className="flex justify-between items-center text-sm">
          <span className="text-slate-400 text-xs">{month.customName || 'Tùy chỉnh'}</span>
          <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs border border-blue-500/20">{month.customPoints}</span>
        </li>
      </ul>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
      className="space-y-8"
    >
      <div className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
             <AppIconNode className={`w-4 h-4 ${
               settings.themeColor === 'emerald' ? 'text-emerald-500' :
               settings.themeColor === 'purple' ? 'text-purple-500' :
               settings.themeColor === 'rose' ? 'text-rose-500' :
               'text-blue-500'
             }`} />
             <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">{settings.appTitle || 'Hệ thống báo cáo KPI'}</span>
          </div>
          <select 
            value={selectedMonthIndex}
            onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
            className="bg-slate-800/80 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-medium focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
          >
            {Array(12).fill(0).map((_, i) => (
              <option key={i} value={i}>Dữ liệu T{i + 1}</option>
            ))}
          </select>
        </div>
        <h1 className="text-2xl font-light text-white tracking-tight">Tổng Quan <span className="font-bold">Kinh Doanh</span></h1>
      </div>

      <div className="px-5 space-y-10 max-w-lg mx-auto">
        {/* Daily Execution Engine */}
        {insight && (dailyTasks.length > 0 || !lastInsight) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-1 rounded-[32px] bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-slate-900 border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="bg-slate-950/80 backdrop-blur-3xl p-5 rounded-[30px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-none mb-1">Daily Execution</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Làm để về số</p>
                  </div>
                </div>
                {dailyTasks.length > 0 && (
                  <div className="flex gap-2">
                    {(() => {
                      const hour = new Date().getHours();
                      const progress = dailyTasks.length > 0 ? (dailyTasks.filter(t => t.isCompleted).length / dailyTasks.length) : 0;
                      if (hour >= 14 && progress < 0.5) {
                        return (
                          <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 text-red-400">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-[10px] font-bold">Cần Re-plan!</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing}
                      className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400"
                    >
                      <Clock className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}
              </div>

              {dailyTasks.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-400 mb-3">Chưa có kế hoạch hành động hôm nay.</p>
                  <button 
                    onClick={handleAnalyze}
                    className="bg-blue-500 text-white text-xs font-bold px-6 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    Lập kế hoạch ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {lastInsight?.riskAlert && (
                    <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <p className="text-[10px] text-red-200 font-medium leading-tight">{lastInsight.riskAlert}</p>
                    </div>
                  )}

                  {lastInsight?.daily_target && (
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 mb-2">
                      <p className="text-[9px] text-blue-400 uppercase tracking-tighter mb-1 font-bold">Mục tiêu doanh số hôm nay</p>
                      <p className="text-sm font-bold text-white">{lastInsight.daily_target}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {dailyTasks.map((task) => (
                       <div key={task.id} className="group relative">
                        {task.isCompleted && (
                          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1 rounded-full z-10 shadow-lg scale-75 group-hover:scale-100 transition-transform">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                        <div className={`p-4 rounded-2xl border transition-all ${
                          task.isCompleted ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-white/5 border-white/10'
                        }`}>
                          <div className="flex gap-3 items-start">
                            <button 
                              onClick={() => {
                                if (!task.isCompleted) {
                                  logTask({
                                    taskId: task.id,
                                    text: task.text,
                                    planned: task.target || 0,
                                    done: task.target || 1,
                                    kpiAtStart: task.kpiAtStart || monthTotalKPI,
                                    kpiAtEnd: monthTotalKPI,
                                    type: task.type
                                  });
                                }
                                toggleDailyTask(task.id);
                              }}
                              className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                task.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20 text-transparent'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {task.type && (
                                    <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded uppercase font-black shrink-0">{task.type}</span>
                                  )}
                                  <p className={`text-xs font-medium leading-tight truncate ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                    {task.text}
                                  </p>
                                </div>
                                <span className={`text-[8px] uppercase tracking-tighter font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                  task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                  'bg-slate-500/20 text-slate-400'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                              
                              <div className="flex gap-2 mb-1.5">
                                {task.expectedImpact && (
                                  <span className="text-[9px] text-blue-400 font-bold bg-blue-500/10 px-1.5 rounded">{task.expectedImpact} Impact</span>
                                )}
                                {task.confidence !== undefined && (
                                  <div className="group/conf relative">
                                    <span className="text-[9px] text-slate-500 font-medium cursor-help hover:text-slate-300 transition-colors">
                                      Confidence: {Math.round(task.confidence * 100)}%
                                    </span>
                                    {task.confidenceDetails && (
                                      <div className="absolute top-full left-0 mt-1 p-2 bg-slate-900 border border-white/10 rounded-lg shadow-2xl z-30 hidden group-hover/conf:block w-32 backdrop-blur-xl">
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-center text-[8px] font-bold">
                                            <span className="text-slate-500">Dữ liệu</span>
                                            <span className="text-white">{Math.round(task.confidenceDetails.dataQuality * 100)}%</span>
                                          </div>
                                          <div className="flex justify-between items-center text-[8px] font-bold">
                                            <span className="text-slate-500">Lịch sử</span>
                                            <span className="text-white">{Math.round(task.confidenceDetails.historicalSupport * 100)}%</span>
                                          </div>
                                          <div className="flex justify-between items-center text-[8px] font-bold">
                                            <span className="text-slate-500">Ký ức</span>
                                            <span className="text-white">{Math.round(task.confidenceDetails.memoryMatch * 100)}%</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {task.target && (
                                <div className="mt-3 space-y-2">
                                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                                    <span className="text-slate-500">Tiến độ: {task.done}/{task.target}</span>
                                    <span className={task.isCompleted ? 'text-emerald-400' : 'text-blue-400'}>
                                      {Math.round((task.done / task.target) * 100)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (task.done / task.target) * 100)}%` }}
                                        className={`h-full rounded-full ${task.isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                      />
                                    </div>
                                    {!task.isCompleted && (
                                      <div className="flex gap-1">
                                        <button 
                                          onClick={() => updateDailyTaskProgress(task.id, Math.max(0, task.done - 1))}
                                          className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-slate-400"
                                        >-</button>
                                        <button 
                                          onClick={() => updateDailyTaskProgress(task.id, task.done + 1)}
                                          className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold"
                                        >+</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {lastInsight?.references && lastInsight.references.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-slate-600 mb-2 flex items-center gap-1 font-medium">
                        <BrainCircuit className="w-3 h-3" /> Trí nhớ hỗ trợ:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {lastInsight.references.map((ref, i) => (
                          <span key={i} className="text-[9px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-md italic">
                            {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Month Section */}
        <section className="relative">
          <div className="absolute -left-5 top-0 bottom-0 w-1 bg-blue-500/20 rounded-r-lg"></div>
          <div className="flex items-center mb-4">
             <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-2"></span>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">KPI {currentMonthStr}</h2>
            {getStatusBadge(currentMonthIndex, realCurrentMonthIndex)}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {isDetailsFirst ? (
              <>
                <MonthDetailsInfo />
                <MonthHeaderStats />
              </>
            ) : (
              <>
                <MonthHeaderStats />
                <MonthDetailsInfo />
              </>
            )}

            {insight && (
              <div className={`mt-2 p-4 rounded-3xl border backdrop-blur-xl ${insight.isBehind ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${insight.isBehind ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {insight.isBehind ? <AlertTriangle className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-semibold mb-1 ${insight.isBehind ? 'text-red-400' : 'text-emerald-400'}`}>
                      {insight.isBehind ? 'Cảnh báo Tiến độ' : 'Tiến độ Tuyệt vời'}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      Đã qua <span className="font-bold text-white">{(insight.timeElapsedRatio * 100).toFixed(0)}%</span> thời gian của tháng (ngày {insight.currentDay}/{insight.daysInMonth}), nhưng doanh số mới đạt <span className="font-bold text-white">{(insight.salesRatio * 100).toFixed(1)}%</span>.
                      <br/>
                      Dự báo cuối tháng: <span className="font-bold text-white">{(insight.forecastedRatio * 100).toFixed(1)}%</span> mục tiêu.
                    </p>
                    
                    {/* Time vs Target Progress Bar */}
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Quỹ thời gian</span>
                          <span>{(insight.timeElapsedRatio * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-950/50 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-slate-400 h-full rounded-full" style={{ width: `${Math.min(100, insight.timeElapsedRatio * 100)}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Doanh số thực tế</span>
                          <span>{(insight.salesRatio * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-950/50 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${insight.isBehind ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, insight.salesRatio * 100)}%` }}></div>
                        </div>
                      </div>

                      {dailyTasks.length > 0 && (
                        <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Thực thi chiến thuật hôm nay</span>
                            <span>{Math.round((dailyTasks.filter(t => t.isCompleted).length / dailyTasks.length) * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-950/50 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${(dailyTasks.filter(t => t.isCompleted).length / dailyTasks.length) * 100}%` }}></div>
                          </div>
                        </div>
                      )}
                      
                      {/* AI Action */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <button
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-blue-400 py-2 rounded-xl border border-blue-500/30 transition-all text-xs font-semibold disabled:opacity-50"
                        >
                          {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          {isAnalyzing ? 'Đang phân tích...' : 'Gợi ý Chiến lược với AI'}
                        </button>
                        
                        {lastInsight && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-4">
                            {/* Daily Target Highlight */}
                            {lastInsight.daily_target && (
                              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-20"><Target className="w-8 h-8" /></div>
                                <p className="text-[10px] text-blue-300 uppercase tracking-widest font-bold mb-1">🎯 Mục tiêu hành động hôm nay</p>
                                <p className="text-xl font-bold text-white tracking-tight leading-tight">{lastInsight.daily_target}</p>
                              </div>
                            )}

                            <div className="flex gap-2 items-start bg-slate-950/50 p-3 rounded-xl border border-white/5">
                              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Vấn đề chính</p>
                                <p className="text-xs text-slate-300 leading-relaxed">{lastInsight.main_issue}</p>
                              </div>
                            </div>

                            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                               <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Chiến thuật hành động</p>
                               <ul className="space-y-3 text-xs text-slate-300">
                                {lastInsight.actions.map((act, i) => (
                                  <li key={i} className="flex gap-2.5 items-start leading-tight group">
                                    <span className={`min-w-2 h-2 rounded-full mt-1.5 ring-4 ring-white/5 ${
                                      act.priority === 'high' ? 'bg-red-400' :
                                      act.priority === 'medium' ? 'bg-yellow-400' :
                                      'bg-slate-400'
                                    }`}></span>
                                    <span>{act.task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* References / Memory Trace */}
                            {lastInsight.references && lastInsight.references.length > 0 && (
                              <div className="pt-2 px-1">
                                <p className="text-[9px] text-slate-500 uppercase tracking-tighter mb-1.5 flex items-center gap-1">
                                  <BrainCircuit className="w-3 h-3" /> Cơ sở phân tích từ Ký ức:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {lastInsight.references.map((ref, idx) => (
                                    <span key={idx} className="bg-white/5 px-2 py-0.5 rounded-md text-[9px] text-slate-400 border border-white/5 italic">
                                      {ref}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quarter Section */}
        <section className="relative">
          <div className="absolute -left-5 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-r-lg"></div>
          <div className="flex items-center mb-4">
             <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-2"></span>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">{currentQuarterStr}</h2>
            {getStatusBadge(currentQuarterIndex, realQuarterIndex)}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <MetricCard 
              title="Điểm KPI Quý" 
              value={`${quarterTotalKPI.toFixed(1)}`} 
              icon={Award} 
              isHighlight 
              colorParams="green"
            />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard title="Đạt Doanh Số" value={quarterSalesRatio} icon={PieChart} />
              <MetricCard title="Đạt Bao Phủ" value={quarterCoverageRatio} icon={Target} />
            </div>

            <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 backdrop-blur-xl mt-2 w-full">
              <h4 className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 mb-3 tracking-widest uppercase border-b border-white/5 pb-2">
                <Activity className="w-3 h-3 text-emerald-400" />
                Dữ liệu lũy kế Quý
              </h4>
              <ul className="space-y-2.5">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Doanh số (80đ)</span>
                  <span className="font-mono text-white bg-slate-800/80 px-2 py-0.5 rounded text-xs border border-white/5">{quarterSalesKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Bao phủ (10đ)</span>
                  <span className="font-mono text-white bg-slate-800/80 px-2 py-0.5 rounded text-xs border border-white/5">{quarterCoverageKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">{quarter.custom1Name || 'Chỉ tiêu 1'} (5đ)</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20">{quarter.custom1Points}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">{quarter.custom2Name || 'Chỉ tiêu 2'} (5đ)</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20">{quarter.custom2Points}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Half Year Section */}
        <section className="relative">
          <div className="absolute -left-5 top-0 bottom-0 w-1 bg-orange-500/20 rounded-r-lg"></div>
          <div className="flex items-center mb-4">
            <span className="w-1.5 h-6 bg-orange-500 rounded-full mr-2"></span>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">{currentHalfStr}</h2>
            {getStatusBadge(currentHalfYearIndex, realHalfYearIndex)}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <MetricCard 
              title="Điểm KPI 6 Tháng" 
              value={`${halfTotalKPI.toFixed(1)}`} 
              icon={Award} 
              isHighlight 
              colorParams="orange"
            />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard title="Đạt Doanh Số" value={halfSalesRatio} icon={PieChart} />
              <MetricCard title="Đạt Bao Phủ" value={halfCoverageRatio} icon={Target} />
            </div>

            <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 backdrop-blur-xl mt-2 w-full">
              <h4 className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 mb-3 tracking-widest uppercase border-b border-white/5 pb-2">
                <Activity className="w-3 h-3 text-orange-400" />
                Dữ liệu lũy kế Bán niên
              </h4>
              <ul className="space-y-2.5">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Doanh số (80đ)</span>
                  <span className="font-mono text-white bg-slate-800/80 px-2 py-0.5 rounded text-xs border border-white/5">{halfSalesKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Bao phủ (10đ)</span>
                  <span className="font-mono text-white bg-slate-800/80 px-2 py-0.5 rounded text-xs border border-white/5">{halfCoverageKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">{halfYear.customName || 'Tùy chỉnh'} (10đ)</span>
                  <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs border border-orange-500/20">{halfYear.customPoints}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Backup and Restore Section */}
        <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl mt-4 mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-4 flex items-center gap-2">
             <span className="w-1.5 h-4 bg-slate-500 rounded-full"></span>
             Dữ liệu & Sao lưu
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={handleExportExcel}
              className="col-span-2 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-3 rounded-2xl border border-emerald-500/20 transition-all text-sm font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất Báo cáo Excel
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-3 rounded-2xl border border-blue-500/20 transition-all text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Lưu cấu hình
            </button>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 py-3 rounded-2xl border border-purple-500/20 transition-all text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Tải lên
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-3 px-2 leading-relaxed">
            Nên thường xuyên lưu cấu hình (.json) ra thiết bị để dự phòng. Xuất Báo cáo Excel để gửi cho sếp.
          </p>
        </div>

      </div>
    </motion.div>
  );
}
