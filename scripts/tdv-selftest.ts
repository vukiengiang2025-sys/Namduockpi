import assert from 'node:assert/strict';
import { calc15DaysKPI, calcCoverageKPI, calcSalesKPI, calcSKUKPI } from '../src/lib/kpi';
import { buildTdvInsights, createSampleDataset, normalizeSalesUpData } from '../src/lib/tdv';

assert.equal(calcSalesKPI(100, 100), 80);
assert.equal(calcSalesKPI(120, 100), 96);
assert.equal(calcSalesKPI(79, 100), 0);
assert.equal(calcCoverageKPI(100, 100), 10);
assert.equal(calc15DaysKPI(55, 100), 5);
assert.equal(calcSKUKPI(4.7), 7.5);
assert.equal(calcSKUKPI(3.2), 0);

const sample = createSampleDataset();
const insights = buildTdvInsights(sample);
assert.ok(insights.metrics.salesActual > 0, 'sample sales should be positive');
assert.ok(insights.metrics.totalKPI > 0, 'sample KPI should be positive');
assert.ok(insights.route.length >= 4, 'route should contain at least 4 stops');
assert.equal(insights.tasks.length, 4, 'daily plan should contain 4 tasks');
assert.ok(insights.customers[0].score >= insights.customers.at(-1)!.score, 'customers must be sorted by score');
assert.ok(insights.route.every(stop => Number.isFinite(stop.distanceKm)), 'route distance must be finite');
assert.ok(insights.route.every(stop => !Number.isNaN(Date.parse(`1970-01-01T${stop.eta}:00`))), 'ETA must be valid time');
assert.ok(insights.personalization.message.length > 20, 'personalization must be actionable');

const imported = normalizeSalesUpData({
  month: 10,
  year: 2026,
  targets: { sales: 100000000, coverage: 20, sku: 4.7 },
  profile: { name: 'TDV Test', region: 'Hà Nội' },
  KHACHHANG: [
    { PK_SEQ: 'KH1', TEN: 'Nhà thuốc A', DIACHI: 'Hà Nội', LAT: '21.03', LON: '105.85', loaiNPP: 'A' },
    { PK_SEQ: 'KH2', TEN: 'Nhà thuốc B', DIACHI: 'Hà Nội', LAT: '', LON: '' },
  ],
  U_DONHANG: [
    { PK_SEQ: 'DH1', KHACHHANG_FK: 'KH1', NGAYNHAP: '10/10/2026', TONGGIATRI: '50000000' },
  ],
  U_DONHANG_SP: [
    { DONHANG_FK: 'DH1', SANPHAM_FK: 'SP1', SOLUONG: '10' },
    { DONHANG_FK: 'DH1', SANPHAM_FK: 'SP2', SOLUONG: '5' },
  ],
  SANPHAM: [
    { PK_SEQ: 'SP1', MA: 'A1', TEN: 'Sản phẩm 1', DONGIA: '10000', SOLUONG1: '100' },
    { PK_SEQ: 'SP2', MA: 'A2', TEN: 'Sản phẩm 2', DONGIA: '20000', SOLUONG1: '100' },
  ],
});

assert.equal(imported.dataset.customers.length, 2);
assert.equal(imported.dataset.customers[0].lat, 21.03);
assert.equal(imported.dataset.customers[1].lat, undefined);
assert.equal(imported.dataset.orders[0].total, 50000000);
assert.equal(imported.dataset.orders[0].lines?.length, 2);
const importedInsights = buildTdvInsights(imported.dataset, new Date(2026, 9, 12));
assert.equal(importedInsights.metrics.coverageActual, 1);
assert.equal(importedInsights.metrics.skuActual, 2);
assert.ok(importedInsights.metrics.salesActual > 0);

console.log('TDV engine self-test passed');
