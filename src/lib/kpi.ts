export function calcSalesKPI(actual: number, target: number): number {
  if (!target || target <= 0) return 0;
  const ratio = actual / target;
  // If the prompt meant "dưới 80 điểm thì bằng 0", we'll check if the point itself is below 80 or ratio < 0.8. Since ratio * 80 < 80 means ratio < 1.0, and coverage explicitly had "dưới 80 điểm" when max was 7.5, we interpret "80" as "80%".
  if (ratio < 0.8) return 0;
  
  const p = ratio * 80;
  if (p > 150) return 150;
  return Number(p.toFixed(2));
}

export function calcCoverageKPI(actual: number, target: number, weight: number, max: number): number {
  if (!target || target <= 0) return 0;
  const ratio = actual / target;
  if (ratio < 0.8) return 0;
  const p = ratio * weight;
  if (p > max) return max;
  return Number(p.toFixed(2));
}

export function calc15DaysSalesKPI(actual15: number, target: number): number {
  if (!target || target <= 0) return 0;
  const p = ((actual15 / target) / 0.55) * 5;
  if (p < 4.4) return 0;
  if (p > 7.5) return 7.5;
  return Number(p.toFixed(2));
}

export function calcSKUKPI(skuVal: number): number {
  if (!skuVal) return 0;
  if (skuVal >= 4.7) return 7.5;
  if (skuVal >= 4.5) return 7.0;
  if (skuVal >= 4.3) return 6.5;
  if (skuVal >= 4.1) return 6.0;
  if (skuVal >= 3.9) return 5.5;
  if (skuVal >= 3.7) return 5.0;
  if (skuVal >= 3.5) return 4.5;
  if (skuVal >= 3.3) return 4.0;
  if (skuVal >= 3.1) return 3.5;
  return 0;
}
