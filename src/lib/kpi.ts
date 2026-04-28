import { useAppStore } from '../store';

function getWeights() {
  const settings = useAppStore.getState().settings;
  return settings.kpiWeights || { sales: 80, coverage: 10, month15Days: 5, sku: 7.5 };
}

function getRules() {
  const settings = useAppStore.getState().settings;
  return settings.kpiRules || {
    salesThreshold: 0.8,
    salesMaxMultiplier: 1.875, // 150/80
    coverageThreshold: 0.8,
    coverageMaxMultiplier: 1.5,
    month15DaysTargetRatio: 0.55,
    month15DaysThreshold: 0.8,
    month15DaysMaxMultiplier: 1.3636, // 7.5/5.5
    skuTable: [
      { min: 4.7, scoreMult: 1 },
      { min: 4.5, scoreMult: 0.933 },
      { min: 4.3, scoreMult: 0.866 },
      { min: 4.1, scoreMult: 0.8 },
      { min: 3.9, scoreMult: 0.733 },
      { min: 3.7, scoreMult: 0.666 },
      { min: 3.5, scoreMult: 0.6 },
      { min: 3.3, scoreMult: 0.533 },
      { min: 3.1, scoreMult: 0.466 },
    ]
  };
}

export function calcSalesKPI(actual: number, target: number): number {
  if (!target || target <= 0) return 0;
  const weights = getWeights();
  const rules = getRules();
  const ratio = actual / target;
  
  if (ratio < rules.salesThreshold) return 0;
  
  const p = ratio * weights.sales;
  const max = weights.sales * rules.salesMaxMultiplier;
  if (p > max) return max;
  return Number(p.toFixed(2));
}

export function calcCoverageKPI(actual: number, target: number, multiplier: number = 1): number {
  if (!target || target <= 0) return 0;
  const weights = getWeights();
  const rules = getRules();
  const baseWeight = weights.coverage; 
  const ratio = actual / target;
  
  if (ratio < rules.coverageThreshold) return 0;
  
  const p = ratio * baseWeight * multiplier;
  const max = baseWeight * multiplier * rules.coverageMaxMultiplier;
  if (p > max) return max;
  return Number(p.toFixed(2));
}

export function calc15DaysSalesKPI(actual15: number, target: number): number {
  if (!target || target <= 0) return 0;
  
  const ratio = actual15 / target;
  
  // Rule: If % progress < 44%, score is 0
  if (ratio < 0.44) return 0;
  
  // Rule: (progress / 55%) * 5
  let score = (ratio / 0.55) * 5;
  
  // Rule: Max is 7.5 points
  if (score > 7.5) score = 7.5;
  
  return Number(score.toFixed(2));
}

export function calcSKUKPI(skuVal: number): number {
  if (!skuVal) return 0;
  const weights = getWeights();
  const rules = getRules();
  
  for (const step of rules.skuTable) {
    if (skuVal >= step.min) {
      return Number((weights.sku * step.scoreMult).toFixed(2));
    }
  }
  
  return 0;
}
