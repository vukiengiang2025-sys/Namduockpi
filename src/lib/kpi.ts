import { useAppStore } from '../store';

function getWeights() {
  const settings = useAppStore.getState().settings;
  return settings.kpiWeights || { sales: 80, coverage: 10, month15Days: 5, sku: 7.5 };
}

export function calcSalesKPI(actual: number, target: number): number {
  if (!target || target <= 0) return 0;
  const weights = getWeights();
  const ratio = actual / target;
  // If the prompt meant "dưới 80 điểm thì bằng 0", we'll check if the point itself is below 80 or ratio < 0.8. Since ratio * 80 < 80 means ratio < 1.0, and coverage explicitly had "dưới 80 điểm" when max was 7.5, we interpret "80" as "80%".
  if (ratio < 0.8) return 0;
  
  const p = ratio * weights.sales;
  if (p > 150) return 150;
  return Number(p.toFixed(2));
}

export function calcCoverageKPI(actual: number, target: number, multiplier: number = 1): number {
  if (!target || target <= 0) return 0;
  const weights = getWeights();
  const baseWeight = weights.coverage; // defaults 10, but in previous code it was 5 for month, let's keep user config
  // Let's assume user sets month weight
  const ratio = actual / target;
  if (ratio < 0.8) return 0;
  // Previously month had max 7.5 (1.5x of 5)
  const p = ratio * baseWeight * multiplier;
  const max = baseWeight * multiplier * 1.5;
  if (p > max) return max;
  return Number(p.toFixed(2));
}

export function calc15DaysSalesKPI(actual15: number, target: number): number {
  if (!target || target <= 0) return 0;
  const weights = getWeights();
  const p = ((actual15 / target) / 0.55) * weights.month15Days;
  if (p < (weights.month15Days * 0.88)) return 0;
  if (p > weights.month15Days * 1.5) return weights.month15Days * 1.5;
  return Number(p.toFixed(2));
}

export function calcSKUKPI(skuVal: number): number {
  if (!skuVal) return 0;
  const weights = getWeights();
  const step = weights.sku / 15; // approximate steps
  
  // Custom logic adapting to dynamic sku weight based on previous standard of 7.5 max
  if (skuVal >= 4.7) return weights.sku;
  if (skuVal >= 4.5) return weights.sku - step * 1;
  if (skuVal >= 4.3) return weights.sku - step * 2;
  if (skuVal >= 4.1) return weights.sku - step * 3;
  if (skuVal >= 3.9) return weights.sku - step * 4;
  if (skuVal >= 3.7) return weights.sku - step * 5;
  if (skuVal >= 3.5) return weights.sku - step * 6;
  if (skuVal >= 3.3) return weights.sku - step * 7;
  if (skuVal >= 3.1) return weights.sku - step * 8;
  return 0;
}
