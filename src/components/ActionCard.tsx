import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { CheckCircle2, Zap, Archive, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { DailyTask } from '../store';

interface ActionCardProps {
  task: DailyTask;
  onToggle: (id: string) => void;
  index: number;
}

export function ActionCard({ task, onToggle, index }: ActionCardProps) {
  const [isStarted, setIsStarted] = useState(false);
  const x = useMotionValue(0);
  
  // Transform values based on drag gesture
  const background = useTransform(
    x,
    [-100, 0, 100],
    ["rgba(239, 68, 68, 0.1)", "rgba(15, 23, 42, 0)", "rgba(34, 197, 94, 0.1)"]
  );
  
  const opacityAction = useTransform(x, [-100, -50, 0, 50, 100], [1, 0, 0, 0, 1]);
  const actionText = useTransform(x, [-100, 0, 100], ["Bỏ qua", "", "Hoàn thành"]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 120) {
      onToggle(task.id);
    } else if (info.offset.x < -120) {
      // Optional: Archive/Skip logic could go here
    }
  };

  const confidenceColor = (task.confidence || 0) > 0.8 ? "text-emerald-400" : (task.confidence || 0) > 0.6 ? "text-yellow-400" : "text-slate-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[2.5rem] mb-4 bg-slate-900/40 border border-white/5"
    >
      {/* Swipe Feedback Layer */}
      <motion.div 
        style={{ background }}
        className="absolute inset-0 flex items-center justify-between px-8"
      >
        <motion.div style={{ opacity: useTransform(x, [-100, -50], [1, 0]) }} className="flex items-center gap-2 text-red-500">
          <Archive className="w-5 h-5" />
          <span className="font-black text-[10px] uppercase tracking-widest">Bỏ qua</span>
        </motion.div>
        <motion.div style={{ opacity: useTransform(x, [50, 100], [0, 1]) }} className="flex items-center gap-2 text-emerald-500">
          <span className="font-black text-[10px] uppercase tracking-widest">Hoàn thành</span>
          <CheckCircle2 className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Main Card Content (Draggable) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "relative z-10 p-6 bg-slate-950 border-white/5 shadow-2xl transition-shadow",
          task.isCompleted ? "opacity-50 grayscale" : "cursor-grab active:cursor-grabbing"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className={cn(
               "p-2 rounded-xl",
               task.priority === 'high' ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-500"
             )}>
                <Zap className={cn("w-4 h-4 fill-current", !task.isCompleted && task.priority === 'high' && "animate-pulse")} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                   {task.type || 'Hành động'}
                </p>
                <div className="flex items-center gap-2">
                   <div className={cn("w-1.5 h-1.5 rounded-full", task.priority === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-slate-700")} />
                   <span className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">Priority: {task.priority}</span>
                </div>
             </div>
          </div>
          
          {task.confidence && (
            <div className="flex flex-col items-end">
               <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className={cn("w-3 h-3", confidenceColor)} />
                  <span className={cn("text-[11px] font-black", confidenceColor)}>{Math.round(task.confidence * 100)}%</span>
               </div>
               <span className="text-[7px] text-slate-600 font-black uppercase tracking-tighter">Confidence</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h4 className={cn(
            "text-base font-bold leading-relaxed mb-2 transition-colors",
            task.isCompleted ? "text-slate-600 line-through" : "text-white"
          )}>
            {task.text}
          </h4>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
             <ArrowRight className="w-3 h-3 text-emerald-500" />
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Impact: {task.expectedImpact}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-white/5">
           <button 
             onClick={() => task.isCompleted ? onToggle(task.id) : setIsStarted(!isStarted)}
             className={cn(
               "flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl",
               task.isCompleted 
                 ? "bg-slate-800 text-slate-500" 
                 : isStarted 
                   ? "bg-emerald-600 text-white shadow-emerald-900/40" 
                   : "bg-blue-600 text-white shadow-blue-900/40 active:scale-95"
             )}
           >
              {task.isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã xong</span>
                </>
              ) : isStarted ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Zap className="w-4 h-4 fill-current" />
                  </motion.div>
                  <span>Đang thực hiện</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Bắt đầu</span>
                </>
              )}
           </button>
           
           {!task.isCompleted && (
             <div className="flex items-center gap-1 px-4 text-slate-600">
               <span className="text-[9px] font-black uppercase italic tracking-tighter">Vuốt để xong</span>
               <ArrowRight className="w-3 h-3 opacity-30 animate-bounce-x" />
             </div>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
}
