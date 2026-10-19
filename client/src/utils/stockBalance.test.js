import { buildStockBalance, OVERALL_UNIT } from './stockBalance';

const branchId = 'LOCAL-WAREHOUSE';
const now = new Date(2026, 9, 17, 15);
const movement = (delta, day, extra = {}) => ({ branchId, unitOfMeasure: 'PCS', quantityDelta: delta, createdAt: new Date(2026, 9, day, 10).toISOString(), ...extra });

test('remaining stock rises and falls after each movement, retaining pre-existing inventory', () => {
  const result = buildStockBalance({ branchId, unit: 'PCS', now, days: 7,
    items: [{ quantity: 12, unitOfMeasure: 'PCS' }],
    movements: [movement(-3, 17), movement(10, 1), movement(5, 16)] });
  expect(result.points.map(point => point.balance)).toEqual([10, 15, 12]);
  expect(result.current).toBe(12);
  expect(result.change).toBe(2);
});

test('all-history view includes opening balances without counting receipts in another location or zero-quantity audit rows', () => {
  const result = buildStockBalance({ branchId, unit: 'PCS', now, days: 'ALL',
    items: [{ quantity: 12, unitOfMeasure: 'PCS' }],
    movements: [movement(10, 1), movement(5, 16), movement(-3, 17), movement(3, 17, { branchId: 'VAN-1' }), movement(0, 17)] });
  expect(result.points.map(point => point.balance)).toEqual([0, 10, 15, 12]);
  expect(result.activityCount).toBe(3);
});

test('measured quantities stay separate and legacy movement units resolve from the catalog', () => {
  const result = buildStockBalance({ branchId, unit: 'METER', now,
    items: [{ id: 'pipe', sku: 'PIPE', quantity: 1.125, unitOfMeasure: 'METER' }, { quantity: 200, unitOfMeasure: 'PCS' }],
    movements: [movement(1.25, 16, { productId: 'pipe', unitOfMeasure: undefined }), movement(-0.125, 17, { sku: 'PIPE', unitOfMeasure: undefined }), movement(200, 17)] });
  expect(result.units).toEqual(['METER', 'PCS']);
  expect(result.points.map(point => point.balance)).toEqual([0, 1.25, 1.125]);
});

test('no recent movements produces an unchanged balance rather than a false zero', () => {
  const result = buildStockBalance({ branchId, unit: 'PCS', now, days: 7,
    items: [{ quantity: 40, unitOfMeasure: 'PCS' }], movements: [movement(40, 1)] });
  expect(result.points.map(point => point.balance)).toEqual([40, 40]);
  expect(result.change).toBe(0);
  expect(result.activityCount).toBe(0);
});

test('Overall combines quantities while retaining each movement unit and excluding other locations', () => {
  const result = buildStockBalance({ branchId, unit: OVERALL_UNIT, now, days: 'ALL',
    items: [{ quantity: 12, unitOfMeasure: 'PCS' }, { quantity: 1.125, unitOfMeasure: 'METER' }, { branchId: 'VAN-1', quantity: 99, unitOfMeasure: 'PCS' }],
    movements: [movement(12, 15), movement(1.25, 16, { unitOfMeasure: 'METER' }), movement(-0.125, 17, { unitOfMeasure: 'METER' }), movement(99, 17, { branchId: 'VAN-1' })] });
  expect(result.current).toBe(13.125);
  expect(result.points.map(point => point.balance)).toEqual([0, 12, 13.25, 13.125]);
  expect(result.points.at(-1).unit).toBe('METER');
});
