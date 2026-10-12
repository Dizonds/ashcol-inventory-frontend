import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Tooltip,
  Dropdown,
  Row,
  Col,
  Space,
  Radio,
  Progress,
  Statistic,
} from "antd";
import { formatMoney } from "../utils/formatters";
import { api } from "../api";
import "./DashboardPage.css";
import arrowGrow from "../assets/dashboard/arrowGrow.png";

/* --- FIGMA EXACT SVG ICONS --- */
function MoneySendIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 8.5C2 5.5 3.5 4 6.5 4H17.5C20.5 4 22 5.5 22 8.5V15.5C22 18.5 20.5 20 17.5 20H6.5C3.5 20 2 18.5 2 15.5V8.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2V4M15 3.5L12 2L9 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoneyBagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M19 13C19 17.42 15.87 21 12 21C8.13 21 5 17.42 5 13C5 9.58 6.5 7.42 8.5 5.5H15.5C17.5 7.42 19 9.58 19 13Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 5L8 3H16L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11H14M12 11V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AudienceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 18V17C6 14.79 7.79 13 10 13H14C16.21 13 18 14.79 18 17V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 19C2 17.34 3.34 16 5 16M22 19C22 17.34 20.66 16 19 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L3 7L12 12L21 7L12 2ZM3 17L12 22L21 17M3 12L12 17L21 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GraphTrendingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 19V5M3 19H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14L11 9L15 12L20 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 6H20V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20M7 12H17M10 18H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9H21M8 2V5M16 2V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 12 Months sales dot matrix config (matching Figma columns distribution)
const MONTHS_DATA = [
  { month: "Jan", dots: [10, 8, 4], amount: "$32,450" },
  { month: "Feb", dots: [8, 3, 11], amount: "$28,120" },
  { month: "Mar", dots: [13, 8, 11], amount: "$44,800" },
  { month: "Apr", dots: [8, 13, 8], amount: "$39,200" },
  { month: "May", dots: [5, 8, 11], amount: "$29,950" },
  { month: "Jun", dots: [12, 13, 10], amount: "$49,150" },
  { month: "Jul", dots: [8, 12, 12], amount: "$42,600" },
  { month: "Aug", dots: [13, 8, 12], amount: "$46,300" },
  { month: "Sept", dots: [11, 8, 11], amount: "$38,400" },
  { month: "Oct", dots: [9, 11, 10], amount: "$37,250" },
  { month: "Nov", dots: [8, 11, 9], amount: "$35,900" },
  { month: "Dec", dots: [6, 6, 6], amount: "$24,500" },
];

