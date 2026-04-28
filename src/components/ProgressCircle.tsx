import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ProgressCircleProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  status?: "danger" | "warning" | "stable" | "success";
  children?: React.ReactNode;
}

export function ProgressCircle({ 
  percent, 
  size = 60, 
  strokeWidth = 6, 
  color = "blue", 
  status = "stable", 
  children 
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  const colorMap = {
    blue: "stroke-blue-500",
    green: "stroke-emerald-500",
    yellow: "stroke-yellow-500",
    red: "stroke-red-500",
    purple: "stroke-purple-500"
  };

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <motion.div 
        animate={status === 'danger' ? { scale: [1, 1.08, 1], opacity: [0.2, 0.4, 0.2] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn("absolute inset-0 rounded-full blur-xl", status === 'danger' ? "bg-red-500" : " hidden")}
      />
      
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/5"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          className={cn("transition-all duration-1000 ease-out", colorMap[color])}
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {children || <span className="text-[10px] font-black text-white">{Math.round(percent)}%</span>}
      </div>
    </div>
  );
}
