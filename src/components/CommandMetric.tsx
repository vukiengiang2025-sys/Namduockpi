import React from 'react';
import { LucideIcon, Zap, Activity, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProgressCircle } from './ProgressCircle';

interface CommandMetricProps {
  title: string;
  value: string | number;
  percent: number;
  status: "danger" | "warning" | "stable" | "success";
  icon: LucideIcon;
  onClick?: () => void;
}

export function CommandMetric({ 
  title, 
  value, 
  percent, 
  status, 
  icon: Icon, 
  onClick 
}: CommandMetricProps) {
  const statusColor = status === 'danger' ? 'red' : status === 'warning' ? 'yellow' : 'green';
  const HeatIcon = status === 'danger' ? Zap : status === 'warning' ? Activity : CheckCircle2;
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative p-5 rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl group transition-all h-full flex flex-col justify-between overflow-hidden",
        onClick ? "cursor-pointer hover:bg-slate-950 hover:border-white/10 active:scale-95 shadow-lg shadow-black/40" : ""
      )}
    >
      {/* Subtle Background Glow */}
      <div className={cn(
        "absolute -top-10 -right-10 w-24 h-24 blur-[80px] opacity-10 transition-opacity group-hover:opacity-20",
        status === 'danger' ? "bg-red-500" : status === 'warning' ? "bg-yellow-500" : "bg-emerald-500"
      )} />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={cn(
          "p-2.5 rounded-2xl transition-transform group-hover:scale-110 duration-500",
          status === 'danger' ? "bg-red-500/10 text-red-400" : status === 'warning' ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400"
        )}>
          <HeatIcon className={cn("w-5 h-5", status === 'danger' && "animate-pulse")} />
        </div>
        <ProgressCircle percent={percent} size={44} strokeWidth={4} color={statusColor as any} status={status} />
      </div>
      
      <div className="relative z-10">
        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5">{title}</p>
        <div className="flex items-baseline lg:items-center justify-between gap-2 flex-wrap">
           <h4 className="text-xl lg:text-2xl font-black text-white leading-none truncate max-w-[70%]">{value}</h4>
           <span className={cn(
             "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0 border",
             status === 'danger' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
             status === 'warning' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : 
             "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
           )}>
             {status === 'danger' ? 'High Heat' : status === 'warning' ? 'Rising' : 'Stable'}
           </span>
        </div>
      </div>
    </div>
  );
}
