import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import DataEntry from './pages/DataEntry';
import YearlyData from './pages/YearlyData';
import Notes from './pages/Notes';
import Weekly from './pages/Weekly';
import Settings from './pages/Settings';
import { LayoutDashboard, FileSpreadsheet, CalendarDays, ClipboardList, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from './store';
import Login from './pages/Login';
import { FirebaseSync } from './components/FirebaseSync';
import { logout } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'yearly' | 'weekly' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings, user, isLoading } = useAppStore();

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

    // Set document title
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 bg-blue-500 rounded-full blur-xl" 
        />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <FirebaseSync />
        <Login />
      </>
    );
  }

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false);
      }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 w-full group relative",
        activeTab === id 
          ? `${theme.activeBg} text-white shadow-lg shadow-black/20` 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-5 h-5", activeTab === id ? "text-white" : theme.text)} />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      {activeTab === id && (
        <motion.div layoutId="active-pill" className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex text-slate-200 transition-colors duration-300 bg-slate-950 font-sans" style={bgStyle}>
      
      <FirebaseSync />
      
      {/* Background Blobs */}
      {!settings.bgUrl && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className={`absolute -top-[10%] -left-[10%] w-[50%] h-[50%] ${theme.bg} rounded-full blur-[120px] opacity-40 transition-colors duration-700`}></div>
          <div className={`absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] ${theme.bg} rounded-full blur-[120px] opacity-40 transition-colors duration-700`}></div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/40 backdrop-blur-2xl border-r border-white/5 p-6 sticky top-0 h-screen z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner", theme.bg)}>
             <BarChart3 className={cn("w-6 h-6", theme.text)} />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-tighter leading-none">{settings.appTitle || 'KPI AI'}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Smart Advisor</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Bàn làm việc" />
          <NavItem id="yearly" icon={CalendarDays} label="Dữ liệu Năm" />
          <NavItem id="weekly" icon={BarChart3} label="Theo dõi Tuần" />
          <NavItem id="settings" icon={SettingsIcon} label="Cấu hình AI" />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <button 
            onClick={() => logout()}
            className="w-full bg-white/5 hover:bg-red-500/10 rounded-2xl p-4 flex items-center gap-3 border border-white/5 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 uppercase font-black text-[10px] text-slate-400 group-hover:border-red-500/20">
              {user.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-xs font-bold text-white truncate">{user.displayName || 'User'}</p>
              <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Header / Sidebar Logic */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="lg:hidden h-16 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 px-4 flex items-center justify-between sticky top-0 z-40">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white">
             <LayoutDashboard className="w-6 h-6" />
           </button>
           <h1 className="text-xs font-black text-white uppercase tracking-widest">{settings.appTitle || 'KPI AI'}</h1>
           <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", theme.bg)}>
             <BarChart3 className={cn("w-5 h-5", theme.text)} />
           </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl z-[70] p-6 lg:hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Danh mục</span>
                  <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500">✕</button>
                </div>
                <nav className="space-y-2">
                  <NavItem id="dashboard" icon={LayoutDashboard} label="Bàn làm việc" />
                  <NavItem id="yearly" icon={CalendarDays} label="Dữ liệu Năm" />
                  <NavItem id="weekly" icon={BarChart3} label="Theo dõi Tuần" />
                  <NavItem id="settings" icon={SettingsIcon} label="Cấu hình AI" />
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 relative z-10 overflow-x-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
            {activeTab === 'yearly' && <YearlyData key="yearly" />}
            {activeTab === 'weekly' && <Weekly key="weekly" />}
            {activeTab === 'settings' && <Settings key="settings" />}
          </AnimatePresence>
        </main>
      </div>
      
    </div>
  );
}
