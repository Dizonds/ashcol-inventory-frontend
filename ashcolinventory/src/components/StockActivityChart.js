import React, { useState, useMemo, useCallback, useRef, useEffect, useId } from "react";
import { Tooltip, Modal, Table } from "antd";
import "./StockActivityChart.css";

// Helper to format Date or date string to YYYY-MM-DD
function toDateKey(value) {
  if (!value) return "";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
}

// Generate smooth cubic Bezier path from a sequence of points
function buildSmoothSpline(points) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) * 0.18;
    const cp1y = p1.y + (p2.y - p0.y) * 0.18;
    const cp2x = p2.x - (p3.x - p1.x) * 0.18;
    const cp2y = p2.y - (p3.y - p1.y) * 0.18;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

// Build closed area path for gradients
function buildAreaPath(points, baselineY) {
  if (!points || points.length === 0) return "";
  const spline = buildSmoothSpline(points);
  const firstX = points[0].x.toFixed(1);
  const lastX = points[points.length - 1].x.toFixed(1);
  return `${spline} L ${lastX} ${baselineY.toFixed(1)} L ${firstX} ${baselineY.toFixed(1)} Z`;
}

// Smart nice tick calculator
function calculateNiceTicks(maxValue, targetTickCount = 5) {
  const max = Math.max(1, maxValue);
  const rawStep = max / (targetTickCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalizedStep = rawStep / magnitude;

  let niceStep = 1;
  if (normalizedStep <= 1) niceStep = 1;
  else if (normalizedStep <= 2) niceStep = 2;
  else if (normalizedStep <= 5) niceStep = 5;
  else niceStep = 10;

  const step = niceStep * magnitude;
  const topTick = Math.ceil(max / step) * step;

  const ticks = [];
  for (let t = 0; t <= topTick; t += step) {
    ticks.push(t);
  }
  return { ticks, maxTick: topTick || step };
}

export default function StockActivityChart({ movementHistory = [], historyReady = true, initialView = null, onViewSave, isExpanded = false, onExpandedChange }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(initialView?.selectedTimeframe ?? 7);
  const [visibleDays, setVisibleDays] = useState(initialView?.visibleDays ?? 7);
  const [panDays, setPanDays] = useState(initialView?.panDays ?? 0);
  const [yZoom, setYZoom] = useState(initialView?.yZoom ?? 1);
  const [quantityFloor, setQuantityFloor] = useState(initialView?.quantityFloor ?? 0);
  const [fittedScale, setFittedScale] = useState(initialView?.fittedScale ?? null);
  const [chartMode, setChartMode] = useState(initialView?.chartMode ?? "area"); // 'area' | 'bar'
  const [showStockIn, setShowStockIn] = useState(initialView?.showStockIn ?? true);
  const [showStockOut, setShowStockOut] = useState(initialView?.showStockOut ?? true);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [hoverY, setHoverY] = useState(null);
  const [hoverX, setHoverX] = useState(null);
  const [containerWidth, setContainerWidth] = useState(820);
  const [containerHeight, setContainerHeight] = useState(420);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const wheelHandlerRef = useRef(null);
  const zoomFrameRef = useRef(null);
  const zoomTargetRef = useRef(null);
  const liveViewRef = useRef({ visibleDays, panDays, yZoom });
  liveViewRef.current = { visibleDays, panDays, yZoom };
  const chartId = useId().replace(/:/g, "");
  const dragRef = useRef(null);
  const savedViewRef = useRef(null);
  savedViewRef.current = {
    selectedTimeframe, visibleDays, panDays, yZoom, quantityFloor,
    fittedScale, chartMode, showStockIn, showStockOut,
  };
  // The app owns this snapshot, so leaving the dashboard does not reset the view.
  // Saving only on departure avoids rerendering the dashboard during each drag.
  useEffect(() => () => {
    onViewSave?.(savedViewRef.current);
  }, [onViewSave]);
  const rangeDays = Math.max(3, Math.ceil(visibleDays));
  const integerPanDays = Math.floor(panDays);
  const panFraction = panDays - integerPanDays;

  // Keep panning bounded by the oldest movement currently available.
  const historyDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const movementDates = movementHistory
      .map((entry) => toDateKey(entry.createdAt || entry.date))
      .filter(Boolean)
      .map((key) => new Date(`${key}T00:00:00`))
      .filter((date) => !isNaN(date.getTime()));

    if (movementDates.length === 0) return 0;
    const oldestDate = new Date(Math.min(...movementDates.map((date) => date.getTime())));
    const availableDays = Math.floor((today - oldestDate) / 86400000);
    return Math.max(0, availableDays);
  }, [movementHistory]);
  const maxPanDays = Math.max(0, historyDays - (visibleDays - 1));

  useEffect(() => {
    if (!historyReady) return;
    setPanDays((current) => Math.min(current, maxPanDays));
  }, [maxPanDays, historyReady]);

  // ResizeObserver for responsive 1:1 pixel rendering
  useEffect(() => {
    if (!viewportRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect && entry.contentRect.width > 0) {
          setContainerWidth(Math.round(entry.contentRect.width));
          if (isExpanded) setContainerHeight(Math.floor(entry.contentRect.height));
        }
      }
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [isExpanded]);

  // Aggregate daily data over the chosen range
  const { seriesData, summaryStats } = useMemo(() => {
    const days = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Extra edge samples keep curves continuous while moving between days.
    for (let i = rangeDays; i >= -1; i--) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - integerPanDays - i
      );
      const key = toDateKey(d);
      days.push({
        date: d,
        key,
        shortLabel:
          rangeDays <= 7
            ? d.toLocaleDateString("en-US", { weekday: "short" })
            : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullLabel: d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        stockIn: 0,
        stockOut: 0,
        movements: [],
      });
    }

    const dayMap = new Map(days.map((item) => [item.key, item]));

    movementHistory.forEach((entry) => {
      const key = toDateKey(entry.createdAt || entry.date);
      const day = dayMap.get(key);
      if (day) {
        const delta = Number(entry.quantityDelta) || 0;
        const type = entry.movementType || "";

        if (delta > 0 || type.toUpperCase() === "STOCK_IN") {
          day.stockIn += Math.abs(delta);
        } else if (delta < 0 || type.toUpperCase() === "STOCK_OUT") {
          day.stockOut += Math.abs(delta);
        }
        day.movements.push(entry);
      }
    });

    const visible = days.slice(1, -1);
    const totalIn = visible.reduce((sum, d) => sum + d.stockIn, 0);
    const totalOut = visible.reduce((sum, d) => sum + d.stockOut, 0);
    const netChange = totalIn - totalOut;
    const activeDaysCount = visible.filter((d) => d.stockIn > 0 || d.stockOut > 0).length;
    const totalTransactions = visible.reduce((sum, d) => sum + d.movements.length, 0);

    return {
      seriesData: days,
      summaryStats: {
        totalIn,
        totalOut,
        netChange,
        activeDaysCount,
        totalTransactions,
      },
    };
  }, [movementHistory, rangeDays, integerPanDays]);

  // Layout parameters for responsive SVG
  const chartHeight = isExpanded ? containerHeight : 320;
  const margin = { top: 22, right: 28, bottom: 36, left: 46 };
  const plotWidth = Math.max(100, containerWidth - margin.left - margin.right);
  const plotHeight = Math.max(60, chartHeight - margin.top - margin.bottom);
  const baselineY = margin.top + plotHeight;
  const dayWidth = plotWidth / Math.max(1, visibleDays - 1);

  // Maximum value for scale
  const rawMax = Math.max(
    1,
    ...seriesData.map((d) => {
      const inVal = showStockIn ? d.stockIn : 0;
      const outVal = showStockOut ? d.stockOut : 0;
      return Math.max(inVal, outVal);
    })
  );

  // Fit each selected preset to its own daily high, then keep that scale stable
  // while navigating so wheel zoom cannot trigger sudden vertical rescaling.
  const timeframeScale = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - selectedTimeframe + 1);
    const startKey = toDateKey(start);
    const endKey = toDateKey(today);
    const totals = new Map();
    movementHistory.forEach((entry) => {
      const key = toDateKey(entry.createdAt || entry.date);
      if (!key || key < startKey || key > endKey) return;
      const day = totals.get(key) || { stockIn: 0, stockOut: 0 };
      const delta = Number(entry.quantityDelta) || 0;
      const type = String(entry.movementType || "").toUpperCase();
      if (delta > 0 || type === "STOCK_IN") day.stockIn += Math.abs(delta);
      else if (delta < 0 || type === "STOCK_OUT") day.stockOut += Math.abs(delta);
      totals.set(key, day);
    });
    let peak = 1;
    totals.forEach((day) => {
      peak = Math.max(peak, showStockIn ? day.stockIn : 0, showStockOut ? day.stockOut : 0);
    });
    return calculateNiceTicks(peak * 1.12).maxTick;
  }, [movementHistory, selectedTimeframe, showStockIn, showStockOut]);
  const autoScale = fittedScale ?? timeframeScale;
  const maxTick = autoScale / yZoom;
  const tickStep = calculateNiceTicks(maxTick, isExpanded ? 6 : 5).ticks[1] || maxTick;
  const firstTick = Math.ceil(quantityFloor / tickStep) * tickStep;
  const ticks = Array.from({ length: Math.ceil(maxTick / tickStep) + 1 }, (_, index) => firstTick + index * tickStep)
    .filter((tick) => tick <= quantityFloor + maxTick);

  const getY = useCallback(
    (val) => baselineY - ((Math.max(0, val) - quantityFloor) / maxTick) * plotHeight,
    [baselineY, maxTick, plotHeight, quantityFloor]
  );

  // Coordinate arrays for lines
  const getPointX = useCallback(
    (idx) =>
      seriesData.length <= 1
        ? margin.left + plotWidth / 2
        : margin.left + plotWidth + (idx - rangeDays + panFraction) * dayWidth,
    [seriesData.length, plotWidth, dayWidth, panFraction, margin.left, rangeDays]
  );

  const pointsStockIn = useMemo(() => {
    return seriesData.map((day, idx) => {
      const x = getPointX(idx);
      const y = getY(day.stockIn);
      return { x, y, val: day.stockIn, day };
    });
  }, [seriesData, getY, getPointX]);

  const pointsStockOut = useMemo(() => {
    return seriesData.map((day, idx) => {
      const x = getPointX(idx);
      const y = getY(day.stockOut);
      return { x, y, val: day.stockOut, day };
    });
  }, [seriesData, getY, getPointX]);

  // Handle pointer tracking
  const handleMouseMove = (e) => {
    if (dragRef.current) return;
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const svgX = (mouseX / rect.width) * containerWidth;

    if (svgX < margin.left || svgX > margin.left + plotWidth || mouseY < margin.top || mouseY > baselineY) {
      setHoverIndex(null);
      setHoverY(null);
      return;
    }

    const closestIdx = Math.min(
      seriesData.length - 1,
      Math.max(0, Math.round((svgX - margin.left - plotWidth) / dayWidth + rangeDays - panFraction))
    );
    setHoverIndex(closestIdx);
    setHoverX(svgX);
    setHoverY(Math.max(margin.top, Math.min(baselineY, mouseY)));
  };

  // Drag the chart horizontally to browse older/newer movement windows.
  const stopZoomAnimation = () => {
    if (zoomFrameRef.current !== null) cancelAnimationFrame(zoomFrameRef.current);
    zoomFrameRef.current = null;
    zoomTargetRef.current = null;
  };

  const handleChartPointerDown = (e) => {
    if (e.target.closest?.("button")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stopZoomAnimation();
    const targetPoint = e.target.closest?.("[data-stock-point]");
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startPan: panDays,
      startY: e.clientY,
      startZoom: yZoom,
      startFloor: quantityFloor,
      quantitySpan: maxTick,
      pointDay: targetPoint ? seriesData[Number(targetPoint.dataset.stockPoint)] : null,
      startDays: visibleDays,
      axis: e.clientX - e.currentTarget.getBoundingClientRect().left < margin.left
        ? "quantity" : e.clientY - e.currentTarget.getBoundingClientRect().top > baselineY ? "date" : "plot",
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    setHoverIndex(null);
    setHoverY(null);
  };

  const handleChartPointerMove = (e) => {
    if (!dragRef.current) return;
    if (dragRef.current.axis === "quantity") {
      setYZoom(Math.max(0.2, Math.min(20, dragRef.current.startZoom * Math.exp((dragRef.current.startY - e.clientY) * 0.008))));
      return;
    }
    if (dragRef.current.axis === "date") {
      setVisibleDays(Math.max(3, Math.min(365, dragRef.current.startDays * Math.exp((dragRef.current.startX - e.clientX) * 0.006))));
      return;
    }
    const draggedDays = (e.clientX - dragRef.current.startX) / dayWidth;
    const nextPan = Math.max(
      0,
      Math.min(maxPanDays, dragRef.current.startPan + draggedDays)
    );
    setPanDays(nextPan);
    // Move the quantity camera without changing the spacing between values.
    // Zero is the lower bound; dragging back down cannot reveal negatives.
    const verticalDrag = (e.clientY - dragRef.current.startY) / plotHeight;
    setQuantityFloor(Math.max(0, dragRef.current.startFloor + verticalDrag * dragRef.current.quantitySpan));
  };

  const handleChartWheel = (e) => {
    e.preventDefault();
    if (dragRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? chartHeight : 1);
    const zoomFactor = Math.exp(Math.max(-100, Math.min(100, delta)) * 0.0015);
    const target = zoomTargetRef.current || { ...liveViewRef.current };
    setHoverIndex(null);
    if (localX < margin.left) {
      target.yZoom = Math.max(0.2, Math.min(20, target.yZoom / zoomFactor));
    } else {
      const nextDays = Math.max(3, Math.min(365, target.visibleDays * zoomFactor));
      const anchor = Math.max(0, Math.min(1, (localX - margin.left) / plotWidth));
      target.panDays = Math.max(0, Math.min(
        Math.max(0, historyDays - (nextDays - 1)),
        target.panDays + (target.visibleDays - nextDays) * (1 - anchor)
      ));
      target.visibleDays = nextDays;
    }
    zoomTargetRef.current = target;
    if (zoomFrameRef.current !== null) return;

    let previousTime = null;
    const animateZoom = (time) => {
      const goal = zoomTargetRef.current;
      if (!goal) { zoomFrameRef.current = null; return; }
      const current = liveViewRef.current;
      const elapsed = previousTime === null ? 16 : Math.min(50, time - previousTime);
      previousTime = time;
      const ease = 1 - Math.exp(-elapsed / 65);
      const next = {
        visibleDays: current.visibleDays + (goal.visibleDays - current.visibleDays) * ease,
        panDays: current.panDays + (goal.panDays - current.panDays) * ease,
        yZoom: current.yZoom + (goal.yZoom - current.yZoom) * ease,
      };
      const finished = Math.abs(next.visibleDays - goal.visibleDays) < 0.0001
        && Math.abs(next.panDays - goal.panDays) < 0.0001
        && Math.abs(next.yZoom - goal.yZoom) < 0.0001;
      const view = finished ? { ...goal } : next;
      liveViewRef.current = view;
      setVisibleDays(view.visibleDays);
      setPanDays(view.panDays);
      setYZoom(view.yZoom);
      if (finished) {
        zoomFrameRef.current = null;
        zoomTargetRef.current = null;
      } else zoomFrameRef.current = requestAnimationFrame(animateZoom);
    };
    zoomFrameRef.current = requestAnimationFrame(animateZoom);
  };

  // A non-passive listener lets chart zoom consume the wheel without scrolling the page.
  wheelHandlerRef.current = handleChartWheel;
  useEffect(() => {
    const viewport = viewportRef.current;
    const onWheel = (event) => wheelHandlerRef.current(event);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", onWheel);
      if (zoomFrameRef.current !== null) cancelAnimationFrame(zoomFrameRef.current);
      zoomFrameRef.current = null;
      zoomTargetRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isExpanded) return;
    if (zoomFrameRef.current !== null) cancelAnimationFrame(zoomFrameRef.current);
    zoomFrameRef.current = null;
    zoomTargetRef.current = null;
    setHoverIndex(null);
    setHoverY(null);
    const onKey = (event) => { if (event.key === "Escape" && !selectedDay) onExpandedChange?.(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [isExpanded, selectedDay, onExpandedChange]);

  const resetView = () => {
    stopZoomAnimation();
    setVisibleDays(selectedTimeframe);
    setPanDays(0);
    setYZoom(1);
    setQuantityFloor(0);
    setFittedScale(null);
    setHoverIndex(null);
  };

  const handleChartPointerEnd = (e) => {
    if (!dragRef.current) return;
    const drag = dragRef.current;
    e.currentTarget.releasePointerCapture?.(drag.pointerId);
    dragRef.current = null;
    setIsDragging(false);
    if (e.type === "pointerup" && drag.pointDay && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 5) {
      setSelectedDay(drag.pointDay);
    }
  };

  const renderPoint = (point, index, direction) => {
    if (point.val <= 0 || point.x < margin.left || point.x > margin.left + plotWidth || point.y < margin.top || point.y > baselineY) return null;
    return (
      <g
        key={`${direction}-point-${point.day.key}`}
        className="stock-point-target"
        data-stock-point={index}
        role="button"
        tabIndex={0}
        aria-label={`View ${direction === "in" ? "Stock In" : "Stock Out"} details for ${point.day.fullLabel}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            stopZoomAnimation();
            setSelectedDay(point.day);
          }
        }}
      >
        <circle cx={point.x} cy={point.y} r="10" fill="transparent" />
        <circle cx={point.x} cy={point.y} r="3.5" fill="#ffffff" stroke={direction === "in" ? "#10b981" : "#f59e0b"} strokeWidth="2" className="stock-dot" />
      </g>
    );
  };

  const movementColumns = [
    { title: "Time", width: 160, render: (_, entry) => entry.createdAt ? new Date(entry.createdAt).toLocaleString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : entry.date || "Not recorded" },
    { title: "SKU / Item", width: 220, render: (_, entry) => <div className="chart-movement-item"><strong>{entry.sku || "No SKU"}</strong><span>{entry.itemName || "Inventory item"}</span></div> },
    { title: "Movement", dataIndex: "movementType", width: 160, render: (value) => String(value || "Movement").replace(/_/g, " ") },
    { title: "Quantity", width: 120, render: (_, entry) => {
      const delta = Number(entry.quantityDelta) || 0;
      return <strong className={delta > 0 ? "chart-movement-in" : delta < 0 ? "chart-movement-out" : ""}>{delta > 0 ? "+" : ""}{delta.toLocaleString()} {entry.unitOfMeasure || "units"}</strong>;
    } },
    { title: "Stock balance", width: 130, render: (_, entry) => entry.beforeQuantity == null || entry.afterQuantity == null ? "Not recorded" : `${entry.beforeQuantity.toLocaleString()} → ${entry.afterQuantity.toLocaleString()}` },
    { title: "Reference / Work order", width: 180, render: (_, entry) => <div className="chart-movement-item"><span>{entry.referenceId || "No reference"}</span>{entry.workOrderId && <span>{entry.workOrderId}</span>}</div> },
    { title: "Processed by", dataIndex: "performedByName", width: 160, render: (value) => value || "Not recorded" },
    { title: "Location", dataIndex: "branchId", width: 150, render: (value) => value === "LOCAL-WAREHOUSE" ? "Taguig Warehouse" : value || "Not recorded" },
    { title: "Remarks", dataIndex: "reason", width: 250, render: (value) => value || "No remarks" },
  ];

  const activeDay = hoverIndex !== null ? seriesData[hoverIndex] : null;
  const detailDay = activeDay || seriesData[seriesData.length - 2];
  const activeStockInPoint = hoverIndex !== null ? pointsStockIn[hoverIndex] : null;
  const activeStockOutPoint = hoverIndex !== null ? pointsStockOut[hoverIndex] : null;

  // Determine label step for X axis so dates do not crowd
  const labelStep = Math.max(1, Math.ceil(80 / dayWidth));

  return (
    <div
      className={`stock-activity-card ${isExpanded ? "is-expanded" : ""}`}
      ref={containerRef}
    >
      {/* 1. CARD HEADER */}
      <div className="stock-card-header">
        <div className="stock-header-left">
          <div className="stock-header-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 19V5M3 19H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 14L11 9L15 12L20 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 6H20V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="stock-title-wrap">
            <div className="stock-title-row">
              <h2 className="stock-card-title">Stock In & Stock Out Activity</h2>
              <Tooltip title="Daily inbound inventory restocks vs outbound dispatches and net balance.">
                <span className="stock-info-icon" tabIndex={0} aria-label="More info">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M12 16V12M12 8H12.01"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </Tooltip>
            </div>
            <span className="stock-card-subtitle">
              Daily movement flow & velocity for Taguig warehouse
            </span>
          </div>
        </div>

        <div className="stock-header-controls">
          {/* Chart Type Toggle */}
          <div className="stock-mode-toggle" role="group" aria-label="Chart display type">
            <button
              type="button"
              className={chartMode === "area" ? "active" : ""}
              onClick={() => setChartMode("area")}
              title="Smooth Line & Area View"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 18C8 10 12 14 21 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>Curve</span>
            </button>
            <button
              type="button"
              className={chartMode === "bar" ? "active" : ""}
              onClick={() => setChartMode("bar")}
              title="Grouped Column Bars View"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="9" width="4" height="12" rx="1" fill="currentColor" />
                <rect x="11" y="4" width="4" height="17" rx="1" fill="currentColor" />
                <rect x="18" y="12" width="4" height="9" rx="1" fill="currentColor" />
              </svg>
              <span>Bars</span>
            </button>
          </div>

          {/* Date Range Selector */}
          <div className="stock-range-pill" role="group" aria-label="Date range selector">
            {[7, 14, 30, 90].map((days) => (
              <button
                type="button"
                key={days}
                className={selectedTimeframe === days ? "active" : ""}
                aria-pressed={selectedTimeframe === days}
                onClick={() => {
                  stopZoomAnimation();
                  setSelectedTimeframe(days);
                  setVisibleDays(days);
                  setYZoom(1);
                  setQuantityFloor(0);
                  setFittedScale(null);
                  setPanDays(0);
                  setHoverIndex(null);
                  setHoverY(null);
                }}
              >
                {days === 90 ? "3M" : `${days}D`}
              </button>
            ))}
          </div>

          {/* Expand / minimize the chart within the dashboard layout. */}
          <button
            type="button"
            className="stock-fullscreen-btn"
            onClick={() => onExpandedChange?.(!isExpanded)}
            aria-expanded={isExpanded}
            title={isExpanded ? "Minimize chart" : "Expand chart"}
            aria-label={isExpanded ? "Minimize chart" : "Expand chart"}
          >
            {isExpanded ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 14H10M10 14V20M10 14L3 21M20 10H14M14 10V4M14 10L21 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 3H21M21 3V9M21 3L14 10M9 21H3M3 21V15M3 21L10 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {isExpanded && <span>Minimize</span>}
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC PILLS & LEGEND */}
      <div className="stock-sub-bar">
        <div className="stock-metric-chips">
          <div className="metric-chip chip-stock-in">
            <span className="metric-chip-icon">↓</span>
            <span className="metric-chip-label">Stock In:</span>
            <strong className="metric-chip-val">
              +{summaryStats.totalIn.toLocaleString()}
            </strong>
          </div>

          <div className="metric-chip chip-stock-out">
            <span className="metric-chip-icon">↑</span>
            <span className="metric-chip-label">Stock Out:</span>
            <strong className="metric-chip-val">
              -{summaryStats.totalOut.toLocaleString()}
            </strong>
          </div>

          <div
            className={`metric-chip chip-net ${
              summaryStats.netChange >= 0 ? "is-positive" : "is-negative"
            }`}
          >
            <span className="metric-chip-label">Net Balance:</span>
            <strong className="metric-chip-val">
              {summaryStats.netChange >= 0 ? "+" : ""}
              {summaryStats.netChange.toLocaleString()}
            </strong>
          </div>

          <div className="metric-chip chip-activity">
            <span className="metric-chip-label">Activity:</span>
            <span className="metric-chip-sub">
              {summaryStats.activeDaysCount} active days / {summaryStats.totalTransactions} ledger records
            </span>
          </div>
        </div>

        {/* Clickable Legend Toggles */}
        <div className="stock-legend-toggles">
          <button
            type="button"
            className={`stock-legend-item ${showStockIn ? "active" : "disabled"}`}
            onClick={() => setShowStockIn((v) => !v)}
            title="Click to toggle Stock In"
          >
            <span className="legend-indicator stock-in-indicator" />
            <span>Stock In</span>
          </button>

          <button
            type="button"
            className={`stock-legend-item ${showStockOut ? "active" : "disabled"}`}
            onClick={() => setShowStockOut((v) => !v)}
            title="Click to toggle Stock Out"
          >
            <span className="legend-indicator stock-out-indicator" />
            <span>Stock Out</span>
          </button>
        </div>
      </div>

      {/* 3. SVG CHART CANVAS */}
      <div
        ref={viewportRef}
        className={`stock-chart-viewport ${isDragging ? "is-dragging" : ""}`}
        tabIndex={0}
        role="region"
        aria-label="Interactive stock chart. Drag horizontally to browse dates and vertically to pan the quantity camera. Zero is the lower boundary. Arrow keys browse dates. Plus and minus zoom. Home resets the view."
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          stopZoomAnimation();
          if (["ArrowLeft", "ArrowRight", "+", "=", "-", "Home"].includes(event.key)) event.preventDefault();
          if (event.key === "ArrowLeft") setPanDays(Math.min(maxPanDays, panDays + visibleDays / 5));
          if (event.key === "ArrowRight") setPanDays(Math.max(0, panDays - visibleDays / 5));
          if (event.key === "+" || event.key === "=") setVisibleDays(Math.max(3, visibleDays / 1.2));
          if (event.key === "-") setVisibleDays(Math.min(365, visibleDays * 1.2));
          if (event.key === "Home") resetView();
        }}
        onDoubleClick={resetView}
        onPointerDown={handleChartPointerDown}
        onPointerMove={handleChartPointerMove}
        onPointerUp={handleChartPointerEnd}
        onPointerCancel={handleChartPointerEnd}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoverIndex(null);
          setHoverY(null);
        }}
        title="Drag horizontally to browse dates or vertically to pan the quantity camera"
      >
        <span className="stock-chart-drag-hint" aria-hidden="true">
          Drag to pan dates and quantities
        </span>
        <svg
          className="stock-svg-element"
          width={containerWidth}
          height={chartHeight}
          viewBox={`0 0 ${containerWidth} ${chartHeight}`}
          role="img"
          aria-label="Stock movement activity trend chart"
        >
          <defs>
            <clipPath id={`${chartId}-plot`}>
              <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} />
            </clipPath>
            {/* Soft Emerald Area Gradient */}
            <linearGradient id="emeraldAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
            </linearGradient>

            {/* Warm Amber Area Gradient */}
            <linearGradient id="amberAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Y-Axis Horizontal Grid Lines and Labels */}
          {ticks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={`tick-${tick}`} className="stock-grid-row">
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  className="stock-grid-line"
                />
                <text
                  x={margin.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="stock-axis-label"
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </text>
              </g>
            );
          })}

          {/* Baseline horizontal axis */}
          <line
            x1={margin.left}
            y1={baselineY}
            x2={margin.left + plotWidth}
            y2={baselineY}
            className="stock-baseline"
          />

          {/* Vertical Y-Axis separator line */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={baselineY}
            className="stock-axis-line"
          />

          {/* MODE A: AREA & SMOOTH CURVE LINES */}
          <g clipPath={`url(#${chartId}-plot)`}>
          {chartMode === "area" && (
            <>
              {/* Area Fills */}
              {showStockIn && (
                <path
                  d={buildAreaPath(pointsStockIn, getY(0))}
                  fill="url(#emeraldAreaGradient)"
                  className="stock-area-fill"
                />
              )}
              {showStockOut && (
                <path
                  d={buildAreaPath(pointsStockOut, getY(0))}
                  fill="url(#amberAreaGradient)"
                  className="stock-area-fill"
                />
              )}

              {/* Curve Strokes */}
              {showStockIn && (
                <path
                  d={buildSmoothSpline(pointsStockIn)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="stock-curve stock-in-curve"
                />
              )}
              {showStockOut && (
                <path
                  d={buildSmoothSpline(pointsStockOut)}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="stock-curve stock-out-curve"
                />
              )}

              {/* Small discrete points along the lines */}
              {visibleDays <= 90 && showStockIn && pointsStockIn.map((point, index) => renderPoint(point, index, "in"))}
              {visibleDays <= 90 && showStockOut && pointsStockOut.map((point, index) => renderPoint(point, index, "out"))}
            </>
          )}

          {/* MODE B: GROUPED BARS */}
          {chartMode === "bar" && (
            <g className="stock-bars-group">
              {seriesData.map((day, idx) => {
                const slotW = dayWidth;
                const cx = getPointX(idx);
                const barW = Math.min(18, Math.max(4, slotW * 0.35));
                const inHeight = Math.max(0, (day.stockIn / maxTick) * plotHeight);
                const outHeight = Math.max(0, (day.stockOut / maxTick) * plotHeight);
                const isHovered = hoverIndex === idx;

                return (
                  <g key={`bar-group-${idx}`}>
                    {/* Hover column background highlight */}
                    {isHovered && (
                      <rect
                        x={cx - slotW * 0.45}
                        y={margin.top}
                        width={slotW * 0.9}
                        height={plotHeight}
                        fill="currentColor"
                        className="bar-hover-bg"
                        rx="4"
                      />
                    )}

                    {/* Stock In Bar (Green) */}
                    {showStockIn && inHeight > 0 && (
                      <rect
                        x={cx - barW - 1.5}
                        y={getY(day.stockIn)}
                        width={barW}
                        height={inHeight}
                        rx="3"
                        fill="#10b981"
                        className="stock-bar in-bar"
                      />
                    )}

                    {/* Stock Out Bar (Amber) */}
                    {showStockOut && outHeight > 0 && (
                      <rect
                        x={cx + 1.5}
                        y={getY(day.stockOut)}
                        width={barW}
                        height={outHeight}
                        rx="3"
                        fill="#f59e0b"
                        className="stock-bar out-bar"
                      />
                    )}

                    {/* Baseline indicator when both are 0 */}
                    {day.stockIn === 0 && day.stockOut === 0 && (
                      <rect
                        x={cx - 5}
                        y={getY(0) - 1}
                        width={10}
                        height={2}
                        rx="1"
                        className="zero-indicator"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* HOVER CROSSHAIR & HIGHLIGHTED POINTS */}
          {hoverIndex !== null && activeStockInPoint && (
            <g className="stock-hover-guide">
              {/* Vertical dashed guide line */}
              <line
                x1={hoverX ?? activeStockInPoint.x}
                y1={margin.top}
                x2={hoverX ?? activeStockInPoint.x}
                y2={baselineY}
                className="stock-crosshair"
              />
              {/* Horizontal quantity guide */}
              {hoverY !== null && (
                <line
                  x1={margin.left}
                  y1={hoverY}
                  x2={margin.left + plotWidth}
                  y2={hoverY}
                  className="stock-crosshair"
                />
              )}

              {/* Enhanced active dot on curve */}
              {chartMode === "area" && showStockIn && (
                <g>
                  <circle
                    cx={activeStockInPoint.x}
                    cy={activeStockInPoint.y}
                    r="8"
                    fill="rgba(16, 185, 129, 0.25)"
                  />
                  <circle
                    cx={activeStockInPoint.x}
                    cy={activeStockInPoint.y}
                    r="4.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}

              {chartMode === "area" && showStockOut && activeStockOutPoint && (
                <g>
                  <circle
                    cx={activeStockOutPoint.x}
                    cy={activeStockOutPoint.y}
                    r="8"
                    fill="rgba(245, 158, 11, 0.25)"
                  />
                  <circle
                    cx={activeStockOutPoint.x}
                    cy={activeStockOutPoint.y}
                    r="4.5"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}
            </g>
          )}

          {/* X-Axis Date Labels */}
          </g>
          {seriesData.map((day, idx) => {
            const shouldRender =
              idx === 0 ||
              idx === seriesData.length - 1 ||
              idx % labelStep === 0;

            if (!shouldRender) return null;

            const x = getPointX(idx);
            if (x < margin.left || x > margin.left + plotWidth) return null;

            return (
              <text
                key={`date-label-${idx}`}
                x={x}
                y={baselineY + 20}
                textAnchor="middle"
                className={`stock-axis-label stock-date-label ${
                  hoverIndex === idx ? "is-active" : ""
                }`}
              >
                {day.shortLabel}
              </text>
            );
          })}
          {activeDay && hoverY !== null && hoverX !== null && (
            <g className="stock-crosshair-labels">
              <rect x={0} y={hoverY - 10} width={margin.left - 3} height={20} rx={3} />
              <text x={(margin.left - 3) / 2} y={hoverY + 4} textAnchor="middle">
                {(quantityFloor + (baselineY - hoverY) / plotHeight * maxTick).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </text>
              <rect x={Math.max(margin.left, Math.min(containerWidth - 100, hoverX - 42))} y={baselineY + 5} width={84} height={24} rx={4} />
              <text x={Math.max(margin.left, Math.min(containerWidth - 100, hoverX - 42)) + 42} y={baselineY + 21} textAnchor="middle">
                {activeDay.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </text>
            </g>
          )}
        </svg>

        {/* Empty state overlay if all points in range are 0 */}
        {summaryStats.totalIn === 0 && summaryStats.totalOut === 0 && (
          <div className="stock-chart-empty-state">
            <div className="empty-state-card">
              <span className="empty-icon">📦</span>
                <strong>No stock movements recorded in this date window</strong>
              <small>
                Stock transactions from supplier receipts, work order dispatches, or inventory adjustments will automatically appear here.
              </small>
              {rangeDays < 90 && (
                <button
                  type="button"
                  className="empty-action-btn"
                  onClick={() => {
                    stopZoomAnimation();
                    setSelectedTimeframe(90);
                    setVisibleDays(90);
                    setPanDays(0);
                    setYZoom(1);
                    setQuantityFloor(0);
                    setFittedScale(null);
                    setHoverIndex(null);
                  }}
                >
                  Expand to 3 Months
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="stock-chart-toolbar" onPointerDown={stopZoomAnimation} onKeyDownCapture={stopZoomAnimation}>
        <div className="stock-chart-details" aria-label="Selected date stock activity">
          <span className="stock-detail-date">{detailDay.fullLabel}</span>
          <span className="stock-detail-in">Stock In <strong>+{detailDay.stockIn.toLocaleString()}</strong></span>
          <span className="stock-detail-out">Stock Out <strong>-{detailDay.stockOut.toLocaleString()}</strong></span>
          <span>Net <strong>{detailDay.stockIn - detailDay.stockOut >= 0 ? "+" : ""}{(detailDay.stockIn - detailDay.stockOut).toLocaleString()}</strong></span>
          <span>{detailDay.movements.length} {detailDay.movements.length === 1 ? "record" : "records"} · Units</span>
        </div>
        <div role="group" aria-label="Chart navigation">
          <button type="button" aria-label="Zoom out" onClick={() => setVisibleDays(Math.min(365, visibleDays * 1.2))}>−</button>
          <button type="button" aria-label="Zoom in" onClick={() => setVisibleDays(Math.max(3, visibleDays / 1.2))}>+</button>
          <button type="button" onClick={() => {
            stopZoomAnimation();
            setFittedScale(calculateNiceTicks(rawMax * 1.12).maxTick);
            setYZoom(1);
            setQuantityFloor(0);
          }}>Auto scale</button>
          <button type="button" onClick={() => { setPanDays(0); setHoverIndex(null); }}>Latest</button>
          <button type="button" onClick={resetView}>Reset</button>
        </div>
      </div>
      <Modal
        open={Boolean(selectedDay)}
        title={selectedDay ? `Stock activity · ${selectedDay.fullLabel}` : "Stock activity"}
        onCancel={() => setSelectedDay(null)}
        footer={null}
        width={1100}
        zIndex={1200}
        className="stock-movement-modal"
      >
        {selectedDay && (
          <>
            <div className="chart-movement-summary">
              <span className="chart-movement-in">Added <strong>+{selectedDay.stockIn.toLocaleString()}</strong></span>
              <span className="chart-movement-out">Removed <strong>-{selectedDay.stockOut.toLocaleString()}</strong></span>
              <span>Net <strong>{selectedDay.stockIn - selectedDay.stockOut >= 0 ? "+" : ""}{(selectedDay.stockIn - selectedDay.stockOut).toLocaleString()}</strong></span>
              <span>{selectedDay.movements.length} {selectedDay.movements.length === 1 ? "movement" : "movements"}</span>
            </div>
            <p>All stock movements for this date, including additions and removals.</p>
            <Table
              columns={movementColumns}
              dataSource={[...selectedDay.movements].sort((a, b) => (new Date(b.createdAt || b.date).getTime() || 0) - (new Date(a.createdAt || a.date).getTime() || 0))}
              rowKey={(entry) => entry.id || entry._id || `${entry.referenceId}-${entry.sku}-${entry.movementType}`}
              size="small"
              scroll={{ x: 1630, y: 400 }}
              pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
