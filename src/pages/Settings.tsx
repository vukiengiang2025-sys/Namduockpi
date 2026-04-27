import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { Settings as SettingsIcon, Key, Palette, Save, Type, Hexagon, Box, Target, Activity, LayoutDashboard, BarChart3, PieChart, Shapes, Sun, Moon, Type as TypeIcon, Image as ImageIcon, Sliders } from 'lucide-react';
import { useState, useEffect } from 'react';

const THEMES = [
  { id: 'blue', name: 'Xanh dương', color: 'bg-blue-500' },
  { id: 'emerald', name: 'Xanh ngọc', color: 'bg-emerald-500' },
  { id: 'purple', name: 'Tím', color: 'bg-purple-500' },
  { id: 'rose', name: 'Hồng', color: 'bg-rose-500' },
];

export const APP_ICONS = [
  { id: 'hexagon', icon: Hexagon },
  { id: 'box', icon: Box },
  { id: 'target', icon: Target },
  { id: 'activity', icon: Activity },
  { id: 'layout', icon: LayoutDashboard },
  { id: 'bar-chart', icon: BarChart3 },
  { id: 'pie-chart', icon: PieChart },
  { id: 'shapes', icon: Shapes },
];

export default function Settings() {
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState({
    themeMode: 'dark',
    fontFamily: 'sans',
    dashboardLayout: 'default',
    ...settings,
    kpiWeights: settings.kpiWeights || { sales: 80, coverage: 10, month15Days: 5, sku: 7.5 },
    appIcon: settings.appIcon || 'hexagon'
  });

  const handleSave = () => {
    updateSettings(localSettings);
    alert('Đã lưu cài đặt!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 px-5 pt-8 pb-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Hệ thống</span>
      </div>
      <h1 className="text-2xl font-light text-white tracking-tight mb-8">Cài đặt <span className="font-bold">Ứng dụng</span></h1>

      {/* Theme Mode */}
      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
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
      </div>

      {/* Font Family */}
      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
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
      </div>

      {/* Dashboard Layout */}
      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
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
      </div>

      {/* Custom Header Bg */}
      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
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
      </div>

      {/* Custom KPI Weights */}
      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-medium text-white">Trọng số KPI (Điểm tối đa)</h2>
        </div>
        <p className="text-[10px] text-slate-500 mb-2">Phù hợp để thay đổi điểm số theo từng mùa thi đua.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Doanh số</label>
            <input 
              type="number" 
              value={localSettings.kpiWeights.sales}
              onChange={(e) => setLocalSettings({...localSettings, kpiWeights: {...localSettings.kpiWeights, sales: Number(e.target.value)}})}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Bao phủ (Tháng)</label>
            <input 
              type="number" 
              value={localSettings.kpiWeights.coverage}
              onChange={(e) => setLocalSettings({...localSettings, kpiWeights: {...localSettings.kpiWeights, coverage: Number(e.target.value)}})}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Tiến độ 15 ngày</label>
            <input 
              type="number" 
              value={localSettings.kpiWeights.month15Days}
              onChange={(e) => setLocalSettings({...localSettings, kpiWeights: {...localSettings.kpiWeights, month15Days: Number(e.target.value)}})}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">SKU</label>
            <input 
              type="number" 
              value={localSettings.kpiWeights.sku}
              onChange={(e) => setLocalSettings({...localSettings, kpiWeights: {...localSettings.kpiWeights, sku: Number(e.target.value)}})}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>
      </div>

      {/* App Title */}
      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
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
      </div>

      {/* Gemini API Key */}
      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-medium text-white">Gemini API Key</h2>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Cần thiết để sử dụng tính năng AI Phân tích. API Key sẽ được lưu trữ an toàn ngay trên thiết bị của bạn.
        </p>
        <input 
          type="password" 
          placeholder="Nhập API Key..." 
          value={localSettings.geminiKey || ''}
          onChange={(e) => setLocalSettings({...localSettings, geminiKey: e.target.value})}
          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>

      {/* App Theme */}
      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
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
      </div>

      {/* App Icon */}
      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl space-y-4">
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
      </div>

      <button 
        onClick={handleSave}
        className="w-full bg-white hover:bg-slate-200 text-slate-900 py-4 rounded-2xl transition-colors font-semibold flex items-center justify-center gap-2 mt-8"
      >
        <Save className="w-5 h-5" />
        Lưu thay đổi
      </button>

    </motion.div>
  );
}
