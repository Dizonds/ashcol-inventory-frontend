import React, { useState, useEffect, useMemo } from "react";
import { Spin, Alert, Dropdown } from "antd";
import { api, errorMessage } from "../api";
import "./MovementsPage.css";

/* --- EXACT SVG ICONS MATCHING FIGMA NODE 488:7823 --- */

// Qlementine list icon (Figma node 440:3250)
function QlementineItemsListIcon({ size = 24, color = "#12A807" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 3C0 2.3025 0 1.9545 0.0765 1.668C0.178789 1.2868 0.37955 0.939217 0.658633 0.660134C0.937717 0.38105 1.2853 0.180289 1.6665 0.078C1.953 0.00150001 2.301 0.0015 3 0.0015C3.699 0.0015 4.0455 0.00150001 4.332 0.078C5.109 0.2865 5.715 0.8925 5.922 1.668C5.9985 1.9545 5.9985 2.3025 5.9985 3C5.9985 3.6975 5.9985 4.0455 5.9235 4.332C5.82121 4.7132 5.62045 5.06078 5.34137 5.33987C5.06228 5.61895 4.7147 5.81971 4.3335 5.922C4.0455 5.9985 3.6975 5.9985 3 5.9985C2.3025 5.9985 1.9545 5.9985 1.668 5.922C1.2868 5.81971 0.939217 5.61895 0.660133 5.33987C0.38105 5.06078 0.180289 4.7132 0.078 4.332C0 4.0455 0 3.6975 0 3ZM3 4.5C2.637 4.5 2.4165 4.5 2.2485 4.4925C2.18418 4.49062 2.12005 4.48461 2.0565 4.4745C1.92913 4.44047 1.81298 4.37347 1.71976 4.28024C1.62653 4.18702 1.55953 4.07087 1.5255 3.9435C1.527 3.9495 1.515 3.912 1.5075 3.7515C1.5 3.5835 1.5 3.36 1.5 3C1.5 2.64 1.5 2.4165 1.5075 2.2485C1.515 2.088 1.527 2.0505 1.5255 2.0565C1.55953 1.92913 1.62653 1.81298 1.71976 1.71976C1.81298 1.62653 1.92913 1.55953 2.0565 1.5255C2.0505 1.527 2.088 1.515 2.2485 1.5075C2.4165 1.5 2.6385 1.5 3 1.5C3.3615 1.5 3.5835 1.5 3.7515 1.5075C3.912 1.515 3.9495 1.527 3.9435 1.5255C4.07087 1.55953 4.18702 1.62653 4.28024 1.71976C4.37347 1.81298 4.44047 1.92913 4.4745 2.0565C4.473 2.0505 4.485 2.088 4.4925 2.2485C4.5 2.4165 4.5 2.6385 4.5 3C4.5 3.3615 4.5 3.5835 4.4925 3.7515C4.49062 3.81582 4.48461 3.87995 4.4745 3.9435C4.44047 4.07087 4.37347 4.18702 4.28024 4.28024C4.18702 4.37347 4.07087 4.44047 3.9435 4.4745C3.9495 4.473 3.912 4.485 3.7515 4.4925C3.5835 4.5 3.3615 4.5 3 4.5ZM0 12C0 11.3025 0 10.9545 0.0765 10.668C0.178789 10.2868 0.37955 9.93922 0.658633 9.66013C0.937717 9.38105 1.2853 9.18029 1.6665 9.078C1.953 9.0015 2.301 9.0015 2.9985 9.0015C3.696 9.0015 4.044 9.0015 4.3305 9.078C5.1075 9.2865 5.7135 9.8925 5.9205 10.668C5.997 10.9545 5.997 11.3025 5.997 12C5.997 12.6975 5.997 13.0455 5.922 13.332C5.81971 13.7132 5.61895 14.0608 5.33987 14.3399C5.06078 14.6189 4.7132 14.8197 4.332 14.922C4.044 14.9985 3.696 14.9985 2.9985 14.9985C2.301 14.9985 1.953 14.9985 1.6665 14.922C1.2853 14.8197 0.937717 14.6189 0.658633 14.3399C0.37955 14.0608 0.178789 13.7132 0.0765 13.332C0 13.0455 0 12.6975 0 12ZM3 13.5C2.637 13.5 2.4165 13.5 2.2485 13.4925C2.18418 13.4906 2.12005 13.4846 2.0565 13.4745C1.92913 13.4405 1.81298 13.3735 1.71976 13.2802C1.62653 13.187 1.55953 13.0709 1.5255 12.9435C1.527 12.9495 1.515 12.912 1.5075 12.7515C1.5 12.5835 1.5 12.3615 1.5 12C1.5 11.6385 1.5 11.4165 1.5075 11.2485C1.515 11.088 1.527 11.0505 1.5255 11.0565C1.55953 10.9291 1.62653 10.813 1.71976 10.7198C1.81298 10.6265 1.92913 10.5595 2.0565 10.5255C2.0565 10.5255 2.0985 10.515 2.2485 10.5075C2.4165 10.5 2.6385 10.5 3 10.5C3.3615 10.5 3.5835 10.5 3.7515 10.5075C3.912 10.515 3.9495 10.527 3.9435 10.5255C4.07087 10.5595 4.18702 10.6265 4.28024 10.7198C4.37347 10.813 4.44047 10.9291 4.4745 11.0565C4.4745 11.0565 4.485 11.0985 4.4925 11.2485C4.5 11.4165 4.5 11.6385 4.5 12C4.5 12.3615 4.5 12.5835 4.4925 12.7515C4.49062 12.8158 4.48461 12.88 4.4745 12.9435C4.44047 13.0709 4.37347 13.187 4.28024 13.2802C4.18702 13.3735 4.07087 13.4405 3.9435 13.4745C3.9435 13.4745 3.9015 13.485 3.7515 13.4925C3.5835 13.5 3.3615 13.5 3 13.5ZM0.0765 19.65C0 19.9365 0 20.2845 0 20.982C0 21.6795 0 22.029 0.0765 22.314C0.178789 22.6952 0.37955 23.0428 0.658633 23.3219C0.937717 23.6009 1.2853 23.8017 1.6665 23.904C1.953 23.9805 2.301 23.9805 2.9985 23.9805C3.696 23.9805 4.044 23.9805 4.3305 23.904C4.7117 23.8017 5.05928 23.6009 5.33837 23.3219C5.61745 23.0428 5.81821 22.6952 5.9205 22.314C5.997 22.0275 5.997 21.6795 5.997 20.982C5.997 20.2845 5.997 19.935 5.922 19.65C5.81971 19.2688 5.61895 18.9212 5.33987 18.6421C5.06078 18.363 4.7132 18.1623 4.332 18.06C4.044 17.9835 3.696 17.9835 2.9985 17.9835C2.301 17.9835 1.953 17.9835 1.6665 18.06C1.2853 18.1623 0.937717 18.363 0.658633 18.6421C0.37955 18.9212 0.178789 19.2688 0.0765 19.65ZM2.2515 22.47C2.4195 22.4775 2.6415 22.4775 3.003 22.4775C3.3645 22.4775 3.588 22.4775 3.7545 22.47C3.81896 22.4709 3.88333 22.4649 3.9465 22.452C4.07359 22.4177 4.18943 22.3506 4.28238 22.2574C4.37532 22.1642 4.4421 22.0482 4.476 21.921C4.476 21.9165 4.4865 21.87 4.494 21.729C4.5015 21.561 4.5015 21.339 4.5015 20.979C4.5015 20.619 4.5015 20.394 4.494 20.226C4.4865 20.076 4.476 20.034 4.476 20.034C4.44187 19.9071 4.37499 19.7914 4.28206 19.6984C4.18913 19.6055 4.07341 19.5386 3.9465 19.5045C3.9465 19.5045 3.9045 19.494 3.7545 19.488C3.5865 19.4805 3.3645 19.479 3.003 19.479C2.6415 19.479 2.4195 19.479 2.2515 19.488C2.18721 19.4894 2.12308 19.4949 2.0595 19.5045C1.93241 19.5388 1.81657 19.6059 1.72362 19.6991C1.63068 19.7923 1.5639 19.9083 1.53 20.0355C1.53 20.0355 1.5195 20.0775 1.512 20.2275C1.5045 20.3955 1.5045 20.6175 1.5045 20.979C1.5045 21.3405 1.5045 21.564 1.512 21.7305C1.5195 21.891 1.5315 21.9285 1.53 21.9225C1.56403 22.0499 1.63103 22.166 1.72426 22.2592C1.81748 22.3525 1.93363 22.4195 2.061 22.4535C2.12455 22.4636 2.18868 22.4696 2.253 22.4715L2.2515 22.47Z"
        fill={color}
      />
      <path
        d="M9.75 3C9.55109 3 9.36032 3.07902 9.21967 3.21967C9.07902 3.36032 9 3.55109 9 3.75C9 3.94891 9.07902 4.13968 9.21967 4.28033C9.36032 4.42098 9.55109 4.5 9.75 4.5H23.25C23.4489 4.5 23.6397 4.42098 23.7803 4.28033C23.921 4.13968 24 3.94891 24 3.75C24 3.55109 23.921 3.36032 23.7803 3.21967C23.6397 3.07902 23.4489 3 23.25 3H9.75ZM9 12.75C9 12.5511 9.07902 12.3603 9.21967 12.2197C9.36032 12.079 9.55109 12 9.75 12H23.25C23.4489 12 23.6397 12.079 23.7803 12.2197C23.921 12.3603 24 12.5511 24 12.75C24 12.9489 23.921 13.1397 23.7803 13.2803C23.6397 13.421 23.4489 13.5 23.25 13.5H9.75C9.55109 13.5 9.36032 13.421 9.21967 13.2803C9.07902 13.1397 9 12.9489 9 12.75ZM9.75 21C9.55109 21 9.36032 21.079 9.21967 21.2197C9.07902 21.3603 9 21.5511 9 21.75C9 21.9489 9.07902 22.1397 9.21967 22.2803C9.36032 22.421 9.55109 22.5 9.75 22.5H23.25C23.4489 22.5 23.6397 22.421 23.7803 22.2803C23.921 22.1397 24 21.9489 24 21.75C24 21.5511 23.921 21.3603 23.7803 21.2197C23.6397 21.079 23.4489 21 23.25 21H9.75Z"
        fill={color}
      />
    </svg>
  );
}

