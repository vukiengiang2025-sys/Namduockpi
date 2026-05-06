import { useAppStore } from '../store';
import { motion } from 'motion/react';
import { formatPercent } from '../lib/utils';
import { Fragment } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function YearlyData() {
  const { months, quarters, updateMonth } = useAppStore();

  const handleNumChange = (index: number, key: string) => (e: any) => {
    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
    updateMonth(index, { [key]: val });
  };

  const monthChartData = months.map((m, i) => {
    const s = m.salesTarget ? (m.salesActual / m.salesTarget) * 100 : 0;
    const c = m.coverageTarget ? (m.coverageActual / m.coverageTarget) * 100 : 0;
    return {
      name: `T${i + 1}`,
      'Doanh số (%)': Math.round(s),
      'Độ phủ (%)': Math.round(c)
    };
  });

  const quarterChartData = quarters.map((_, i) => {
    const qMonths = months.slice(i * 3, i * 3 + 3);
    const sTarget = qMonths.reduce((sum, m) => sum + (m.salesTarget || 0), 0);
    const sActual = qMonths.reduce((sum, m) => sum + (m.salesActual || 0), 0);
    const cTarget = qMonths.reduce((sum, m) => sum + (m.coverageTarget || 0), 0);
    const cActual = qMonths.reduce((sum, m) => sum + (m.coverageActual || 0), 0);
    
    const s = sTarget ? (sActual / sTarget) * 100 : 0;
    const c = cTarget ? (cActual / cTarget) * 100 : 0;

    return {
      name: `Q${i + 1}`,
      'Doanh số (%)': Math.round(s),
      'Độ phủ (%)': Math.round(c)
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-bold text-xs mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
      className="space-y-8 pb-10"
    >
      <div className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
           <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
           <span className="text-[10px] text-slate-400 uppercase tracking-widest">Dữ liệu cả năm</span>
        </div>
        <h1 className="text-2xl font-light text-white tracking-tight">Doanh Số <span className="font-bold">Năm</span></h1>
      </div>

      <div className="px-3 sm:px-5 space-y-8 max-w-5xl mx-auto">
        {/* Charts Section */}
        <div className="bg-slate-900/40 rounded-[2rem] p-4 shadow-2xl border border-white/5 backdrop-blur-xl w-full">
          <h3 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-widest mb-6">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Biểu đồ Tháng
          </h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff0a' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Doanh số (%)" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Độ phủ (%)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/40 rounded-[2rem] p-4 shadow-2xl border border-white/5 backdrop-blur-xl w-full">
          <h3 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-widest mb-6">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Biểu đồ Quý
          </h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff0a' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Doanh số (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Độ phủ (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/40 rounded-[2rem] p-4 shadow-2xl border border-white/5 backdrop-blur-xl flex flex-col overflow-hidden w-full">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-widest">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              Cấu hình 12 Tháng
            </h3>
          </div>
          
          <div className="space-y-3">
            {months.map((monthData, i) => {
              const salesRatio = formatPercent(monthData.salesActual, monthData.salesTarget);
              const coverageRatio = formatPercent(monthData.coverageActual, monthData.coverageTarget);
              
              return (
                <div key={i} className="bg-slate-800/20 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-sm font-black text-white uppercase tracking-widest">Tháng {i + 1}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Doanh số */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Doanh số</span>
                         <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">{salesRatio}</span>
                      </div>
                      <div className="flex gap-2">
                         <input 
                           type="number"
                           placeholder="Khoán"
                           value={monthData.salesTarget === 0 && !monthData.salesTarget ? '' : monthData.salesTarget}
                           onChange={handleNumChange(i, 'salesTarget')}
                           className="bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 w-full text-xs text-purple-400 font-mono focus:ring-1 focus:ring-purple-500 outline-none"
                         />
                         <input 
                           type="number"
                           placeholder="Thực đạt"
                           value={monthData.salesActual === 0 && !monthData.salesActual ? '' : monthData.salesActual}
                           onChange={handleNumChange(i, 'salesActual')}
                           className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-full text-xs text-white font-mono focus:ring-1 focus:ring-purple-500 outline-none"
                         />
                      </div>
                    </div>

                    {/* Bao phủ */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bao phủ</span>
                         <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">{coverageRatio}</span>
                      </div>
                      <div className="flex gap-2">
                         <input 
                           type="number"
                           placeholder="Khoán"
                           value={monthData.coverageTarget === 0 && !monthData.coverageTarget ? '' : monthData.coverageTarget}
                           onChange={handleNumChange(i, 'coverageTarget')}
                           className="bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 w-full text-xs text-purple-400 font-mono focus:ring-1 focus:ring-purple-500 outline-none"
                         />
                         <input 
                           type="number"
                           placeholder="Thực đạt"
                           value={monthData.coverageActual === 0 && !monthData.coverageActual ? '' : monthData.coverageActual}
                           onChange={handleNumChange(i, 'coverageActual')}
                           className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-full text-xs text-white font-mono focus:ring-1 focus:ring-purple-500 outline-none"
                         />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
