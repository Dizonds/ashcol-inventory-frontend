import React, { useState, useMemo, useEffect } from "react";
import { Dropdown } from "antd";

// AC Type / Brand Product Images
import carrierSplitImg from "../assets/ac-types/carrier-split.png";
import kolinWindowImg from "../assets/ac-types/kolin-window.jpg";
import daikinSplitImg from "../assets/ac-types/daikin-split.jpg";
import panasonicSplitImg from "../assets/ac-types/panasonic-split.jpg";
import floorMountedImg from "../assets/ac-types/floor-mounted.jpg";
import ceilingCassetteImg from "../assets/ac-types/ceiling-cassette.jpg";
import portableAcImg from "../assets/ac-types/portable-ac.jpg";

import "./CompatibilityLookupPage.css";

/* --- EXACT SVG ICONS MATCHING FIGMA NODE 488:7758 --- */

// Search icon (Figma node 440:1874)
function SearchIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M21.71 20.29L18 16.61C19.4401 14.8144 20.1375 12.5353 19.9488 10.2413C19.7601 7.9473 18.6997 5.81278 16.9855 4.27664C15.2714 2.74051 13.0338 1.91951 10.7329 1.98247C8.43204 2.04543 6.24272 2.98756 4.61514 4.61514C2.98756 6.24272 2.04543 8.43204 1.98247 10.7329C1.91951 13.0338 2.74051 15.2714 4.27664 16.9855C5.81278 18.6997 7.9473 19.7601 10.2413 19.9488C12.5353 20.1375 14.8144 19.4401 16.61 18L20.29 21.68C20.383 21.7737 20.4936 21.8481 20.6154 21.8989C20.7373 21.9497 20.868 21.9758 21 21.9758C21.132 21.9758 21.2627 21.9497 21.3846 21.8989C21.5064 21.8481 21.617 21.7737 21.71 21.68C21.8902 21.4935 21.991 21.2443 21.991 20.985C21.991 20.7257 21.8902 20.4765 21.71 20.29ZM11 18C9.61553 18 8.26215 17.5895 7.11101 16.8203C5.95986 16.0511 5.06266 14.9579 4.53284 13.6788C4.00303 12.3997 3.86441 10.9922 4.1345 9.63437C4.4046 8.2765 5.07129 7.02922 6.05025 6.05025C7.02922 5.07129 8.2765 4.4046 9.63437 4.1345C10.9922 3.86441 12.3997 4.00303 13.6788 4.53284C14.9579 5.06266 16.0511 5.95986 16.8203 7.11101C17.5895 8.26215 18 9.61553 18 11C18 12.8565 17.2625 14.637 15.9497 15.9497C14.637 17.2625 12.8565 18 11 18Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Filter icon (Figma node 440:1901)
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
    <svg width={size} height={size * 0.6} viewBox="0 0 12 7" fill="none">
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

