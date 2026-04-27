import { useAppStore } from '../store';
import { calc15DaysSalesKPI, calcCoverageKPI, calcSalesKPI, calcSKUKPI } from '../lib/kpi';
import { formatPercent } from '../lib/utils';
import { motion } from 'motion/react';
import { Target, TrendingUp, Award } from 'lucide-react';

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
    <div className={`p-4 rounded-3xl flex items-start gap-4 backdrop-blur-md border shadow-2xl ${containerClass}`}>
      <div className={`p-3 rounded-2xl ${iconContainerClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className={`text-xl font-bold font-mono ${valueClass}`}>{value}</h4>
        {subtitle && <p className="text-[10px] text-slate-500 mt-1 italic">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { months, quarters, halfYears } = useAppStore();

  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentQuarterIndex = Math.floor(currentMonthIndex / 3);
  const currentHalfYearIndex = Math.floor(currentMonthIndex / 6);

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
  const monthCoverageKPI = calcCoverageKPI(month.coverageActual, month.coverageTarget, 5, 7.5);
  const month15DaysKPI = calc15DaysSalesKPI(month.sales15DaysActual, month.salesTarget);
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
      <div className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
           <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
           <span className="text-[10px] text-slate-400 uppercase tracking-widest">Hệ thống báo cáo KPI</span>
        </div>
        <h1 className="text-2xl font-light text-white tracking-tight">Tổng Quan <span className="font-bold">Kinh Doanh</span></h1>
      </div>

      <div className="px-5 space-y-10 max-w-lg mx-auto">
        {/* Month Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">KPI {currentMonthStr}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <MetricCard 
              title="Điểm KPI Tháng" 
              value={`${monthTotalKPI.toFixed(1)}`} 
              icon={Award} 
              isHighlight 
              colorParams="blue"
              subtitle={`Tối đa: ${150 + 7.5 + 7.5 + 7.5 + (month.customPoints > 0 ? month.customPoints : 10)} điểm`}
            />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard title="Đạt Doanh Số" value={monthSalesRatio} icon={TrendingUp} />
              <MetricCard title="Độ Bao Phủ" value={monthCoverageRatio} icon={Target} />
            </div>
            
            <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 backdrop-blur-xl mt-2 w-full">
              <h4 className="text-[11px] font-semibold text-slate-300 mb-4 tracking-widest uppercase border-b border-white/5 pb-2">Chi tiết thành phần</h4>
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Doanh số (80đ)</span>
                  <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded text-xs">{monthSalesKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Bao phủ (5đ)</span>
                  <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded text-xs">{monthCoverageKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Tiến độ 15 ngày (5đ)</span>
                  <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded text-xs">{month15DaysKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">SKU (7.5đ)</span>
                  <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded text-xs">{monthSKUKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">{month.customName || 'Tùy chỉnh'}</span>
                  <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs">{month.customPoints}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Quarter Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">{currentQuarterStr}</h2>
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
              <MetricCard title="Đạt Doanh Số" value={quarterSalesRatio} icon={TrendingUp} />
              <MetricCard title="Đạt Bao Phủ" value={quarterCoverageRatio} icon={Target} />
            </div>

            <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 backdrop-blur-xl mt-2 w-full">
              <h4 className="text-[11px] font-semibold text-slate-300 mb-4 tracking-widest uppercase border-b border-white/5 pb-2">Chi tiết thành phần</h4>
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Doanh số (80đ)</span>
                  <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded text-xs">{quarterSalesKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Bao phủ (10đ)</span>
                  <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded text-xs">{quarterCoverageKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">{quarter.custom1Name || 'Chỉ tiêu 1'} (5đ)</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">{quarter.custom1Points}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">{quarter.custom2Name || 'Chỉ tiêu 2'} (5đ)</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">{quarter.custom2Points}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Half Year Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">{currentHalfStr}</h2>
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
              <MetricCard title="Đạt Doanh Số" value={halfSalesRatio} icon={TrendingUp} />
              <MetricCard title="Đạt Bao Phủ" value={halfCoverageRatio} icon={Target} />
            </div>

            <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 backdrop-blur-xl mt-2 w-full">
              <h4 className="text-[11px] font-semibold text-slate-300 mb-4 tracking-widest uppercase border-b border-white/5 pb-2">Chi tiết thành phần</h4>
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Doanh số (80đ)</span>
                  <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded text-xs">{halfSalesKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">Bao phủ (10đ)</span>
                  <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded text-xs">{halfCoverageKPI.toFixed(1)}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 text-xs">{halfYear.customName || 'Tùy chỉnh'} (10đ)</span>
                  <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs">{halfYear.customPoints}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
}
