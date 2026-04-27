import { useAppStore } from '../store';
import { calc15DaysSalesKPI, calcCoverageKPI, calcSalesKPI, calcSKUKPI } from '../lib/kpi';
import { formatPercent } from '../lib/utils';
import { motion } from 'motion/react';
import { Target, TrendingUp, Award, Download, Upload, PieChart, Activity, CheckCircle2, Clock, FileSpreadsheet } from 'lucide-react';
import React, { useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import * as XLSX from 'xlsx';
import { APP_ICONS } from './Settings';

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
  const { months, quarters, halfYears, selectedMonthIndex, setSelectedMonthIndex, settings } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
