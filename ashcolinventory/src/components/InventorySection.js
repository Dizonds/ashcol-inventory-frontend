import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Select,
  Modal,
  Input,
  InputNumber,
  Alert,
  Popconfirm,
  Typography,
  Descriptions,
  Tooltip,
  Dropdown,
} from "antd";
import { BusBoldDuotoneIcon } from "@solar-icons/react";
import { api, errorMessage } from "../api";
import { formatMoney } from "../utils/formatters";
import "./InventorySection.css";

/* --- FIGMA EXACT SVG ICONS --- */
function QlementineItemsListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6H5M4 12H5M4 18H5M8 6H20M8 12H20M8 18H20"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16.5 16.5L20 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6H20M7 12H17M10 18H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterResetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3v5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 8v13H3V8M1 3h22v5H1V3zm9 9h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
  );
}

function EyeViewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function PencilEditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShippingTruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M1 3h14v13H1V3zm14 5h4l3 3v5h-7V8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const emptyItem = {
  sku: "",
  name: "",
  itemType: "AC Unit",
  category: "Split Type",
  brand: "Carrier",
  capacity: "",
  unitOfMeasure: "UNIT",
  unitCost: 0,
  listPrice: 0,
  quantity: 0,
  reorderLevel: 3,
  supplier: "",
  compatibleModels: [],
};
const isContinuousUnit = (unit) =>
  ["METER", "FOOT", "KG", "LITER"].includes(unit);

const units = [
  "UNIT",
  "PCS",
  "METER",
  "FOOT",
  "KG",
  "LITER",
  "ROLL",
  "CYLINDER",
  "CYL",
  "PAIR",
  "CAN",
  "SET",
];

