import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, LogIn, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function Login() {
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-[2rem] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/20 mb-6">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">NAMDUOC KPI</h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight px-6">
            Hệ thống Cố vấn Chiến thuật & Quản lý KPI thông minh cấp cao nhất.
          </p>
        </div>

        <div className="space-y-6">
           <div className="grid grid-cols-1 gap-4 mb-8">
              <FeatureItem icon={ShieldCheck} text="Bảo mật dữ liệu đám mây" />
              <FeatureItem icon={Zap} text="Phân tích AI thời gian thực" />
              <FeatureItem icon={Sparkles} text="Chiến thuật đánh trận hằng ngày" />
           </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className={cn(
              "w-full h-14 rounded-2xl bg-white text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50",
              loading ? "cursor-wait" : "hover:bg-slate-100 shadow-xl shadow-white/5"
            )}
          >
            {loading ? (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <LogIn className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Đăng nhập với Google</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest">
            Sử dụng tài khoản công ty để đồng bộ dữ liệu
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
      <div className="p-2 bg-blue-500/10 rounded-xl">
        <Icon className="w-4 h-4 text-blue-400" />
      </div>
      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">{text}</span>
    </div>
  );
}
