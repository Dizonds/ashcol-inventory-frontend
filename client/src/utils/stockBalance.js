const round = value => Math.round((value + Number.EPSILON) * 1000) / 1000;
export const OVERALL_UNIT = 'OVERALL';

export function buildStockBalance({ items = [], movements = [], branchId, unit, days = 30, now = new Date() }) {
  const scopedItems = items.filter(item => !item.branchId || item.branchId === branchId);
  const catalog = new Map(scopedItems.filter(item => item.id || item._id).map(item => [String(item.id || item._id), item]));
  const bySku = new Map(scopedItems.filter(item => item.sku).map(item => [item.sku, item]));
  const unitOf = entry => entry.unitOfMeasure || catalog.get(String(entry.productId))?.unitOfMeasure || bySku.get(entry.sku)?.unitOfMeasure || 'UNIT';
  const matchesUnit = entry => unit === OVERALL_UNIT || unitOf(entry) === unit;
  const scoped = movements.filter(entry => entry.branchId === branchId);
  const units = [...new Set([...scopedItems.map(unitOf), ...scoped.map(unitOf)])].sort();
  const current = round(scopedItems.filter(matchesUnit)
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0));
  const activity = scoped.map(entry => ({ ...entry, timestamp: new Date(entry.createdAt || `${entry.date}T00:00:00`).getTime() }))
    .filter(entry => matchesUnit(entry) && Number.isFinite(entry.timestamp) && entry.timestamp <= now.getTime() && Number.isFinite(entry.quantityDelta) && entry.quantityDelta !== 0)
    .sort((a, b) => a.timestamp - b.timestamp || String(a.id || a._id || '').localeCompare(String(b.id || b._id || '')));
  const start = new Date(days === 'ALL' && activity.length ? activity[0].timestamp : now);
  start.setHours(0, 0, 0, 0);
  if (days !== 'ALL') start.setDate(start.getDate() - (days - 1));
  const visible = activity.filter(entry => entry.timestamp >= start.getTime());
  // Anchor history to today's actual stock, retaining any pre-existing balance.
  // Summing movement deltas from zero would misstate imported inventory.
  const opening = round(current - visible.reduce((sum, entry) => sum + entry.quantityDelta, 0));
  let balance = opening;
  const points = [{ timestamp: start.getTime(), balance, delta: 0, label: 'Starting balance' }];
  for (const entry of visible) {
    balance = round(balance + entry.quantityDelta);
    points.push({ timestamp: entry.timestamp, balance, delta: entry.quantityDelta, unit: unitOf(entry), label: entry.itemName || entry.sku || 'Stock movement', entry });
  }
  if (!visible.length) points.push({ timestamp: now.getTime(), balance: current, delta: 0, label: 'Current stock' });
  return { units, current, opening, change: round(current - opening), points, activityCount: visible.length };
}
