
import React, { useEffect } from 'react';
import { useAppStore, Toast } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium shadow-2xl border backdrop-blur-xl min-w-[280px]",
        toast.type === 'success' ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-100" :
        toast.type === 'error' ? "bg-red-950/80 border-red-500/30 text-red-100" :
        "bg-slate-900/80 border-white/10 text-white"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0", 
        toast.type === 'success' ? "text-emerald-400" : 
        toast.type === 'error' ? "text-red-400" : 
        "text-blue-400"
      )} />
      <span className="flex-1">{toast.message}</span>
      <button 
        onClick={() => onRemove(toast.id)}
        className="p-1 hover:bg-white/10 rounded-full transition-colors"
      >
        <X className="w-4 h-4 opacity-50" />
      </button>
    </motion.div>
  );
}
