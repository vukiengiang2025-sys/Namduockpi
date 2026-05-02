import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import YearlyData from './pages/YearlyData';
import Weekly from './pages/Weekly';
import Settings from './pages/Settings';
import { LayoutDashboard, CalendarDays, BarChart3, Settings as SettingsIcon, BrainCircuit, ShieldCheck } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from './store';
import Notes from './pages/Notes';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'yearly' | 'intel' | 'strategy' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useAppStore();

  useEffect(() => {
    if (settings.themeMode === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }

    document.body.style.fontFamily = settings.fontFamily === 'serif' ? 'var(--font-serif)' : 
                                     settings.fontFamily === 'mono' ? 'var(--font-mono)' : 
                                     'var(--font-sans)';

    document.title = settings.appTitle || 'KPI Manager';
  }, [settings.themeMode, settings.fontFamily, settings.appTitle]);

  const getThemeColors = () => {
    switch (settings.themeColor) {
      case 'emerald': return { bg: 'bg-emerald-600/20', text: 'text-emerald-400', activeBg: 'bg-emerald-500', border: 'border-emerald-500/30' };
      case 'purple': return { bg: 'bg-purple-600/20', text: 'text-purple-400', activeBg: 'bg-purple-500', border: 'border-purple-500/30' };
      case 'rose': return { bg: 'bg-rose-600/20', text: 'text-rose-400', activeBg: 'bg-rose-500', border: 'border-rose-500/30' };
      case 'blue': default: return { bg: 'bg-blue-600/20', text: 'text-blue-400', activeBg: 'bg-blue-500', border: 'border-blue-500/30' };
    }
  };

  const theme = getThemeColors();
  const bgStyle = settings.bgUrl ? { backgroundImage: `url(${settings.bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {};

  const pageVariants = {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false);
      }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 w-full group relative overflow-hidden",
        activeTab === id 
          ? `${theme.activeBg} text-white shadow-lg shadow-black/40` 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-5 h-5 transition-transform duration-300 group-active:scale-90", activeTab === id ? "text-white" : theme.text)} />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      {activeTab === id && (
        <motion.div 
          layoutId="active-pill" 
          className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex text-slate-200 transition-colors duration-300 bg-slate-950 font-sans selection:bg-blue-500/30" style={bgStyle}>
      
      {!settings.bgUrl && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            animate={{ 
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className={`absolute -top-[10%] -left-[10%] w-[60%] h-[60%] ${theme.bg} rounded-full blur-[100px] transition-colors duration-700`}
          />
          <motion.div 
            animate={{ 
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className={`absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] ${theme.bg} rounded-full blur-[100px] transition-colors duration-700`}
          />
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 p-6 sticky top-0 h-screen z-50">
        <div className="flex items-center justify-between mb-10 px-2">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl relative group", theme.bg)}>
             <BarChart3 className={cn("w-6 h-6 z-10", theme.text)} />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-tighter leading-none">{settings.appTitle || 'KPI AI'}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Personal Edition</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Chiến lược" />
          <NavItem id="yearly" icon={CalendarDays} label="Mục tiêu Năm" />
          <NavItem id="intel" icon={BrainCircuit} label="Ký ức AI" />
          <NavItem id="strategy" icon={BarChart3} label="Tổng kết Tuần" />
          <NavItem id="settings" icon={SettingsIcon} label="Hệ thống" />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5 group hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 uppercase font-black text-[10px] text-slate-400 group-hover:scale-110 transition-transform">P</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Offline Mode</p>
              <p className="text-[9px] text-slate-500 truncate uppercase tracking-widest">Sử dụng cục bộ</p>
            </div>
          </motion.div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="lg:hidden h-16 bg-slate-900/40 backdrop-blur-2xl border-b border-white/5 px-4 flex items-center justify-between sticky top-0 z-40">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-transform active:scale-90">
             <LayoutDashboard className="w-6 h-6" />
           </button>
           <h1 className="text-xs font-black text-white uppercase tracking-widest">{settings.appTitle || 'KPI AI'}</h1>
           <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", theme.bg)}>
             <BarChart3 className={cn("w-5 h-5", theme.text)} />
           </div>
        </header>

        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 left-0 w-80 bg-slate-900 shadow-[20px_0_40px_rgba(0,0,0,0.5)] z-[70] p-8 lg:hidden flex flex-col"
              >
                <div className="flex items-center justify-between mb-12">
                  <span className="text-xs font-black text-white uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Danh mục</span>
                  <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-500 transition-colors">✕</button>
                </div>
                <nav className="space-y-3">
                  <NavItem id="dashboard" icon={LayoutDashboard} label="Chiến lược" />
                  <NavItem id="yearly" icon={CalendarDays} label="Mục tiêu Năm" />
                  <NavItem id="intel" icon={BrainCircuit} label="Ký ức AI" />
                  <NavItem id="strategy" icon={BarChart3} label="Tổng kết Tuần" />
                  <NavItem id="settings" icon={SettingsIcon} label="Hệ thống" />
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 relative z-10 overflow-x-hidden p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
              {activeTab === 'yearly' && <YearlyData key="yearly" />}
              {activeTab === 'intel' && <Notes key="intel" />}
              {activeTab === 'strategy' && <Weekly key="strategy" />}
              {activeTab === 'settings' && <Settings key="settings" />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
