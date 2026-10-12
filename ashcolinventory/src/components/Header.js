import React, { useState } from "react";
import { Dropdown } from "antd";
import "./Header.css";
import avatarImg from "../assets/header/avatar.png";

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M21.71 20.29L18 16.61C19.44 14.81 20.14 12.54 19.95 10.24C19.76 7.95 18.7 5.81 16.99 4.28C15.27 2.74 13.03 1.92 10.73 1.98C8.43 2.05 6.24 2.99 4.62 4.62C2.99 6.24 2.05 8.43 1.98 10.73C1.92 13.03 2.74 15.27 4.28 16.99C5.81 18.7 7.95 19.76 10.24 19.95C12.54 20.14 14.81 19.44 16.61 18L20.29 21.68C20.48 21.87 20.73 21.98 21 21.98C21.27 21.98 21.52 21.87 21.71 21.68C22.09 21.3 22.09 20.67 21.71 20.29ZM11 18C7.13 18 4 14.87 4 11C4 7.13 7.13 4 11 4C14.87 4 18 7.13 18 11C18 14.87 14.87 18 11 18Z"
        fill="currentColor"
      />
    </svg>
  );
}

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

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21.75C13.1 21.75 14 20.85 14 19.75H10C10 20.85 10.9 21.75 12 21.75ZM18 15.75V10.75C18 7.68 16.37 5.11 13.5 4.43V3.75C13.5 2.92 12.83 2.25 12 2.25C11.17 2.25 10.5 2.92 10.5 3.75V4.43C7.64 5.11 6 7.67 6 10.75V15.75L4 17.75V18.75H20V17.75L18 15.75ZM16 16.75H8V10.75C8 8.27 9.51 6.25 12 6.25C14.49 6.25 16 8.27 16 10.75V16.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M19 12C17.8 12.64 16.43 13 14.98 13C10.25 13 6.42 9.17 6.42 4.44C6.42 2.99 6.78 1.62 7.42 0.42C3.17 1.42 0 5.24 0 9.8C0 15.11 4.31 19.42 9.63 19.42C14.19 19.42 18 16.25 19 12Z"
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2V4M12 20V22M4 12H2M22 12H20M5.64 5.64L7.05 7.05M16.95 16.95L18.36 18.36M5.64 18.36L7.05 16.95M16.95 7.05L18.36 5.64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

export default function Header({
  user,
  loading,
  setRefresh,
  isDark,
  setIsDark,
  logout,
  searchQuery = "",
  setSearchQuery,
  pendingCount = 0,
}) {
  const [useFallbackAvatar, setUseFallbackAvatar] = useState(false);

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
          <div style={{ fontSize: 11, fontWeight: 700, color: "#3ab44a", marginTop: 4 }}>
            Role: {user?.role || "EMPLOYEE"}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
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
      onClick: logout,
    },
  ];

  return (
    <header className="ashcol-header" data-node-id="441:5286">
      {/* Left: Search Bar & Warehouse */}
      <div className="header-left-group">
        <div className="header-search-wrap" data-node-id="441:5287">
          <span className="header-search-icon" data-node-id="440:1874">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="header-search-input"
            placeholder="Search anything"
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            data-node-id="441:5289"
          />
        </div>

      </div>

      {/* Right: Date, Actions (Theme, Notifications), User Profile */}
      <div className="header-right-group" data-node-id="441:5290">
        {/* Date Display Pill */}
        <div className="header-date-pill" data-node-id="441:5362">
          <span className="header-date-icon" data-node-id="441:5364">
            <CalendarIcon />
          </span>
          <span className="header-date-text" data-node-id="441:5365">
            {formattedDate}
          </span>
          <span className="header-chevron-icon">
            <ChevronDownIcon />
          </span>
        </div>

        {/* Action Buttons Section */}
        <div className="header-actions-divider" data-node-id="441:5321">
          {/* Moon / Theme Toggle Button */}
          <button
            type="button"
            className="header-square-btn"
            onClick={() => {
              const nextMode = !isDark;
              setIsDark(nextMode);
              localStorage.setItem("ashcol_theme", nextMode ? "dark" : "light");
            }}
            title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
            data-node-id="441:5322"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Notifications Button */}
          <button
            type="button"
            className="header-square-btn"
            title="Notifications"
            onClick={() => setRefresh && setRefresh((r) => r + 1)}
            data-node-id="441:5325"
          >
            <BellIcon />
            {pendingCount > 0 && <span className="header-badge-dot" />}
          </button>
        </div>

        {/* User Profile Dropdown */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={["click"]}>
          <button type="button" className="header-user-btn" data-node-id="441:5303">
            <div data-node-id="441:5305">
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

            <div className="header-user-info" data-node-id="441:5306">
              <span className="header-user-name" data-node-id="441:5307">
                {user?.fullName || "Jenny Wilson"}
              </span>
              <span className="header-user-email" data-node-id="441:5308">
                {user?.email || "felicia.reid@example.com"}
              </span>
            </div>

            <span className="header-chevron-icon" data-node-id="440:1883">
              <ChevronDownIcon />
            </span>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
