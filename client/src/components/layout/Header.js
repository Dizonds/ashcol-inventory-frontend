import { Dropdown, Modal } from "antd";
import { useState } from "react";
import avatarImg from "../../assets/header/avatar.png";
import AccountEditor from "../common/AccountEditor";
import "./Header.css";

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.8 0C7.25 0 7.65 0.38 7.65 0.84V2.41H16.67V0.85C16.67 0.39 17.04 0.01 17.51 0.01C17.97 0.01 18.35 0.38 18.35 0.85V2.41H21.6C22.93 2.41 24 3.48 24 4.81V21.6C24 22.93 22.93 24 21.6 24H2.4C1.07 24 0 22.93 0 21.6V4.81C0 3.48 1.07 2.41 2.4 2.41H5.97V0.84C5.97 0.38 6.34 0 6.8 0ZM1.68 9.29V21.6C1.68 22 2 22.32 2.4 22.32H21.6C22 22.32 22.32 22 22.32 21.6V9.31L1.68 9.29ZM8 17.54V19.54H6V17.54H8ZM13 17.54V19.54H11V17.54H13ZM18 17.54V19.54H16V17.54H18ZM8 12.77V14.77H6V12.77H8ZM13 12.77V14.77H11V12.77H13ZM18 12.77V14.77H16V12.77H18ZM2.4 4.09C2 4.09 1.68 4.41 1.68 4.81V7.61H22.32V4.81C22.32 4.41 22 4.09 21.6 4.09H18.35V5.2C18.35 5.67 17.97 6.04 17.51 6.04C17.04 6.04 16.67 5.67 16.67 5.2V4.09H7.65V5.19C7.65 5.66 7.27 6.03 6.81 6.03C6.34 6.03 5.97 5.66 5.97 5.19V4.09H2.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
      <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PAGE_TITLES = {
  dashboard: "Overview",
  inventory: "Inventory Catalog",
  requests: "Material Requests",
  post_movement: "Post Movement",
  movements: "Stock Ledger",
  service_vehicles: "Service Vehicles",
  job_orders: "Job Orders",
  compatibility: "Model Matching",
  suppliers: "Suppliers & Vendors",
  user_management: "User Management",
  branches: "Branches",
};

export default function Header({
  page = "service_vehicles",
  user,
  isDark,
  setIsDark,
  logout,
  save,
  onProfileUpdate,
}) {
  const [useFallbackAvatar, setUseFallbackAvatar] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const pageTitle = PAGE_TITLES[page] || "Service Vehicles";

  // Format dynamic date like "Sat, 11 Oct 2026"
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const userMenuItems = [
    {
      key: "user-meta",
      label: (
        <div style={{ padding: "4px 8px" }}>
          <div style={{ fontWeight: 600 }}>{user?.fullName || "User Account"}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{user?.email || "Signed in"}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#006830", marginTop: 4 }}>
            Role: {user?.role || "EMPLOYEE"}
            <div>Status: {user?.availability || "AVAILABLE"}</div>
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    { key: "edit-profile", label: "Edit Profile", onClick: () => setProfileOpen(true) },
    {
      key: "theme",
      label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
      onClick: () => {
        const nextMode = !isDark;
        setIsDark(nextMode);
        localStorage.setItem("ashcol_theme", nextMode ? "dark" : "light");
      },
    },
    {
      key: "logout",
      label: <span style={{ color: "#ef4444" }}>Log Out</span>,
      onClick: () =>
        Modal.confirm({
          title: "Log out?",
          content: "Are you sure you want to log out of ASHCOL Inventory?",
          okText: "Log out",
          okButtonProps: { danger: true },
          cancelText: "Cancel",
          onOk: logout,
        }),
    },
  ];

  return (
    <>
    <header className="ashcol-header" data-node-id="488:6920">
      <div className="header-page-title-wrap" data-node-id="488:6921">
        <h1 className="header-page-title" data-node-id="488:6922">
          {pageTitle}
        </h1>
      </div>

      <div className="header-right-group" data-node-id="488:6923">
        <div className="header-date-pill" data-node-id="488:6929">
          <div className="header-date-inner" data-node-id="488:6930">
            <span className="header-date-icon" data-node-id="488:6931">
              <CalendarIcon />
            </span>
            <span className="header-date-text" data-node-id="488:6932">
              {formattedDate}
            </span>
          </div>
          <span className="header-chevron-icon" data-node-id="440:1887">
            <ChevronDownIcon />
          </span>
        </div>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={["click"]}>
          <button type="button" className="header-user-btn" data-node-id="441:5303">
            <div className="header-user-avatar-wrap" data-node-id="488:6939">
              {!useFallbackAvatar ? (
                <img
                  src={avatarImg}
                  alt={user?.fullName || "User"}
                  className="header-user-avatar"
                  onError={() => setUseFallbackAvatar(true)}
                />
              ) : (
                <div className="header-user-avatar-placeholder">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>

            <div className="header-user-info" data-node-id="488:6940">
              <span className="header-user-name" data-node-id="488:6941">
                {user?.fullName || "User"}
              </span>
              <span className="header-user-email" data-node-id="488:6942">
                {user?.email || "Email unavailable"}
              </span>
            </div>

            <span className="header-chevron-icon" data-node-id="440:1883">
              <ChevronDownIcon />
            </span>
          </button>
        </Dropdown>
      </div>
    </header>
    {profileOpen && <AccountEditor account={user} currentUser={user} save={save} onSaved={onProfileUpdate} onClose={() => setProfileOpen(false)} />}
    </>
  );
}