// Shipping Truck icon (Figma node 440:12224)
function ShippingTruckIcon({ size = 24 }) {
  return (
    <svg width={size} height={size * 0.81} viewBox="0 0 21.5 17.5" fill="none">
      <circle cx="15.75" cy="14.25" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.75" cy="14.25" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13.25 14.25H8.25M18.25 14.25H19.0132C19.2331 14.25 19.3431 14.25 19.4355 14.2385C20.1169 14.1536 20.6536 13.6169 20.7385 12.9355C20.75 12.8431 20.75 12.7331 20.75 12.5132V9.75C20.75 6.16015 17.8399 3.25 14.25 3.25M13.75 12.25V3.75C13.75 2.33579 13.75 1.62868 13.3107 1.18934C12.8713 0.750004 12.1642 0.750004 10.75 0.750004H3.75C2.33579 0.750004 1.62868 0.750004 1.18934 1.18934C0.750004 1.62868 0.750004 2.33579 0.750004 3.75V11.75C0.750004 12.6846 0.750004 13.1519 0.950966 13.5C1.08262 13.728 1.27197 13.9174 1.5 14.049C1.84808 14.25 2.31539 14.25 3.25 14.25"
        stroke="currentColor"
        strokeWidth="1.5"
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

/**
 * Intelligent image resolver that matches an AC unit to its specific photo
 * based on brand, category, SKU, and model name.
 */
export function getAcUnitImage(unit) {
  if (!unit) return carrierSplitImg;
  if (unit.image) return unit.image;

  const sku = (unit.sku || "").toUpperCase();
  const name = (unit.name || "").toLowerCase();
  const brand = (unit.brand || "").toLowerCase();
  const category = (unit.category || "").toLowerCase();

  // 1. Kolin or Window Type AC (KOL-0.75HP-WND, KOL-1.0HP-WINV, etc.)
  if (
    brand.includes("kolin") ||
    name.includes("kolin") ||
    sku.startsWith("KOL-") ||
    category.includes("window") ||
    name.includes("window")
  ) {
    return kolinWindowImg;
  }

  // 2. Floor Mounted / Floor Standing Commercial AC (GREE-3.0TR-FLR, MIDEA-5.0TR-FLR, etc.)
  if (
    category.includes("floor") ||
    name.includes("floor") ||
    sku.includes("FLR") ||
    sku.includes("PKG") ||
    name.includes("standing") ||
    name.includes("package ac")
  ) {
    return floorMountedImg;
  }

  // 3. Ceiling Cassette AC
  if (
    category.includes("cassette") ||
    name.includes("cassette") ||
    name.includes("ceiling") ||
    sku.includes("CAS")
  ) {
    return ceilingCassetteImg;
  }

  // 4. Portable AC (TCL-1.0HP-PORT, etc.)
  if (
    category.includes("portable") ||
    name.includes("portable") ||
    sku.includes("PORT")
  ) {
    return portableAcImg;
  }

  // 5. Daikin Inverter Split AC (DAIK-1.0HP-INV, DAIK-1.5HP-INV, etc.)
  if (
    brand.includes("daikin") ||
    name.includes("daikin") ||
    sku.startsWith("DAIK-")
  ) {
    return daikinSplitImg;
  }

  // 6. Panasonic Aero Inverter nanoe X Split AC (PANA-1.5HP-XPU, etc.)
  if (
    brand.includes("panasonic") ||
    name.includes("panasonic") ||
    sku.startsWith("PANA-")
  ) {
    return panasonicSplitImg;
  }

  // 7. Carrier Inverter Split AC (CAR-1.0HP-CRY, CAR-1.5HP-INV, CAR-2.0HP-INV, etc.)
  if (
    brand.includes("carrier") ||
    name.includes("carrier") ||
    sku.startsWith("CAR-")
  ) {
    return carrierSplitImg;
  }

  // Generic category fallbacks
  if (category.includes("window")) return kolinWindowImg;
  if (category.includes("floor")) return floorMountedImg;
  if (category.includes("cassette")) return ceilingCassetteImg;
  if (category.includes("portable")) return portableAcImg;

  return carrierSplitImg;
}

export default function CompatibilityLookupPage({ items = [], onNavigateToItem, isDark = false }) {
  // 1. Filter all available AC Units across brands and types
  const acUnits = useMemo(() => {
    return items.filter(
      (item) =>
        (item.itemType === "AC Unit" ||
          item.category === "Split Type" ||
          item.category === "Window Type" ||
          item.category === "Floor Mounted" ||
          item.category === "Floor Standing" ||
          item.category === "Portable" ||
          item.category === "Cassette" ||
          (item.sku &&
            (item.sku.startsWith("CAR-") ||
              item.sku.startsWith("KOL-") ||
              item.sku.startsWith("DAIK-") ||
              item.sku.startsWith("PANA-") ||
              item.sku.startsWith("GREE-") ||
              item.sku.startsWith("MIDEA-") ||
              item.sku.startsWith("TCL-")))) &&
        !item.archived
    );
  }, [items]);

  // Default to Carrier Aura Inverter if present, otherwise first AC unit
  const [selectedUnitId, setSelectedUnitId] = useState(() => {
    const carrier = acUnits.find(
      (u) => u.sku === "CAR-1.5HP-INV" || u.name?.toLowerCase().includes("carrier aura")
    );
    if (carrier) return carrier.id;
    return acUnits[0]?.id || "";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Selected AC Unit
  const selectedUnit = useMemo(() => {
    if (!selectedUnitId) return acUnits[0] || null;
    return (
      acUnits.find((item) => String(item.id || item._id || item.sku) === String(selectedUnitId)) ||
      acUnits[0] ||
      null
    );
  }, [acUnits, selectedUnitId]);

  // Active AC image according to the selected unit type/brand
  const activeAcImage = useMemo(() => {
    return getAcUnitImage(selectedUnit);
  }, [selectedUnit]);

  // 2. Find matching compatible parts for this unit
  const matchingParts = useMemo(() => {
    if (!selectedUnit) return [];

    const sku = String(selectedUnit.sku || "").trim().toUpperCase();
    const name = String(selectedUnit.name || "").trim().toUpperCase();
    return items.filter((part) => {
      if (part.itemType === "AC Unit" || part.archived) return false;
      return Array.isArray(part.compatibleModels) && part.compatibleModels.some((model) => {
        const reference = String(model).trim().toUpperCase();
        return reference && (reference === sku || reference === name);
      });
    });
  }, [items, selectedUnit]);

  // 3. Search query filter
  const filteredParts = useMemo(() => {
    if (!searchQuery.trim()) return matchingParts;
    const query = searchQuery.toLowerCase().trim();

    return matchingParts.filter((part) => {
      return (
        part.sku?.toLowerCase().includes(query) ||
        part.name?.toLowerCase().includes(query) ||
        part.category?.toLowerCase().includes(query) ||
        part.itemType?.toLowerCase().includes(query) ||
        part.supplier?.toLowerCase().includes(query)
      );
    });
  }, [matchingParts, searchQuery]);

  // 4. Metric calculations matching Figma Node 488:7595, 488:7602, 488:7609
  const compatibleItemsCount = filteredParts.length;
  const stockByUnit = useMemo(() => {
    const totals = filteredParts.reduce((result, part) => {
      const unit = part.unitOfMeasure || "UNIT";
      result[unit] = Math.round(((result[unit] || 0) + Number(part.quantity || 0)) * 1000) / 1000;
      return result;
    }, {});
    return Object.entries(totals).map(([unit, total]) => `${total} ${unit}`).join(" · ") || "0";
  }, [filteredParts]);
  const suppliersCount = useMemo(() => {
    return new Set(filteredParts.map((p) => p.supplier).filter(Boolean)).size;
  }, [filteredParts]);

  // 5. Pagination
  const totalEntries = filteredParts.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  useEffect(() => { setCurrentPage((page) => Math.min(page, totalPages)); }, [totalPages]);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedParts = useMemo(() => {
    return filteredParts.slice(startIndex, startIndex + pageSize);
  }, [filteredParts, startIndex, pageSize]);

  const startEntry = totalEntries === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(startIndex + pageSize, totalEntries);

  // Model Selector Dropdown menu with rich thumbnails and tags
  const modelMenuItems = useMemo(() => {
    return acUnits.map((unit) => {
      const uKey = String(unit.id || unit._id || unit.sku);
      const unitImg = getAcUnitImage(unit);
      const isSelected = uKey === String(selectedUnit?.id || selectedUnit?._id || selectedUnit?.sku);

      return {
        key: uKey,
        label: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "6px 4px",
              minWidth: 280,
            }}
          >
            <div
              style={{
                width: 44,
                height: 36,
                borderRadius: 6,
                background: "#f4f4f4",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: isSelected ? "1.5px solid #13c906" : "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <img
                src={unitImg}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ color: isSelected ? "#006830" : "#111827", fontSize: 13 }}>
                  {unit.sku}
                </strong>
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 4,
                    background: unit.category?.toLowerCase().includes("window")
                      ? "#e0f2fe"
                      : unit.category?.toLowerCase().includes("floor")
                      ? "#fef3c7"
                      : "#f3f4f6",
                    color: unit.category?.toLowerCase().includes("window")
                      ? "#0369a1"
                      : unit.category?.toLowerCase().includes("floor")
                      ? "#b45309"
                      : "#4b5563",
                    fontWeight: 500,
                  }}
                >
                  {unit.category || unit.brand}
                </span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "#4b5563",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {unit.name}
              </span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                {unit.capacity || "AC Unit"} • Stock: {unit.quantity} {unit.unitOfMeasure || "UNIT"}
              </span>
            </div>
          </div>
        ),
        onClick: () => {
          setSelectedUnitId(unit.id);
          setCurrentPage(1);
        },
      };
    });
  }, [acUnits, selectedUnit]);

  return (
    <div className={`model-matching-container ${isDark ? "dark" : ""}`}>
      {/* ====================================================================
          1. MODEL MATCHING OVERVIEW CARD
          ==================================================================== */}
      <div className="model-matching-overview-card">
        <div><h2 className="model-matching-overview-title">Model Matching Overview</h2><p className="model-matching-help">Matches use the compatible models saved in each item's specifications.</p></div>

        <div className="model-matching-overview-actions">
          {/* Inset Search Box (Node 488:7622) */}
          <div className="model-matching-search-box">
            <span className="model-matching-search-icon">
              <SearchIcon size={20} />
            </span>
            <input
              type="text"
              className="model-matching-search-input"
              placeholder="Search SKU, name, or supplier"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="model-matching-search-clear"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Model Selector Dropdown (Node 488:7625) */}
          <Dropdown
            menu={{
              items: modelMenuItems,
              onClick: ({ key }) => {
                setSelectedUnitId(key);
                setCurrentPage(1);
              },
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <div className="model-matching-selector-btn" role="button" tabIndex={0}>
              <div className="model-matching-selector-label">
                <span className="model-matching-selector-icon">
                  <FilterIcon size={20} />
                </span>
                <span title={selectedUnit ? `${selectedUnit.sku} — ${selectedUnit.name}` : "Select AC Unit Model"}>
                  {selectedUnit ? `${selectedUnit.brand} (${selectedUnit.sku})` : "Select AC Unit Model"}
                </span>
              </div>
              <span className="model-matching-selector-chevron">
                <ChevronDownIcon size={14} />
              </span>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* ====================================================================
          2. METRIC CARDS ROW (3 CARDS)
          ==================================================================== */}
      <div className="model-matching-metrics-grid">
        {/* Card 1: Compatible Items */}
        <div className="model-matching-metric-card">
          <h1 className="model-matching-metric-value">{compatibleItemsCount}</h1>
          <div className="model-matching-metric-label-group">
            <span className="model-matching-metric-icon">
              <ShippingTruckIcon size={24} />
            </span>
            <span className="model-matching-metric-label">Compatible Items</span>
          </div>
        </div>

        {/* Card 2: Total Stock Units */}
        <div className="model-matching-metric-card">
          <h1 className="model-matching-metric-value model-matching-unit-totals">{stockByUnit}</h1>
          <div className="model-matching-metric-label-group">
            <span className="model-matching-metric-icon">
              <ShippingTruckIcon size={24} />
            </span>
            <span className="model-matching-metric-label">Stock by unit</span>
          </div>
        </div>

        {/* Card 3: Suppliers & Vendors */}
        <div className="model-matching-metric-card">
          <h1 className="model-matching-metric-value">{suppliersCount}</h1>
          <div className="model-matching-metric-label-group">
            <span className="model-matching-metric-icon">
              <ShippingTruckIcon size={24} />
            </span>
            <span className="model-matching-metric-label">Suppliers & Vendors</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. MAIN CONTENT: TWO-COLUMN LAYOUT
          ==================================================================== */}
      <div className="model-matching-content-grid">
        {/* LEFT COLUMN: AC UNIT DETAILS CARD (Node 488:7630) */}
        <div className="model-matching-left-card">
          <div className="model-matching-image-wrapper">
            <img
              src={activeAcImage}
              alt={selectedUnit?.name || "AC Unit"}
              className="model-matching-image"
              key={selectedUnit?.sku || "default-ac"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = carrierSplitImg;
              }}
            />
          </div>

          {/* AC Unit Specification Box (Node 488:7631) */}
          <div className="model-matching-spec-box">
            {/* Row 1: SKU, ITEM, TYPE / CATEGORY */}
            <div className="model-matching-spec-row">
              <div className="model-matching-spec-col" style={{ width: "30%" }}>
                <p className="model-matching-spec-label">SKU</p>
                <p className="model-matching-spec-value">
                  {selectedUnit?.sku || "—"}
                </p>
              </div>

              <div className="model-matching-spec-col" style={{ width: "40%" }}>
                <p className="model-matching-spec-label">ITEM</p>
                <p className="model-matching-spec-value">
                  {selectedUnit?.name || "Carrier Aura Inverter High Wall Split"}
                </p>
              </div>

              <div className="model-matching-spec-col" style={{ width: "30%" }}>
                <p className="model-matching-spec-label">TYPE / CATEGORY</p>
                <p className="model-matching-spec-value">
                  {selectedUnit?.itemType || "AC Unit"}
                  <br />
                  {selectedUnit?.category || "Split Type"}
                </p>
              </div>
            </div>

            {/* Row 2: SPEC, CURRENT STOCK */}
            <div className="model-matching-spec-row">
              <div className="model-matching-spec-col" style={{ width: "50%" }}>
                <p className="model-matching-spec-label">SPEC</p>
                <p className="model-matching-spec-value">
                  {selectedUnit?.capacity ? (
                    selectedUnit.capacity.includes("/") ? (
                      selectedUnit.capacity.split("/").map((part, idx) => (
                        <React.Fragment key={idx}>
                          {part.trim()}
                          {idx === 0 && <br />}
                        </React.Fragment>
                      ))
                    ) : (
                      selectedUnit.capacity
                    )
                  ) : (
                    <>
                      1.5 HP
                      <br />
                      12,500 BTU
                    </>
                  )}
                </p>
              </div>

              <div className="model-matching-spec-col" style={{ width: "50%" }}>
                <p className="model-matching-spec-label">CURRENT STOCK</p>
                <p className="model-matching-spec-value">
                  {selectedUnit ? `${selectedUnit.quantity || 0} ${selectedUnit.unitOfMeasure || "UNIT"}` : "0 UNIT"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: COMPATIBLE ITEMS TABLE (Node 488:7648) */}
        <div className="model-matching-table-card">
          <div className="model-matching-table-container">
            <table className="model-matching-table">
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>SKU</th>
                  <th style={{ width: "32%" }}>PART / MATERIAL NAME</th>
                  <th style={{ width: "20%" }}>CLASSIFICATION</th>
                  <th style={{ width: "15%" }}>IN STOCK</th>
                  <th style={{ width: "15%" }}>SUPPLIER</th>
                </tr>
              </thead>
              <tbody>
                {paginatedParts.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="model-matching-empty">
                        <h4>No compatible parts found</h4>
                        <p>
                          {searchQuery
                            ? `No items match "${searchQuery}". Try a different search term.`
                            : "No compatible parts registered for this model yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedParts.map((item) => {
                    const qty = Number(item.quantity) || 0;
                    const uom = item.unitOfMeasure || "UNIT";
                    const reorder = Number(item.reorderLevel) || 3;

                    let stockClass = "on-hand";
                    let stockText = `${qty} ${uom} (On Hand)`;

                    if (qty === 0) {
                      stockClass = "no-stock";
                      stockText = "Out of Stock";
                    } else if (qty <= reorder) {
                      stockClass = "low-stock";
                      stockText = `${qty} ${uom} (Low Stock)`;
                    }

                    return (
                      <tr key={item.id}>
                        <td className="model-matching-cell-sku">{item.sku}</td>
                        <td className="model-matching-cell-name">{item.name}</td>
                        <td className="model-matching-cell-classification">
                          {item.itemType || "Part"}
                          <br />
                          {item.category || "General"}
                        </td>
                        <td>
                          <span className={`model-matching-stock-pill ${stockClass}`}>
                            {stockText}
                          </span>
                        </td>
                        <td className="model-matching-cell-supplier">
                          {item.supplier || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer (Node 488:7651) */}
          <div className="model-matching-pagination-footer">
            <p className="model-matching-pagination-info">
              Showing {startEntry} to {endEntry} of {totalEntries} entries
            </p>

            <div className="model-matching-pagination-controls">
              {/* Prev Button */}
              <button
                type="button"
                className="model-matching-page-btn prev-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                aria-label="Previous Page"
              >
                <ChevronLeftIcon />
              </button>

              {/* Numbered Page Buttons */}
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`model-matching-page-btn ${pageNum === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next Button */}
              <button
                type="button"
                className="model-matching-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                aria-label="Next Page"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
