import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { api, errorMessage } from "../api";

const emptyAccount = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "EMPLOYEE",
};

const TAGUIG_WAREHOUSE_ID = "LOCAL-WAREHOUSE";

function clean(value) {
  return value.trim().replace(/\s+/g, " ");
}

function nameIsValid(value) {
  return /^[\p{L}][\p{L} .'-]{1,49}$/u.test(clean(value));
}

export default function SettingsPage({ section = "branches", save, refresh, user: currentUser }) {
  const [account, setAccount] = useState(emptyAccount);
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [activeModule, setActiveModule] = useState(null);
  const [removeAccount, setRemoveAccount] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const isAdmin = currentUser?.role === "ADMIN";
  const isProtectedAccount = (user) => user.id === (currentUser?.id || currentUser?._id) ||
    (user.role === "ADMIN" && users.filter((entry) => entry.role === "ADMIN").length <= 1);

  function confirmRemoveAccount() {
    if (!isAdmin || !removeAccount || isProtectedAccount(removeAccount) || removeBusy) return;
    setRemoveBusy(true);
    setRemoveError("");
    const id = removeAccount.id;
    save("delete", `/users/${id}`, undefined, "User account removed.", undefined, { refresh: false })
      .then(() => {
        setUsers((current) => current.filter((user) => user.id !== id));
        setRemoveAccount(null);
      })
      .catch((err) => setRemoveError(errorMessage(err)))
      .finally(() => setRemoveBusy(false));
  }

  useEffect(() => {
    if (section !== "users") return undefined;
    let active = true;
    api("get", "/users")
      .then(({ data }) => active && setUsers(data))
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, [section, refresh]);

  function validateAccount() {
    const firstName = clean(account.firstName);
    const lastName = clean(account.lastName);
    const email = clean(account.email).toLowerCase();
    if (!nameIsValid(firstName)) return "Enter a valid first name (2-50 letters).";
    if (!nameIsValid(lastName)) return "Enter a valid last name (2-50 letters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Enter a valid work email address.";
    if (account.password.length < 10)
      return "Password must contain at least 10 characters.";
    if (!/[A-Z]/.test(account.password) || !/[a-z]/.test(account.password))
      return "Password must contain at least one uppercase and one lowercase letter.";
    if (!/\d/.test(account.password))
      return "Password must contain at least one number.";
    if (account.password !== account.confirmPassword) return "Passwords do not match.";
    return "";
  }

  function createAccount(event) {
    event.preventDefault();
    const validationError = validateAccount();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setBusy(true);
    setError("");
    setFormError("");
    save(
      "post",
      "/users",
      {
        firstName: clean(account.firstName),
        lastName: clean(account.lastName),
        email: clean(account.email).toLowerCase(),
        password: account.password,
        role: account.role,
        branchId: TAGUIG_WAREHOUSE_ID,
      },
      "User account created.",
    )
      .then(() => setAccount(emptyAccount))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  }

  if (section === "users") {
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
            <Button type="primary" htmlType="submit" loading={busy} style={{ marginTop: 8 }}>
              Create User Account
            </Button>
          </form>
        </Card>}
        {activeModule === "registered" && <Card title="Registered User Accounts" className="user-management-module">
          <Table
            rowKey="id"
            dataSource={users}
            scroll={{ x: 700 }}
            columns={[
              { title: "Name", render: (_, user) => <strong>{user.fullName || `${user.firstName} ${user.lastName}`}</strong> },
              { title: "Email", dataIndex: "email" },
              { title: "Role", dataIndex: "role", render: (role) => <Tag color={role === "ADMIN" ? "green" : role === "MANAGER" ? "blue" : "default"}>{role}</Tag> },
              ...(isAdmin ? [{
                title: "Actions",
                render: (_, user) => (
                  <Button
                    danger
                    disabled={isProtectedAccount(user)}
                    title={isProtectedAccount(user) ? "Your signed-in account and the last administrator are protected." : "Remove this user account"}
                    onClick={() => {
                      setRemoveError("");
                      setRemoveAccount(user);
                    }}
                  >
                    Remove User
                  </Button>
                ),
              }] : []),
            ]}
          />
        </Card>}
        <Modal
          title="Remove User Account"
          open={Boolean(removeAccount)}
          onCancel={() => !removeBusy && setRemoveAccount(null)}
          onOk={confirmRemoveAccount}
          okText="Remove User"
          okButtonProps={{ danger: true, disabled: !removeAccount || isProtectedAccount(removeAccount) }}
          cancelButtonProps={{ disabled: removeBusy }}
          confirmLoading={removeBusy}
          closable={!removeBusy}
          maskClosable={!removeBusy}
        >
          <Typography.Paragraph>
            Remove {removeAccount?.fullName} ({removeAccount?.email})? Their active sessions will end.
            Past stock movements and material request history will be kept.
          </Typography.Paragraph>
          {removeError && <Alert type="error" showIcon title={removeError} />}
        </Modal>
      </>
    );
  }

  return null;
}
