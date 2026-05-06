
export interface KPIWeights {
  sales: number;
  coverage: number;
  month15Days: number;
  sku: number;
}

export const DEFAULT_WEIGHTS: KPIWeights = {
  sales: 80,
  coverage: 10,
  month15Days: 5,
  sku: 7.5
};

export function calcSalesKPI(actual: number, target: number, weights: Partial<KPIWeights> = {}) {
  if (!target || target <= 0) return 0;
  const maxPts = weights.sales ?? DEFAULT_WEIGHTS.sales;
  const ratio = actual / target;
  if (ratio < 0.8) return 0;
  // Maximum can reach 150% target points (1.875 * 80 = 150)
  return parseFloat(Math.min(ratio * maxPts, maxPts * 1.875).toFixed(2));
}

export function calcCoverageKPI(actual: number, target: number, weights: Partial<KPIWeights> = {}) {
  if (!target || target <= 0) return 0;
  const maxPts = weights.coverage ?? DEFAULT_WEIGHTS.coverage;
  const ratio = actual / target;
  if (ratio < 0.8) return 0;
  // Maximum can reach 150% target points (1.5 * 10 = 15)
  return parseFloat(Math.min(ratio * maxPts, maxPts * 1.5).toFixed(2));
}

export function calc15DaysKPI(actual15: number, salesTarget: number) {
  if (!salesTarget || salesTarget <= 0) return 0;
  const ratio = actual15 / salesTarget;
  if (ratio < 0.44) return 0;
  // Based on the rule: 55% target gets 5 points, max 7.5 points
  return parseFloat(Math.min((ratio / 0.55) * 5, 7.5).toFixed(2));
}

export function calcSKUKPI(sku: number, tiers?: { threshold: number; score: number }[]) {
  const defaultTiers = [
    { threshold: 4.7, score: 7.5 },
    { threshold: 4.5, score: 7.0 },
    { threshold: 4.3, score: 6.5 },
    { threshold: 4.1, score: 6.0 },
    { threshold: 3.9, score: 5.5 },
    { threshold: 3.7, score: 5.0 },
    { threshold: 3.5, score: 4.5 },
    { threshold: 3.3, score: 4.0 },
  ];
  
  const sortedTiers = [...(tiers || defaultTiers)].sort((a, b) => b.threshold - a.threshold);
  
  for (const tier of sortedTiers) {
    if (sku >= tier.threshold) return tier.score;
  }
  return 0;
}

export function calcTotalKPI(data: any, weights: Partial<KPIWeights> = {}, skuTiers?: { threshold: number; score: number }[]) {
  const s = calcSalesKPI(data.salesActual || 0, data.salesTarget || 0, weights);
  const c = calcCoverageKPI(data.coverageActual || 0, data.coverageTarget || 0, weights);
  const d15 = calc15DaysKPI(data.sales15DaysActual || 0, data.salesTarget || 0);
  const sku = calcSKUKPI(data.skuActual || 0, skuTiers);
  
  return parseFloat((s + c + d15 + sku + (data.customPoints || 0)).toFixed(2));
}

export const MONTHS_VI = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
export const FULL_MONTHS_VI = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