export default function DashboardPage({
  items = [],
  requests = [],
  branchId,
  canManage,
  user,
  onRestockItem,
  onNavigateToInventoryWithFilter,
}) {
  const [view, setView] = useState("cards");
  const [analytics, setAnalytics] = useState({ fastMoving: [], slowMoving: [] });
  const [selectedPeriod, setSelectedPeriod] = useState("Last Week");
  const [selectedFilter, setSelectedFilter] = useState("All Products");

  // Keep original analytics fetch
  useEffect(() => {
    if (!branchId) return;
    let active = true;
    api("get", "/analytics", null, { branchId })
      .then(({ data }) => {
        if (active) setAnalytics(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [branchId, items]);

  // Keep all original inventory calculations
  const low = items.filter(
    (item) => item.quantity > 0 && item.quantity <= item.reorderLevel
  );
  const out = items.filter((item) => item.quantity === 0);
  const high = items.filter(
    (item) =>
      item.quantity > (item.reorderLevel > 0 ? item.reorderLevel * 4 : 20)
  );
  const warnings = items.filter((item) => item.quantity <= item.reorderLevel);
  const cost = items.reduce(
    (sum, item) => sum + item.unitCost * item.quantity,
    0
  );
  const salesValue = items.reduce(
    (sum, item) => sum + item.listPrice * item.quantity,
    0
  );
  const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const pending = requests.filter(
    (request) => request.status === "PENDING"
  ).length;
  const reservedTotal = items.reduce(
    (acc, it) => acc + (it.reservedQuantity || 0),
    0
  );
  const totals = items.reduce((result, item) => {
    const unit = item.unitOfMeasure;
    result[unit] =
      Math.round(((result[unit] || 0) + item.quantity) * 1000) / 1000;
    return result;
  }, {});

  const categories = [
    "Split Type",
    "Window Type",
    "Floor Mounted",
    "Portable",
    "Compressors",
    "Fan Motors",
    "PCBs & Inverters",
    "Refrigerants",
    "Copper Tubing",
    "Installation Materials",
    "Vacuum Pumps",
    "Manifold Gauges",
  ];

  const breakdown = categories
    .map((category) => ({
      category,
      count: items.filter((item) => item.category === category).length,
    }))
    .filter((entry) => entry.count > 0);

  // Dynamic user display name
  const displayName = user?.firstName
    ? user.firstName
    : user?.fullName
    ? user.fullName.replace("Administrator", "Admin")
    : "Admin";

  // Filtered items based on Total Sales dropdown filter
  const filteredItems = items.filter((item) => {
    if (selectedFilter === "AC Units") {
      return (
        item.itemType === "AC Unit" ||
        (item.category && item.category.toLowerCase().includes("type"))
      );
    }
    if (selectedFilter === "Parts & Materials") {
      return (
        item.itemType !== "AC Unit" &&
        (!item.category || !item.category.toLowerCase().includes("type"))
      );
    }
    return true; // All Products
  });

  // Calculate filtered turnover / potential value
  const filteredSalesValue = filteredItems.reduce(
    (sum, item) => sum + (item.listPrice || 0) * (item.quantity || 0),
    0
  );

  // Calculate period multiplier
  const periodMultiplier =
    selectedPeriod === "Last Week"
      ? 0.32
      : selectedPeriod === "Last Month"
      ? 0.75
      : 1.0;

  const displaySalesAmount = Math.round(filteredSalesValue * periodMultiplier);

  // Dynamic growth %
  const markupPercent =
    cost > 0 ? Math.round(((salesValue - cost) / cost) * 100) : 40;
  const marginPercent =
    salesValue > 0 ? Math.round(((salesValue - cost) / salesValue) * 100) : 27;

  // Calculate dynamic green dot color based on vertical stack position
  function getDotColor(dotIndex, totalDots) {
    const fraction = dotIndex / Math.max(totalDots - 1, 1);
    if (fraction === 0) return "#12a807";
    if (fraction < 0.25) return "#22c55e";
    if (fraction < 0.5) return "#4ade80";
    if (fraction < 0.75) return "#86efac";
    if (fraction < 0.9) return "#bbf7d0";
    return "#dcfce7";
  }

  // 12 Months dynamic dot matrix
  const MONTHS_CONFIG = [
    { month: "Jan", weight: 0.65 },
    { month: "Feb", weight: 0.55 },
    { month: "Mar", weight: 0.92 },
    { month: "Apr", weight: 0.78 },
    { month: "May", weight: 0.60 },
    { month: "Jun", weight: 0.98 },
    { month: "Jul", weight: 0.85 },
    { month: "Aug", weight: 0.94 },
    { month: "Sept", weight: 0.76 },
    { month: "Oct", weight: 0.74 },
    { month: "Nov", weight: 0.71 },
    { month: "Dec", weight: 0.48 },
  ];

  const monthsChartData = MONTHS_CONFIG.map((m) => {
    const monthSales = Math.round(
      (filteredSalesValue * m.weight * periodMultiplier) / 4
    );
    const maxDots = 13;
    const baseDots = Math.max(3, Math.min(maxDots, Math.round(m.weight * 12)));
    return {
      month: m.month,
      dots: [
        Math.max(2, Math.min(maxDots, baseDots + 1)),
        Math.max(2, Math.min(maxDots, baseDots - 2)),
        Math.max(2, Math.min(maxDots, baseDots)),
      ],
      amount: formatMoney(monthSales),
    };
  });

  const filterMenu = {
    items: [
      {
        key: "all",
        label: "All Products",
        onClick: () => setSelectedFilter("All Products"),
      },
      {
        key: "units",
        label: "AC Units Only",
        onClick: () => setSelectedFilter("AC Units"),
      },
      {
        key: "parts",
        label: "Parts & Materials",
        onClick: () => setSelectedFilter("Parts & Materials"),
      },
    ],
  };

  const periodMenu = {
    items: [
      {
        key: "last_week",
        label: "Last Week",
        onClick: () => setSelectedPeriod("Last Week"),
      },
      {
        key: "last_month",
        label: "Last Month",
        onClick: () => setSelectedPeriod("Last Month"),
      },
      {
        key: "this_year",
        label: "Full Year (2026)",
        onClick: () => setSelectedPeriod("Full Year"),
      },
    ],
  };

  return (
    <div className="dashboard-container">
      {/* 1. WELCOME GREETING BANNER (NODE 441:5358) */}
      <div className="dashboard-welcome" data-node-id="441:5358">
        <h1 className="dashboard-welcome-title" data-node-id="441:5359">
          Welcome Back, {displayName}! 👋🏼
        </h1>
        <p className="dashboard-welcome-subtitle" data-node-id="441:5360">
          Here is today's dashboard. Stock readiness, material requests, and real-time inventory valuations for the Taguig warehouse.
        </p>
      </div>

      {/* 2. KPI METRIC CARDS ROW (NODES 441:5405 & 441:5549) */}
      <div className="dashboard-kpi-grid" data-node-id="441:5405">
        {/* Card 1: Total Revenue (441:5406 / 441:5549) */}
        <div
          className="dashboard-kpi-card"
          data-node-id="441:5406"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigateToInventoryWithFilter({})}
          title="Click to view catalog"
        >
          <div className="kpi-main-content">
            <div className="kpi-header-row">
              <div className="kpi-icon-badge" data-node-id="441:5410">
                <MoneySendIcon />
              </div>
              <h3 className="kpi-title" data-node-id="441:5412">
                Total Revenue
              </h3>
            </div>

            <div className="kpi-trend-row" data-node-id="441:5413">
              <div className="kpi-trend-badge" data-node-id="441:5415">
                <img src={arrowGrow} alt="Trend Up" className="kpi-trend-arrow" />
                <span>+{markupPercent}%</span>
              </div>
              <span className="kpi-trend-period" data-node-id="441:5418">
                Over inventory cost
              </span>
            </div>

            <div className="kpi-values-row" data-node-id="441:5420">
              <span className="kpi-value-large" data-node-id="441:5421">
                {formatMoney(salesValue)}
              </span>
              <span className="kpi-subdelta" data-node-id="441:5422">
                +{formatMoney(salesValue - cost)}
              </span>
            </div>
          </div>

          {/* Mini Bar Chart Visual */}
          <div className="kpi-mini-bars" data-node-id="441:5423">
            <div className="kpi-bar" style={{ height: "39px" }} data-node-id="441:5424" />
            <div className="kpi-bar" style={{ height: "50px" }} data-node-id="441:5425" />
            <div className="kpi-bar active" style={{ height: "71px" }} data-node-id="441:5426" />
            <div className="kpi-bar" style={{ height: "34px" }} data-node-id="441:5427" />
          </div>
        </div>

        {/* Card 2: Profit / Gross Margin (441:5428) */}
        <div
          className="dashboard-kpi-card"
          data-node-id="441:5428"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigateToInventoryWithFilter({})}
          title="Click to view catalog"
        >
          <div className="kpi-main-content">
            <div className="kpi-header-row">
              <div className="kpi-icon-badge" data-node-id="441:5432">
                <MoneyBagIcon />
              </div>
              <h3 className="kpi-title" data-node-id="441:5434">
                Profit
              </h3>
            </div>

            <div className="kpi-trend-row" data-node-id="441:5435">
              <div className="kpi-trend-badge" data-node-id="441:5437">
                <img src={arrowGrow} alt="Trend Up" className="kpi-trend-arrow" />
                <span>+{marginPercent}%</span>
              </div>
              <span className="kpi-trend-period" data-node-id="441:5440">
                Gross margin
              </span>
            </div>

            <div className="kpi-values-row" data-node-id="441:5442">
              <span className="kpi-value-large" data-node-id="441:5443">
                {formatMoney(salesValue - cost)}
              </span>
              <span className="kpi-subdelta" data-node-id="441:5444">
                Cost: {formatMoney(cost)}
              </span>
            </div>
          </div>

          {/* Mini Bar Chart Visual */}
          <div className="kpi-mini-bars" data-node-id="441:5445">
            <div className="kpi-bar" style={{ height: "39px" }} data-node-id="441:5446" />
            <div className="kpi-bar active" style={{ height: "67px" }} data-node-id="441:5447" />
            <div className="kpi-bar" style={{ height: "71px" }} data-node-id="441:5448" />
            <div className="kpi-bar" style={{ height: "34px" }} data-node-id="441:5449" />
          </div>
        </div>

        {/* Card 3: Total Customers / Catalog Items (441:5450) */}
        <div
          className="dashboard-kpi-card"
          data-node-id="441:5450"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigateToInventoryWithFilter({})}
          title="Click to view all SKUs"
        >
          <div className="kpi-main-content">
            <div className="kpi-header-row">
              <div className="kpi-icon-badge" data-node-id="441:5454">
                <AudienceIcon />
              </div>
              <h3 className="kpi-title" data-node-id="441:5456">
                Total Catalog SKUs
              </h3>
            </div>

            <div className="kpi-trend-row" data-node-id="441:5457">
              <div className="kpi-trend-badge" data-node-id="441:5459">
                <img src={arrowGrow} alt="Trend Up" className="kpi-trend-arrow" />
                <span>{items.length} SKUs</span>
              </div>
              <span className="kpi-trend-period" data-node-id="441:5462">
                {totalUnits} units total
              </span>
            </div>

            <div className="kpi-values-row" data-node-id="441:5464">
              <span className="kpi-value-large" data-node-id="441:5465">
                {items.length}
              </span>
              <span className="kpi-subdelta" data-node-id="441:5466" style={{ color: out.length > 0 ? "#ef4444" : "#12a807" }}>
                {out.length} Out, {low.length} Low
              </span>
            </div>
          </div>

          {/* Mini Bar Chart Visual */}
          <div className="kpi-mini-bars" data-node-id="441:5467">
            <div className="kpi-bar" style={{ height: "39px" }} data-node-id="441:5468" />
            <div className="kpi-bar" style={{ height: "67px" }} data-node-id="441:5469" />
            <div className="kpi-bar" style={{ height: "71px" }} data-node-id="441:5470" />
            <div className="kpi-bar active" style={{ height: "34px" }} data-node-id="441:5471" />
          </div>
        </div>

        {/* Card 4: Stock Health & Reorders (Functional System UI Integration) */}
        <div
          className="dashboard-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigateToInventoryWithFilter({ status: "LOW" })}
          title="Click to view items needing reorder"
        >
          <div className="kpi-main-content">
            <div className="kpi-header-row">
              <div
                className="kpi-icon-badge"
                style={{
                  color: warnings.length > 0 ? "#f59e0b" : "#12a807",
                  background: warnings.length > 0 ? "#fef3c7" : "#e2ffe0",
                }}
              >
                <PackageIcon />
              </div>
              <h3 className="kpi-title">Stock Health</h3>
            </div>

            <div className="kpi-trend-row">
              <div
                className="kpi-trend-badge"
                style={{ color: warnings.length > 0 ? "#f59e0b" : "#31c998" }}
              >
                <img src={arrowGrow} alt="Trend" className="kpi-trend-arrow" />
                <span>
                  {warnings.length > 0 ? `${warnings.length} Reorders` : "Healthy"}
                </span>
              </div>
              <span className="kpi-trend-period">
                {reservedTotal} Units Reserved
              </span>
            </div>

            <div className="kpi-values-row">
              <span className="kpi-value-large">
                {warnings.length}
              </span>
              <span className="kpi-subdelta" style={{ color: "#3b82f6" }}>
                {pending} Requests
              </span>
            </div>
          </div>

          <div className="kpi-mini-bars">
            <div className="kpi-bar" style={{ height: "42px" }} />
            <div className="kpi-bar" style={{ height: "55px" }} />
            <div className="kpi-bar active" style={{ height: "71px" }} />
            <div className="kpi-bar" style={{ height: "36px" }} />
          </div>
        </div>
      </div>

      {/* 3. TOTAL SALES ANALYTICS CHART CARD (NODE 441:5620) */}
      <div className="dashboard-sales-card" data-node-id="441:5620">
        <div className="sales-card-header" data-node-id="441:5621">
          <div className="sales-header-left" data-node-id="441:5622">
            <div className="sales-header-icon" data-node-id="441:5624">
              <GraphTrendingIcon />
            </div>
            <h2 className="sales-header-title" data-node-id="441:5626">
              Total Sales
            </h2>
            <Tooltip title="Aggregated turnover and potential fulfillment volume for the Taguig warehouse based on inventory records.">
              <span className="sales-info-icon" data-node-id="441:5627">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </Tooltip>
          </div>

          <div className="sales-header-controls" data-node-id="441:5628">
            <Dropdown menu={filterMenu} trigger={["click"]}>
              <div className="sales-control-pill" data-node-id="441:5629">
                <FilterIcon />
                <span data-node-id="441:5632">{selectedFilter}</span>
                <ChevronDownIcon />
              </div>
            </Dropdown>

            <Dropdown menu={periodMenu} trigger={["click"]}>
              <div className="sales-control-pill" data-node-id="441:5634">
                <CalendarIcon />
                <span data-node-id="441:5637">{selectedPeriod}</span>
                <ChevronDownIcon />
              </div>
            </Dropdown>
          </div>
        </div>

        {/* Big Sales Metric Value */}
        <div className="sales-stat-summary" data-node-id="441:5639">
          <span className="sales-stat-amount" data-node-id="441:5640">
            {formatMoney(displaySalesAmount)}
          </span>
          <div className="sales-stat-trend" data-node-id="441:5641">
            <img src={arrowGrow} alt="Trend Up" className="kpi-trend-arrow" />
            <span data-node-id="441:5645">+{marginPercent}%</span>
          </div>
          <span className="sales-stat-period" data-node-id="441:5646">
            Estimated for {selectedPeriod.toLowerCase()} ({filteredItems.length} SKUs)
          </span>
        </div>

        {/* Dot Matrix Sales Chart Visual */}
        <div className="sales-chart-wrapper" data-node-id="441:5647">
          {/* Y-Axis */}
          <div className="sales-y-axis" data-node-id="441:5648">
            <span data-node-id="441:5649">50k</span>
            <span data-node-id="441:5650">30k</span>
            <span data-node-id="441:5651">10k</span>
            <span data-node-id="441:5652">0</span>
          </div>

          {/* Chart Content */}
          <div className="sales-chart-content">
            <div className="sales-columns-container" data-node-id="441:5654">
              {monthsChartData.map((item) => (
                <div key={item.month} className="sales-month-group">
                  {item.dots.map((dotCount, cIdx) => (
                    <Tooltip
                      key={cIdx}
                      title={`${item.month} (Week ${cIdx + 1}): ~${item.amount} (${selectedFilter})`}
                    >
                      <div className="sales-dot-column">
                        {Array.from({ length: dotCount }).map((_, dIdx) => (
                          <div
                            key={dIdx}
                            className="sales-dot"
                            style={{
                              backgroundColor: getDotColor(dIdx, dotCount),
                            }}
                          />
                        ))}
                      </div>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>

            {/* X-Axis */}
            <div className="sales-x-axis" data-node-id="441:6021">
              {monthsChartData.map((item) => (
                <span key={item.month} className="sales-x-label">
                  {item.month}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. STOCK MEASURE UNITS RIBBON */}
      <div className="dashboard-section-card">
        <div className="dashboard-section-header">
          <div className="section-header-title-wrap">
            <h3 className="section-title">📊 Active Unit Quantities & Commitments</h3>
            <span className="section-subtitle">
              Current stock on hand segmented by physical unit of measure
            </span>
          </div>
          <Tag color="cyan">{items.length} Catalog Items</Tag>
        </div>

        <div className="dashboard-unit-chips">
          {Object.keys(totals).map((unit) => (
            <div key={unit} className="unit-chip">
              <span className="unit-value">{totals[unit]}</span>
              <span className="unit-label">{unit}</span>
            </div>
          ))}
          {reservedTotal > 0 && (
            <div className="unit-chip reserved">
              <span className="unit-value">{reservedTotal}</span>
              <span className="unit-label">RESERVED FOR JOBS</span>
            </div>
          )}
          {pending > 0 && (
            <div className="unit-chip pending">
              <span className="unit-value">{pending}</span>
              <span className="unit-label">PENDING REQUESTS</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. CATALOG COMPOSITION (FIGMA EMBEDDED STYLING) */}
      <div className="dashboard-section-card">
        <div className="dashboard-section-header">
          <div className="section-header-title-wrap">
            <h3 className="section-title">📦 Catalog Composition by Category</h3>
            <span className="section-subtitle">
              Distribution of equipment and materials across categories
            </span>
          </div>
          <Radio.Group
            value={view}
            onChange={(e) => setView(e.target.value)}
            options={[
              { label: "Cards", value: "cards" },
              { label: "Bars", value: "bar" },
              { label: "Circles", value: "pie" },
            ]}
          />
        </div>

        <div className="metric-grid" style={{ marginTop: 16 }}>
          {breakdown.map((entry) => (
            <div
              key={entry.category}
              className="composition-item"
              onClick={() =>
                onNavigateToInventoryWithFilter({ category: entry.category })
              }
            >
              <Button type="link" className="composition-link">
                {entry.category}
              </Button>
              {view === "cards" ? (
                <div className="composition-count">
                  <span className="count-number">{entry.count}</span>
                  <span className="count-unit">SKUs</span>
                </div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <Progress
                    type={view === "pie" ? "circle" : "line"}
                    percent={
                      items.length
                        ? Math.round((entry.count / items.length) * 100)
                        : 0
                    }
                    size={view === "pie" ? 64 : undefined}
                    strokeColor="#12a807"
                  />
                  <div style={{ fontSize: 12, marginTop: 4, color: "#6b7280" }}>
                    {entry.count} SKUs
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. FAST/SLOW MOVING INVENTORY TABLES */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div className="dashboard-section-card">
            <div className="dashboard-section-header">
              <h3 className="section-title">🚀 Fast-Moving Supplies (Past 30 Days)</h3>
              <Tag color="green">High Turn-over</Tag>
            </div>
            <Table
              size="small"
              rowKey="id"
              dataSource={analytics.fastMoving}
              pagination={false}
              locale={{
                emptyText: "No high-turnover items in the past 30 days.",
              }}
              columns={[
                {
                  title: "SKU",
                  dataIndex: "sku",
                  render: (s) => <strong>{s}</strong>,
                },
                { title: "Item Name", dataIndex: "name" },
                {
                  title: "Dispatched",
                  render: (_, r) => (
                    <Tag color="green">
                      {r.dispatched30d} {r.unitOfMeasure}
                    </Tag>
                  ),
                },
                {
                  title: "Remaining",
                  render: (_, r) => `${r.quantity} ${r.unitOfMeasure}`,
                },
              ]}
            />
          </div>
        </Col>

        <Col xs={24} md={12}>
          <div className="dashboard-section-card">
            <div className="dashboard-section-header">
              <h3 className="section-title">⏳ Slow-Moving Supplies</h3>
              <Tag color="orange">Zero Dispatches (30d)</Tag>
            </div>
            <Table
              size="small"
              rowKey="id"
              dataSource={analytics.slowMoving}
              pagination={false}
              locale={{
                emptyText: "All supplies are active.",
              }}
              columns={[
                {
                  title: "SKU",
                  dataIndex: "sku",
                  render: (s) => <strong>{s}</strong>,
                },
                { title: "Item Name", dataIndex: "name" },
                {
                  title: "Category",
                  dataIndex: "category",
                  render: (c) => <Tag>{c}</Tag>,
                },
                {
                  title: "Current Stock",
                  render: (_, r) => `${r.quantity} ${r.unitOfMeasure}`,
                },
              ]}
            />
          </div>
        </Col>
      </Row>

      {/* 7. REORDER WATCH LIST */}
      <div className="dashboard-section-card">
        <div className="dashboard-section-header">
          <div className="section-header-title-wrap">
            <h3 className="section-title">⚠️ Reorder Watch List</h3>
            <span className="section-subtitle">
              Supplies at or below threshold reorder levels
            </span>
          </div>
          <Button
            type="link"
            onClick={() => onNavigateToInventoryWithFilter({ status: "LOW" })}
          >
            View all low stock ({warnings.length})
          </Button>
        </div>

        <Table
          rowKey="id"
          dataSource={warnings}
          scroll={{ x: 650 }}
          pagination={{ defaultPageSize: 6 }}
          columns={[
            { title: "SKU", dataIndex: "sku" },
            { title: "Item", dataIndex: "name" },
            {
              title: "Available",
              render: (_, item) => `${item.quantity} ${item.unitOfMeasure}`,
            },
            {
              title: "Reorder level",
              render: (_, item) => `${item.reorderLevel} ${item.unitOfMeasure}`,
            },
            {
              title: "Status",
              render: (_, item) => (
                <Tag color={item.quantity === 0 ? "red" : "orange"}>
                  {item.quantity === 0 ? "Out of stock" : "Low stock"}
                </Tag>
              ),
            },
            ...(canManage
              ? [
                  {
                    title: "Action",
                    render: (_, item) => (
                      <Button
                        size="small"
                        type="primary"
                        style={{ background: "#12a807", borderColor: "#12a807" }}
                        onClick={() => onRestockItem(item.id)}
                      >
                        Restock
                      </Button>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>
    </div>
  );
}

