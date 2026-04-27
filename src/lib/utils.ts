import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatPercent(actual: number, target: number) {
  if (!target || target === 0) return "0%";
  return ((actual / target) * 100).toFixed(1) + "%";
}
