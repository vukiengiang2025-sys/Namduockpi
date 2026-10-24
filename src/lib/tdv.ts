import {
  calc15DaysKPI,
  calcCoverageKPI,
  calcSalesKPI,
  calcSKUKPI,
  calcTotalKPI,
  DEFAULT_WEIGHTS,
  type KPIWeights,
} from './kpi';

export type CustomerTier = 'A' | 'B' | 'C';
export type TdvTaskType = 'coverage' | 'sales' | 'sku' | 'other';
export type TdvPriority = 'high' | 'medium' | 'low';
export type TdvFocus = 'sales' | 'coverage' | 'sku' | 'month15Days' | 'maintain';

export interface TdvCustomer {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  routeId?: string;
  tier?: CustomerTier;
  potential?: number;
  lastVisitAt?: string;
  lastOrderAt?: string;
  mtdSales?: number;
  mtdOrders?: number;
  skuCount?: number;
  debt?: number;
  status?: 'active' | 'inactive' | 'new';
  promoEligible?: boolean;
  visitFrequencyDays?: number;
}

export interface TdvOrderLine {
  productId: string;
  quantity: number;
  price?: number;
}

export interface TdvOrder {
  id: string;
  customerId: string;
  date: string;
  total: number;
  lines?: TdvOrderLine[];
}

export interface TdvProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  promo?: boolean;
  margin?: number;
  category?: string;
}

export interface TdvRoute {
  id: string;
  name: string;
  customerIds?: string[];
}

export interface TdvTargets {
  sales: number;
  coverage: number;
  sku: number;
  sales15Days?: number;
}

export interface TdvProfile {
  id: string;
  name: string;
  region?: string;
  depot?: { lat: number; lng: number; name?: string };
  preferredHours?: { morning: number; afternoon: number };
}

export interface TdvDataset {
  version: 1;
  generatedAt: string;
  month: number;
  year: number;
  asOfDate?: string;
  profile: TdvProfile;
  targets: TdvTargets;
  customers: TdvCustomer[];
  orders: TdvOrder[];
  products: TdvProduct[];
  routes: TdvRoute[];
  weights?: Partial<KPIWeights>;
  skuTiers?: { threshold: number; score: number }[];
}

export interface TdvMetrics {
  salesActual: number;
  salesTarget: number;
  sales15DaysActual: number;
  coverageActual: number;
  coverageTarget: number;
  skuActual: number;
  skuTarget: number;
  salesKPI: number;
  coverageKPI: number;
  month15DaysKPI: number;
  skuKPI: number;
  totalKPI: number;
  salesRatio: number;
  coverageRatio: number;
  skuRatio: number;
  totalRatio: number;
  daysInMonth: number;
  daysElapsed: number;
  remainingDays: number;
  timeElapsedRatio: number;
  avgDailySales: number;
  projectedSales: number;
  projectedSalesRatio: number;
  requiredDailySales: number;
  requiredDailyCoverage: number;
  salesStatus: 'danger' | 'warning' | 'success';
  coverageStatus: 'danger' | 'warning' | 'success';
  skuStatus: 'danger' | 'warning' | 'success';
}

export interface CustomerInsight {
  customer: TdvCustomer;
  score: number;
  priority: TdvPriority;
  activeThisMonth: boolean;
  mtdSales: number;
  daysSinceVisit: number;
  reasons: string[];
  action: string;
  impact: string;
}

export interface RouteStop {
  sequence: number;
  customer: TdvCustomer;
  score: number;
  priority: TdvPriority;
  eta: string;
  distanceKm: number;
  reason: string;
  action: string;
}

export interface TdvTask {
  text: string;
  target?: number;
  priority: TdvPriority;
  expectedImpact: string;
  confidence: number;
  type: TdvTaskType;
}

export interface TdvPersonalization {
  persona: string;
  focus: TdvFocus;
  focusLabel: string;
  message: string;
  bestTime: string;
  topProduct?: TdvProduct;
  coaching: string;
}

export interface TdvInsights {
  metrics: TdvMetrics;
  customers: CustomerInsight[];
  route: RouteStop[];
  tasks: TdvTask[];
  personalization: TdvPersonalization;
  focusGaps: Record<TdvFocus, number>;
  warnings: string[];
}

