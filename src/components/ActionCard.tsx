import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, PlusCircle, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { DailyTask } from '../store';

interface ActionCardProps {
  task: DailyTask;
  onToggle: (id: string) => void;
  index: number;
}

export function ActionCard({ task, onToggle, index }: ActionCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.1 }}
      className={cn(
        "group relative flex flex-col p-6 rounded-[2rem] border transition-all h-full",
        task.isCompleted 
          ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" 
          : "bg-slate-950/60 border-white/5 hover:border-blue-500/30 hover:bg-slate-950 shadow-lg shadow-black/20"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[7px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter", 
            task.priority === 'high' ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400"
          )}>
            Priority: {task.priority}
          </span>
          {task.type && (
            <span className="text-[7px] font-black text-blue-400/60 uppercase tracking-tighter">@{task.type}</span>
          )}
        </div>
        {task.expectedImpact && (
          <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
            {task.expectedImpact}
          </div>
        )}
      </div>
      
      <div className="flex-1 mb-6">
        <p className={cn(
          "text-sm font-bold leading-relaxed", 
          task.isCompleted ? "text-slate-600 line-through" : "text-white group-hover:text-blue-200"
        )}>
          {task.text}
        </p>
      </div>

      <div className="flex items-center gap-3 mt-auto">
        <button 
          onClick={() => onToggle(task.id)}
          className={cn(
            "flex-1 h-11 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all overflow-hidden flex items-center justify-center gap-2",
            task.isCompleted 
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
              : "bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-xl shadow-blue-600/20 group-hover:bg-blue-500"
          )}
        >
          {task.isCompleted ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã hoàn thành</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>Bắt đầu ngay</span>
            </>
          )}
        </button>
      </div>

      {!task.isCompleted && (
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <PlusCircle className="w-4 h-4 text-blue-500/40" />
        </div>
      )}
    </motion.div>
  );
}
