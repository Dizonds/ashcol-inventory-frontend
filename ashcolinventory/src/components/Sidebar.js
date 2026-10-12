import React from "react";
import "./Sidebar.css";
import ashcolLogo from "../assets/ashcolLogoFigma.png";

/* --- FIGMA EXACT SVG ICONS --- */
function OverviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M8.25 6.5V4.5C8.25 2.85 8.25 2.03 7.8 1.48C7.71 1.38 7.62 1.28 7.52 1.2C6.97 0.75 6.14 0.75 4.5 0.75C2.86 0.75 2.03 0.75 1.48 1.2C1.38 1.28 1.28 1.38 1.2 1.48C0.75 2.03 0.75 2.85 0.75 4.5V6.5C0.75 8.14 0.75 8.97 1.2 9.52C1.28 9.62 1.38 9.71 1.48 9.8C2.03 10.25 2.86 10.25 4.5 10.25C6.14 10.25 6.97 10.25 7.52 9.8C7.62 9.71 7.71 9.62 7.8 9.52C8.25 8.97 8.25 8.14 8.25 6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 13.25H3.5C2.8 13.25 2.45 13.25 2.17 13.34C1.53 13.53 1.03 14.03 0.84 14.67C0.75 14.95 0.75 15.3 0.75 16C0.75 16.7 0.75 17.05 0.84 17.33C1.03 17.97 1.53 18.47 2.17 18.66C2.45 18.75 2.8 18.75 3.5 18.75H5.5C6.2 18.75 6.55 18.75 6.83 18.66C7.47 18.47 7.97 17.97 8.16 17.33C8.25 17.05 8.25 16.7 8.25 16C8.25 15.3 8.25 14.95 8.16 14.67C7.97 14.03 7.47 13.53 6.83 13.34C6.55 13.25 6.2 13.25 5.5 13.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M18.75 15V13C18.75 11.36 18.75 10.53 18.3 9.98C18.21 9.88 18.12 9.79 18.02 9.7C17.47 9.25 16.64 9.25 15 9.25C13.36 9.25 12.53 9.25 11.98 9.7C11.88 9.79 11.79 9.88 11.7 9.98C11.25 10.53 11.25 11.36 11.25 13V15C11.25 16.64 11.25 17.47 11.7 18.02C11.79 18.12 11.88 18.21 11.98 18.3C12.53 18.75 13.36 18.75 15 18.75C16.64 18.75 17.47 18.75 18.02 18.3C18.12 18.21 18.21 18.12 18.3 18.02C18.75 17.47 18.75 16.64 18.75 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 0.75H14C13.3 0.75 12.95 0.75 12.67 0.84C12.03 1.03 11.53 1.53 11.34 2.17C11.25 2.45 11.25 2.8 11.25 3.5C11.25 4.2 11.25 4.55 11.34 4.83C11.53 5.47 12.03 5.97 12.67 6.16C12.95 6.25 13.3 6.25 14 6.25H16C16.7 6.25 17.05 6.25 17.33 6.16C17.97 5.97 18.47 5.47 18.66 4.83C18.75 4.55 18.75 4.2 18.75 3.5C18.75 2.8 18.75 2.45 18.66 2.17C18.47 1.53 17.97 1.03 17.33 0.84C17.05 0.75 16.7 0.75 16 0.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 22" fill="none">
      <path
        d="M9.75 0.75C8.93 0.75 8.15 1.08 6.58 1.74C2.7 3.38 0.75 4.2 0.75 5.58V15.75M9.75 0.75C10.57 0.75 11.35 1.08 12.91 1.74C16.8 3.38 18.75 4.2 18.75 5.58V15.75M9.75 0.75V11.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.07 13.06L3.15 14.47C1.55 15.25 0.75 15.64 0.75 16.25C0.75 16.86 1.55 17.25 3.15 18.03L6.07 19.44C7.88 20.31 8.78 20.75 9.75 20.75C10.72 20.75 11.62 20.31 13.42 19.44L16.34 18.03C17.95 17.25 18.75 16.86 18.75 16.25C18.75 15.64 17.95 15.25 16.34 14.47L13.42 13.06C11.62 12.19 10.72 11.75 9.75 11.75C8.78 11.75 7.88 12.19 6.07 13.06Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.75 10.75L5.75 9.75M14.75 18.75L4.75 13.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RequestsIcon() {
  return (
    <svg width="21" height="20" viewBox="0 0 21.5 20.5" fill="none">
      <path
        d="M0.75 19.75H2.05C3.24 19.75 3.83 19.75 4.23 19.38C4.63 19.01 4.71 18.39 4.87 17.15L6 8.22C6.2 6.57 6.31 5.74 6.84 5.25C7.38 4.75 8.17 4.75 9.75 4.75H19.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9.25" cy="17.25" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.25" cy="17.25" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M18.75 7.75H12.75C11.81 7.75 11.34 7.75 11.04 8.12C10.75 8.48 10.75 9.07 10.75 10.25C10.75 11.43 10.75 12.02 11.04 12.38C11.34 12.75 11.81 12.75 12.75 12.75H18.75C19.69 12.75 20.16 12.75 20.46 12.38C20.75 12.02 20.75 11.43 20.75 10.25C20.75 9.07 20.75 8.48 20.46 8.12C20.16 7.75 19.69 7.75 18.75 7.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PostMovementIcon() {
  return (
    <svg width="18" height="21" viewBox="0 0 17.5 21.5" fill="none">
      <path
        d="M0.75 17.4V6.8C0.75 3.95 0.75 2.52 1.63 1.64C2.51 0.75 3.92 0.75 6.75 0.75H10.75C13.58 0.75 14.99 0.75 15.87 1.64C16.75 2.52 16.75 3.95 16.75 6.8V17.4C16.75 18.9 16.75 19.66 16.29 19.96C15.53 20.45 14.37 19.43 13.78 19.06C13.29 18.75 13.05 18.6 12.78 18.59C12.49 18.58 12.24 18.73 11.72 19.06L9.81 20.26C9.29 20.59 9.04 20.75 8.75 20.75C8.46 20.75 8.21 20.59 7.69 20.26L5.78 19.06C5.29 18.75 5.05 18.6 4.78 18.59C4.49 18.58 4.24 18.73 3.72 19.06C3.13 19.43 1.97 20.45 1.21 19.96C0.75 19.66 0.75 18.9 0.75 17.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.75 9.75H4.75M10.75 5.75H4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StockLedgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 17V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 17V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 17V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ServiceVehiclesIcon() {
  return (
    <svg width="21" height="18" viewBox="0 0 21.5 17.5" fill="none">
      <circle cx="15.75" cy="14.25" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.75" cy="14.25" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13.25 14.25H8.25M18.25 14.25H19.01C19.23 14.25 19.34 14.25 19.44 14.24C20.12 14.15 20.65 13.62 20.74 12.94C20.75 12.84 20.75 12.73 20.75 12.51V9.75C20.75 6.16 17.84 3.25 14.25 3.25M13.75 12.25V3.75C13.75 2.34 13.75 1.63 13.31 1.19C12.87 0.75 12.16 0.75 10.75 0.75H3.75C2.34 0.75 1.63 0.75 1.19 1.19C0.75 1.63 0.75 2.34 0.75 3.75V11.75C0.75 12.68 0.75 13.15 0.95 13.5C1.08 13.73 1.27 13.92 1.5 14.05C1.85 14.25 2.32 14.25 3.25 14.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ModelMatchingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M2.5 16.5C2.5 17.43 2.5 17.89 2.58 18.28C2.89 19.87 4.13 21.11 5.72 21.42C6.11 21.5 6.57 21.5 7.5 21.5M21.5 16.5C21.5 17.43 21.5 17.89 21.42 18.28C21.11 19.87 19.87 21.11 18.28 21.42C17.89 21.5 17.43 21.5 16.5 21.5M21.5 7.5C21.5 6.57 21.5 6.11 21.42 5.72C21.11 4.13 19.87 2.89 18.28 2.58C17.89 2.5 17.43 2.5 16.5 2.5M2.5 7.5C2.5 6.57 2.5 6.11 2.58 5.72C2.89 4.13 4.13 2.89 5.72 2.58C6.11 2.5 6.57 2.5 7.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="6.5" y1="12" x2="17.5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SuppliersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 11V15.52C3 18.35 3 19.76 3.88 20.64C4.76 21.52 6.17 21.52 9 21.52H15C17.83 21.52 19.24 21.52 20.12 20.64C21 19.76 21 18.35 21 15.52V11"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M15 17C14.32 17.61 13.23 18 12 18C10.77 18 9.68 17.61 9 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M17.8 2.53L6.15 2.56C4.41 2.47 3.97 3.81 3.97 4.46C3.97 5.05 3.89 5.9 2.82 7.51C1.76 9.11 1.84 9.59 2.44 10.7C2.94 11.62 4.21 11.98 4.87 12.04C6.97 12.09 7.99 10.27 7.99 9C9.03 12.21 12 12.21 13.32 11.84C14.64 11.47 15.77 10.16 16.04 9C16.19 10.44 16.67 11.28 18.07 11.85C19.51 12.45 20.76 11.54 21.38 10.95C22.01 10.37 22.41 9.07 21.3 7.64C20.53 6.65 20.21 5.72 20.1 4.76C20.04 4.21 19.99 3.61 19.6 3.23C19.02 2.67 18.2 2.5 17.8 2.53Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserManagementIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 17" fill="none">
      <circle cx="10.75" cy="7.25" r="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.25 7.75C4.32 7.75 2.75 6.18 2.75 4.25C2.75 2.32 4.32 0.75 6.25 0.75C8.06 0.75 9.56 2.13 9.73 3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.77 3.9C11.94 2.13 13.44 0.75 15.25 0.75C17.18 0.75 18.75 2.32 18.75 4.25C18.75 6.18 17.18 7.75 15.25 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0.75 12.75C0.75 9.99 3.21 7.75 6.25 7.75M5.25 15.75C5.25 12.99 7.71 10.75 10.75 10.75C13.79 10.75 16.25 12.99 16.25 15.75M15.25 7.75C18.29 7.75 20.75 9.99 20.75 12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
      <path
        d="M19.75 12.33C18.55 12.97 17.18 13.33 15.73 13.33C11 13.33 7.17 9.5 7.17 4.77C7.17 3.32 7.53 1.95 8.17 0.75C3.92 1.75 0.75 5.57 0.75 10.12C0.75 15.44 5.06 19.75 10.38 19.75C14.93 19.75 18.75 16.58 19.75 12.33Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2V4M12 20V22M4 12H2M22 12H20M5.64 5.64L7.05 7.05M16.95 16.95L18.36 18.36M5.64 18.36L7.05 16.95M16.95 7.05L18.36 5.64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 22" fill="none">
      <path
        d="M1.14 2.75C0.75 3.37 0.75 4.16 0.75 5.75V15.75C0.75 17.34 0.75 18.13 1.14 18.75C1.21 18.86 1.29 18.96 1.38 19.06C1.86 19.61 2.63 19.83 4.16 20.26C5.69 20.7 6.46 20.92 7.01 20.59C7.11 20.53 7.2 20.47 7.28 20.39C7.75 19.95 7.75 19.15 7.75 17.55V3.95C7.75 2.35 7.75 1.55 7.28 1.11C7.2 1.03 7.11 0.97 7.01 0.91C6.46 0.58 5.69 0.8 4.16 1.24C2.63 1.67 1.86 1.89 1.38 2.44C1.29 2.54 1.21 2.64 1.14 2.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.75 2.75H9.77C11.67 2.75 12.62 2.75 13.21 3.34C13.54 3.66 13.69 4.1 13.75 4.75M7.75 18.75H9.77C11.67 18.75 12.62 18.75 13.21 18.16C13.54 17.84 13.69 17.4 13.75 16.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.75 10.75H10.75M16.25 8.25L18.75 10.75L16.25 13.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Sidebar({
  page,
  setPage,
  user,
  canManage,
}) {
  const operations = [
    { id: "inventory", label: "Inventory Catalog", icon: <InventoryIcon />, nodeId: "488:5002" },
    { id: "requests", label: "Material Requests", icon: <RequestsIcon />, nodeId: "488:5009" },
    ...(canManage ? [{ id: "post_movement", label: "Post Movement", icon: <PostMovementIcon />, nodeId: "488:5011" }] : []),
    { id: "movements", label: "Stock Ledger", icon: <StockLedgerIcon />, nodeId: "488:5028" },
    { id: "service_vehicles", label: "Service Vehicles", icon: <ServiceVehiclesIcon />, nodeId: "488:5013" },
    { id: "compatibility", label: "Model Matching", icon: <ModelMatchingIcon />, nodeId: "488:5016" },
    { id: "suppliers", label: "Suppliers & Vendors", icon: <SuppliersIcon />, nodeId: "488:5018" },
  ];

  const adminOther = user && user.role === "ADMIN" ? [
    { id: "user_management", label: "User Management", icon: <UserManagementIcon />, nodeId: "441:3966" },
  ] : [];

  return (
    <aside className="ashcol-sidebar" data-node-id="488:4982">
      {/* Dynamic Brand Header */}
      <div
        className="sidebar-brand-header"
        onClick={() => setPage("dashboard")}
        title="ASHCOL Smart Stock Tracking"
        data-node-id="488:4985"
      >
        <div className="sidebar-brand-logo-wrap" data-node-id="488:4986">
          <img
            src={ashcolLogo}
            alt="ASHCOL Logo"
            className="sidebar-brand-logo"
          />
        </div>
        <div className="sidebar-brand-text">
          <h2 className="sidebar-brand-title" data-node-id="488:4989">
            ASHCOL
          </h2>
          <span className="sidebar-brand-sub" data-node-id="488:4991">
            Smart Stock Tracking
          </span>
        </div>
      </div>

      <div className="sidebar-nav-container">
        {/* Main Menu Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-label" data-node-id="488:4992">
            Main Menu
          </div>
          <button
            type="button"
            className={`sidebar-item-btn ${page === "dashboard" ? "active" : ""}`}
            onClick={() => setPage("dashboard")}
            data-node-id="488:4995"
            title="Overview"
          >
            <span className="sidebar-item-icon">
              <OverviewIcon />
            </span>
            <span className="sidebar-item-text" data-node-id="488:4998">
              Overview
            </span>
          </button>
        </div>

        <div className="sidebar-divider" data-node-id="488:4984" />

        {/* Operations Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-label" data-node-id="488:4993">
            Operations
          </div>
          {operations.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item-btn ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
              data-node-id={item.nodeId}
              title={item.label}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-text">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Other Section (Admin only) */}
        {adminOther.length > 0 && (
          <>
            <div className="sidebar-divider" data-node-id="488:4983" />
            <div className="sidebar-section">
              <div className="sidebar-section-label" data-node-id="488:4994">
                Other
              </div>
              {adminOther.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-item-btn ${page === item.id ? "active" : ""}`}
                  onClick={() => setPage(item.id)}
                  data-node-id={item.nodeId}
                  title={item.label}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-text">{item.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}


