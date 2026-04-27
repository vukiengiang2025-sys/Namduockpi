import { useAppStore } from '../store';
import { motion } from 'motion/react';
import { calc15DaysSalesKPI, calcCoverageKPI, calcSalesKPI, calcSKUKPI } from '../lib/kpi';
import { formatPercent } from '../lib/utils';

function TableGroup({ title, accentColor = 'blue', children, totalPoints }: any) {
  const bgColors = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500'
  };
  const accentClass = bgColors[accentColor as keyof typeof bgColors] || 'bg-blue-500';
  const textClass = accentClass.replace('bg-', 'text-');
  const bgSoftClass = accentClass.replace('bg-', 'bg-').replace('-500', '-500/10');

  return (
    <div className="bg-slate-900/40 rounded-[2rem] p-4 lg:p-6 shadow-2xl border border-white/5 backdrop-blur-xl flex flex-col overflow-hidden w-full">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-widest">
          <span className={`w-1.5 h-6 ${accentClass} rounded-full`}></span>
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        <table className="w-full text-xs text-left min-w-[320px]">
          <thead className="text-slate-500 uppercase border-b border-white/10">
            <tr className="text-[10px]">
              <th className="pb-2 font-medium w-3/12">Chỉ tiêu</th>
              <th className="pb-2 font-medium w-3/12">Khoán</th>
              <th className="pb-2 font-medium w-3/12">Thực đạt</th>
              <th className="pb-2 text-right font-medium w-3/12">Tỷ lệ | Điểm</th>
            </tr>
          </thead>
          <tbody className="text-slate-300 divide-y divide-white/5">
            {children}
          </tbody>
        </table>
      </div>
      <div className={`mt-4 p-3 ${bgSoftClass} rounded-xl border border-white/5 flex justify-between items-center`}>
        <span className="text-xs font-bold text-white tracking-widest uppercase">Tổng Điểm</span>
        <span className={`text-xl font-black ${textClass} font-mono`}>{totalPoints}</span>
      </div>
    </div>
  );
}

function TableRow({ label, targetValue, onTargetChange, actualValue, onActualChange, ratio, point }: any) {
  const isReadOnly = !onTargetChange || !onActualChange;

  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
      <td className="py-3 pr-2 font-medium text-[11px] leading-tight text-white">{label}</td>
      <td className="py-3 pr-2">
        <input 
          type="number"
          value={targetValue === 0 && !targetValue ? '' : targetValue}
          onChange={onTargetChange || (() => {})}
          readOnly={isReadOnly}
          className={`bg-slate-800/50 border border-white/10 rounded px-2 py-1.5 w-full text-xs text-blue-400 font-mono outline-none min-w-[60px] ${isReadOnly ? 'opacity-70 cursor-not-allowed' : 'focus:ring-1 focus:ring-emerald-500'}`}
        />
      </td>
      <td className="py-3 pr-2">
        <input 
          type="number"
          value={actualValue === 0 && !actualValue ? '' : actualValue}
          onChange={onActualChange || (() => {})}
          readOnly={isReadOnly}
          className={`bg-white/10 border border-white/10 rounded px-2 py-1.5 w-full text-xs text-white font-mono outline-none min-w-[60px] ${isReadOnly ? 'opacity-70 cursor-not-allowed' : 'focus:ring-1 focus:ring-emerald-500'}`}
        />
      </td>
      <td className="py-3 text-right">
        <div className="flex flex-col items-end">
          {ratio && <span className="text-[9px] text-slate-500 font-mono mb-0.5">{ratio}</span>}
          <span className="font-bold text-emerald-400 font-mono text-sm">{point}</span>
        </div>
      </td>
    </tr>
  );
}

