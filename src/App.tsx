import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import DataEntry from './pages/DataEntry';
import YearlyData from './pages/YearlyData';
import { LayoutDashboard, FileSpreadsheet, CalendarDays } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'data' | 'yearly'>('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between overflow-hidden relative font-sans text-slate-200">
      
      {/* Background Blobs for Frosted Glass Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
          {activeTab === 'data' && <DataEntry key="data" />}
          {activeTab === 'yearly' && <YearlyData key="yearly" />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900/60 backdrop-blur-xl border-t border-white/5 pb-safe z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4 relative">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
              activeTab === 'dashboard' ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {activeTab === 'dashboard' && <div className="absolute top-0 w-8 h-1.5 bg-emerald-500 rounded-b-full"></div>}
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest">Tổng quan</span>
          </button>

          <button
            onClick={() => setActiveTab('yearly')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
              activeTab === 'yearly' ? "text-purple-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {activeTab === 'yearly' && <div className="absolute top-0 w-8 h-1.5 bg-purple-500 rounded-b-full"></div>}
            <CalendarDays className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest">Năm</span>
          </button>
          
          <button
            onClick={() => setActiveTab('data')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
              activeTab === 'data' ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {activeTab === 'data' && <div className="absolute top-0 w-8 h-1.5 bg-blue-500 rounded-b-full"></div>}
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest">Nhập liệu</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}
