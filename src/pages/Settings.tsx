import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { Settings as SettingsIcon, Key, Palette, Save, Type, Hexagon, Box, Target, Activity, LayoutDashboard, BarChart3, PieChart, Shapes, Sun, Moon, Type as TypeIcon, Image as ImageIcon, Sliders, Database, Download, Upload, BrainCircuit, ShieldCheck, Cpu, Sparkles, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

import { saveFile } from '../lib/fileSystem';

const THEMES = [
  { id: 'blue', name: 'Xanh dương', color: 'bg-blue-500' },
  { id: 'emerald', name: 'Xanh ngọc', color: 'bg-emerald-500' },
  { id: 'purple', name: 'Tím', color: 'bg-purple-500' },
  { id: 'rose', name: 'Hồng', color: 'bg-rose-500' },
];

export const APP_ICONS = [
  { id: 'brain', icon: BrainCircuit },
  { id: 'shield', icon: ShieldCheck },
  { id: 'cpu', icon: Cpu },
  { id: 'sparkles', icon: Sparkles },
  { id: 'trending', icon: TrendingUp },
  { id: 'hexagon', icon: Hexagon },
  { id: 'target', icon: Target },
  { id: 'activity', icon: Activity },
];

export default function Settings() {
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState({
    themeMode: 'dark',
    fontFamily: 'sans',
    dashboardLayout: 'default',
    ...settings,
    kpiWeights: settings.kpiWeights || { sales: 80, coverage: 10, month15Days: 5.5, sku: 7.5 },
    kpiRules: settings.kpiRules || {
      salesThreshold: 0.8,
      salesMaxMultiplier: 1.875,
      coverageThreshold: 0.8,
      coverageMaxMultiplier: 1.5,
      month15DaysTargetRatio: 0.55,
      month15DaysThreshold: 0.8,
      month15DaysMaxMultiplier: 1.3636,
      skuTable: [
        { min: 4.7, scoreMult: 1 },
        { min: 4.5, scoreMult: 0.933 },
        { min: 4.3, scoreMult: 0.866 },
        { min: 4.1, scoreMult: 0.8 },
        { min: 3.9, scoreMult: 0.733 },
        { min: 3.7, scoreMult: 0.666 },
        { min: 3.5, scoreMult: 0.6 },
        { min: 3.3, scoreMult: 0.533 },
        { min: 3.1, scoreMult: 0.466 },
      ]
    },
    appIcon: settings.appIcon || 'hexagon',
    skuTiers: settings.skuTiers || [
      { threshold: 3.3, score: 4.0 },
      { threshold: 3.5, score: 4.5 },
      { threshold: 3.7, score: 5.0 },
      { threshold: 3.9, score: 5.5 },
      { threshold: 4.1, score: 6.0 },
      { threshold: 4.3, score: 6.5 },
      { threshold: 4.5, score: 7.0 },
      { threshold: 4.7, score: 7.5 }
    ]
  });

  const handleSave = () => {
    updateSettings(localSettings);
    alert('Đã lưu cài đặt!');
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 pb-32 md:pb-12"
    >
      <div className="max-w-5xl mx-auto px-5 pt-8 space-y-8">
        <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Hệ thống</span>
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-3xl font-black text-white tracking-tight mb-8 uppercase">
          Cài đặt <span className="text-blue-500">Hệ thống</span>
        </motion.h1>

      {/* Theme Mode */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          {localSettings.themeMode === 'light' ? <Sun className="w-5 h-5 text-slate-400" /> : <Moon className="w-5 h-5 text-slate-400" />}
          <h2 className="text-sm font-medium text-white">Chế độ giao diện</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLocalSettings({...localSettings, themeMode: 'dark'})}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
              localSettings.themeMode !== 'light' ? 'border-white/20 bg-white/5' : 'border-transparent hover:bg-white/5'
            }`}
          >
            <Moon className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-medium text-white">Tối (Dark)</span>
          </button>
          <button
            onClick={() => setLocalSettings({...localSettings, themeMode: 'light'})}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
              localSettings.themeMode === 'light' ? 'border-white/20 bg-white/5' : 'border-transparent hover:bg-white/5'
            }`}
          >
            <Sun className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-white">Sáng (Light)</span>
          </button>
        </div>
      </motion.div>

      {/* Font Family */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <TypeIcon className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-medium text-white">Font chữ</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'sans', label: 'Hiện đại', fontClass: 'font-sans' },
            { id: 'serif', label: 'Báo chí', fontClass: 'font-serif' },
            { id: 'mono', label: 'Lập trình', fontClass: 'font-mono' }
          ].map((font) => (
            <button
              key={font.id}
              onClick={() => setLocalSettings({...localSettings, fontFamily: font.id as any})}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                localSettings.fontFamily === font.id ? 'border-white/20 bg-white/5 text-white' : 'border-transparent hover:bg-white/5 text-slate-400'
              }`}
            >
              <span className={`text-xs ${font.fontClass}`}>{font.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Dashboard Layout */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <LayoutDashboard className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-medium text-white">Bố cục Tổng quan</h2>
        </div>
        <select 
          value={localSettings.dashboardLayout}
          onChange={(e) => setLocalSettings({...localSettings, dashboardLayout: e.target.value as any})}
          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="default">Mặc định (Biểu đồ dưới)</option>
          <option value="details-first">Ưu tiên chi tiết KPI (Biểu đồ trên)</option>
        </select>
        <p className="text-[10px] text-slate-500">Kéo các phần biểu đồ và chi tiết ở màn hình Tổng quan theo cách bạn thích xem nhất.</p>
      </motion.div>

      {/* Custom Header Bg */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-medium text-white">Hình nền tuỳ chỉnh</h2>
        </div>
        <input 
          type="url" 
          placeholder="Nhập đường dẫn hình ảnh (URL)..." 
          value={localSettings.bgUrl || ''}
          onChange={(e) => setLocalSettings({...localSettings, bgUrl: e.target.value})}
          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <p className="text-[10px] text-slate-500">Có thể dụng hình ảnh hoặc GIF làm hình nền. Nếu đường dẫn trống, hệ thống sẽ sử dụng hiệu ứng sương mù hiện đại.</p>
      </motion.div>

      {/* Custom KPI Thresholds & Rules */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-medium text-white">Trọng số & Luật KPI (Rules)</h2>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mb-2">Thay đổi tỷ trọng điểm của từng phần và tỷ lệ % tối thiểu để đạt điểm.</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5">
              <label className="text-[11px] font-semibold text-slate-300 block mb-2">Doanh Số</label>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Giới hạn tỉ lệ tối thiểu</span>
                  <input type="number" step="0.1" value={localSettings.kpiRules?.salesThreshold} onChange={e => setLocalSettings(p => ({...p, kpiRules: {...p.kpiRules, salesThreshold: Number(e.target.value)} as any}))} className="w-16 bg-slate-900 border text-center border-white/10 rounded px-2 py-1 text-white text-xs"/>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Hệ số nhân tối đa</span>
                  <input type="number" step="0.1" value={localSettings.kpiRules?.salesMaxMultiplier} onChange={e => setLocalSettings(p => ({...p, kpiRules: {...p.kpiRules, salesMaxMultiplier: Number(e.target.value)} as any}))} className="w-16 bg-slate-900 border text-center border-white/10 rounded px-2 py-1 text-white text-xs"/>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Trọng số (Điểm)</span>
                  <input type="number" value={localSettings.kpiWeights.sales} onChange={e => setLocalSettings(p => ({...p, kpiWeights: {...p.kpiWeights, sales: Number(e.target.value)}}))} className="w-16 bg-blue-500/20 text-blue-400 font-bold border text-center border-blue-500/30 rounded px-2 py-1 text-xs"/>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5">
              <label className="text-[11px] font-semibold text-slate-300 block mb-2">Bao Phủ</label>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Giới hạn tỉ lệ tối thiểu</span>
                  <input type="number" step="0.1" value={localSettings.kpiRules?.coverageThreshold} onChange={e => setLocalSettings(p => ({...p, kpiRules: {...p.kpiRules, coverageThreshold: Number(e.target.value)} as any}))} className="w-16 bg-slate-900 border text-center border-white/10 rounded px-2 py-1 text-white text-xs"/>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Hệ số nhân tối đa</span>
                  <input type="number" step="0.1" value={localSettings.kpiRules?.coverageMaxMultiplier} onChange={e => setLocalSettings(p => ({...p, kpiRules: {...p.kpiRules, coverageMaxMultiplier: Number(e.target.value)} as any}))} className="w-16 bg-slate-900 border text-center border-white/10 rounded px-2 py-1 text-white text-xs"/>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Trọng số (Điểm)</span>
                  <input type="number" value={localSettings.kpiWeights.coverage} onChange={e => setLocalSettings(p => ({...p, kpiWeights: {...p.kpiWeights, coverage: Number(e.target.value)}}))} className="w-16 bg-blue-500/20 text-blue-400 font-bold border text-center border-blue-500/30 rounded px-2 py-1 text-xs"/>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5">
              <label className="text-[11px] font-semibold text-slate-300 block mb-2">Tiến độ 15 Ngày (11 Ngày)</label>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Tỉ lệ mục tiêu</span>
                  <input type="number" step="0.05" value={localSettings.kpiRules?.month15DaysTargetRatio} onChange={e => setLocalSettings(p => ({...p, kpiRules: {...p.kpiRules, month15DaysTargetRatio: Number(e.target.value)} as any}))} className="w-16 bg-slate-900 border text-center border-white/10 rounded px-2 py-1 text-white text-xs"/>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Ngưỡng tối thiểu</span>
                  <input type="number" step="0.1" value={localSettings.kpiRules?.month15DaysThreshold} onChange={e => setLocalSettings(p => ({...p, kpiRules: {...p.kpiRules, month15DaysThreshold: Number(e.target.value)} as any}))} className="w-16 bg-slate-900 border text-center border-white/10 rounded px-2 py-1 text-white text-xs"/>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Trọng số (Điểm)</span>
                  <input type="number" value={localSettings.kpiWeights.month15Days} onChange={e => setLocalSettings(p => ({...p, kpiWeights: {...p.kpiWeights, month15Days: Number(e.target.value)}}))} className="w-16 bg-blue-500/20 text-blue-400 font-bold border text-center border-blue-500/30 rounded px-2 py-1 text-xs"/>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5">
              <label className="text-[11px] font-semibold text-slate-300 block mb-2">SKU</label>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 leading-tight">Điểm SKU sẽ được nội suy dựa trên cấu hình mảng trong bộ nhớ. Hiện tại:</p>
                <div className="flex justify-between items-center text-xs mt-2">
                  <span className="text-slate-500">Trọng số (Điểm Max)</span>
                  <input type="number" step="0.5" value={localSettings.kpiWeights.sku} onChange={e => setLocalSettings(p => ({...p, kpiWeights: {...p.kpiWeights, sku: Number(e.target.value)}}))} className="w-16 bg-blue-500/20 text-blue-400 font-bold border text-center border-blue-500/30 rounded px-2 py-1 text-xs"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* App Title */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Type className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-medium text-white">Tên Ứng dụng</h2>
        </div>
        <input 
          type="text" 
          placeholder="Ví dụ: Hệ thống báo cáo KPI" 
          value={localSettings.appTitle || ''}
          onChange={(e) => setLocalSettings({...localSettings, appTitle: e.target.value})}
          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-200 leading-relaxed mt-2">
          <p className="font-bold mb-1">Lưu ý khi biên dịch APK (GitHub Actions):</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Để đổi tên app hiển thị ngoài màn hình điện thoại, bạn phải sửa biến <code>appName</code> trong file <code>capacitor.config.ts</code> trên repo.</li>
            <li>Để đổi Logo App cài đặt trên màn hình, hãy tải lên ảnh <code>icon.png</code> và <code>splash.png</code> vào thư mục <code>resources</code> trên repo, sau đó chạy lệnh <code>npx capacitor-assets generate</code> nếu bạn kéo code về build offline, hoặc commit trực tiếp để GitHub Actions tự generate.</li>
          </ul>
        </div>
      </motion.div>

      {/* App Title */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-medium text-white">Chủ đề Giao diện</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setLocalSettings({...localSettings, themeColor: theme.id})}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                localSettings.themeColor === theme.id 
                  ? 'border-white/20 bg-white/5' 
                  : 'border-transparent hover:bg-white/5'
              }`}
            >
              <span className={`w-6 h-6 rounded-full ${theme.color} shadow-lg`} />
              <span className="text-xs font-medium text-white">{theme.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* App Icon */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shapes className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-medium text-white">Biểu tượng Ứng dụng</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {APP_ICONS.map((item) => (
            <button
              key={item.id}
              onClick={() => setLocalSettings({...localSettings, appIcon: item.id})}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 ${
                localSettings.appIcon === item.id 
                  ? 'border-white/20 bg-white/10 text-white' 
                  : 'border-transparent hover:bg-white/5 text-slate-400'
              }`}
            >
              <item.icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* SKU Tiers Configuration */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-medium text-white">Cấu hình Bậc Điểm SKU</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {(localSettings.skuTiers || []).map((tier, idx) => (
            <div key={idx} className="flex flex-col gap-1 bg-slate-950/30 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-500 font-bold">BẬC {idx + 1}</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  step="0.1"
                  value={tier.threshold}
                  onChange={(e) => {
                    const newTiers = [...(localSettings.skuTiers || [])];
                    newTiers[idx].threshold = parseFloat(e.target.value);
                    setLocalSettings({...localSettings, skuTiers: newTiers});
                  }}
                  className="w-16 bg-transparent border-b border-white/10 text-xs text-white focus:border-blue-500 py-1 outline-none font-mono"
                  placeholder="Mốc"
                />
                <span className="text-[10px] text-slate-400">→</span>
                <input 
                  type="number"
                  step="0.5"
                  value={tier.score}
                  onChange={(e) => {
                    const newTiers = [...(localSettings.skuTiers || [])];
                    newTiers[idx].score = parseFloat(e.target.value);
                    setLocalSettings({...localSettings, skuTiers: newTiers});
                  }}
                  className="w-16 bg-transparent border-b border-white/10 text-xs text-blue-400 focus:border-blue-500 py-1 outline-none font-mono font-bold"
                  placeholder="Điểm"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Management: Backup & Restore */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-medium text-white">Quản lý Dữ liệu & Sao lưu</h2>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed italic">
          Xuất toàn bộ cấu hình, cài đặt và ký ức AI của bạn thành file JSON để sao lưu hoặc chuyển đổi thiết bị.
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <button
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
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all gap-2 group"
          >
            <Download className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Sao lưu (Backup)</span>
          </button>

          <label className="flex flex-col items-center justify-center p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all gap-2 group cursor-pointer">
            <Upload className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Khôi phục (Restore)</span>
            <input 
              type="file" 
              className="hidden" 
              accept=".json"
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
                      alert('Khôi phục dữ liệu thành công! Hệ thống sẽ tải lại sau 1 giây.');
                      setLocalSettings(data.settings);
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
          </label>
        </div>
      </motion.div>

      <motion.button 
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        className="w-full bg-white hover:bg-slate-200 text-slate-900 py-4 rounded-2xl transition-colors font-semibold flex items-center justify-center gap-2 mt-8 shadow-xl"
      >
        <Save className="w-5 h-5" />
        Lưu thay đổi
      </motion.button>

      </div>
    </motion.div>
  );
}