export default function DataEntry() {
  const { months, quarters, halfYears, updateMonth, updateQuarter, updateHalfYear, selectedMonthIndex, setSelectedMonthIndex } = useAppStore();

  const currentMonthIndex = selectedMonthIndex;
  const currentQuarterIndex = Math.floor(currentMonthIndex / 3);
  const currentHalfYearIndex = Math.floor(currentMonthIndex / 6);

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
  };

  // Derive Half Year from months
  const currentHalfMonths = months.slice(currentHalfYearIndex * 6, currentHalfYearIndex * 6 + 6);
  const halfYear = {
    salesTarget: currentHalfMonths.reduce((sum, m) => sum + (m.salesTarget || 0), 0),
    salesActual: currentHalfMonths.reduce((sum, m) => sum + (m.salesActual || 0), 0),
    coverageTarget: currentHalfMonths.reduce((sum, m) => sum + (m.coverageTarget || 0), 0),
    coverageActual: currentHalfMonths.reduce((sum, m) => sum + (m.coverageActual || 0), 0),
  };

  // Helper cho value từ input
  const handleNumChange = (updater: any, index: number, key: string) => (e: any) => {
    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
    updater(index, { [key]: val });
  };
  const handleStrChange = (updater: any, index: number, key: string) => (e: any) => {
    updater(index, { [key]: e.target.value });
  };

  // Month Calcs
  const monthSalesRatio = formatPercent(month.salesActual, month.salesTarget);
  const monthCoverageRatio = formatPercent(month.coverageActual, month.coverageTarget);
  const monthSalesKPI = calcSalesKPI(month.salesActual, month.salesTarget);
  const monthCoverageKPI = calcCoverageKPI(month.coverageActual, month.coverageTarget, 5, 7.5);
  const month15DaysKPI = calc15DaysSalesKPI(month.sales15DaysActual, month.salesTarget);
  const month15DaysRatio = formatPercent(month.sales15DaysActual, month.salesTarget);
  const monthSKUKPI = calcSKUKPI(month.skuActual);
  const monthTotalKPI = monthSalesKPI + monthCoverageKPI + month15DaysKPI + monthSKUKPI + (month.customPoints || 0);

  // Quarter Calcs
  const quarterSalesRatio = formatPercent(quarter.salesActual, quarter.salesTarget);
  const quarterCoverageRatio = formatPercent(quarter.coverageActual, quarter.coverageTarget);
  const quarterSalesKPI = calcSalesKPI(quarter.salesActual, quarter.salesTarget);
  const quarterCoverageKPI = calcCoverageKPI(quarter.coverageActual, quarter.coverageTarget, 10, 15);
  const quarterTotalKPI = quarterSalesKPI + quarterCoverageKPI + (quarter.custom1Points || 0) + (quarter.custom2Points || 0);

  // HalfYear Calcs
  const halfSalesRatio = formatPercent(halfYear.salesActual, halfYear.salesTarget);
  const halfCoverageRatio = formatPercent(halfYear.coverageActual, halfYear.coverageTarget);
  const halfSalesKPI = calcSalesKPI(halfYear.salesActual, halfYear.salesTarget);
  const halfCoverageKPI = calcCoverageKPI(halfYear.coverageActual, halfYear.coverageTarget, 10, 15);
  const halfTotalKPI = halfSalesKPI + halfCoverageKPI + (halfYear.customPoints || 0);

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
             <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
             <span className="text-[10px] text-slate-400 uppercase tracking-widest">Bảng tính tự động</span>
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
        <h1 className="text-2xl font-light text-white tracking-tight">Nhập Liệu <span className="font-bold">KPI</span></h1>
      </div>

      <div className="px-3 sm:px-5 space-y-8 max-w-lg mx-auto pb-8">
        <TableGroup title={`Chỉ tiêu Tháng ${currentMonthIndex + 1}`} accentColor="blue" totalPoints={monthTotalKPI.toFixed(1)}>
          <TableRow 
            label="Doanh số (80đ)" 
            targetValue={month.salesTarget} onTargetChange={handleNumChange(updateMonth, currentMonthIndex, 'salesTarget')}
            actualValue={month.salesActual} onActualChange={handleNumChange(updateMonth, currentMonthIndex, 'salesActual')}
            ratio={monthSalesRatio}
            point={monthSalesKPI.toFixed(1)}
          />
          <TableRow 
            label="Độ phủ (5đ)" 
            targetValue={month.coverageTarget} onTargetChange={handleNumChange(updateMonth, currentMonthIndex, 'coverageTarget')}
            actualValue={month.coverageActual} onActualChange={handleNumChange(updateMonth, currentMonthIndex, 'coverageActual')}
            ratio={monthCoverageRatio}
            point={monthCoverageKPI.toFixed(1)}
          />
          <tr className="group hover:bg-white/[0.02] transition-colors">
            <td className="py-3 pr-2 font-medium text-[11px] leading-tight text-white">15 Ngày (5đ)</td>
            <td className="py-3 pr-2" colSpan={1}>
              <span className="text-[9px] text-slate-500 font-mono">Dựa vào TDS khoán</span>
            </td>
            <td className="py-3 pr-2">
              <input 
                type="number" value={month.sales15DaysActual || ''} onChange={handleNumChange(updateMonth, currentMonthIndex, 'sales15DaysActual')}
                placeholder="Thực đạt"
                className="bg-white/10 border border-white/10 rounded px-2 py-1.5 w-full text-xs text-white font-mono min-w-[60px] outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </td>
            <td className="py-3 text-right">
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-500 font-mono mb-0.5">{month15DaysRatio}</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{month15DaysKPI.toFixed(1)}</span>
              </div>
            </td>
          </tr>
          <tr className="group hover:bg-white/[0.02] transition-colors">
            <td className="py-3 pr-2 font-medium text-[11px] leading-tight text-white">SKU (7.5đ)</td>
            <td className="py-3 pr-2 text-slate-500 text-[10px] font-mono" colSpan={1}>Điểm 3.1-5.0</td>
            <td className="py-3 pr-2">
              <input 
                type="number" value={month.skuActual || ''} onChange={handleNumChange(updateMonth, currentMonthIndex, 'skuActual')}
                className="bg-white/10 border border-white/10 rounded px-2 py-1.5 w-full text-xs text-white font-mono min-w-[60px] outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </td>
            <td className="py-3 text-right">
              <span className="font-bold text-emerald-400 font-mono text-sm">{monthSKUKPI.toFixed(1)}</span>
            </td>
          </tr>
          <tr className="group hover:bg-white/[0.02] transition-colors border-t border-white/10 border-dashed">
            <td className="py-3 pr-2" colSpan={2}>
              <input 
                type="text" value={month.customName} onChange={handleStrChange(updateMonth, currentMonthIndex, 'customName')} placeholder="Nhập tên tiêu chí tùy chọn..."
                className="bg-transparent border-b border-white/10 px-1 py-1 w-full text-[11px] text-slate-300 outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
            </td>
            <td className="py-3 pr-2">
              <input 
                type="number" value={month.customPoints === 0 ? '' : month.customPoints} onChange={handleNumChange(updateMonth, currentMonthIndex, 'customPoints')} placeholder="Điểm"
                className="bg-white/10 border border-white/10 rounded px-2 py-1.5 w-full text-xs text-white font-mono min-w-[60px] outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </td>
            <td className="py-3 text-right">
              <span className="font-bold text-emerald-400 font-mono text-sm">{(month.customPoints || 0).toFixed(1)}</span>
            </td>
          </tr>
        </TableGroup>

        <TableGroup title={`Chỉ tiêu Quý ${currentQuarterIndex + 1}`} accentColor="emerald" totalPoints={quarterTotalKPI.toFixed(1)}>
          <TableRow 
            label="Doanh số (CQ)" 
            targetValue={quarter.salesTarget} onTargetChange={() => {}}
            actualValue={quarter.salesActual} onActualChange={() => {}}
            ratio={quarterSalesRatio}
            point={quarterSalesKPI.toFixed(1)}
          />
          <TableRow 
            label="Độ phủ (CQ)" 
            targetValue={quarter.coverageTarget} onTargetChange={() => {}}
            actualValue={quarter.coverageActual} onActualChange={() => {}}
            ratio={quarterCoverageRatio}
            point={quarterCoverageKPI.toFixed(1)}
          />
          <tr className="group hover:bg-white/[0.02] transition-colors border-t border-white/10 border-dashed">
            <td className="py-3 pr-2" colSpan={2}>
              <input 
                type="text" value={quarterCustom.custom1Name} onChange={handleStrChange(updateQuarter, currentQuarterIndex, 'custom1Name')} placeholder="Tiêu chí 3..."
                className="bg-transparent border-b border-white/10 px-1 py-1 w-full text-[11px] text-slate-300 outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
            </td>
            <td className="py-3 pr-2">
              <input 
                type="number" value={quarterCustom.custom1Points === 0 ? '' : quarterCustom.custom1Points} onChange={handleNumChange(updateQuarter, currentQuarterIndex, 'custom1Points')} placeholder="Điểm"
                className="bg-white/10 border border-white/10 rounded px-2 py-1.5 w-full text-xs text-white font-mono min-w-[60px] outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </td>
            <td className="py-3 text-right">
              <span className="font-bold text-emerald-400 font-mono text-sm">{(quarterCustom.custom1Points || 0).toFixed(1)}</span>
            </td>
          </tr>
          <tr className="group hover:bg-white/[0.02] transition-colors border-t border-white/10 border-dashed">
            <td className="py-3 pr-2" colSpan={2}>
              <input 
                type="text" value={quarterCustom.custom2Name} onChange={handleStrChange(updateQuarter, currentQuarterIndex, 'custom2Name')} placeholder="Tiêu chí 4..."
                className="bg-transparent border-b border-white/10 px-1 py-1 w-full text-[11px] text-slate-300 outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
            </td>
            <td className="py-3 pr-2">
              <input 
                type="number" value={quarterCustom.custom2Points === 0 ? '' : quarterCustom.custom2Points} onChange={handleNumChange(updateQuarter, currentQuarterIndex, 'custom2Points')} placeholder="Điểm"
                className="bg-white/10 border border-white/10 rounded px-2 py-1.5 w-full text-xs text-white font-mono min-w-[60px] outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </td>
            <td className="py-3 text-right">
              <span className="font-bold text-emerald-400 font-mono text-sm">{(quarterCustom.custom2Points || 0).toFixed(1)}</span>
            </td>
          </tr>
        </TableGroup>

        <TableGroup title={`Chỉ tiêu ${currentHalfYearIndex === 0 ? '6 Tháng Đầu Năm' : '6 Tháng Cuối Năm'}`} accentColor="orange" totalPoints={halfTotalKPI.toFixed(1)}>
          <TableRow 
            label="Doanh số (CH)" 
            targetValue={halfYear.salesTarget} onTargetChange={() => {}}
            actualValue={halfYear.salesActual} onActualChange={() => {}}
            ratio={halfSalesRatio}
            point={halfSalesKPI.toFixed(1)}
          />
          <TableRow 
            label="Độ phủ (CH)" 
            targetValue={halfYear.coverageTarget} onTargetChange={() => {}}
            actualValue={halfYear.coverageActual} onActualChange={() => {}}
            ratio={halfCoverageRatio}
            point={halfCoverageKPI.toFixed(1)}
          />
          <tr className="group hover:bg-white/[0.02] transition-colors border-t border-white/10 border-dashed">
            <td className="py-3 pr-2" colSpan={2}>
              <input 
                type="text" value={halfCustom.customName} onChange={handleStrChange(updateHalfYear, currentHalfYearIndex, 'customName')} placeholder="Tiêu chí cuối (10đ)..."
                className="bg-transparent border-b border-white/10 px-1 py-1 w-full text-[11px] text-slate-300 outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
            </td>
            <td className="py-3 pr-2">
              <input 
                type="number" value={halfCustom.customPoints === 0 ? '' : halfCustom.customPoints} onChange={handleNumChange(updateHalfYear, currentHalfYearIndex, 'customPoints')} placeholder="Điểm"
                className="bg-white/10 border border-white/10 rounded px-2 py-1.5 w-full text-xs text-white font-mono min-w-[60px] outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </td>
            <td className="py-3 text-right">
              <span className="font-bold text-emerald-400 font-mono text-sm">{(halfCustom.customPoints || 0).toFixed(1)}</span>
            </td>
          </tr>
        </TableGroup>
      </div>
    </motion.div>
  );
}

