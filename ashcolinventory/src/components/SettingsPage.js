import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Alert, Modal, Typography } from "antd";
import { api, errorMessage } from "../api";
import AccountEditor from "./AccountEditor";
import "./UserManagement.css";

const TAGUIG_WAREHOUSE_ID = "LOCAL-WAREHOUSE";

const emptyAccount = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "EMPLOYEE",
};

function clean(value) {
  return (value || "").trim().replace(/\s+/g, " ");
}

function nameIsValid(value) {
  return /^[\p{L}][\p{L} .'-]{1,49}$/u.test(clean(value));
}

function formatJoinedDate(dateStr) {
  if (!dateStr) return "Jan 15, 2024";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Jan 15, 2024";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Jan 15, 2024";
  }
}

function parseName(user) {
  const first = user.firstName || "";
  const last = user.lastName || "";
  if (first || last) return { firstName: first, lastName: last };
  const parts = (user.fullName || "").split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function formatRole(role) {
  if (!role) return "Employee";
  const map = {
    ADMIN: "Admin",
    MANAGER: "Manager",
    EMPLOYEE: "Employee",
  };
  return map[role] || role;
}

// Inline SVGs for clean presentation without external dependencies
function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function SettingsPage({
  section = "users",
  save,
  refresh,
  user: currentUser,
  onUserUpdate,
  isDark,
}) {
  const isDarkMode =
    isDark ??
    (typeof document !== "undefined" &&
      Boolean(document.querySelector(".inventory-app.dark")));

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalUser, setDetailsModalUser] = useState(null);
  const [editAccount, setEditAccount] = useState(null);
  const [removeAccount, setRemoveAccount] = useState(null);

  // Form & Network States
  const [newAccount, setNewAccount] = useState(emptyAccount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const isAdmin = currentUser?.role === "ADMIN";

  const isProtectedAccount = (user) =>
    user.id === (currentUser?.id || currentUser?._id) ||
    (user.role === "ADMIN" &&
      users.filter((entry) => entry.role === "ADMIN").length <= 1);

  // Fetch users on load / refresh
  useEffect(() => {
    if (section !== "users") return undefined;
    let active = true;
    api("get", "/users")
      .then(({ data }) => {
        if (active) setUsers(data);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [section, refresh]);

  // Filtered & Paged users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (u.role === "ADMIN") return false; // Admin accounts are hidden from the list
      const q = searchQuery.toLowerCase().trim();
      const name = (u.fullName || `${u.firstName} ${u.lastName}`).toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || "").toLowerCase();

      const matchesQuery =
        !q || name.includes(q) || email.includes(q) || role.includes(q);

      const matchesRole =
        roleFilter === "ALL" || (u.role && u.role.toUpperCase() === roleFilter);

      return matchesQuery && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const totalPages = Math.ceil((filteredUsers.length || 1) / pageSize);
  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Handle Account Creation Validation
  function validateNewAccount() {
    const firstName = clean(newAccount.firstName);
    const lastName = clean(newAccount.lastName);
    const email = clean(newAccount.email).toLowerCase();

    if (!nameIsValid(firstName))
      return "Enter a valid first name (2-50 letters).";
    if (!nameIsValid(lastName))
      return "Enter a valid last name (2-50 letters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Enter a valid work email address.";
    if (newAccount.password.length < 10)
      return "Password must contain at least 10 characters.";
    if (!/[A-Z]/.test(newAccount.password) || !/[a-z]/.test(newAccount.password))
      return "Password must contain at least one uppercase and one lowercase letter.";
    if (!/\d/.test(newAccount.password))
      return "Password must contain at least one number.";
    if (newAccount.password !== newAccount.confirmPassword)
      return "Passwords do not match.";

    return "";
  }

  function handleCreateAccount(event) {
    event.preventDefault();
    const validationError = validateNewAccount();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setBusy(true);
    setFormError("");
    setError("");

    save(
      "post",
      "/users",
      {
        firstName: clean(newAccount.firstName),
        lastName: clean(newAccount.lastName),
        email: clean(newAccount.email).toLowerCase(),
        password: newAccount.password,
        role: newAccount.role,
        branchId: TAGUIG_WAREHOUSE_ID,
      },
      "User account created.",
    )
      .then((createdUser) => {
        if (createdUser && createdUser.id) {
          setUsers((prev) => [...prev, createdUser]);
        } else {
          // Re-fetch users
          api("get", "/users").then(({ data }) => setUsers(data));
        }
        setNewAccount(emptyAccount);
        setCreateModalOpen(false);
      })
      .catch((err) => setFormError(errorMessage(err)))
      .finally(() => setBusy(false));
  }

  function confirmRemoveAccount() {
    if (
      !isAdmin ||
      !removeAccount ||
      isProtectedAccount(removeAccount) ||
      removeBusy
    )
      return;

    setRemoveBusy(true);
    setRemoveError("");
    const id = removeAccount.id;

    save(
      "delete",
      `/users/${id}`,
      undefined,
      "User account removed.",
      undefined,
      { refresh: false },
    )
      .then(() => {
        setUsers((current) => current.filter((u) => u.id !== id));
        setRemoveAccount(null);
      })
      .catch((err) => setRemoveError(errorMessage(err)))
      .finally(() => setRemoveBusy(false));
  }

  if (section !== "users") return null;

  return (
    <div className="um-container">
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          closable
          onClose={() => setError("")}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* ── MAIN CARD: ACCOUNT LIST (Figma Node 534:5462) ── */}
      <div className="um-card">
        {/* Header Row: Title, Search, Filter, Register Button */}
        <div className="um-header-row">
          <div className="um-header-left">
            {/* Title with List Icon */}
            <div className="um-title-group">
              <div className="um-title-icon-box">
                <ListIcon />
              </div>
              <h2 className="um-title">Account List</h2>
            </div>

            {/* Search Input */}
            <div className="um-search-wrap">
              <span className="um-search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="um-search-input"
                placeholder="Search name, role, or email"
                aria-label="Search name, role, or email"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="um-header-right">
            {/* Filter Dropdown */}
            <div className="um-filter-wrap">
              <select
                className="um-filter-btn"
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">ALL</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>

            {/* Register Account Button */}
            {isAdmin && (
              <button
                type="button"
                className="um-btn-register"
                onClick={() => {
                  setFormError("");
                  setNewAccount(emptyAccount);
                  setCreateModalOpen(true);
                }}
              >
                <PlusIcon />
                <span>Register Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Account Table */}
        <div className="um-table-container">
          <table className="um-table">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>FULLNAME</th>
                <th style={{ width: "24%" }}>EMAIL</th>
                <th style={{ width: "14%" }}>ROLE</th>
                <th style={{ width: "12%" }}>STATUS</th>
                <th style={{ width: "14%" }}>JOINED DATE</th>
                <th style={{ width: "14%", textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="um-empty-state">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                pagedUsers.map((item) => {
                  const nameInfo = parseName(item);
                  const isOwn = item.id === (currentUser?.id || currentUser?._id);
                  const protectedUser = isProtectedAccount(item);
                  const isActive = item.availability !== "AWAY";

                  return (
                    <tr key={item.id}>
                      {/* FULLNAME */}
                      <td className="um-td-fullname">
                        {item.fullName || `${nameInfo.firstName} ${nameInfo.lastName}`}
                      </td>

                      {/* EMAIL */}
                      <td>{item.email}</td>

                      {/* ROLE */}
                      <td>
                        <span className="um-role-text">{formatRole(item.role)}</span>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`um-status-badge ${
                            isActive ? "active" : "inactive"
                          }`}
                        >
                          <span className="um-status-dot" />
                          <span>{isActive ? "Active" : "Inactive"}</span>
                        </span>
                      </td>

                      {/* JOINED DATE */}
                      <td>{formatJoinedDate(item.createdAt)}</td>

                      {/* ACTIONS */}
                      <td>
                        <div
                          className="um-actions-cell"
                          style={{ justifyContent: "center" }}
                        >
                          {/* View Details Button (Eye) */}
                          <button
                            type="button"
                            className="um-action-btn"
                            title="View Details"
                            aria-label={`View ${item.fullName}`}
                            onClick={() => setDetailsModalUser(item)}
                          >
                            <EyeIcon />
                          </button>

                          {/* Edit User Button (Pen) */}
                          {isAdmin && (
                            <button
                              type="button"
                              className="um-action-btn"
                              title="Edit User"
                              aria-label={`Edit ${item.fullName}`}
                              onClick={() => setEditAccount(item)}
                            >
                              <PenIcon />
                            </button>
                          )}

                          {/* Delete User Button (Trash) */}
                          {isAdmin && (
                            <button
                              type="button"
                              className="um-action-btn btn-delete"
                              title={
                                protectedUser
                                  ? isOwn
                                    ? "Cannot delete your own signed-in account"
                                    : "Last administrator account cannot be deleted"
                                  : "Delete User"
                              }
                              aria-label={`Delete ${item.fullName}`}
                              disabled={protectedUser}
                              onClick={() => {
                                setRemoveError("");
                                setRemoveAccount(item);
                              }}
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="um-pagination-bar">
          <span className="um-pagination-text">
            Showing{" "}
            {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}{" "}
            to {Math.min(currentPage * pageSize, filteredUsers.length)} of{" "}
            {filteredUsers.length} entries
          </span>

          <div className="um-pagination-controls">
            <button
              type="button"
              className="um-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`um-page-btn ${p === currentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              className="um-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: CREATE USER ACCOUNT (Figma Node 534:5899) ── */}
      {createModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`um-modal-overlay ${isDarkMode ? "dark" : ""}`}
          >
            <div
              className="um-modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-user-modal-title"
            >
              {/* Header */}
              <div className="um-modal-header">
                <h3 id="create-user-modal-title" className="um-modal-title">
                  Create User Account
                </h3>
                <button
                  type="button"
                  className="um-modal-close-btn"
                  disabled={busy}
                  onClick={() => {
                    setFormError("");
                    setCreateModalOpen(false);
                  }}
                  aria-label="Close modal"
                >
                  <CloseIcon />
                </button>
              </div>

              {formError && (
                <Alert
                  type="error"
                  message={formError}
                  showIcon
                  style={{ marginBottom: 4 }}
                />
              )}

              {/* Form */}
              <form onSubmit={handleCreateAccount}>
                <div className="um-form-grid-2col">
                  {/* Left Column */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    {/* First Name */}
                    <div className="um-form-group">
                      <label className="um-form-label" htmlFor="create-first-name">
                        First Name
                      </label>
                      <input
                        id="create-first-name"
                        type="text"
                        className="um-form-input"
                        placeholder="e.g Juan"
                        required
                        maxLength={50}
                        disabled={busy}
                        value={newAccount.firstName}
                        onChange={(e) =>
                          setNewAccount({
                            ...newAccount,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Last Name */}
                    <div className="um-form-group">
                      <label className="um-form-label" htmlFor="create-last-name">
                        Last Name
                      </label>
                      <input
                        id="create-last-name"
                        type="text"
                        className="um-form-input"
                        placeholder="e.g Dela Cruz"
                        required
                        maxLength={50}
                        disabled={busy}
                        value={newAccount.lastName}
                        onChange={(e) =>
                          setNewAccount({
                            ...newAccount,
                            lastName: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Email */}
                    <div className="um-form-group">
                      <label className="um-form-label" htmlFor="create-email">
                        Email
                      </label>
                      <input
                        id="create-email"
                        type="email"
                        className="um-form-input"
                        placeholder="e.g delacruz@ashcol.com"
                        required
                        maxLength={200}
                        autoComplete="email"
                        disabled={busy}
                        value={newAccount.email}
                        onChange={(e) =>
                          setNewAccount({
                            ...newAccount,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    {/* Select Role */}
                    <div className="um-form-group">
                      <label className="um-form-label" htmlFor="create-role">
                        Select Role
                      </label>
                      <select
                        id="create-role"
                        className="um-form-select"
                        disabled={busy}
                        value={newAccount.role}
                        onChange={(e) =>
                          setNewAccount({
                            ...newAccount,
                            role: e.target.value,
                          })
                        }
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>

                    {/* Password */}
                    <div className="um-form-group">
                      <label className="um-form-label" htmlFor="create-password">
                        Password
                      </label>
                      <input
                        id="create-password"
                        type="password"
                        className="um-form-input"
                        placeholder="At least 10 characters"
                        required
                        minLength={10}
                        autoComplete="new-password"
                        disabled={busy}
                        value={newAccount.password}
                        onChange={(e) =>
                          setNewAccount({
                            ...newAccount,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Confirmed Password */}
                    <div className="um-form-group">
                      <label
                        className="um-form-label"
                        htmlFor="create-confirm-password"
                      >
                        Confirmed Password
                      </label>
                      <input
                        id="create-confirm-password"
                        type="password"
                        className="um-form-input"
                        placeholder="Confirmed Password"
                        required
                        minLength={10}
                        autoComplete="new-password"
                        disabled={busy}
                        value={newAccount.confirmPassword}
                        onChange={(e) =>
                          setNewAccount({
                            ...newAccount,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="um-modal-footer">
                  <button
                    type="submit"
                    className="um-btn-submit"
                    disabled={busy}
                  >
                    {busy ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* ── MODAL 2: USER DETAILS (Figma Node 534:6363) ── */}
      {detailsModalUser &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`um-modal-overlay ${isDarkMode ? "dark" : ""}`}
          >
            <div
              className="um-modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="user-details-modal-title"
            >
              {/* Header */}
              <div className="um-modal-header">
                <h3 id="user-details-modal-title" className="um-modal-title">
                  User Details
                </h3>
                <button
                  type="button"
                  className="um-modal-close-btn"
                  onClick={() => setDetailsModalUser(null)}
                  aria-label="Close modal"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Details 2-Column Grid */}
              <div className="um-details-grid">
                {/* Left Column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* First Name */}
                  <div className="um-details-item">
                    <span className="um-details-label">First Name</span>
                    <div className="um-details-value-box">
                      {parseName(detailsModalUser).firstName || "—"}
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="um-details-item">
                    <span className="um-details-label">Last Name</span>
                    <div className="um-details-value-box">
                      {parseName(detailsModalUser).lastName || "—"}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="um-details-item">
                    <span className="um-details-label">Email</span>
                    <div className="um-details-value-box">
                      {detailsModalUser.email || "—"}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* Select Role */}
                  <div className="um-details-item">
                    <span className="um-details-label">Select Role</span>
                    <div className="um-details-value-box">
                      {detailsModalUser.role || "EMPLOYEE"}
                    </div>
                  </div>

                  {/* Joined */}
                  <div className="um-details-item">
                    <span className="um-details-label">Joined</span>
                    <div className="um-details-value-box">
                      {formatJoinedDate(detailsModalUser.createdAt)}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="um-details-item">
                    <span className="um-details-label">Status</span>
                    <div className="um-details-value-box">
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor:
                            detailsModalUser.availability !== "AWAY"
                              ? "#13c906"
                              : "#9ca3af",
                          display: "inline-block",
                        }}
                      />
                      <span>
                        {detailsModalUser.availability !== "AWAY"
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Edit User Account Modal (using AccountEditor) */}
      {editAccount && (
        <AccountEditor
          key={editAccount.id}
          account={editAccount}
          administrative
          currentUser={currentUser}
          save={save}
          onSaved={(updated) => {
            setUsers((current) =>
              current.map((u) => (u.id === updated.id ? updated : u)),
            );
            onUserUpdate?.(updated, editAccount);
          }}
          onClose={() => setEditAccount(null)}
        />
      )}

      {/* Remove User Confirmation Modal */}
      <Modal
        title="Remove User Account"
        open={Boolean(removeAccount)}
        onCancel={() => !removeBusy && setRemoveAccount(null)}
        onOk={confirmRemoveAccount}
        okText="Remove User"
        okButtonProps={{
          danger: true,
          disabled: !removeAccount || isProtectedAccount(removeAccount),
        }}
        cancelButtonProps={{ disabled: removeBusy }}
        confirmLoading={removeBusy}
        closable={!removeBusy}
        maskClosable={false}
      >
        <Typography.Paragraph>
          Remove {removeAccount?.fullName} ({removeAccount?.email})? Their active
          sessions will end. Past stock movements and material request history
          will be kept.
        </Typography.Paragraph>
        {removeError && (
          <Alert type="error" showIcon message={removeError} />
        )}
      </Modal>
    </div>
  );
}
