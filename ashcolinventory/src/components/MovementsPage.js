import React, { useState, useEffect } from "react";
import { Spin, Alert } from "antd";
import { api, errorMessage } from "../api";
import "./MovementsPage.css";

// Figma Icons
function ItemsListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 6H20M8 12H20M8 18H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 5H21M6 12H18M10 19H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 19L8 12L15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 5L16 12L9 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MovementsPage({ branchId, refresh }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounced search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api("get", "/movements", null, { branchId, page, pageSize, search, type })
      .then(({ data }) => {
        if (active) {
          setRows(data.items || []);
          setTotal(data.total || 0);
        }
      })
      .catch((err) => {
        if (active) {
          setError(errorMessage(err));
          setRows([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [branchId, page, pageSize, search, type, refresh]);

  // Format timestamp in Philippine time
  const formatTimestamp = (entry) => {
    if (!entry.createdAt) return entry.date || "Legacy: not recorded";
    try {
      const d = new Date(entry.createdAt);
      return d.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return entry.date || "Legacy: not recorded";
    }
  };

  // Helper to format movement type badge matching Figma
  const renderMovementTypeBadge = (rawType, delta) => {
    const t = String(rawType || "").toUpperCase();
    if (t.includes("STOCK_IN") || t === "STOCK IN" || t === "OPENING" || t === "RESTORE") {
      return <span className="movement-badge stock-in">Stock In</span>;
    }
    if (t.includes("TRANSFER_OUT") || t === "TRANSFER OUT") {
      return <span className="movement-badge transfer-out">Transfer Out</span>;
    }
    if (t.includes("STOCK_OUT") || t === "STOCK OUT" || t.includes("REQUEST") || t === "ARCHIVE") {
      return <span className="movement-badge stock-out">Stock Out</span>;
    }
    if (t.includes("TRANSFER_IN") || t === "TRANSFER IN") {
      return <span className="movement-badge transfer-in">Transfer In</span>;
    }
    const label = rawType ? rawType.replace(/_/g, " ") : "Movement";
    return <span className="movement-badge default">{label}</span>;
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // Generate page numbers
  const renderPaginationButtons = () => {
    const buttons = [];
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          type="button"
          className={`stock-ledger-page-btn ${page === i ? "active" : ""}`}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="stock-ledger-container">
      {/* 1. Header Title & Subtitle (Node 458:15860) */}
      <div className="stock-ledger-header-wrap" data-node-id="458:15860">
        <h1 className="stock-ledger-title">
          Stock Movements Ledger
        </h1>
        <p className="stock-ledger-subtitle">
          Search the full retained warehouse history. Times are displayed in Philippine time. Legacy records may lack a verified actor or balance.
        </p>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          closable
          onClose={() => setError("")}
        />
      )}

      {/* 2. Main Transaction History Card (Node 458:15886) */}
      <div className="stock-ledger-card" data-node-id="458:15886">
        {/* Toolbar (Node 458:15887) */}
        <div className="stock-ledger-toolbar" data-node-id="458:15887">
          <div className="stock-ledger-toolbar-left" data-node-id="458:15888">
            <div className="stock-ledger-title-group" data-node-id="458:15889">
              <div className="stock-ledger-list-icon-badge" data-node-id="458:15890">
                <ItemsListIcon />
              </div>
              <h2 className="stock-ledger-section-title" data-node-id="458:15892">
                Inventory Transaction History
              </h2>
            </div>

            {/* Search Box (Node 458:15893) */}
            <div className="stock-ledger-search-wrap" data-node-id="458:15893">
              <span className="stock-ledger-search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="stock-ledger-search-input"
                placeholder="Search SKU, item, or reference"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Dropdown Pill (Node 458:15896 / 458:15897) */}
          <div className="stock-ledger-toolbar-right" data-node-id="458:15896">
            <label className="stock-ledger-filter-pill" data-node-id="458:15897">
              <span className="stock-ledger-filter-icon">
                <FilterIcon />
              </span>
              <select
                className="stock-ledger-filter-select"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Movement Types</option>
                <option value="STOCK_IN">Stock In</option>
                <option value="STOCK_OUT">Stock Out</option>
                <option value="TRANSFER_IN">Transfer In</option>
                <option value="TRANSFER_OUT">Transfer Out</option>
                <option value="REQUEST_ISSUE">Material Request Issue</option>
                <option value="OPENING">Opening Balance</option>
                <option value="DETAILS">Details Update</option>
                <option value="ARCHIVE">Archive</option>
                <option value="RESTORE">Restore</option>
              </select>
              <ChevronDownIcon />
            </label>
          </div>
        </div>

        {/* 3. Table (Node 458:15905) */}
        <div className="stock-ledger-table-wrap" data-node-id="458:15905">
          <Spin spinning={loading}>
            <table className="stock-ledger-table">
              <thead>
                <tr>
                  <th data-node-id="458:15908">TIMESTAMP</th>
                  <th data-node-id="458:15924">INVENTORY ITEM</th>
                  <th data-node-id="458:15945">MOVEMENT TYPE</th>
                  <th data-node-id="458:15966">QUANTITY</th>
                  <th data-node-id="458:15987">STOCK BALANCE</th>
                  <th data-node-id="458:16003">PROCESSED BY</th>
                  <th data-node-id="459:16250">REFERENCE ID</th>
                  <th data-node-id="459:16271">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="stock-ledger-empty">
                      No stock movement transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  rows.map((entry) => {
                    const delta = entry.quantityDelta || 0;
                    const isPositive = delta > 0;
                    const isNegative = delta < 0;
                    const uom = entry.unitOfMeasure ? ` ${entry.unitOfMeasure}` : " Unit";

                    return (
                      <tr key={entry.id}>
                        {/* TIMESTAMP */}
                        <td className="ledger-cell-timestamp">
                          {formatTimestamp(entry)}
                        </td>

                        {/* INVENTORY ITEM */}
                        <td>
                          <div className="ledger-cell-item">
                            <span className="ledger-item-name">
                              {entry.itemName || "Item"}
                            </span>
                            {entry.sku && (
                              <span className="ledger-item-sku">
                                {entry.sku}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* MOVEMENT TYPE */}
                        <td>
                          {renderMovementTypeBadge(entry.movementType, delta)}
                        </td>

                        {/* QUANTITY */}
                        <td>
                          <span
                            className={`ledger-cell-qty ${
                              isPositive ? "positive" : isNegative ? "negative" : ""
                            }`}
                          >
                            {isPositive ? `+${delta}` : delta}
                            {uom}
                          </span>
                        </td>

                        {/* STOCK BALANCE */}
                        <td className="ledger-cell-balance">
                          {entry.beforeQuantity === undefined || entry.beforeQuantity === null
                            ? "Legacy: not recorded"
                            : `${entry.beforeQuantity} → ${entry.afterQuantity}`}
                        </td>

                        {/* PROCESSED BY */}
                        <td className="ledger-cell-actor">
                          {entry.performedByName || "Administrator"}
                        </td>

                        {/* REFERENCE ID */}
                        <td>
                          {entry.referenceId ? (
                            <span className="ledger-ref-pill">
                              {entry.referenceId}
                            </span>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </td>

                        {/* REMARKS */}
                        <td className="ledger-cell-remarks">
                          {entry.reason || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Spin>
        </div>

        {/* 4. Custom Pagination (Node 458:16080) */}
        <div className="stock-ledger-pagination-wrap" data-node-id="458:16080">
          <div className="stock-ledger-pagination-info" data-node-id="458:16082">
            Showing {startItem} to {endItem} of {total} entries
          </div>

          <div className="stock-ledger-pagination-controls" data-node-id="458:16083">
            {/* Prev button */}
            <button
              type="button"
              className="stock-ledger-arrow-btn"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              data-node-id="458:16084"
              aria-label="Previous Page"
            >
              <ChevronLeftIcon />
            </button>

            {/* Page number buttons */}
            {renderPaginationButtons()}

            {/* Next button */}
            <button
              type="button"
              className="stock-ledger-arrow-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              data-node-id="458:16096"
              aria-label="Next Page"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
