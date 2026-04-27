import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import DataEntry from './pages/DataEntry';
import YearlyData from './pages/YearlyData';
import Notes from './pages/Notes';
import Analyzer from './pages/Analyzer';
import Settings from './pages/Settings';
import { LayoutDashboard, FileSpreadsheet, CalendarDays, ClipboardList, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence } from 'motion/react';
import { useAppStore } from './store';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'data' | 'yearly' | 'notes' | 'analyzer' | 'settings'>('dashboard');
  const { settings } = useAppStore();

  useEffect(() => {
    if (settings.themeMode === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }

    // Set font family
    document.body.style.fontFamily = settings.fontFamily === 'serif' ? 'var(--font-serif)' : 
                                     settings.fontFamily === 'mono' ? 'var(--font-mono)' : 
                                     'var(--font-sans)';

  }, [settings.themeMode, settings.fontFamily]);

  const getThemeColors = () => {
    switch (settings.themeColor) {
      case 'emerald': return { bg: 'bg-emerald-600/20', text: 'text-emerald-400', activeBg: 'bg-emerald-500' };
      case 'purple': return { bg: 'bg-purple-600/20', text: 'text-purple-400', activeBg: 'bg-purple-500' };
      case 'rose': return { bg: 'bg-rose-600/20', text: 'text-rose-400', activeBg: 'bg-rose-500' };
      case 'blue': default: return { bg: 'bg-blue-600/20', text: 'text-blue-400', activeBg: 'bg-blue-500' };
    }
  };

  const theme = getThemeColors();
  const bgStyle = settings.bgUrl ? { backgroundImage: `url(${settings.bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {};

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-hidden relative text-slate-200 transition-colors duration-300" style={bgStyle}>
      
      {/* Background Blobs for Frosted Glass Effect - Hide if custom bg */}
      {!settings.bgUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className={`absolute -top-[10%] -left-[10%] w-[50%] h-[50%] ${theme.bg} rounded-full blur-[100px] transition-colors duration-700`}></div>
          <div className={`absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] ${theme.bg} rounded-full blur-[100px] transition-colors duration-700`}></div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
          {activeTab === 'data' && <DataEntry key="data" />}
          {activeTab === 'yearly' && <YearlyData key="yearly" />}
          {activeTab === 'notes' && <Notes key="notes" />}
          {activeTab === 'analyzer' && <Analyzer key="analyzer" />}
          {activeTab === 'settings' && <Settings key="settings" />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900/60 backdrop-blur-xl border-t border-white/5 pb-safe z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2 relative overflow-x-auto no-scrollbar">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] h-full gap-1 transition-colors relative shrink-0",
              activeTab === 'dashboard' ? theme.text : "text-slate-500 hover:text-slate-300"
            )}
          >
            {activeTab === 'dashboard' && <div className={`absolute top-0 w-8 h-1.5 ${theme.activeBg} rounded-b-full`}></div>}
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest hidden sm:block">Tổng quan</span>
          </button>

          <button
            onClick={() => setActiveTab('yearly')}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] h-full gap-1 transition-colors relative shrink-0",
              activeTab === 'yearly' ? theme.text : "text-slate-500 hover:text-slate-300"
            )}
          >
            {activeTab === 'yearly' && <div className={`absolute top-0 w-8 h-1.5 ${theme.activeBg} rounded-b-full`}></div>}
            <CalendarDays className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest hidden sm:block">Năm</span>
          </button>
          
          <button
            onClick={() => setActiveTab('data')}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] h-full gap-1 transition-colors relative shrink-0",
              activeTab === 'data' ? theme.text : "text-slate-500 hover:text-slate-300"
            )}
          >
            {activeTab === 'data' && <div className={`absolute top-0 w-8 h-1.5 ${theme.activeBg} rounded-b-full`}></div>}
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest hidden sm:block">Nhập liệu</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] h-full gap-1 transition-colors relative shrink-0",
              activeTab === 'notes' ? theme.text : "text-slate-500 hover:text-slate-300"
            )}
          >
            {activeTab === 'notes' && <div className={`absolute top-0 w-8 h-1.5 ${theme.activeBg} rounded-b-full`}></div>}
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest hidden sm:block">Ghi chú</span>
          </button>

          <button
            onClick={() => setActiveTab('analyzer')}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] h-full gap-1 transition-colors relative shrink-0",
              activeTab === 'analyzer' ? theme.text : "text-slate-500 hover:text-slate-300"
            )}
          >
            {activeTab === 'analyzer' && <div className={`absolute top-0 w-8 h-1.5 ${theme.activeBg} rounded-b-full`}></div>}
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest hidden sm:block">AI PTích</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] h-full gap-1 transition-colors relative shrink-0",
              activeTab === 'settings' ? theme.text : "text-slate-500 hover:text-slate-300"
            )}
          >
            {activeTab === 'settings' && <div className={`absolute top-0 w-8 h-1.5 ${theme.activeBg} rounded-b-full`}></div>}
            <SettingsIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest hidden sm:block">Cài đặt</span>
          </button>

        </div>
      </div>
      
    </div>
  );
}
