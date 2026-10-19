import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { buildStockBalance, OVERALL_UNIT } from '../../utils/stockBalance';
import './StockBalanceView.css';

const amount = value => value.toLocaleString('en-US', { maximumFractionDigits: 3 });
const dateLabel = timestamp => new Date(timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const DAY = 86400000;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function StockBalanceView({ items = [], movementHistory = [], branchId, unit = OVERALL_UNIT, days = 7,
  historyReady = true, historyError = false, isExpanded = false, view, onViewChange, onOpenPoint }) {
  const [localView, setLocalView] = useState({ visibleDays: days, panDays: 0, yZoom: 1, quantityFloor: 0, fittedScale: null });
  const { visibleDays, panDays, yZoom, quantityFloor, fittedScale } = view || localView;
  const update = next => onViewChange ? onViewChange(next) : setLocalView(previous => ({ ...previous, ...next }));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hover, setHover] = useState(null);
  const [size, setSize] = useState({ width: 820, height: 320 });
  const [dragging, setDragging] = useState(false);
  const plotRef = useRef(null), dragRef = useRef(null), wheelRef = useRef(null), suppressClick = useRef(false);
  const clipId = `balance-${useId().replace(/:/g, '')}`;
  const balanceUnit = unit === OVERALL_UNIT ? 'mixed units' : unit;
  // Reconstruct the full ledger before cropping, retaining the carried balance
  // when browsing older dates instead of treating today's stock as past stock.
  const data = useMemo(() => buildStockBalance({ items, movements: movementHistory, branchId, unit, days: 'ALL' }), [items, movementHistory, branchId, unit]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const historyDays = Math.max(0, (today.getTime() - data.points[0].timestamp) / DAY);
  const maxPan = Math.max(0, historyDays - (visibleDays - 1));
  const boundedPan = clamp(panDays, 0, maxPan);
  const end = today.getTime() + DAY - boundedPan * DAY;
  const start = end - visibleDays * DAY;
  const activities = data.points.filter(point => point.entry);
  let opening = data.points[0].balance, closing = opening;
  for (const point of activities) {
    if (point.timestamp < start) opening = point.balance;
    if (point.timestamp <= end) closing = point.balance;
  }
  const visible = activities.filter(point => point.timestamp >= start && point.timestamp <= end);
  // Multiple inventory edits on one day are one plotted reading, preventing
  // each transaction from adding another sharp spike to the overall graph.
  const daily = [];
  for (const activity of visible) {
    const date = new Date(activity.timestamp);
    date.setHours(0, 0, 0, 0);
    const previous = daily[daily.length - 1];
    if (previous?.date === date.getTime()) {
      previous.balance = activity.balance;
      previous.timestamp = activity.timestamp;
      previous.entries.push(activity.entry);
    } else {
      daily.push({ date: date.getTime(), timestamp: activity.timestamp, balance: activity.balance, entries: [activity.entry] });
    }
  }
  let priorBalance = opening;
  const dailyPoints = daily.map(day => {
    const delta = day.balance - priorBalance;
    priorBalance = day.balance;
    return { timestamp: day.timestamp, balance: day.balance, delta,
      unit: unit === OVERALL_UNIT ? 'mixed units' : unit,
      label: `${day.entries.length} ${day.entries.length === 1 ? 'stock movement' : 'stock movements'}` };
  });
  const points = [{ timestamp: start, balance: opening, delta: 0, label: 'Starting balance' }, ...dailyPoints,
    { timestamp: Math.min(end, Date.now()), balance: closing, delta: 0, label: 'Ending balance' }];
  const width = size.width, height = isExpanded ? size.height : 320;
  const left = 46, right = 28, top = 22, bottom = 36;
  const plotWidth = Math.max(100, width - left - right), plotHeight = Math.max(60, height - top - bottom);
  // Scale to the selected window so the movements being reviewed remain
  // visible, even when older stock history contains much larger balances.
  const minimum = Math.min(...points.map(point => point.balance));
  const maximum = Math.max(...points.map(point => point.balance));
  const span = (fittedScale || Math.max(1, (maximum - minimum) * 1.12)) / yZoom;
  const floor = minimum + quantityFloor;
  const coordinates = points.map(point => ({ ...point,
    x: left + (point.timestamp - start) / (end - start) * plotWidth,
    y: top + (1 - (point.balance - floor) / span) * plotHeight }));
  // Connect readings on neighboring days to form the stock trend. For a long
  // inactive gap, hold the balance flat and make the climb on the restock day.
  let path = coordinates.length ? `M ${coordinates[0].x} ${coordinates[0].y}` : '';
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1], point = coordinates[index];
    const previousDay = new Date(previous.timestamp); previousDay.setHours(0, 0, 0, 0);
    const pointDay = new Date(point.timestamp); pointDay.setHours(0, 0, 0, 0);
    const gapDays = Math.round((pointDay.getTime() - previousDay.getTime()) / DAY);
    if (gapDays > 1 && point.label !== 'Ending balance') {
      const beforeMovementX = point.x - plotWidth / (end - start) * DAY;
      path += ` H ${Math.max(previous.x, beforeMovementX)} L ${point.x} ${point.y}`;
    } else path += ` L ${point.x} ${point.y}`;
  }
  const selected = coordinates[clamp(hover?.index ?? selectedIndex ?? coordinates.length - 1, 0, coordinates.length - 1)];
  const ready = historyReady && !historyError;
  const reset = () => { update({ visibleDays: days, panDays: 0, yZoom: 1, quantityFloor: 0, fittedScale: null }); setSelectedIndex(null); setHover(null); };
  const zoom = (factor, anchor = 0.5) => {
    const nextDays = clamp(visibleDays * factor, 3, 365);
    update({ visibleDays: nextDays, panDays: clamp(boundedPan + (visibleDays - nextDays) * (1 - anchor), 0, Math.max(0, historyDays - (nextDays - 1))) });
    setSelectedIndex(null);
    setHover(null);
  };
  useEffect(() => {
    if (!ready || !plotRef.current) return undefined;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect?.width > 0) setSize({ width: Math.max(280, Math.round(rect.width)), height: Math.max(240, Math.floor(rect.height || 320)) });
    });
    observer.observe(plotRef.current);
    return () => observer.disconnect();
  }, [ready, isExpanded]);
  wheelRef.current = event => {
    event.preventDefault();
    if (dragRef.current) return;
    setHover(null);
    const x = event.clientX - plotRef.current.getBoundingClientRect().left;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
    const factor = Math.exp(clamp(delta, -100, 100) * 0.0015);
    if (x < left) update({ yZoom: clamp(yZoom / factor, 0.2, 20) });
    else zoom(factor, clamp((x - left) / plotWidth, 0, 1));
  };
  useEffect(() => {
    const element = plotRef.current;
    if (!element) return undefined;
    const wheel = event => wheelRef.current(event);
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [ready]);
  const openPoint = point => {
    setSelectedIndex(coordinates.indexOf(point));
    const date = new Date(point.timestamp).toDateString();
    onOpenPoint?.(point, activities.filter(entry => new Date(entry.timestamp).toDateString() === date).map(entry => entry.entry));
  };
  const finishDrag = event => {
    const drag = dragRef.current;
    if (!drag) return;
    const moved = Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 5;
    suppressClick.current = moved || event.type !== 'pointerup';
    if (!moved && event.type === 'pointerup' && drag.point) { openPoint(drag.point); suppressClick.current = true; }
    dragRef.current = null; setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <section className="stock-balance-view" aria-label="Overall stock balance">
    {!ready ? <p className="stock-balance-message" role="status">{historyError ? 'Stock history could not be loaded. Refresh to try again.' : 'Loading stock history…'}</p> : <>
      <div className="stock-sub-bar"><div className="stock-metric-chips">
        <div className="metric-chip"><span className="metric-chip-label">Current stock:</span><strong className="metric-chip-val" data-testid="stock-balance-current">{amount(data.current)} <small>{balanceUnit}</small></strong></div>
        <div className="metric-chip"><span className="metric-chip-label">Starting balance:</span><strong className="metric-chip-val">{amount(opening)}</strong></div>
        <div className={`metric-chip chip-net ${closing >= opening ? 'is-positive' : 'is-negative'}`}><span className="metric-chip-label">Change in period:</span><strong className="metric-chip-val">{closing >= opening ? '+' : ''}{amount(closing - opening)}</strong></div>
      </div><span className="stock-balance-footnote">Drag to pan · Scroll to zoom · Drag axes to stretch</span></div>
      <div className={`stock-chart-viewport stock-balance-plot${dragging ? ' is-dragging' : ''}`} ref={plotRef}
        role="region" aria-label="Interactive overall stock chart" tabIndex={0} onDoubleClick={reset}
        onPointerLeave={() => setHover(null)} onBlur={() => setHover(null)}
        onKeyDown={event => {
          if (event.target !== event.currentTarget) return;
          if (['+', '=', '-', 'ArrowLeft', 'ArrowRight', 'Home', '0'].includes(event.key)) event.preventDefault();
          if (event.key === '+' || event.key === '=') zoom(1 / 1.2);
          if (event.key === '-') zoom(1.2);
          if (event.key === 'ArrowLeft') update({ panDays: clamp(boundedPan + Math.max(1, visibleDays / 5), 0, maxPan) });
          if (event.key === 'ArrowRight') update({ panDays: clamp(boundedPan - Math.max(1, visibleDays / 5), 0, maxPan) });
          if (event.key === 'Home') update({ panDays: 0 });
          if (event.key === '0') reset();
        }}
        onPointerDown={event => {
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          setHover(null);
          const rect = event.currentTarget.getBoundingClientRect(), target = event.target.closest?.('[data-balance-point]');
          suppressClick.current = false;
          dragRef.current = { x: event.clientX, y: event.clientY, pan: boundedPan, days: visibleDays, zoom: yZoom, floor: quantityFloor, span,
            point: target ? coordinates[Number(target.dataset.balancePoint)] : null,
            axis: event.clientX - rect.left < left ? 'quantity' : event.clientY - rect.top > height - bottom ? 'date' : 'plot' };
          event.currentTarget.setPointerCapture?.(event.pointerId); setDragging(true);
        }}
        onPointerMove={event => {
          const drag = dragRef.current;
          if (!drag) {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left) * width / (rect.width || width);
            const y = (event.clientY - rect.top) * height / (rect.height || height);
            if (x < left || x > width - right || y < top || y > height - bottom) { setHover(null); return; }
            // Hover shows the balance already reached at this time, never a
            // future restock just because its point is closer to the cursor.
            let index = 0;
            coordinates.forEach((point, candidate) => {
              if (point.x <= x) index = candidate;
            });
            setHover({ x, y, index });
            return;
          }
          if (drag.axis === 'quantity') update({ yZoom: clamp(drag.zoom * Math.exp((drag.y - event.clientY) * 0.008), 0.2, 20) });
          else if (drag.axis === 'date') update({ visibleDays: clamp(drag.days * Math.exp((drag.x - event.clientX) * 0.006), 3, 365) });
          else update({ panDays: clamp(drag.pan + (event.clientX - drag.x) / plotWidth * drag.days, 0, maxPan), quantityFloor: Math.max(0, drag.floor + (event.clientY - drag.y) / plotHeight * drag.span) });
        }} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={() => { dragRef.current = null; setDragging(false); }}>
        <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`Stock balance line chart in ${balanceUnit}`}>
          <defs><clipPath id={clipId}><rect x={left} y={top} width={plotWidth} height={plotHeight} /></clipPath></defs>
          {[0, 1, 2, 3, 4].map(index => {
            const value = floor + span * index / 4, y = top + (1 - index / 4) * plotHeight;
            return <g key={index}><line x1={left} x2={width - right} y1={y} y2={y} className="stock-balance-grid" /><text x={left - 8} y={y + 4} textAnchor="end">{amount(value)}</text></g>;
          })}
          <g clipPath={`url(#${clipId})`}>
            <path d={path} className="stock-balance-line" data-series="stock-balance" data-testid="stock-balance-line" />
            {coordinates.map((point, index) => point.y >= top && point.y <= height - bottom ? <g key={index} role="button" tabIndex={0} data-balance-point={index}
              aria-label={`${point.label}: ${amount(point.balance)} ${balanceUnit}, ${dateLabel(point.timestamp)}`}
              onMouseEnter={() => { if (!dragRef.current) setSelectedIndex(index); }} onFocus={() => setSelectedIndex(index)}
              onClick={() => { if (!suppressClick.current) openPoint(point); suppressClick.current = false; }}
              onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); openPoint(point); } }}>
              <title>{`${dateLabel(point.timestamp)} · ${point.label} · ${amount(point.balance)} ${balanceUnit}`}</title>
              <circle cx={point.x} cy={point.y} r="10" fill="transparent" />
              <circle cx={point.x} cy={point.y} r={selected === point ? 5 : 3.5} className="stock-balance-dot" />
            </g> : null)}
            {hover && !dragging && <g className="stock-hover-guide stock-balance-hover" data-testid="stock-balance-hover" pointerEvents="none">
              <line data-testid="stock-balance-hover-vertical" x1={hover.x} x2={hover.x} y1={top} y2={height - bottom} className="stock-crosshair" />
              <line data-testid="stock-balance-hover-horizontal" x1={left} x2={width - right} y1={hover.y} y2={hover.y} className="stock-crosshair" />
            </g>}
          </g>
          {[0, 0.25, 0.5, 0.75, 1].map(fraction => <text key={fraction} x={left + fraction * plotWidth} y={height - 12}
            textAnchor={fraction === 0 ? 'start' : fraction === 1 ? 'end' : 'middle'}>
            {new Date(start + fraction * (end - start)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>)}
        </svg>
      </div>
      <div className="stock-chart-toolbar">
        <div className="stock-chart-details stock-balance-detail" data-testid="stock-balance-detail" aria-live="polite">
          <span><strong>{selected.label}</strong> · {dateLabel(selected.timestamp)}</span>
          <span>{selected.delta ? `${selected.delta > 0 ? '+' : ''}${amount(selected.delta)} ${selected.unit || balanceUnit} → ` : ''}<strong>{amount(selected.balance)} {balanceUnit}</strong></span>
        </div>
        <div role="group" aria-label="Chart navigation">
          <button type="button" aria-label="Zoom out" onClick={() => zoom(1.2)}>−</button>
          <button type="button" aria-label="Zoom in" onClick={() => zoom(1 / 1.2)}>+</button>
          <button type="button" onClick={() => update({ yZoom: 1, quantityFloor: Math.min(...points.map(point => point.balance)) - minimum, fittedScale: Math.max(1, Math.max(...points.map(point => point.balance)) - Math.min(...points.map(point => point.balance))) * 1.12 })}>Auto scale</button>
          <button type="button" onClick={() => { update({ panDays: 0 }); setSelectedIndex(null); }}>Latest</button>
          <button type="button" onClick={reset}>Reset</button>
        </div>
      </div>
      <p className="stock-balance-footnote">{visible.length ? `${visible.length} stock movements · Select a dot to open this date's movement details.` : 'No stock movements in this period. The balance stays unchanged.'}</p>
    </>}
  </section>;
}