const DAY = 86400000;
const DEFAULT_FREQUENCY_DAYS = 14;
const DEFAULT_VISIT_CAPACITY = 8;
const SERVICE_MINUTES = 20;
const TRAVEL_SPEED_KMH = 25;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const raw = value.trim().replace(/[^\d.,-]/g, '');
    if (!raw) return fallback;
    let normalized = raw;
    if (raw.includes('.') && raw.includes(',')) {
      normalized = raw.lastIndexOf(',') > raw.lastIndexOf('.')
        ? raw.replace(/\./g, '').replace(',', '.')
        : raw.replace(/,/g, '');
    } else if (raw.includes('.')) {
      normalized = /^-?\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replace(/\./g, '') : raw;
    } else if (raw.includes(',')) {
      normalized = /^-?\d{1,3}(,\d{3})+$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.');
    }
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export function parseDate(value?: string | number | Date | null): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const trimmed = String(value).trim();
  const vietnamese = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (vietnamese) {
    const date = new Date(Number(vietnamese[3]), Number(vietnamese[2]) - 1, Number(vietnamese[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const daysBetween = (later: Date, earlier: Date) => Math.max(0, Math.floor((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / DAY));

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(value)) + 'đ';
}

export function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000_000) return `${round(value / 1_000_000_000, 2)} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${round(value / 1_000_000, 1)} tr`;
  if (Math.abs(value) >= 1_000) return `${round(value / 1_000, 0)}k`;
  return formatCurrency(value);
}

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = Math.round(minutes % 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radius = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function normalizeTier(value: unknown): CustomerTier {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'A' || raw === '1' || raw === 'VIP') return 'A';
  if (raw === 'C' || raw === '3') return 'C';
  return 'B';
}

function getStatus(actual: number, target: number, baseRatio: number): 'danger' | 'warning' | 'success' {
  if (target <= 0) return 'success';
  const ratio = actual / target;
  if (ratio >= baseRatio) return 'success';
  if (ratio >= baseRatio * 0.8) return 'warning';
  return 'danger';
}

function getOrderLines(order: TdvOrder) {
  return Array.isArray(order.lines) ? order.lines : [];
}

function collectSkuByCustomer(orders: TdvOrder[]) {
  const map = new Map<string, Set<string>>();
  for (const order of orders) {
    if (!order.customerId) continue;
    const set = map.get(order.customerId) ?? new Set<string>();
    for (const line of getOrderLines(order)) {
      if (line.productId) set.add(String(line.productId));
    }
    map.set(order.customerId, set);
  }
  return map;
}

export function buildTdvInsights(dataset: TdvDataset, now = new Date()): TdvInsights {
  const warnings: string[] = [];
  const weights: KPIWeights = { ...DEFAULT_WEIGHTS, ...(dataset.weights ?? {}) };
  const monthIndex = clamp(Math.round(dataset.month || now.getMonth() + 1), 1, 12) - 1;
  const year = dataset.year || now.getFullYear();
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const nowInMonth = now >= monthStart && now <= monthEnd;
  const requestedAsOf = parseDate(dataset.asOfDate);
  const asOf = requestedAsOf && requestedAsOf >= monthStart
    ? (requestedAsOf > monthEnd ? monthEnd : requestedAsOf)
    : (nowInMonth ? now : monthEnd);
  const daysInMonth = monthEnd.getDate();
  const daysElapsed = clamp(asOf.getDate(), 1, daysInMonth);
  const remainingDays = Math.max(0, daysInMonth - daysElapsed);

  if (!dataset.targets.sales || !dataset.targets.coverage) {
    warnings.push('Chưa có đủ chỉ tiêu doanh số/độ phủ. Hãy bổ sung để dự báo chính xác.');
  }
  if (!dataset.customers.length) warnings.push('Chưa có danh sách khách hàng.');
  if (!dataset.orders.length) warnings.push('Chưa có đơn hàng trong kỳ. Đang dùng dữ liệu khách hàng để gợi ý.');

  const ordersInMonth = dataset.orders.filter(order => {
    const date = parseDate(order.date);
    return date && date >= monthStart && date <= asOf;
  });
  const orders15 = ordersInMonth.filter(order => {
    const date = parseDate(order.date);
    return date && date.getDate() <= 15;
  });

  const salesActual = ordersInMonth.reduce((sum, order) => sum + toNumber(order.total), 0);
  const sales15DaysActual = orders15.reduce((sum, order) => sum + toNumber(order.total), 0);
  const activeCustomerIds = new Set(ordersInMonth.map(order => String(order.customerId)).filter(Boolean));
  const coverageActual = activeCustomerIds.size;
  const skuByCustomer = collectSkuByCustomer(ordersInMonth);
  const skuActual = skuByCustomer.size
    ? average([...skuByCustomer.values()].map(set => set.size))
    : average(dataset.customers.map(customer => toNumber(customer.skuCount)));

  const salesKPI = calcSalesKPI(salesActual, dataset.targets.sales, weights);
  const coverageKPI = calcCoverageKPI(coverageActual, dataset.targets.coverage, weights);
  const month15DaysKPI = calc15DaysKPI(sales15DaysActual, dataset.targets.sales);
  const skuKPI = calcSKUKPI(skuActual, dataset.skuTiers);
  const totalKPI = calcTotalKPI({
    salesActual,
    salesTarget: dataset.targets.sales,
    coverageActual,
    coverageTarget: dataset.targets.coverage,
    sales15DaysActual,
    skuActual,
    customPoints: 0,
  }, weights, dataset.skuTiers);

  const salesRatio = dataset.targets.sales > 0 ? (salesActual / dataset.targets.sales) * 100 : 0;
  const coverageRatio = dataset.targets.coverage > 0 ? (coverageActual / dataset.targets.coverage) * 100 : 0;
  const skuRatio = dataset.targets.sku > 0 ? (skuActual / dataset.targets.sku) * 100 : 0;
  const skuMax = Math.max(7.5, ...(dataset.skuTiers ?? []).map(tier => tier.score));
  const maxKPI = weights.sales * 1.875 + weights.coverage * 1.5 + skuMax + weights.month15Days;
  const totalRatio = maxKPI > 0 ? (totalKPI / maxKPI) * 100 : 0;
  const timeElapsedRatio = (daysElapsed / daysInMonth) * 100;
  const avgDailySales = salesActual / Math.max(1, daysElapsed);
  const projectedSales = nowInMonth ? salesActual + avgDailySales * remainingDays : salesActual;
  const projectedSalesRatio = dataset.targets.sales > 0 ? (projectedSales / dataset.targets.sales) * 100 : 0;
  const requiredDailySales = remainingDays > 0 ? Math.max(0, dataset.targets.sales - salesActual) / remainingDays : 0;
  const requiredDailyCoverage = remainingDays > 0 ? Math.max(0, dataset.targets.coverage - coverageActual) / remainingDays : 0;

  const metrics: TdvMetrics = {
    salesActual,
    salesTarget: dataset.targets.sales,
    sales15DaysActual,
    coverageActual,
    coverageTarget: dataset.targets.coverage,
    skuActual,
    skuTarget: dataset.targets.sku,
    salesKPI,
    coverageKPI,
    month15DaysKPI,
    skuKPI,
    totalKPI,
    salesRatio,
    coverageRatio,
    skuRatio,
    totalRatio,
    daysInMonth,
    daysElapsed,
    remainingDays,
    timeElapsedRatio,
    avgDailySales,
    projectedSales,
    projectedSalesRatio,
    requiredDailySales,
    requiredDailyCoverage,
    salesStatus: getStatus(salesActual, dataset.targets.sales, timeElapsedRatio / 100),
    coverageStatus: getStatus(coverageActual, dataset.targets.coverage, timeElapsedRatio / 100),
    skuStatus: getStatus(skuActual, dataset.targets.sku, 1),
  };

  const focusGaps: Record<TdvFocus, number> = {
    sales: Math.max(0, weights.sales - salesKPI),
    coverage: Math.max(0, weights.coverage - coverageKPI),
    month15Days: Math.max(0, weights.month15Days - month15DaysKPI),
    sku: Math.max(0, weights.sku - skuKPI),
    maintain: 0,
  };
  const focus = (Object.entries(focusGaps) as [TdvFocus, number][])
    .filter(([key]) => key !== 'maintain')
    .sort((a, b) => b[1] - a[1])[0];
  const focusKey: TdvFocus = focus && focus[1] > 0 ? focus[0] : 'maintain';

  const ordersByCustomer = new Map<string, { sales: number; lastOrder?: Date; orders: number }>();
  for (const order of ordersInMonth) {
    const id = String(order.customerId);
    const current = ordersByCustomer.get(id) ?? { sales: 0, orders: 0 };
    const date = parseDate(order.date) ?? undefined;
    current.sales += toNumber(order.total);
    current.orders += 1;
    if (date && (!current.lastOrder || date > current.lastOrder)) current.lastOrder = date;
    ordersByCustomer.set(id, current);
  }

  const maxPotential = Math.max(1, ...dataset.customers.map(customer => toNumber(customer.potential, ordersByCustomer.get(customer.id)?.sales ?? 0)));
  const customerInsights: CustomerInsight[] = dataset.customers.map(customer => {
    const orderInfo = ordersByCustomer.get(customer.id);
    const activeThisMonth = Boolean(orderInfo);
    const mtdSales = toNumber(customer.mtdSales, orderInfo?.sales ?? 0);
    const potential = toNumber(customer.potential, Math.max(mtdSales, 0));
    const lastOrder = parseDate(customer.lastOrderAt) ?? orderInfo?.lastOrder ?? null;
    const lastVisit = parseDate(customer.lastVisitAt) ?? lastOrder;
    const daysSinceVisit = lastVisit ? daysBetween(asOf, lastVisit) : 60;
    const frequency = Math.max(1, toNumber(customer.visitFrequencyDays, DEFAULT_FREQUENCY_DAYS));
    const recencyPressure = clamp((daysSinceVisit - frequency) / frequency, 0, 1);
    const coverageGap = activeThisMonth ? 0.15 : 1;
    const tierWeight = customer.tier === 'A' ? 1 : customer.tier === 'C' ? 0.45 : 0.72;
    const potentialNorm = clamp(potential / maxPotential, 0, 1);
    const debtPenalty = toNumber(customer.debt) > 0
      ? clamp(toNumber(customer.debt) / Math.max(1, mtdSales * 2 + 1), 0, 0.35)
      : 0;
    const promoBoost = customer.promoEligible ? 0.08 : 0;
    const score = clamp(100 * (0.34 * potentialNorm + 0.24 * coverageGap + 0.16 * recencyPressure + 0.16 * tierWeight + promoBoost - debtPenalty), 0, 100);
    const skuCount = toNumber(customer.skuCount, skuByCustomer.get(customer.id)?.size ?? 0);
    const reasons: string[] = [];
    if (!activeThisMonth) reasons.push('Chưa phát sinh đơn trong tháng');
    if (daysSinceVisit > frequency) reasons.push(`${daysSinceVisit} ngày chưa ghé`);
    if (skuCount > 0 && skuCount < 3) reasons.push(`Mới bán ${skuCount} SKU`);
    if (toNumber(customer.debt) > 0) reasons.push(`Công nợ ${formatCompactCurrency(toNumber(customer.debt))}`);
    if (customer.promoEligible) reasons.push('Có CTKM phù hợp');
    if (!reasons.length) reasons.push('Khách hàng đang đúng nhịp chăm sóc');

    let action = 'Duy trì chăm sóc và kiểm tra tồn kho';
    let impact = 'Duy trì độ phủ';
    if (!activeThisMonth) {
      action = 'Ghé thăm, kiểm tra tồn kho và chốt đơn đầu tháng';
      impact = 'Mở rộng độ phủ';
    } else if (skuCount > 0 && skuCount < 3) {
      action = 'Tư vấn thêm SKU trọng tâm theo nhu cầu';
      impact = 'Tăng điểm SKU';
    } else if (potential > 0 && mtdSales < potential * 0.6) {
      action = 'Khai thác doanh số từ nhóm sản phẩm chủ lực';
      impact = 'Thu hẹp gap doanh số';
    } else if (customer.promoEligible) {
      action = 'Áp dụng chương trình khuyến mại đang chạy';
      impact = 'Tăng doanh số/đơn';
    } else if (toNumber(customer.debt) > 0) {
      action = 'Đối chiếu công nợ và thu trong lần ghé';
      impact = 'Giảm rủi ro công nợ';
    }

    return {
      customer,
      score: round(score, 0),
      priority: (score >= 72 ? 'high' : score >= 48 ? 'medium' : 'low') as TdvPriority,
      activeThisMonth,
      mtdSales,
      daysSinceVisit,
      reasons,
      action,
      impact,
    };
  }).sort((a, b) => b.score - a.score);

  const visitCapacity = clamp(Math.max(4, Math.ceil(requiredDailyCoverage)), 1, DEFAULT_VISIT_CAPACITY);
  const route = buildRoute(dataset, customerInsights.slice(0, visitCapacity), visitCapacity);
  const tasks = buildTasks(dataset, metrics, customerInsights, route, focusKey);
  const personalization = buildPersonalization(dataset, metrics, customerInsights, focusKey);

  return {
    metrics,
    customers: customerInsights,
    route,
    tasks,
    personalization,
    focusGaps,
    warnings,
  };
}

function buildRoute(dataset: TdvDataset, customers: CustomerInsight[], capacity: number): RouteStop[] {
  if (!customers.length) return [];
  const withCoords = customers.filter(item => Number.isFinite(item.customer.lat) && Number.isFinite(item.customer.lng));
  const ordered: CustomerInsight[] = [];
  const pool = [...customers];
  const depot = dataset.profile.depot;
  let current = depot && Number.isFinite(depot.lat) && Number.isFinite(depot.lng)
    ? { lat: depot.lat, lng: depot.lng }
    : withCoords[0]?.customer
      ? { lat: withCoords[0].customer.lat as number, lng: withCoords[0].customer.lng as number }
      : null;

  while (pool.length && ordered.length < capacity) {
    let bestIndex = 0;
    if (current) {
      let bestCost = Number.POSITIVE_INFINITY;
      pool.forEach((item, index) => {
        if (!Number.isFinite(item.customer.lat) || !Number.isFinite(item.customer.lng)) return;
        const distance = haversineKm(current as { lat: number; lng: number }, { lat: item.customer.lat as number, lng: item.customer.lng as number });
        const cost = distance * (1.35 - (item.score / 100) * 0.55);
        if (cost < bestCost) {
          bestCost = cost;
          bestIndex = index;
        }
      });
    }
    const [next] = pool.splice(bestIndex, 1);
    ordered.push(next);
    if (Number.isFinite(next.customer.lat) && Number.isFinite(next.customer.lng)) {
      current = { lat: next.customer.lat as number, lng: next.customer.lng as number };
    }
  }

  let cursor = 8 * 60;
  let previous = depot && Number.isFinite(depot.lat) && Number.isFinite(depot.lng)
    ? { lat: depot.lat, lng: depot.lng }
    : null;
  return ordered.map((item, index) => {
    const point = Number.isFinite(item.customer.lat) && Number.isFinite(item.customer.lng)
      ? { lat: item.customer.lat as number, lng: item.customer.lng as number }
      : null;
    const distanceKm = previous && point ? haversineKm(previous, point) : 0;
    const travelMinutes = distanceKm > 0 ? (distanceKm / TRAVEL_SPEED_KMH) * 60 + 5 : 0;
    cursor += travelMinutes;
    const eta = formatTime(cursor);
    cursor += SERVICE_MINUTES;
    if (point) previous = point;
    return {
      sequence: index + 1,
      customer: item.customer,
      score: item.score,
      priority: item.priority,
      eta,
      distanceKm: round(distanceKm, 1),
      reason: item.reasons[0],
      action: item.action,
    };
  });
}

function buildTasks(dataset: TdvDataset, metrics: TdvMetrics, customers: CustomerInsight[], route: RouteStop[], focus: TdvFocus): TdvTask[] {
  const tasks: TdvTask[] = [];
  const confidence = dataset.orders.length && dataset.customers.length ? 0.9 : 0.62;
  const salesGap = Math.max(0, metrics.salesTarget - metrics.salesActual);
  const coverageGap = Math.max(0, metrics.coverageTarget - metrics.coverageActual);
  const visitTarget = Math.max(4, Math.min(DEFAULT_VISIT_CAPACITY, Math.ceil(metrics.requiredDailyCoverage) || route.length || 1));

  if (salesGap > 0) {
    tasks.push({
      text: `Hoàn thành ${formatCompactCurrency(metrics.requiredDailySales)} doanh số hôm nay`,
      target: Math.max(1, Math.round(metrics.requiredDailySales / 1_000_000)),
      priority: focus === 'sales' ? 'high' : 'medium',
      expectedImpact: `Bù ${formatCompactCurrency(salesGap)} còn thiếu`,
      confidence,
      type: 'sales',
    });
  }
  if (coverageGap > 0 || focus === 'coverage') {
    tasks.push({
      text: `Ghé thăm ${visitTarget} khách hàng ưu tiên trong tuyến hôm nay`,
      target: visitTarget,
      priority: focus === 'coverage' ? 'high' : 'medium',
      expectedImpact: `Cần thêm ${Math.ceil(coverageGap)} lượt phủ`,
      confidence,
      type: 'coverage',
    });
  }
  if (focus === 'sku' || metrics.skuRatio < 100) {
    const skuTarget = Math.max(1, Math.ceil(visitTarget / 2));
    tasks.push({
      text: `Tư vấn thêm SKU trọng tâm cho ${skuTarget} khách hàng`,
      target: skuTarget,
      priority: focus === 'sku' ? 'high' : 'low',
      expectedImpact: `Nâng SKU bình quân lên ${round(dataset.targets.sku, 1)}`,
      confidence: confidence - 0.08,
      type: 'sku',
    });
  }
  const top = route[0] ?? customers[0];
  if (top) {
    tasks.push({
      text: `${top.action} tại ${top.customer.name}`,
      target: 1,
      priority: top.priority,
      expectedImpact: 'impact' in top ? top.impact : 'Ưu tiên tuyến hôm nay',
      confidence: Math.min(confidence, top.priority === 'high' ? 0.94 : 0.78),
      type: 'other',
    });
  }
  return tasks.slice(0, 4);
}

function buildPersonalization(dataset: TdvDataset, metrics: TdvMetrics, customers: CustomerInsight[], focus: TdvFocus): TdvPersonalization {
  const labels: Record<TdvFocus, string> = {
    sales: 'Tăng tốc doanh số',
    coverage: 'Mở rộng độ phủ',
    sku: 'Đa dạng hóa SKU',
    month15Days: 'Giữ nhịp 15 ngày',
    maintain: 'Duy trì phong độ',
  };
  const personas: Record<TdvFocus, string> = {
    sales: 'TDV tăng tốc',
    coverage: 'TDV mở phủ',
    sku: 'TDV đa dạng SKU',
    month15Days: 'TDV giữ nhịp',
    maintain: 'TDV dẫn đầu',
  };
  const top = customers[0];
  const bestTime = (dataset.profile.preferredHours?.morning ?? 1) >= (dataset.profile.preferredHours?.afternoon ?? 1)
    ? 'Buổi sáng (ưu tiên 8:00–11:30)'
    : 'Buổi chiều (ưu tiên 13:30–17:00)';
  const product = dataset.products
    .filter(item => item.stock > 0)
    .sort((a, b) => Number(Boolean(b.promo)) - Number(Boolean(a.promo)) || (b.margin ?? 0) - (a.margin ?? 0))[0];
  const message = metrics.remainingDays > 0
    ? `Còn ${metrics.remainingDays} ngày, cần ${formatCompactCurrency(metrics.requiredDailySales)}/ngày và thêm ${Math.ceil(Math.max(0, metrics.coverageTarget - metrics.coverageActual))} lượt phủ. Ưu tiên ${top?.customer.name ?? 'khách hàng trọng tâm'} và ${labels[focus].toLowerCase()}.`
    : `Kỳ đã kết thúc với ${round(metrics.totalKPI, 1)} điểm. Tập trung chốt dữ liệu và chuẩn bị kế hoạch kỳ sau.`;
  const coaching = focus === 'sales'
    ? 'Dùng đơn hàng nhanh cho nhóm sản phẩm chủ lực, chốt thêm combo tại mỗi điểm ghé.'
    : focus === 'coverage'
      ? 'Đi theo tuyến đã tối ưu, không bỏ điểm chưa phát sinh đơn trong tháng.'
      : focus === 'sku'
        ? 'Mỗi điểm ghé mang theo 2 SKU bổ trợ phù hợp, kiểm tra tồn kho trước khi tư vấn.'
        : 'Giữ nhịp chăm sóc đều, cập nhật thực tế ngay sau mỗi lần ghé.';

  return {
    persona: personas[focus],
    focus,
    focusLabel: labels[focus],
    message,
    bestTime,
    topProduct: product,
    coaching,
  };
}

export interface SalesUpImportResult {
  dataset: TdvDataset;
  warnings: string[];
}

export function normalizeSalesUpData(raw: unknown): SalesUpImportResult {
  const warnings: string[] = [];
  const input = (raw ?? {}) as Record<string, any>;
  const source = input.dataset && typeof input.dataset === 'object' ? input.dataset as Record<string, any> : input;
  const now = new Date();
  const customersRaw = source.customers ?? source.KHACHHANG ?? source.khachhang ?? [];
  const ordersRaw = source.orders ?? source.U_DONHANG ?? source.donhang ?? [];
  const linesRaw = source.orderLines ?? source.U_DONHANG_SP ?? source.order_lines ?? [];
  const productsRaw = source.products ?? source.SANPHAM ?? source.sanpham ?? [];
  const routesRaw = source.routes ?? source.TUYENBANHANG ?? source.tuyenbanhang ?? [];
  const customerRoutesRaw = source.customerRoutes ?? source.KHACHHANG_TUYENBANHANG ?? [];
  const targetsRaw = source.targets ?? source.kpi ?? source.chiTieu ?? {};
  const profileRaw = source.profile ?? source.user ?? source.tdv ?? {};

  if (!Array.isArray(customersRaw)) warnings.push('Không tìm thấy mảng khách hàng.');
  if (!Array.isArray(ordersRaw)) warnings.push('Không tìm thấy mảng đơn hàng.');

  const routeByCustomer = new Map<string, string>();
  for (const link of Array.isArray(customerRoutesRaw) ? customerRoutesRaw : []) {
    const customerId = String(link.KHACHHANG_FK ?? link.customerId ?? link.customer_id ?? '');
    const routeId = String(link.TBH_FK ?? link.routeId ?? link.route_id ?? '');
    if (customerId && routeId) routeByCustomer.set(customerId, routeId);
  }

  const products: TdvProduct[] = (Array.isArray(productsRaw) ? productsRaw : []).map((item: any, index: number) => ({
    id: String(item.id ?? item.PK_SEQ ?? item.ma ?? index),
    sku: String(item.sku ?? item.MA ?? item.ma ?? `SKU-${index + 1}`),
    name: String(item.name ?? item.TEN ?? item.ten ?? `Sản phẩm ${index + 1}`),
    price: toNumber(item.price ?? item.DONGIA ?? item.dongia),
    stock: toNumber(item.stock ?? item.SOLUONG1 ?? item.soluong1 ?? item.AVAILABLE ?? item.available),
    promo: Boolean(item.promo ?? item.promoEligible ?? item.CTKM),
    margin: toNumber(item.margin ?? item.CHIETKHAU ?? item.chietkhau),
    category: item.category ?? item.NHOMSP ?? item.nhomsp,
  }));

  const linesByOrder = new Map<string, TdvOrderLine[]>();
  for (const line of Array.isArray(linesRaw) ? linesRaw : []) {
    const orderId = String(line.DONHANG_FK ?? line.orderId ?? line.order_id ?? '');
    if (!orderId) continue;
    const list = linesByOrder.get(orderId) ?? [];
    list.push({
      productId: String(line.SANPHAM_FK ?? line.productId ?? line.product_id ?? ''),
      quantity: toNumber(line.SOLUONG ?? line.quantity ?? line.qty),
      price: toNumber(line.DONGIA ?? line.price),
    });
    linesByOrder.set(orderId, list);
  }

  const orders: TdvOrder[] = (Array.isArray(ordersRaw) ? ordersRaw : []).map((item: any, index: number) => {
    const id = String(item.id ?? item.PK_SEQ ?? item.orderId ?? index);
    return {
      id,
      customerId: String(item.customerId ?? item.KHACHHANG_FK ?? item.khachhang_fk ?? ''),
      date: String(item.date ?? item.NGAYNHAP ?? item.ngaynhap ?? item.NGAY ?? item.ngay ?? ''),
      total: toNumber(item.total ?? item.TONGGIATRI ?? item.tonggiatri),
      lines: Array.isArray(item.lines) ? item.lines : linesByOrder.get(id),
    };
  });

  const customers: TdvCustomer[] = (Array.isArray(customersRaw) ? customersRaw : []).map((item: any, index: number) => {
    const id = String(item.id ?? item.PK_SEQ ?? item.customerId ?? index);
    return {
      id,
      name: String(item.name ?? item.TEN ?? item.ten ?? `Khách hàng ${index + 1}`),
      address: item.address ?? item.DIACHI ?? item.diachi,
      phone: item.phone ?? item.DIENTHOAI ?? item.dienthoai,
      lat: (() => { const value = item.lat ?? item.LAT; const parsed = value == null || value === '' ? NaN : toNumber(value, NaN); return Number.isFinite(parsed) ? parsed : undefined; })(),
      lng: (() => { const value = item.lng ?? item.LON; const parsed = value == null || value === '' ? NaN : toNumber(value, NaN); return Number.isFinite(parsed) ? parsed : undefined; })(),
      routeId: String(item.routeId ?? item.TBH_FK ?? routeByCustomer.get(id) ?? ''),
      tier: normalizeTier(item.tier ?? item.loaiNPP ?? item.LOAINPP),
      potential: toNumber(item.potential ?? item.doanhSoTiemNang ?? item.DOANHSOTIEMNANG, 0),
      lastVisitAt: item.lastVisitAt ?? item.NGAY,
      lastOrderAt: item.lastOrderAt,
      mtdSales: toNumber(item.mtdSales ?? item.doanhSo ?? item.DOANHSO, 0),
      mtdOrders: toNumber(item.mtdOrders ?? item.soDon ?? item.SODON, 0),
      skuCount: toNumber(item.skuCount ?? item.soSKU ?? item.SOSKU, 0),
      debt: toNumber(item.debt ?? item.congNo ?? item.CONGNO, 0),
      status: item.status,
      promoEligible: Boolean(item.promoEligible ?? item.CTKM),
      visitFrequencyDays: toNumber(item.visitFrequencyDays ?? item.TANSO, 0) || undefined,
    };
  });

  const routes: TdvRoute[] = (Array.isArray(routesRaw) ? routesRaw : []).map((item: any, index: number) => ({
    id: String(item.id ?? item.PK_SEQ ?? index),
    name: String(item.name ?? item.DIENGIAI ?? item.diengiai ?? `Tuyến ${index + 1}`),
  }));

  const targets: TdvTargets = {
    sales: toNumber(targetsRaw.sales ?? targetsRaw.salesTarget ?? targetsRaw.doanhSo ?? targetsRaw.DOANHSO),
    coverage: toNumber(targetsRaw.coverage ?? targetsRaw.coverageTarget ?? targetsRaw.doPhu ?? targetsRaw.DOPHU),
    sku: toNumber(targetsRaw.sku ?? targetsRaw.skuTarget ?? targetsRaw.SKU ?? 4.7),
    sales15Days: toNumber(targetsRaw.sales15Days ?? targetsRaw.sales15DaysTarget ?? targetsRaw.doanhSo15Ngay, 0),
  };
  if (!targets.sku) targets.sku = 4.7;

  const dataset: TdvDataset = {
    version: 1,
    generatedAt: String(source.generatedAt ?? now.toISOString()),
    month: clamp(toNumber(source.month, now.getMonth() + 1), 1, 12),
    year: toNumber(source.year, now.getFullYear()),
    asOfDate: source.asOfDate,
    profile: {
      id: String(profileRaw.id ?? profileRaw.DANGNHAP ?? 'tdv'),
      name: String(profileRaw.name ?? profileRaw.ten ?? profileRaw.TEN ?? 'Trình dược viên'),
      region: profileRaw.region ?? profileRaw.khuVuc,
      depot: profileRaw.depot,
      preferredHours: profileRaw.preferredHours,
    },
    targets,
    customers,
    orders,
    products,
    routes,
    weights: source.weights ?? source.kpiWeights,
    skuTiers: source.skuTiers,
  };

  if (!dataset.customers.length) warnings.push('Dữ liệu khách hàng trống.');
  if (!dataset.orders.length) warnings.push('Dữ liệu đơn hàng trống.');
  return { dataset, warnings };
}

export function parseTdvJson(text: string): SalesUpImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('File JSON không hợp lệ.');
  }
  return normalizeSalesUpData(raw);
}

