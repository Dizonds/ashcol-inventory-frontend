import { render, screen, fireEvent, within } from '@testing-library/react';
import StockActivityChart from './StockActivityChart';
import StockBalanceView from './StockBalanceView';

test('Overall is the third activity chart mode with one balance line and shared unit and period controls', () => {
  const now = new Date().toISOString();
  render(<StockActivityChart branchId="LOCAL-WAREHOUSE"
    items={[{ quantity: 12, unitOfMeasure: 'PCS' }, { quantity: 1.125, unitOfMeasure: 'METER' }]}
    movementHistory={[{ branchId: 'LOCAL-WAREHOUSE', createdAt: now, unitOfMeasure: 'PCS', quantityDelta: 12, itemName: 'Capacitor' }]} />);
  expect(screen.queryByRole('heading', { name: 'Overall Stock Balance' })).not.toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('group', { name: 'Chart display type' })).getByRole('button', { name: 'Overall' }));
  fireEvent.change(screen.getByLabelText('Chart unit of measure'), { target: { value: 'PCS' } });
  expect(screen.queryAllByTestId('stock-balance-line')).toHaveLength(1);
  expect(screen.getByTestId('stock-balance-current')).toHaveTextContent('12 PCS');
  fireEvent.focus(screen.getByRole('button', { name: /^Starting balance: 0 PCS/ }));
  expect(screen.queryByTestId('stock-balance-detail')).toHaveTextContent('Starting balance');
  fireEvent.focus(screen.getByRole('button', { name: /^1 stock movement: 12 PCS/ }));
  expect(screen.queryByTestId('stock-balance-detail')).toHaveTextContent('+12 PCS → 12 PCS');
  fireEvent.change(screen.getByLabelText('Chart unit of measure'), { target: { value: 'METER' } });
  expect(screen.getByTestId('stock-balance-current')).toHaveTextContent('1.125 METER');
  expect(screen.getByText(/No stock movements in this period/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '30D', exact: true }));
  expect(screen.getByRole('button', { name: '30D', exact: true })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.change(screen.getByLabelText('Chart unit of measure'), { target: { value: 'OVERALL' } });
  expect(screen.getByTestId('stock-balance-current')).toHaveTextContent('13.125 mixed units');
  expect(screen.queryAllByTestId('stock-balance-line')).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('Chart unit of measure'), { target: { value: 'PCS' } });
  expect(screen.getByTestId('stock-balance-current')).toHaveTextContent('12 PCS');
  fireEvent.click(screen.getByRole('button', { name: 'Bar', exact: true }));
  expect(screen.queryByTestId('stock-balance-line')).toBeNull();
  expect(screen.getByRole('img', { name: 'Stock movement activity trend chart' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Line', exact: true }));
  expect(screen.getByRole('button', { name: 'Line', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('incomplete or failed history does not display a misleading balance line', () => {
  const { rerender } = render(<StockBalanceView historyReady={false} />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading stock history');
  expect(screen.queryByTestId('stock-balance-line')).toBeNull();
  rerender(<StockBalanceView historyError />);
  expect(screen.getByRole('status')).toHaveTextContent('could not be loaded');
});

test('Overall tracks the cursor between movements and clears its indicator outside the plot and during drags', () => {
  render(<StockBalanceView items={[{ quantity: 10 }]} />);
  const plot = screen.getByRole('region', { name: 'Interactive overall stock chart' });
  // The chart can be stretched on screen; pointer positions must map to SVG coordinates.
  plot.getBoundingClientRect = () => ({ left: 100, top: 50, width: 1640, height: 640 });
  const originalPointerEvent = window.PointerEvent;
  window.PointerEvent = MouseEvent;
  try {
    expect(screen.queryByTestId('stock-balance-hover')).not.toBeInTheDocument();
    fireEvent.pointerMove(plot, { clientX: 700, clientY: 250 });
    const guide = screen.getByTestId('stock-balance-hover');
    expect(guide).toBeInTheDocument();
    expect(within(guide).queryAllByText((_, element) => element.matches('circle'))).toHaveLength(0);
    expect(screen.getByTestId('stock-balance-hover-vertical')).toHaveAttribute('x1', '300');
    expect(screen.getByTestId('stock-balance-hover-horizontal')).toHaveAttribute('y1', '100');
    fireEvent.pointerMove(plot, { clientX: 110, clientY: 250 });
    expect(screen.queryByTestId('stock-balance-hover')).not.toBeInTheDocument();
    fireEvent.pointerMove(plot, { clientX: 800, clientY: 300 });
    expect(screen.getByTestId('stock-balance-hover')).toBeInTheDocument();
    fireEvent.pointerLeave(plot);
    expect(screen.queryByTestId('stock-balance-hover')).not.toBeInTheDocument();
    fireEvent.pointerMove(plot, { clientX: 800, clientY: 300 });
    fireEvent.pointerDown(plot, { clientX: 800, clientY: 300 });
    fireEvent.pointerMove(plot, { clientX: 850, clientY: 300 });
    expect(screen.queryByTestId('stock-balance-hover')).not.toBeInTheDocument();
    fireEvent.pointerUp(plot, { clientX: 850, clientY: 300 });
  } finally { window.PointerEvent = originalPointerEvent; }
});

test('panning into older history carries the historical balance instead of current stock', () => {
  const recent = new Date(), old = new Date(); old.setDate(old.getDate() - 30);
  render(<StockBalanceView branchId="LOCAL-WAREHOUSE" unit="PCS"
    items={[{ quantity: 15, unitOfMeasure: 'PCS' }]}
    movementHistory={[
      { branchId: 'LOCAL-WAREHOUSE', createdAt: old.toISOString(), unitOfMeasure: 'PCS', quantityDelta: 10 },
      { branchId: 'LOCAL-WAREHOUSE', createdAt: recent.toISOString(), unitOfMeasure: 'PCS', quantityDelta: 5 },
    ]} view={{ visibleDays: 7, panDays: 24, yZoom: 1, quantityFloor: 0, fittedScale: null }} />);
  expect(screen.getByTestId('stock-balance-current')).toHaveTextContent('15 PCS');
  expect(screen.queryByTestId('stock-balance-detail')).toHaveTextContent('10 PCS');
  expect(screen.getByText(/1 stock movements/)).toBeInTheDocument();
});

test('Overall stays flat during a long gap and changes only on movement dates', () => {
  const stockOut = new Date(), stockIn = new Date();
  stockOut.setDate(stockOut.getDate() - 50);
  stockIn.setDate(stockIn.getDate() - 1);
  render(<StockBalanceView branchId="LOCAL-WAREHOUSE" unit="PCS" days={90}
    items={[{ quantity: 12, unitOfMeasure: 'PCS' }]}
    movementHistory={[
      { branchId: 'LOCAL-WAREHOUSE', createdAt: stockOut.toISOString(), unitOfMeasure: 'PCS', quantityDelta: -4, itemName: 'Dispatch' },
      { branchId: 'LOCAL-WAREHOUSE', createdAt: stockIn.toISOString(), unitOfMeasure: 'PCS', quantityDelta: 6, itemName: 'Restock' },
    ]} />);
  const path = screen.queryByTestId('stock-balance-line').getAttribute('d');
  expect(path).toMatch(/^M [\d.]+ [\d.]+ H [\d.]+ L [\d.]+ [\d.]+ H [\d.]+ L [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);
  const values = path.match(/[\d.]+/g).map(Number);
  const [, initialY, , outX, outY, , inX, inY, , endY] = values;
  expect(outY).toBeGreaterThan(initialY); // A dispatch drops the stock line.
  expect(inY).toBeLessThan(outY); // Restocking raises it on that date.
  expect(endY).toEqual(inY);
  expect(inX - outX).toBeGreaterThan(300); // The long gap is a horizontal hold.
  const plot = screen.getByRole('region', { name: 'Interactive overall stock chart' });
  plot.getBoundingClientRect = () => ({ left: 0, top: 0, width: 820, height: 320 });
  const originalPointerEvent = window.PointerEvent;
  window.PointerEvent = MouseEvent;
  try {
    fireEvent.pointerMove(plot, { clientX: inX - 20, clientY: 100 });
    expect(screen.queryByTestId('stock-balance-detail')).toHaveTextContent('6 PCS');
    expect(screen.queryByTestId('stock-balance-detail')).toHaveTextContent('1 stock movement');
    expect(screen.getByTestId('stock-balance-hover-horizontal')).toHaveAttribute('y1', '100');
  } finally { window.PointerEvent = originalPointerEvent; }
});
