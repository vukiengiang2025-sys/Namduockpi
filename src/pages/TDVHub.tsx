import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  Flame,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  Route as RouteIcon,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { CommandMetric } from '../components/CommandMetric';
import { useAppStore } from '../store';
import {
  buildTdvInsights,
  createSampleDataset,
  formatCompactCurrency,
  parseTdvJson,
  type TdvDataset,
  type TdvPriority,
} from '../lib/tdv';
import { cn } from '../lib/utils';
import { saveFile } from '../lib/fileSystem';

const STORAGE_KEY = 'tdv-super-app-dataset-v1';

const priorityStyle: Record<TdvPriority, { label: string; className: string }> = {
  high: { label: 'Ưu tiên cao', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  medium: { label: 'Ưu tiên vừa', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  low: { label: 'Duy trì', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

export default function TDVHub() {
  const { setDailyTasks, addToast } = useAppStore();
  const [dataset, setDataset] = useState<TdvDataset | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      setDataset(JSON.parse(stored) as TdvDataset);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const insights = useMemo(() => dataset ? buildTdvInsights(dataset) : null, [dataset]);

  const applyDataset = (next: TdvDataset, nextWarnings: string[] = []) => {
    setDataset(next);
    setWarnings(nextWarnings);
    setError('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const result = parseTdvJson(text);
      applyDataset(result.dataset, result.warnings);
      addToast({ type: 'success', message: `Đã nạp dữ liệu ${result.dataset.customers.length} khách hàng.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không đọc được file dữ liệu.';
      setError(message);
      addToast({ type: 'error', message });
    }
  };

  const loadSample = () => {
    applyDataset(createSampleDataset(), []);
    addToast({ type: 'info', message: 'Đang dùng dữ liệu mẫu để trải nghiệm TDV Hub.' });
  };

  const reset = () => {
    setDataset(null);
    setWarnings([]);
    setError('');
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportData = async () => {
    if (!dataset) return;
    await saveFile(
      `tdv-super-app-${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(dataset, null, 2),
      'application/json',
    );
    addToast({ type: 'success', message: 'Đã xuất dữ liệu TDV Hub.' });
  };

  const addPlanToToday = () => {
    if (!insights) return;
    setDailyTasks(insights.tasks.map(task => ({
      text: task.text,
      target: task.target,
      priority: task.priority,
      expectedImpact: task.expectedImpact,
      confidence: task.confidence,
      type: task.type,
    })), insights.metrics.totalKPI);
    addToast({ type: 'success', message: 'Đã đưa kế hoạch TDV vào mục tiêu hôm nay.' });
  };

  if (!dataset || !insights) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen pb-32 px-4 sm:px-6 pt-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[10px] text-slate-400 uppercase tracking-[0.25em] font-bold">TDV Hub</span>
          </div>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-slate-900/70 to-blue-500/10 p-7 sm:p-10">
            <div className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-emerald-500/20 blur-[90px]" />
            <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-blue-500/20 blur-[90px]" />
            <div className="relative z-10 space-y-5 max-w-2xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <Compass className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300 mb-2">Siêu ứng dụng cá nhân hóa</p>
                <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                  Biến dữ liệu SalesUp thành <span className="text-emerald-300">hành động mỗi ngày</span>
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed mt-3">
                  Kết hợp chỉ tiêu KPI, khách hàng, tuyến bán hàng và đơn hàng để tạo kế hoạch ghé thăm,
                  dự báo doanh số và gợi ý bán thêm SKU cho từng trình dược viên.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="h-12 px-6 rounded-2xl bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <Upload className="w-4 h-4" /> Nạp dữ liệu SalesUp
                </button>
                <button
                  onClick={loadSample}
                  className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" /> Dùng dữ liệu mẫu
                </button>
              </div>
              {error && (
                <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Target, title: 'KPI thông minh', text: 'Doanh số, độ phủ, SKU và nhịp 15 ngày theo đúng luật Nam Dược.' },
              { icon: RouteIcon, title: 'Tuyến tối ưu', text: 'Xếp thứ tự ghé thăm theo điểm ưu tiên, khoảng cách và thời gian.' },
              { icon: Zap, title: 'Gợi ý hành động', text: 'Biết nên ghé ai, bán thêm gì và cần bao nhiêu doanh số mỗi ngày.' },
            ].map(item => (
              <div key={item.title} className="rounded-3xl bg-slate-900/40 border border-white/5 p-5">
                <item.icon className="w-5 h-5 text-emerald-300 mb-3" />
                <h3 className="text-sm font-black text-white">{item.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">{item.text}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed">
            Hỗ trợ JSON xuất từ SalesUp hoặc JSON theo schema TDV. Xem <span className="text-slate-300">docs/TDV-SUPER-APP.md</span> để biết cách chuyển đổi từ bảng SQLite.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
              event.target.value = '';
            }}
          />
        </div>
      </motion.div>
    );
  }

  const { metrics, personalization, customers, route, tasks } = insights;
  const totalDistance = route.reduce((sum, stop) => sum + stop.distanceKm, 0);
  const topCustomers = customers.slice(0, 6);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen pb-40 px-3 sm:px-5">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="sticky top-0 z-30 -mx-3 sm:-mx-5 px-3 sm:px-5 pt-8 pb-4 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] text-emerald-300 uppercase tracking-[0.25em] font-black">TDV Hub · {personalization.persona}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {dataset.profile.name}
                <span className="text-slate-500 font-medium text-base sm:text-lg ml-2">{dataset.profile.region}</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <CalendarDays className="w-3 h-3" /> Tháng {dataset.month}/{dataset.year} · Cập nhật ngày {metrics.daysElapsed}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                <Upload className="w-3.5 h-3.5" /> Nạp
              </button>
              <button onClick={exportData} className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                <Download className="w-3.5 h-3.5" /> Xuất
              </button>
              <button onClick={loadSample} title="Tải lại dữ liệu mẫu" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {(warnings.length > 0 || error) && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 space-y-1">
            {error && <p className="text-xs text-red-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</p>}
            {warnings.map(warning => <p key={warning} className="text-[11px] text-yellow-200 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> {warning}</p>)}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <CommandMetric title="Doanh số" value={`${metrics.salesRatio.toFixed(1)}%`} percent={metrics.salesRatio} status={metrics.salesStatus} icon={TrendingUp} />
          <CommandMetric title="Bao phủ" value={`${metrics.coverageActual}/${metrics.coverageTarget}`} percent={metrics.coverageRatio} status={metrics.coverageStatus} icon={Target} />
          <CommandMetric title="SKU bình quân" value={metrics.skuActual.toFixed(1)} percent={metrics.skuRatio} status={metrics.skuStatus} icon={Package} />
          <CommandMetric title="Điểm KPI" value={metrics.totalKPI.toFixed(1)} percent={metrics.totalRatio} status={metrics.salesStatus === 'danger' ? 'danger' : 'success'} icon={Flame} />
        </div>

        <section className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-slate-900/70 to-blue-500/10 p-6">
            <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-emerald-500/20 blur-[70px]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-300 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Cá nhân hóa hôm nay</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{personalization.focusLabel}</span>
              </div>
              <p className="text-sm sm:text-base text-white font-bold leading-relaxed mt-4">{personalization.message}</p>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-2">{personalization.coaching}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5"><Clock className="w-3 h-3 text-emerald-300" /> {personalization.bestTime}</span>
                {personalization.topProduct && (
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5"><Package className="w-3 h-3 text-emerald-300" /> {personalization.topProduct.name}</span>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-[2rem] bg-slate-900/40 border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Dự báo cuối tháng</span>
              <span className={cn("text-[9px] font-black px-2 py-1 rounded-lg border", metrics.projectedSalesRatio >= 100 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20")}>
                {metrics.projectedSalesRatio.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-black text-white leading-none">{formatCompactCurrency(metrics.projectedSales)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Dự báo từ nhịp bán hiện tại</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-300">{formatCompactCurrency(metrics.requiredDailySales)}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Cần mỗi ngày</p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${Math.min(100, metrics.projectedSalesRatio)}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="rounded-xl bg-white/5 p-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Còn lại</p>
                <p className="text-sm font-black text-white">{metrics.remainingDays} ngày</p>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Gap doanh số</p>
                <p className="text-sm font-black text-white">{formatCompactCurrency(Math.max(0, metrics.salesTarget - metrics.salesActual))}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Gap phủ</p>
                <p className="text-sm font-black text-white">{Math.max(0, metrics.coverageTarget - metrics.coverageActual)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7 rounded-[2rem] bg-slate-900/40 border border-white/5 overflow-hidden">
            <div className="p-5 sm:p-6 flex items-start justify-between gap-3 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-300" />
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">Tuyến hôm nay</h2>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{route.length} điểm ghé · {totalDistance.toFixed(1)} km · tối ưu theo ưu tiên và khoảng cách</p>
              </div>
              <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">8:00 bắt đầu</span>
            </div>
            <div className="divide-y divide-white/5">
              {route.map(stop => (
                <div key={stop.customer.id} className="p-4 sm:p-5 flex gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-black shrink-0">{stop.sequence}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{stop.customer.name}</p>
                        <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {stop.customer.address || 'Chưa có địa chỉ'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-white">{stop.eta}</p>
                        <p className="text-[9px] text-slate-500">{stop.distanceKm.toFixed(1)} km</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-2">{stop.action}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={cn('text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md border', priorityStyle[stop.priority].className)}>{stop.score} điểm</span>
                      <span className="text-[9px] text-slate-500">{stop.reason}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!route.length && <p className="p-8 text-center text-xs text-slate-500">Chưa đủ dữ liệu để tạo tuyến.</p>}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-[2rem] bg-slate-900/40 border border-white/5 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-300" />
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">Kế hoạch hôm nay</h2>
                </div>
                <button onClick={addPlanToToday} className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-blue-500 text-white hover:brightness-110 active:scale-95 transition-all">Đưa vào Today</button>
              </div>
              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <div key={`${task.text}-${index}`} className="rounded-2xl bg-white/[0.03] border border-white/5 p-3 flex items-start gap-3">
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black', task.priority === 'high' ? 'bg-red-500/15 text-red-300' : task.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-300' : 'bg-emerald-500/15 text-emerald-300')}>{index + 1}</div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-white leading-snug">{task.text}</p>
                      <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> {task.expectedImpact} · {Math.round(task.confidence * 100)}% tin cậy</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-slate-900/40 border border-white/5 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-purple-300" />
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Khách hàng ưu tiên</h2>
              </div>
              <div className="space-y-3">
                {topCustomers.map(customer => (
                  <div key={customer.customer.id}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{customer.customer.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{customer.reasons[0]}</p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-300 shrink-0">{customer.score}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 mt-1.5 overflow-hidden">
                      <div className={cn('h-full rounded-full', customer.priority === 'high' ? 'bg-red-400' : customer.priority === 'medium' ? 'bg-yellow-400' : 'bg-emerald-400')} style={{ width: `${customer.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-slate-900/40 border border-white/5 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Dữ liệu & công cụ</h2>
            </div>
            <button onClick={reset} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-300 transition-colors">Xóa dữ liệu</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <button onClick={() => fileRef.current?.click()} className="rounded-2xl bg-white/5 border border-white/5 p-4 text-left hover:bg-white/10 transition-colors">
              <Upload className="w-4 h-4 text-emerald-300 mb-2" />
              <p className="text-[11px] font-bold text-white">Nạp JSON SalesUp</p>
              <p className="text-[9px] text-slate-500 mt-1">Khách hàng, đơn hàng, sản phẩm, tuyến.</p>
            </button>
            <button onClick={exportData} className="rounded-2xl bg-white/5 border border-white/5 p-4 text-left hover:bg-white/10 transition-colors">
              <Download className="w-4 h-4 text-blue-300 mb-2" />
              <p className="text-[11px] font-bold text-white">Xuất dữ liệu TDV</p>
              <p className="text-[9px] text-slate-500 mt-1">Sao lưu để dùng lại hoặc chia sẻ.</p>
            </button>
            <button onClick={addPlanToToday} className="rounded-2xl bg-white/5 border border-white/5 p-4 text-left hover:bg-white/10 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-purple-300 mb-2" />
              <p className="text-[11px] font-bold text-white">Đồng bộ nhiệm vụ</p>
              <p className="text-[9px] text-slate-500 mt-1">Đưa kế hoạch vào mục tiêu Today.</p>
            </button>
          </div>
          <p className="text-[9px] text-slate-500 mt-4 leading-relaxed">
            Nguồn dữ liệu gợi ý: bảng <span className="text-slate-300">KHACHHANG</span>, <span className="text-slate-300">U_DONHANG</span>, <span className="text-slate-300">U_DONHANG_SP</span>, <span className="text-slate-300">SANPHAM</span>, <span className="text-slate-300">TUYENBANHANG</span> trong SalesUp. Xem tài liệu tích hợp để biết ánh xạ chi tiết.
          </p>
        </section>

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) void handleImport(file);
            event.target.value = '';
          }}
        />
      </div>
    </motion.div>
  );
}
