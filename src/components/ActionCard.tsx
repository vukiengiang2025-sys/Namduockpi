import React from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { CheckCircle2, Zap, Archive, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { DailyTask, useAppStore } from '../store';

interface ActionCardProps {
  task: DailyTask;
  onToggle: (id: string) => void;
  index: number;
}

export const ActionCard: React.FC<ActionCardProps> = ({ task, onToggle, index }) => {
  const { startDailyTask } = useAppStore();
  const x = useMotionValue(0);
  
  // Transform values based on drag gesture
  const background = useTransform(
    x,
    [-100, 0, 100],
    ["rgba(239, 68, 68, 0.15)", "rgba(15, 23, 42, 0)", "rgba(34, 197, 94, 0.15)"]
  );
  
  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onToggle(task.id);
      x.set(0);
    } else if (info.offset.x < -100) {
      // Optional Skip
      x.set(0);
    } else {
      x.set(0);
    }
  };

  const confidenceColor = (task.confidence || 0) > 0.8 ? "text-emerald-400" : (task.confidence || 0) > 0.6 ? "text-yellow-400" : "text-slate-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[2.5rem] bg-slate-900/40 border border-white/5"
    >
      {/* Swipe Feedback Layer */}
      <motion.div 
        style={{ background }}
        className="absolute inset-0 flex items-center justify-between px-8"
      >
        <div className="flex items-center gap-2 text-red-500/50">
          <Archive className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 text-emerald-500/50">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </motion.div>

      {/* Main Card Content (Draggable) */}
      <motion.div
        drag={task.isCompleted ? false : "x"}
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x, touchAction: 'pan-y' }}
        className={cn(
          "relative z-10 p-6 bg-slate-950 border-white/5 shadow-2xl transition-all h-full flex flex-col",
          task.isCompleted ? "opacity-50 grayscale select-none" : "cursor-grab active:cursor-grabbing"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className={cn(
               "p-2.5 rounded-2xl",
               task.priority === 'high' ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-500"
             )}>
                <Zap className={cn("w-4 h-4 fill-current", !task.isCompleted && task.priority === 'high' && "animate-pulse")} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                   {task.type || 'HÀNH ĐỘNG'}
                </p>
                <div className="flex items-center gap-2">
                   <div className={cn("w-1.5 h-1.5 rounded-full", task.priority === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-slate-700")} />
                   <span className="text-[9px] font-black text-slate-400 tracking-tighter uppercase whitespace-nowrap">Ưu tiên: {task.priority}</span>
                </div>
             </div>
          </div>
          
          {task.confidence && (
            <div className="flex flex-col items-end">
               <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className={cn("w-3 h-3", confidenceColor)} />
                  <span className={cn("text-[11px] font-black leading-none", confidenceColor)}>{Math.round(task.confidence * 100)}%</span>
               </div>
               <span className="text-[7px] text-slate-600 font-black uppercase tracking-tighter">Confidence</span>
            </div>
          )}
        </div>

        <div className="flex-1 mb-6">
          <h4 className={cn(
            "text-base font-bold leading-relaxed mb-3",
            task.isCompleted ? "text-slate-600 line-through" : "text-white group-hover:text-blue-200"
          )}>
            {task.text}
          </h4>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
             <Sparkles className="w-3 h-3 text-emerald-500" />
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Tác động: {task.expectedImpact}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-white/5 mt-auto">
           <button 
             onClick={(e) => {
               e.stopPropagation();
               if (task.isCompleted) {
                 onToggle(task.id);
               } else if (!task.isStarted) {
                 startDailyTask(task.id);
               }
             }}
             className={cn(
               "flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 overflow-hidden",
               task.isCompleted 
                 ? "bg-slate-800 text-slate-500" 
                 : task.isStarted 
                   ? "bg-emerald-600 text-white shadow-xl shadow-emerald-900/40" 
                   : "bg-blue-600 text-white shadow-xl shadow-blue-900/40 active:scale-95"
             )}
           >
              {task.isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất</span>
                </>
              ) : task.isStarted ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                    <Zap className="w-4 h-4 fill-current" />
                  </motion.div>
                  <span>Đang thực chiến</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Bắt đầu ngay</span>
                </>
              )}
           </button>
           
           {!task.isCompleted && (
             <div className="flex flex-col items-center gap-1 opacity-40 shrink-0">
               <motion.div 
                 animate={{ x: [0, 8, 0] }}
                 transition={{ duration: 1.5, repeat: Infinity }}
               >
                 <ArrowRight className="w-4 h-4 text-emerald-500" />
               </motion.div>
               <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Swipe</span>
             </div>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
}