export function createSampleDataset(now = new Date()): TdvDataset {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const day = Math.max(8, Math.min(now.getDate(), 26));
  const date = (d: number) => new Date(year, month - 1, Math.min(d, day)).toISOString();
  const customerSeed = [
    ['KH001', 'Nhà thuốc An Khang', '12 Hàng Bài, Hoàn Kiếm', 21.0253, 105.8521, 'A', 180000000, 2, 6, 0, true, 7],
    ['KH002', 'Nhà thuốc Tâm An', '45 Nguyễn Trãi, Thanh Xuân', 20.9951, 105.8143, 'A', 150000000, 18, 4, 12000000, false, 10],
    ['KH003', 'Quầy thuốc Minh Châu', '88 Lê Văn Lương, Cầu Giấy', 21.0107, 105.8012, 'B', 95000000, 5, 2, 0, true, 14],
    ['KH004', 'Nhà thuốc Hồng Phát', '23 Trần Duy Hưng, Cầu Giấy', 21.0128, 105.7986, 'B', 72000000, 22, 1, 0, false, 14],
    ['KH005', 'Nhà thuốc Đức Thành', '9 Kim Mã, Ba Đình', 21.0311, 105.8242, 'A', 210000000, 3, 7, 0, true, 7],
    ['KH006', 'Quầy thuốc Bình Minh', '56 Đội Cấn, Ba Đình', 21.0354, 105.8238, 'C', 42000000, 35, 0, 0, false, 21],
    ['KH007', 'Nhà thuốc Phương Nam', '101 Nguyễn Lương Bằng, Đống Đa', 21.0186, 105.8311, 'B', 110000000, 9, 3, 4000000, true, 14],
    ['KH008', 'Nhà thuốc Thịnh Vượng', '17 Tây Sơn, Đống Đa', 21.0083, 105.8251, 'C', 36000000, 41, 0, 0, false, 21],
    ['KH009', 'Nhà thuốc Vạn Xuân', '72 Giải Phóng, Hai Bà Trưng', 20.9948, 105.8414, 'B', 86000000, 12, 2, 0, false, 14],
    ['KH010', 'Quầy thuốc Sao Mai', '31 Đại La, Hai Bà Trưng', 20.9982, 105.8469, 'C', 51000000, 28, 1, 0, true, 21],
  ] as const;

  const customers: TdvCustomer[] = customerSeed.map(([id, name, address, lat, lng, tier, potential, daysSince, skuCount, debt, promo, frequency]) => ({
    id,
    name,
    address,
    lat,
    lng,
    tier: tier as CustomerTier,
    potential,
    lastVisitAt: new Date(now.getTime() - Number(daysSince) * DAY).toISOString(),
    skuCount: Number(skuCount),
    debt: Number(debt),
    promoEligible: Boolean(promo),
    visitFrequencyDays: Number(frequency),
    status: Number(daysSince) > 30 ? 'inactive' : 'active',
  }));

  const products: TdvProduct[] = [
    { id: 'SP01', sku: 'ND-TP01', name: 'Trà thảo mộc Nam Dược', price: 85000, stock: 240, promo: true, margin: 24, category: 'Thảo dược' },
    { id: 'SP02', sku: 'ND-VC02', name: 'Vitamin C Nam Dược', price: 120000, stock: 180, promo: false, margin: 31, category: 'Vitamin' },
    { id: 'SP03', sku: 'ND-CX03', name: 'Cao xoa bóp Nam Dược', price: 95000, stock: 96, promo: true, margin: 28, category: 'Chăm sóc' },
    { id: 'SP04', sku: 'ND-GN04', name: 'Gối thảo dược Nam Dược', price: 210000, stock: 42, promo: false, margin: 22, category: 'Thiết bị' },
    { id: 'SP05', sku: 'ND-ĐH05', name: 'Đông trùng hạ thảo', price: 420000, stock: 28, promo: true, margin: 35, category: 'Bổ sung' },
    { id: 'SP06', sku: 'ND-TA06', name: 'Trà Atiso Nam Dược', price: 72000, stock: 310, promo: false, margin: 19, category: 'Thảo dược' },
  ];

  const orderSeed: [string, number, number, string[]][] = [
    ['KH001', 3, 14200000, ['SP01', 'SP02', 'SP03', 'SP05']],
    ['KH001', 11, 9800000, ['SP01', 'SP02', 'SP05']],
    ['KH002', 2, 7600000, ['SP02', 'SP03']],
    ['KH002', 13, 12400000, ['SP01', 'SP02', 'SP03', 'SP06']],
    ['KH003', 5, 4200000, ['SP01', 'SP06']],
    ['KH005', 4, 16500000, ['SP01', 'SP02', 'SP03', 'SP04', 'SP05']],
    ['KH005', 15, 11200000, ['SP01', 'SP02', 'SP05']],
    ['KH007', 7, 6800000, ['SP02', 'SP03', 'SP06']],
    ['KH009', 8, 5100000, ['SP01', 'SP02']],
    ['KH010', 12, 3300000, ['SP06']],
    ['KH004', 16, 2800000, ['SP01']],
    ['KH006', 17, 1900000, ['SP06']],
  ];

  const orders: TdvOrder[] = orderSeed.map(([customerId, orderDay, total, skuIds], index) => ({
    id: `DH${String(index + 1).padStart(3, '0')}`,
    customerId,
    date: date(orderDay),
    total,
    lines: skuIds.map((productId, lineIndex) => ({
      productId,
      quantity: 2 + lineIndex,
      price: products.find(product => product.id === productId)?.price ?? 0,
    })),
  }));

  return {
    version: 1,
    generatedAt: now.toISOString(),
    month,
    year,
    asOfDate: date(day),
    profile: {
      id: 'TDV-001',
      name: 'Nguyễn Minh Anh',
      region: 'Hà Nội',
      depot: { lat: 21.0278, lng: 105.8342, name: 'Kho Nam Dược Hà Nội' },
      preferredHours: { morning: 1.25, afternoon: 0.85 },
    },
    targets: {
      sales: 120000000,
      coverage: 18,
      sku: 4.7,
      sales15Days: 60000000,
    },
    customers,
    orders,
    products,
    routes: [
      { id: 'T01', name: 'Tuyến Hoàn Kiếm – Ba Đình' },
      { id: 'T02', name: 'Tuyến Đống Đa – Thanh Xuân' },
      { id: 'T03', name: 'Tuyến Hai Bà Trưng' },
    ],
    weights: { sales: 80, coverage: 10, month15Days: 5, sku: 7.5 },
  };
}
