import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Row,
  Col,
  Radio,
  Progress,
} from "antd";
import { formatMoney } from "../utils/formatters";
import { api } from "../api";
import "./DashboardPage.css";
import StockActivityChart from "./StockActivityChart";
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



export default function DashboardPage({
  items = [],
  requests = [],
  branchId,
  canManage,
  user,
  onRestockItem,
  onNavigateToInventoryWithFilter,
  stockChartView,
  onStockChartViewSave,
}) {
  const [view, setView] = useState("cards");
  const [analytics, setAnalytics] = useState({ fastMoving: [], slowMoving: [] });
  const [movementHistory, setMovementHistory] = useState([]);
  const [movementHistoryReady, setMovementHistoryReady] = useState(false);

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

  useEffect(() => {
    if (!branchId) return;
    let active = true;
    api("get", "/movements", null, { branchId, page: 1, pageSize: 100 })
      .then(async ({ data }) => {
        const firstPage = data.items || [];
        const pageSize = data.pageSize || firstPage.length || 100;
        const totalPages = Math.ceil((data.total || firstPage.length) / pageSize);
        const remaining = await Promise.all(
          Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
            api("get", "/movements", null, { branchId, page: index + 2, pageSize })
              .then((response) => response.data.items || [])
          )
        );
        if (active) {
          setMovementHistory(firstPage.concat(...remaining));
          setMovementHistoryReady(true);
        }
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
  const warnings = items.filter((item) => item.quantity <= item.reorderLevel);
  const cost = items.reduce(
    (sum, item) => sum + item.unitCost * item.quantity,
    0
  );
  const salesValue = items.reduce(
    (sum, item) => sum + item.listPrice * item.quantity,
    0
  );
  const potentialInventoryValue = salesValue;
  const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const pending = requests.filter(
    (request) => request.status === "PENDING"
  ).length;
  const reservedTotal = items.reduce(
    (acc, it) => acc + (it.reservedQuantity || 0),
    0
  );
  const recentMovementCount = movementHistory.length;


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
        {/* Card 1: Total Inventory Cost */}
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
                Total Inventory Cost
              </h3>
            </div>

            <div className="kpi-trend-row" data-node-id="441:5413">
              <div className="kpi-trend-badge" data-node-id="441:5415">
                <img src={arrowGrow} alt="Trend Up" className="kpi-trend-arrow" />
                <span>{items.length} SKUs</span>
              </div>
              <span className="kpi-trend-period" data-node-id="441:5418">
                Current stock at cost
              </span>
            </div>

            <div className="kpi-values-row" data-node-id="441:5420">
              <span className="kpi-value-large" data-node-id="441:5421">
                {formatMoney(cost)}
              </span>
              <span className="kpi-subdelta" data-node-id="441:5422">
                {totalUnits} units
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

        {/* Card 2: Potential Inventory Value */}
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
                Potential Inventory Value
              </h3>
            </div>

            <div className="kpi-trend-row" data-node-id="441:5435">
              <div className="kpi-trend-badge" data-node-id="441:5437">
                <img src={arrowGrow} alt="Trend Up" className="kpi-trend-arrow" />
                <span>List price</span>
              </div>
              <span className="kpi-trend-period" data-node-id="441:5440">
                Estimated catalog value
              </span>
            </div>

            <div className="kpi-values-row" data-node-id="441:5442">
              <span className="kpi-value-large" data-node-id="441:5443">
                {formatMoney(potentialInventoryValue)}
              </span>
              <span className="kpi-subdelta" data-node-id="441:5444">
                Cost basis: {formatMoney(cost)}
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

        {/* Card 4: Low Stock Items */}
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
              <h3 className="kpi-title">Low Stock Items</h3>
            </div>

            <div className="kpi-trend-row">
              <div
                className="kpi-trend-badge"
                style={{ color: warnings.length > 0 ? "#f59e0b" : "#31c998" }}
              >
                <img src={arrowGrow} alt="Trend" className="kpi-trend-arrow" />
                <span>
                  {low.length > 0 ? `${low.length} Need attention` : "Healthy"}
                </span>
              </div>
              <span className="kpi-trend-period">
                {reservedTotal} Units Reserved
              </span>
            </div>

            <div className="kpi-values-row">
              <span className="kpi-value-large">
                {low.length}
              </span>
              <span className="kpi-subdelta" style={{ color: "#3b82f6" }}>
                {out.length} Out of stock
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

      {/* 3. INVENTORY MOVEMENT TREND */}
      <div className="dashboard-main-grid">
        <StockActivityChart
          movementHistory={movementHistory}
          historyReady={movementHistoryReady}
          initialView={stockChartView}
          onViewSave={onStockChartViewSave}
        />

      <div className="dashboard-attention-card">
        <div className="dashboard-section-header">
          <div className="section-header-title-wrap">
            <h3 className="section-title">Needs Attention</h3>
            <span className="section-subtitle">Items and work requiring follow-up</span>
          </div>
        </div>
        <button type="button" className="attention-row" onClick={() => onNavigateToInventoryWithFilter({ status: "LOW" })}>
          <span className="attention-row-icon attention-warning">!</span>
          <span><strong>{low.length} low-stock items</strong><small>Review reorder levels</small></span>
          <span className="attention-arrow">→</span>
        </button>
        <button type="button" className="attention-row" onClick={() => onNavigateToInventoryWithFilter({ status: "OUT" })}>
          <span className="attention-row-icon attention-danger">×</span>
          <span><strong>{out.length} out-of-stock items</strong><small>Require replenishment</small></span>
          <span className="attention-arrow">→</span>
        </button>
        <div className="attention-row attention-row-static">
          <span className="attention-row-icon attention-info">↗</span>
          <span><strong>{pending} pending requests</strong><small>Awaiting review or fulfillment</small></span>
        </div>
      </div>
      </div>

      <div className="dashboard-section-card recent-activity-card">
        <div className="dashboard-section-header">
          <div className="section-header-title-wrap">
            <h3 className="section-title">Recent Activity</h3>
            <span className="section-subtitle">Latest stock ledger updates</span>
          </div>
          <Tag color="cyan">{recentMovementCount} entries</Tag>
        </div>
        <div className="recent-activity-list">
          {movementHistory.slice(0, 5).map((entry) => (
            <div className="recent-activity-row" key={entry.id || entry._id}>
              <span className={`recent-activity-type ${Number(entry.quantityDelta) >= 0 ? "recent-in" : "recent-out"}`}>
                {Number(entry.quantityDelta) >= 0 ? "IN" : "OUT"}
              </span>
              <span className="recent-activity-item"><strong>{entry.itemName || entry.sku}</strong><small>{entry.reason || "Stock movement"}</small></span>
              <span className="recent-activity-quantity">{Number(entry.quantityDelta) > 0 ? "+" : ""}{entry.quantityDelta} {entry.unitOfMeasure}</span>
            </div>
          ))}
          {movementHistory.length === 0 && <span className="recent-activity-empty">No recent stock movements.</span>}
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