// UIL Search icon (Figma node 440:1874)
function SearchIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M21.71 20.29L18 16.61C19.4401 14.8144 20.1375 12.5353 19.9488 10.2413C19.7601 7.9473 18.6997 5.81278 16.9855 4.27664C15.2714 2.74051 13.0338 1.91951 10.7329 1.98247C8.43204 2.04543 6.24272 2.98756 4.61514 4.61514C2.98756 6.24272 2.04543 8.43204 1.98247 10.7329C1.91951 13.0338 2.74051 15.2714 4.27664 16.9855C5.81278 18.6997 7.9473 19.7601 10.2413 19.9488C12.5353 20.1375 14.8144 19.4401 16.61 18L20.29 21.68C20.383 21.7737 20.4936 21.8481 20.6154 21.8989C20.7373 21.9497 20.868 21.9758 21 21.9758C21.132 21.9758 21.2627 21.9497 21.3846 21.8989C21.5064 21.8481 21.617 21.7737 21.71 21.68C21.8902 21.4935 21.991 21.2443 21.991 20.985C21.991 20.7257 21.8902 20.4765 21.71 20.29ZM11 18C9.61553 18 8.26215 17.5895 7.11101 16.8203C5.95986 16.0511 5.06266 14.9579 4.53284 13.6788C4.00303 12.3997 3.86441 10.9922 4.1345 9.63437C4.4046 8.2765 5.07129 7.02922 6.05025 6.05025C7.02922 5.07129 8.2765 4.4046 9.63437 4.1345C10.9922 3.86441 12.3997 4.00303 13.6788 4.53284C14.9579 5.06266 16.0511 5.95986 16.8203 7.11101C17.5895 8.26215 18 9.61553 18 11C18 12.8565 17.2625 14.637 15.9497 15.9497C14.637 17.2625 12.8565 18 11 18Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Proicons filter (Figma node 440:1901)
function FilterIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M6 9.66667H26M9.84667 16H22.1533M13.6933 22.3333H18.3067"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Chevron Down icon (Figma node 440:1903)
function ChevronDownIcon({ size = 12 }) {
  return (
    <svg width={size} height={size * 0.58} viewBox="0 0 12 7" fill="none">
      <path
        d="M1 1L6 6L11 1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Chevron Left icon
function ChevronLeftIcon() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
      <path
        d="M7 1L1 7L7 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Chevron Right icon
function ChevronRightIcon() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
      <path
        d="M1 1L7 7L1 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MOVEMENT_TYPES = [
  { value: "", label: "All Movement Types" },
  { value: "STOCK_IN", label: "Stock In" },
  { value: "STOCK_OUT", label: "Stock Out" },
  { value: "TRANSFER_OUT", label: "Transfer Out" },
  { value: "TRANSFER_IN", label: "Transfer In" },
  { value: "REQUEST_ISSUE", label: "Material Request Issue" },
  { value: "OPENING", label: "Opening Balance" },
  { value: "DETAILS", label: "Details Update" },
  { value: "ARCHIVE", label: "Archive" },
  { value: "RESTORE", label: "Restore" },
];

export default function MovementsPage({ branchId, refresh }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // 6 rows per page matching Figma node 488:7823
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

  // Format timestamp in Philippine time matching Figma: 10/11/2026 1:41 AM
  const formatTimestamp = (entry) => {
    if (!entry.createdAt) return entry.date || "Legacy";
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
      return entry.date || "Legacy";
    }
  };

  // Helper to format movement type badge matching Figma
  const renderMovementTypeBadge = (rawType) => {
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

  // Pagination calculation matching Figma
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

  // Filter dropdown menu items
  const filterMenuItems = useMemo(() => {
    return MOVEMENT_TYPES.map((item) => ({
      key: item.value,
      label: (
        <span style={{ fontWeight: item.value === type ? 600 : 400, color: item.value === type ? "#006830" : "inherit" }}>
          {item.label}
        </span>
      ),
    }));
  }, [type]);

  const activeFilterLabel = useMemo(() => {
    const found = MOVEMENT_TYPES.find((m) => m.value === type);
    return found ? found.label : "All Movement Types";
  }, [type]);

  return (
    <div className="stock-ledger-container">
      {error && (
        <Alert
          type="error"
          message={error}
          closable
          onClose={() => setError("")}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Main Card: Inventory Transaction History (Figma Node 458:15886) */}
      <div className="stock-ledger-card" data-node-id="458:15886">
        {/* Toolbar (Figma Node 458:15887) */}
        <div className="stock-ledger-toolbar" data-node-id="458:15887">
          <div className="stock-ledger-toolbar-left" data-node-id="458:15888">
            <div className="stock-ledger-title-group" data-node-id="458:15889">
              <div className="stock-ledger-list-icon-badge" data-node-id="458:15890">
                <QlementineItemsListIcon size={24} color="#12a807" />
              </div>
              <h2 className="stock-ledger-section-title" data-node-id="458:15892">
                Inventory Transaction History
              </h2>
            </div>

            {/* Inset Search Box (Figma Node 458:15893) */}
            <div className="stock-ledger-search-wrap" data-node-id="458:15893">
              <span className="stock-ledger-search-icon">
                <SearchIcon size={20} />
              </span>
              <input
                type="text"
                className="stock-ledger-search-input"
                placeholder="Search SKU, item, or reference"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  className="stock-ledger-search-clear"
                  onClick={() => setSearchInput("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdown Pill (Figma Node 458:15896 / 458:15897) */}
          <div className="stock-ledger-toolbar-right" data-node-id="458:15896">
            <Dropdown
              menu={{
                items: filterMenuItems,
                onClick: ({ key }) => {
                  setType(key);
                  setPage(1);
                },
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div className="stock-ledger-filter-pill" role="button" tabIndex={0} data-node-id="458:15897">
                <div className="stock-ledger-filter-label">
                  <span className="stock-ledger-filter-icon">
                    <FilterIcon size={20} />
                  </span>
                  <span>{activeFilterLabel}</span>
                </div>
                <span className="stock-ledger-filter-chevron">
                  <ChevronDownIcon size={14} />
                </span>
              </div>
            </Dropdown>
          </div>
        </div>

        {/* Table (Figma Node 458:15905) */}
        <div className="stock-ledger-table-wrap" data-node-id="458:15905">
          <Spin spinning={loading}>
            <table className="stock-ledger-table">
              <thead>
                <tr>
                  <th style={{ width: "13%" }} data-node-id="458:15908">TIMESTAMP</th>
                  <th style={{ width: "20%" }} data-node-id="458:15924">INVENTORY ITEM</th>
                  <th style={{ width: "11%" }} data-node-id="458:15945">MOVEMENT TYPE</th>
                  <th style={{ width: "10%" }} data-node-id="458:15966">QUANTITY</th>
                  <th style={{ width: "11%" }} data-node-id="458:15987">STOCK BALANCE</th>
                  <th style={{ width: "11%" }} data-node-id="458:16003">PROCESSED BY</th>
                  <th style={{ width: "10%" }} data-node-id="459:16250">REFERENCE ID</th>
                  <th style={{ width: "14%" }} data-node-id="459:16271">REMARKS</th>
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
                    const delta = Number(entry.quantityDelta) || 0;
                    const isPositive = delta > 0;
                    const uom = entry.unitOfMeasure ? ` ${entry.unitOfMeasure}` : " Unit";
                    const formattedQty = isPositive ? `+${delta}${uom}` : `${delta}${uom}`;

                    return (
                      <tr key={entry.id || entry._id}>
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
                          {renderMovementTypeBadge(entry.movementType)}
                        </td>

                        {/* QUANTITY */}
                        <td>
                          <span className="ledger-cell-qty">
                            {formattedQty}
                          </span>
                        </td>

                        {/* STOCK BALANCE */}
                        <td className="ledger-cell-balance">
                          {entry.beforeQuantity === undefined || entry.beforeQuantity === null
                            ? "—"
                            : `${entry.beforeQuantity} → ${entry.afterQuantity}`}
                        </td>

                        {/* PROCESSED BY */}
                        <td className="ledger-cell-actor">
                          {entry.performedByName || "Administrator"}
                        </td>

                        {/* REFERENCE ID */}
                        <td>
                          <span className="ledger-cell-ref">
                            {entry.referenceId || "—"}
                          </span>
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

        {/* Custom Pagination (Figma Node 458:16080) */}
        <div className="stock-ledger-pagination-wrap" data-node-id="458:16080">
          <div className="stock-ledger-pagination-info" data-node-id="458:16082">
            Showing {startItem} to {endItem} of {total} entries
          </div>

          <div className="stock-ledger-pagination-controls" data-node-id="458:16083">
            {/* Prev button */}
            <button
              type="button"
              className="stock-ledger-arrow-btn prev-btn"
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
