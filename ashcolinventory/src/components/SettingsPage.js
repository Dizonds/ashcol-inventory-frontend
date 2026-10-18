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
      <>
        <Typography.Title level={3}>User Management</Typography.Title>
        <Typography.Paragraph type="secondary">
          Create and review authenticated inventory accounts. Assign the least-privileged
          role; all accounts automatically use the Taguig warehouse.
        </Typography.Paragraph>
        {!activeModule && <div className="user-management-actions" aria-label="User management actions">
          <Button className="user-management-action" onClick={() => setActiveModule("create")}>
            <span className="user-management-action-icon">+</span>
            <span>
              <strong>Create User Account</strong>
              <small>Add a new administrator, manager, or employee</small>
            </span>
          </Button>
          <Button className="user-management-action" onClick={() => setActiveModule("registered")}>
            <span className="user-management-action-icon user-management-action-icon--list">☷</span>
            <span>
              <strong>Registered User Accounts</strong>
              <small>Review all accounts and their assigned roles</small>
            </span>
          </Button>
        </div>}
        {activeModule && (
          <Button className="user-management-back" onClick={() => {
            setActiveModule(null);
            setError("");
            setFormError("");
          }}>
            ← Back to User Management
          </Button>
        )}
        {error && <Alert type="error" title={error} showIcon />}
        {formError && <Alert type="warning" title={formError} showIcon style={{ marginTop: 12 }} />}
        {activeModule === "create" && <Card title="Create User Account" className="user-management-module">
          <form onSubmit={createAccount}>
            <div className="form-grid">
              <label className="field">
                First name
                <Input required maxLength={50} placeholder="e.g. Juan" value={account.firstName} onChange={(e) => setAccount({ ...account, firstName: e.target.value })} />
              </label>
              <label className="field">
                Last name
                <Input required maxLength={50} placeholder="e.g. Dela Cruz" value={account.lastName} onChange={(e) => setAccount({ ...account, lastName: e.target.value })} />
              </label>
              <label className="field">
                Work email address
                <Input required type="email" maxLength={200} autoComplete="email" placeholder="name@ashcol.com" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
              </label>
              <label className="field">
                Account role
                <Select
                  value={account.role}
                  onChange={(role) => setAccount({ ...account, role })}
                  options={[
                    { value: "EMPLOYEE", label: "Employee — view and request materials" },
                    { value: "MANAGER", label: "Manager — manage warehouse inventory" },
                    { value: "ADMIN", label: "Administrator — manage the whole system" },
                  ]}
                />
              </label>
              <label className="field">
                Temporary password
                <Input.Password required minLength={10} autoComplete="new-password" placeholder="At least 10 characters" value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} />
                <small>Use uppercase, lowercase, and a number.</small>
              </label>
              <label className="field">
                Confirm password
                <Input.Password required minLength={10} autoComplete="new-password" placeholder="Re-enter temporary password" value={account.confirmPassword} onChange={(e) => setAccount({ ...account, confirmPassword: e.target.value })} />
              </label>
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