export default function InventorySection({
  items,
  brands,
  branches = [],
  user,
  branchId,
  save,
  preselectedFilter,
  onNavigateToPostMovement,
}) {
  const canManage = user.role !== "EMPLOYEE";
  const serviceVans = branches.filter((b) => b.branchType === "SERVICE_VAN");
  const [loadVanItem, setLoadVanItem] = useState(null);
  const [selectedVanId, setSelectedVanId] = useState("");
  const [loadQuantity, setLoadQuantity] = useState(1);
  const [loadNotes, setLoadNotes] = useState("");
  const [loadBusy, setLoadBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [type, setType] = useState(
    preselectedFilter && preselectedFilter.itemType
      ? preselectedFilter.itemType
      : "ALL",
  );
  const [status, setStatus] = useState(
    preselectedFilter && preselectedFilter.status
      ? preselectedFilter.status
      : "ALL",
  );
  const [category, setCategory] = useState(
    preselectedFilter && preselectedFilter.category
      ? preselectedFilter.category
      : "",
  );
  const [brand, setBrand] = useState("");
  const [archived, setArchived] = useState(false);
  const [archivedItems, setArchivedItems] = useState([]);
  const [archiveError, setArchiveError] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [values, setValues] = useState(emptyItem);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [suppliersList, setSuppliersList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const categoriesByType = {
    "AC Unit": ["Split Type", "Window Type", "Floor Mounted", "Portable"],
    "Spare Part": [
      "Compressors",
      "Fan Motors",
      "PCBs & Inverters",
      "Capacitors",
      "Sensors & Thermostats",
      "Valves & Coils",
    ],
    "Consumable": [
      "Refrigerants",
      "Copper Tubing",
      "Installation Materials",
      "Insulation & Aerotape",
      "Drain Hoses & Fittings",
      "Brazing & Silver Rods",
    ],
    "Tool / Equipment": [
      "Vacuum Pumps",
      "Manifold Gauges",
      "Flaring & Swaging Tools",
      "Clamp & Multimeters",
      "Leak Detectors",
      "Hand Tools",
    ],
    "Material / Part": [
      "Compressors",
      "Refrigerants",
      "Installation Materials",
      "Copper Tubing",
    ],
  };
  const categories = categoriesByType[values.itemType] || [
    "Compressors",
    "Refrigerants",
    "Installation Materials",
    "Copper Tubing",
  ];

  useEffect(() => {
    let active = true;
    const req = api("get", "/suppliers");
    if (req && typeof req.then === "function") {
      req
        .then((res) => {
          if (active && res && Array.isArray(res.data)) {
            setSuppliersList(res.data);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!archived) return;
    let active = true;
    setArchiveError("");
    setArchiveLoading(true);
    api("get", "/products", null, { branchId, archived: true })
      .then(({ data }) => {
        if (active) setArchivedItems(data);
      })
      .catch((err) => {
        if (active) setArchiveError(errorMessage(err));
      })
      .finally(() => {
        if (active) setArchiveLoading(false);
      });
    return () => {
      active = false;
    };
  }, [archived, branchId, items]);

  function field(name, value) {
    setValues({ ...values, [name]: value });
  }
  function open(item) {
    setValues(item || { ...emptyItem });
    setEditing(item ? item.id : "new");
    setFormError("");
  }
  function submit(event) {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    const payload = { ...values, branchId };
    if (editing !== "new") delete payload.quantity;
    save(
      editing === "new" ? "post" : "put",
      editing === "new" ? "/products" : `/products/${editing}`,
      payload,
      "Inventory item saved.",
    )
      .then(() => setEditing(null))
      .catch((err) => setFormError(errorMessage(err)))
      .finally(() => setBusy(false));
  }

  const visible = (archived ? archivedItems : items).filter((item) => {
    const matchesText = `${item.sku} ${item.name} ${item.brand}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return (
      matchesText &&
      (type === "ALL" || item.itemType === type) &&
      (!category || item.category === category) &&
      (!brand || item.brand === brand) &&
      (status === "ALL" ||
        (status === "LOW"
          ? item.quantity > 0 && item.quantity <= item.reorderLevel
          : item.quantity === 0))
    );
  });

  // Calculate pagination boundaries
  const totalEntries = visible.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const currentSafePage = Math.min(currentPage, totalPages);
  const startEntry = totalEntries === 0 ? 0 : (currentSafePage - 1) * pageSize + 1;
  const endEntry = Math.min(currentSafePage * pageSize, totalEntries);
  const paginatedData = visible.slice((currentSafePage - 1) * pageSize, currentSafePage * pageSize);

  // Menus for Dropdown filter pills
  const typeMenu = {
    items: [
      "ALL",
      "AC Unit",
      "Spare Part",
      "Consumable",
      "Tool / Equipment",
      "Material / Part",
    ].map((t) => ({
      key: t,
      label: t,
      onClick: () => {
        setType(t);
        setCurrentPage(1);
      },
    })),
  };

  const statusMenu = {
    items: [
      { key: "ALL", label: "All Stock Levels" },
      { key: "LOW", label: "Low Stock" },
      { key: "OUT", label: "Out of Stock" },
    ].map((s) => ({
      key: s.key,
      label: s.label,
      onClick: () => {
        setStatus(s.key);
        setCurrentPage(1);
      },
    })),
  };

  const categoryMenu = {
    items: [
      { key: "", label: "All Categories" },
      ...[
        "Split Type",
        "Window Type",
        "Floor Mounted",
        "Portable",
        "Compressors",
        "Refrigerants",
        "Installation Materials",
        "Copper Tubing",
      ].map((c) => ({ key: c, label: c })),
    ].map((c) => ({
      key: c.key || "all",
      label: c.label,
      onClick: () => {
        setCategory(c.key);
        setCurrentPage(1);
      },
    })),
  };

  const brandMenu = {
    items: [
      { key: "", label: "All Brands" },
      ...brands.map((b) => ({ key: b.name, label: b.name })),
    ].map((b) => ({
      key: b.key || "all",
      label: b.label,
      onClick: () => {
        setBrand(b.key);
        setCurrentPage(1);
      },
    })),
  };

  const columns = [
    {
      title: "SKU",
      dataIndex: "sku",
      render: (sku) => <span className="table-sku-cell">{sku}</span>,
    },
    {
      title: "ITEM",
      dataIndex: "name",
      render: (name) => <span className="table-item-name">{name}</span>,
    },
    {
      title: "TYPE / CATEGORY",
      render: (_, item) => (
        <div className="table-type-cat">
          <span className="table-type-label">{item.itemType}</span>
          <span className="table-cat-label">{item.category}</span>
        </div>
      ),
    },
    {
      title: "BRAND",
      dataIndex: "brand",
      render: (b) => <span>{b}</span>,
    },
    {
      title: "SELLING PRICE",
      render: (_, item) => (
        <span className="table-price-cell">{formatMoney(item.listPrice)}</span>
      ),
    },
    {
      title: "STOCK & AVAILABILITY",
      render: (_, item) => (
        <div>
          <span
            className={`stock-pill ${
              item.quantity === 0
                ? "no-stock"
                : item.quantity <= item.reorderLevel
                ? "low-stock"
                : "on-hand"
            }`}
          >
            {item.quantity} {item.unitOfMeasure}{" "}
            {item.quantity === 0
              ? "(No Stock)"
              : item.quantity <= item.reorderLevel
              ? "(Low Stock)"
              : "(On Hand)"}
          </span>
          {item.reservedQuantity > 0 && (
            <div>
              <span className="stock-pill reserved">
                {item.reservedQuantity} {item.unitOfMeasure} (Reserved)
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "REORDER LEVEL",
      render: (_, item) => (
        <span>
          {item.reorderLevel} {item.unitOfMeasure}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      render: (_, item) => (
        <div className="table-actions-wrap">
          <Tooltip title="View Specifications">
            <button
              type="button"
              className="table-action-btn"
              onClick={() => setViewing(item)}
            >
              <EyeViewIcon />
            </button>
          </Tooltip>
          {canManage && !archived && (
            <Tooltip title="Edit Specifications">
              <button
                type="button"
                className="table-action-btn"
                onClick={() => open(item)}
              >
                <PencilEditIcon />
              </button>
            </Tooltip>
          )}
          {canManage && (
            <Popconfirm
              title={
                archived
                  ? "Restore this item?"
                  : "Archive this zero-stock item?"
              }
              description="Stock history is retained."
              onConfirm={() =>
                save(
                  archived ? "post" : "delete",
                  archived
                    ? `/products/${item.id}/restore`
                    : `/products/${item.id}`,
                  archived ? { branchId } : null,
                  archived ? "Item restored." : "Item archived.",
                  { branchId },
                ).catch(() => {})
              }
            >
              <Tooltip title={archived ? "Restore Item" : "Archive Item"}>
                <button type="button" className="table-action-btn danger">
                  <ArchiveIcon />
                </button>
              </Tooltip>
            </Popconfirm>
          )}
          {canManage &&
            !archived &&
            item.quantity > 0 &&
            serviceVans.length > 0 && (
              <Tooltip title="Add to Service Vehicle">
                <button
                  type="button"
                  className="table-action-btn van"
                  onClick={() => {
                    setLoadVanItem(item);
                    setSelectedVanId(serviceVans[0]?.id || "");
                    setLoadQuantity(1);
                    setLoadNotes("");
                    setLoadError("");
                  }}
                >
                  <ShippingTruckIcon />
                </button>
              </Tooltip>
            )}
        </div>
      ),
    },
  ];

  return (
    <div className="inventory-catalog-container" data-node-id="488:4981">
      {/* 1. Header Title & Subtitle (Node 441:7235) */}
      <div className="inventory-catalog-header-wrap" data-node-id="441:7235">
        <h1 className="inventory-catalog-title" data-node-id="441:7236">
          Inventory Catalog
        </h1>
        <p className="inventory-catalog-subtitle" data-node-id="441:7237">
          AC equipment and service materials for the selected branch. Stock quantities change only through recorded movements.
        </p>
      </div>

      {/* 2. Main Products List Card (Node 442:4080) */}
      <div className="inventory-catalog-card" data-node-id="442:4080">
        {/* Toolbar (Node 442:4081) */}
        <div className="catalog-toolbar" data-node-id="442:4081">
          <div className="catalog-toolbar-left" data-node-id="442:4082">
            <div className="catalog-title-group" data-node-id="442:4083">
              <div className="catalog-list-icon-badge" data-node-id="442:4084">
                <QlementineItemsListIcon />
              </div>
              <h2 className="catalog-section-title" data-node-id="442:4086">
                Products List
              </h2>
            </div>

            {/* Search Input (Node 444:4272) */}
            <div className="catalog-search-wrap" data-node-id="444:4272">
              <span className="catalog-search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="catalog-search-input"
                placeholder="Search SKU, name, or brand"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Right Toolbar: Filters, Actions & Register (Node 442:4088) */}
          <div className="catalog-toolbar-right" data-node-id="442:4088">
            {/* Filter 1: Type Pill */}
            <Dropdown menu={typeMenu} trigger={["click"]}>
              <div className="catalog-filter-pill" data-node-id="442:4089">
                <FilterIcon />
                <span>{type === "ALL" ? "ALL" : type}</span>
                <ChevronDownIcon />
              </div>
            </Dropdown>

            {/* Filter 2: Stock Levels Pill */}
            <Dropdown menu={statusMenu} trigger={["click"]}>
              <div className="catalog-filter-pill" data-node-id="444:4277">
                <FilterIcon />
                <span>
                  {status === "ALL"
                    ? "All Stock Levels"
                    : status === "LOW"
                    ? "Low Stock"
                    : "Out of Stock"}
                </span>
                <ChevronDownIcon />
              </div>
            </Dropdown>

            {/* Filter 3: Categories Pill */}
            <Dropdown menu={categoryMenu} trigger={["click"]}>
              <div className="catalog-filter-pill" data-node-id="444:4284">
                <FilterIcon />
                <span>{category || "All Categories"}</span>
                <ChevronDownIcon />
              </div>
            </Dropdown>

            {/* Filter 4: Brands Pill */}
            <Dropdown menu={brandMenu} trigger={["click"]}>
              <div className="catalog-filter-pill" data-node-id="444:4291">
                <FilterIcon />
                <span>{brand || "All Brands"}</span>
                <ChevronDownIcon />
              </div>
            </Dropdown>

            {/* Filter Reset Button (Node 444:4810) */}
            <Tooltip title="Reset filters">
              <button
                type="button"
                className="catalog-icon-btn"
                data-node-id="444:4810"
                onClick={() => {
                  setSearch("");
                  setType("ALL");
                  setStatus("ALL");
                  setCategory("");
                  setBrand("");
                  setCurrentPage(1);
                }}
              >
                <FilterResetIcon />
              </button>
            </Tooltip>

            {/* Archive Toggle Button (Node 444:4812) */}
            <Tooltip title={archived ? "View active catalog items" : "View archived zero-stock items"}>
              <button
                type="button"
                className={`catalog-icon-btn ${archived ? "active" : ""}`}
                data-node-id="444:4812"
                onClick={() => {
                  setArchived(!archived);
                  setCurrentPage(1);
                }}
              >
                <ArchiveIcon />
              </button>
            </Tooltip>

            {/* Post Movement Button (Node 444:4311) */}
            {canManage && (
              <button
                type="button"
                className="btn-post-movement"
                data-node-id="444:4311"
                onClick={onNavigateToPostMovement}
              >
                Post Movement
              </button>
            )}

            {/* Register Item Button (Node 442:4099) */}
            {canManage && (
              <button
                type="button"
                className="btn-register-item"
                data-node-id="442:4099"
                onClick={() => open(null)}
              >
                <PlusCircleIcon />
                <span>Register Item</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Table (Node 442:4102) */}
        {archiveError ? (
          <Alert type="error" title={archiveError} />
        ) : (
          <div className="figma-catalog-table" data-node-id="442:4102">
            <Table
              dataSource={paginatedData}
              columns={columns}
              rowKey="id"
              loading={archiveLoading}
              scroll={{ x: 1000 }}
              pagination={false}
            />
          </div>
        )}

        {/* 4. Footer Pagination (Node 442:4235) */}
        <div className="catalog-pagination-wrap" data-node-id="442:4235">
          <span className="catalog-pagination-info" data-node-id="442:4237">
            Showing {startEntry} to {endEntry} of {totalEntries} entries
          </span>

          <div className="catalog-pagination-controls" data-node-id="442:4238">
            <button
              type="button"
              className="pagination-arrow-btn"
              disabled={currentSafePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              data-node-id="442:4239"
            >
              <ChevronLeftIcon />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`pagination-page-btn ${pageNumber === currentSafePage ? "active" : ""}`}
                onClick={() => setCurrentPage(pageNumber)}
                data-node-id={pageNumber === currentSafePage ? "442:4241" : undefined}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              className="pagination-arrow-btn"
              disabled={currentSafePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              data-node-id="442:4251"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      <Modal
        title={
          editing === "new" ? "Register inventory item" : "Edit specifications"
        }
        open={Boolean(editing)}
        onCancel={() => !busy && setEditing(null)}
        footer={null}
        width={700}
      >
        {formError && <Alert type="error" title={formError} />}
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              SKU / model
              <Input
                required
                maxLength={100}
                disabled={editing !== "new"}
                value={values.sku}
                onChange={(e) => field("sku", e.target.value)}
              />
            </label>
            <label className="field">
              Item name
              <Input
                required
                maxLength={200}
                value={values.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            <label className="field">
              Item type
              <Select
                value={values.itemType}
                onChange={(value) =>
                  setValues({
                    ...values,
                    itemType: value,
                    category:
                      value === "AC Unit"
                        ? "Split Type"
                        : value === "Spare Part"
                        ? "Compressors"
                        : value === "Consumable"
                        ? "Refrigerants"
                        : value === "Tool / Equipment"
                        ? "Vacuum Pumps"
                        : "Installation Materials",
                    unitOfMeasure:
                      editing === "new" && value === "AC Unit"
                        ? "UNIT"
                        : values.unitOfMeasure,
                  })
                }
                options={[
                  "AC Unit",
                  "Spare Part",
                  "Consumable",
                  "Tool / Equipment",
                  "Material / Part",
                ].map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </label>
            <label className="field">
              Category
              <Select
                value={values.category}
                onChange={(value) => field("category", value)}
                options={categories.map((value) => ({ value, label: value }))}
              />
            </label>
            <label className="field">
              Brand
              <Select
                showSearch
                value={values.brand}
                onChange={(value) => field("brand", value)}
                options={brands.map((entry) => ({
                  value: entry.name,
                  label: entry.name,
                }))}
              />
            </label>
            <label className="field">
              Capacity / specification
              <Input
                value={values.capacity}
                onChange={(e) => field("capacity", e.target.value)}
                placeholder="e.g. 1.5 HP or 1/4-inch tubing"
              />
            </label>
            <label className="field">
              Supplier / Vendor
              <Select
                showSearch
                allowClear
                placeholder="Select or enter supplier"
                value={values.supplier || undefined}
                onChange={(value) => field("supplier", value || "")}
                options={Array.from(
                  new Set([
                    ...suppliersList.map((s) => s.name),
                    ...items.map((it) => it.supplier).filter(Boolean),
                    ...(values.supplier ? [values.supplier] : []),
                  ]),
                ).map((name) => ({
                  value: name,
                  label: name,
                }))}
              />
            </label>
            {values.itemType !== "AC Unit" && (
              <label className="field" style={{ gridColumn: "span 2" }}>
                Compatible AC Unit Models / SKUs
                <Select
                  mode="tags"
                  placeholder="Select or enter compatible AC SKUs/models (e.g. CAR-1.0HP-CRY)"
                  value={values.compatibleModels || []}
                  onChange={(val) => field("compatibleModels", val)}
                  options={items
                    .filter((it) => it.itemType === "AC Unit")
                    .map((it) => ({
                      value: it.sku,
                      label: `${it.sku} — ${it.name}`,
                    }))}
                />
              </label>
            )}
            <label className="field">
              Unit of measure
              <Select
                disabled={editing !== "new" || values.itemType === "AC Unit"}
                value={values.unitOfMeasure}
                onChange={(value) => field("unitOfMeasure", value)}
                options={units.map((value) => ({ value, label: value }))}
              />
            </label>
            <label className="field">
              {editing === "new"
                ? "Opening quantity"
                : "Current stock (read only)"}
              <InputNumber
                min={0}
                step={isContinuousUnit(values.unitOfMeasure) ? 0.1 : 1}
                precision={isContinuousUnit(values.unitOfMeasure) ? 3 : 0}
                disabled={editing !== "new"}
                value={values.quantity}
                onChange={(value) => field("quantity", value)}
                style={{ width: "100%" }}
              />
            </label>
            <label className="field">
              Unit cost (PHP)
              <InputNumber
                min={0}
                precision={2}
                value={values.unitCost}
                onChange={(value) => field("unitCost", value)}
                style={{ width: "100%" }}
              />
            </label>
            <label className="field">
              Selling price (PHP)
              <InputNumber
                min={0}
                precision={2}
                value={values.listPrice}
                onChange={(value) => field("listPrice", value)}
                style={{ width: "100%" }}
              />
            </label>
            <label className="field">
              Reorder level (zero allowed)
              <InputNumber
                min={0}
                step={isContinuousUnit(values.unitOfMeasure) ? 0.1 : 1}
                precision={isContinuousUnit(values.unitOfMeasure) ? 3 : 0}
                value={values.reorderLevel}
                onChange={(value) => field("reorderLevel", value)}
                style={{ width: "100%" }}
              />
            </label>
          </div>
          <Button htmlType="submit" type="primary" loading={busy}>
            Save item
          </Button>
        </form>
        {editing === "new" && (
          <div className="field">
            <span>Missing a brand?</span>
            <Space.Compact>
              <Input
                placeholder="New brand name"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
              />
              <Button
                disabled={!newBrand.trim() || busy}
                onClick={() => {
                  setBusy(true);
                  save("post", "/brands", { name: newBrand }, "Brand added.")
                    .then(() => setNewBrand(""))
                    .catch((err) => setFormError(errorMessage(err)))
                    .finally(() => setBusy(false));
                }}
              >
                Add brand
              </Button>
            </Space.Compact>
          </div>
        )}
      </Modal>
      <Modal
        title="Item specifications"
        open={Boolean(viewing)}
        onCancel={() => setViewing(null)}
        footer={null}
      >
        {viewing && (
          <Descriptions
            column={1}
            bordered
            items={[
              { key: "sku", label: "SKU", children: viewing.sku },
              { key: "name", label: "Name", children: viewing.name },
              {
                key: "brand",
                label: "Brand / specification",
                children: `${viewing.brand} / ${viewing.capacity || "Not applicable"}`,
              },
              {
                key: "qty",
                label: "Stock",
                children: `${viewing.quantity} ${viewing.unitOfMeasure}`,
              },
              {
                key: "cost",
                label: "Unit cost",
                children: formatMoney(viewing.unitCost),
              },
              {
                key: "price",
                label: "Selling price",
                children: formatMoney(viewing.listPrice),
              },
              {
                key: "supplier",
                label: "Supplier / Vendor",
                children: viewing.supplier || "Not specified",
              },
              ...(Array.isArray(viewing.compatibleModels) &&
              viewing.compatibleModels.length > 0
                ? [
                    {
                      key: "models",
                      label: "Compatible AC Units",
                      children: (
                        <Space wrap>
                          {viewing.compatibleModels.map((m) => (
                            <Tag key={m} color="blue">
                              {m}
                            </Tag>
                          ))}
                        </Space>
                      ),
                    },
                  ]
                : []),
              ...(Array.isArray(viewing.priceHistory) &&
              viewing.priceHistory.length > 0
                ? [
                    {
                      key: "priceHistory",
                      label: "Purchase Cost History",
                      children: (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {viewing.priceHistory.map((ph, idx) => (
                            <li key={idx}>
                              <strong>{formatMoney(ph.cost)}</strong> —{" "}
                              {new Date(ph.date).toLocaleDateString()} (
                              {ph.supplier || "Direct"} · {ph.note || "Logged"})
                            </li>
                          ))}
                        </ul>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(loadVanItem)}
        title={loadVanItem ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><BusBoldDuotoneIcon size={20}/>Load to Service Vehicle: {loadVanItem.name}</span> : ""}
        onCancel={() => setLoadVanItem(null)}
        footer={null}
        destroyOnClose
      >
        {loadVanItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoadBusy(true);
              setLoadError("");
              save(
                "post",
                "/transfers",
                {
                  branchId,
                  destinationId: selectedVanId,
                  productId: loadVanItem.id,
                  quantity: loadQuantity,
                  reason: loadNotes
                    ? `Vehicle Loadout: ${loadNotes}`
                    : `Stock loaded to vehicle ${selectedVanId}`,
                },
                `Successfully loaded ${loadQuantity} ${loadVanItem.unitOfMeasure} of ${loadVanItem.name} to Service Vehicle!`,
              )
                .then(() => {
                  setLoadVanItem(null);
                })
                .catch((err) => {
                  setLoadError(errorMessage(err));
                })
                .finally(() => setLoadBusy(false));
            }}
          >
            {loadError && (
              <Alert
                type="error"
                showIcon
                message={loadError}
                style={{ marginBottom: 12 }}
              />
            )}
            <div style={{ marginBottom: 12 }}>
              <Typography.Text type="secondary">
                Current Branch Stock:{" "}
                <strong>
                  {loadVanItem.quantity} {loadVanItem.unitOfMeasure}
                </strong>
              </Typography.Text>
            </div>
            <label className="field" style={{ display: "block", marginBottom: 12 }}>
              Target Service Vehicle
              <Select
                value={selectedVanId}
                onChange={setSelectedVanId}
                style={{ width: "100%", marginTop: 4 }}
                options={serviceVans.map((van) => ({
                  value: van.id,
                  label: (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <BusBoldDuotoneIcon size={16} />
                      {van.name} ({van.plateNumber ? `${van.plateNumber} · ` : ""}{van.status})
                    </span>
                  ),
                }))}
              />
            </label>
            <label className="field" style={{ display: "block", marginBottom: 12 }}>
              Quantity to Load ({loadVanItem.unitOfMeasure})
              <InputNumber
                min={isContinuousUnit(loadVanItem.unitOfMeasure) ? 0.001 : 1}
                max={loadVanItem.quantity}
                step={isContinuousUnit(loadVanItem.unitOfMeasure) ? 0.1 : 1}
                precision={isContinuousUnit(loadVanItem.unitOfMeasure) ? 3 : 0}
                value={loadQuantity}
                onChange={setLoadQuantity}
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>
            <label className="field" style={{ display: "block", marginBottom: 16 }}>
              Job / Dispatch Note (optional)
              <Input
                placeholder="e.g. Field restock for AC repair jobs"
                value={loadNotes}
                onChange={(e) => setLoadNotes(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </label>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setLoadVanItem(null)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loadBusy}
                disabled={!selectedVanId || loadQuantity <= 0}
              >
                Confirm Load to Van
              </Button>
            </Space>
          </form>
        )}
      </Modal>
    </div>
  );
}
