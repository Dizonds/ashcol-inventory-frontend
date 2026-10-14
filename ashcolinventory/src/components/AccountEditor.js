import React, { useState } from "react";
import { Modal, Input, Select, Alert, Typography } from "antd";
import { errorMessage } from "../api";

export default function AccountEditor({ account, administrative = false, currentUser, save, onSaved, onClose }) {
  const parts = (account.fullName || "").split(/\s+/);
  const inferredFirstName = parts.shift() || "";
  const [form, setForm] = useState({
    firstName: account.firstName || inferredFirstName,
    lastName: account.lastName || parts.join(" "),
    email: account.email || "", role: account.role,
    availability: account.availability || "AVAILABLE",
    password: "", confirmPassword: "", currentPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const ownAccount = account.id === currentUser?.id;
  function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password && (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password) || /\s/.test(form.password) || form.password.length < 10)) {
      setError("Use at least 10 characters with uppercase, lowercase, and a number, without spaces."); return;
    }
    if (!administrative && form.password && !form.currentPassword) { setError("Enter your current password."); return; }
    setBusy(true); setError("");
    const data = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), availability: form.availability };
    if (administrative) Object.assign(data, { email: form.email.trim(), role: form.role });
    if (form.password) Object.assign(data, { password: form.password, ...(!administrative ? { currentPassword: form.currentPassword } : {}) });
    save("patch", administrative ? `/users/${account.id}` : "/auth/me", data,
      administrative ? "User account updated." : "Profile updated.", undefined, { refresh: false })
      .then((updated) => { onSaved(updated); onClose(); })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  }
  return <Modal open title={administrative ? "Edit User Account" : "Edit My Profile"}
    onCancel={() => !busy && onClose()} onOk={() => document.getElementById("account-editor-form").requestSubmit()}
    okText="Save Changes" confirmLoading={busy} cancelButtonProps={{ disabled: busy }} closable={!busy} maskClosable={!busy}>
    {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 12 }} />}
    <form id="account-editor-form" onSubmit={submit}>
      <div className="form-grid">
        <label className="field">First name<Input required maxLength={50} disabled={busy} value={form.firstName} onChange={(e) => field("firstName", e.target.value)} /></label>
        <label className="field">Last name<Input required maxLength={50} disabled={busy} value={form.lastName} onChange={(e) => field("lastName", e.target.value)} /></label>
        <label className="field">Email address<Input type="email" required readOnly={!administrative} disabled={busy} value={form.email} onChange={(e) => field("email", e.target.value)} /></label>
        <label className="field">Availability<Select aria-label="Account availability" disabled={busy} value={form.availability} onChange={(value) => field("availability", value)} options={["AVAILABLE", "BUSY", "AWAY"].map((value) => ({ value, label: value[0] + value.slice(1).toLowerCase() }))} /></label>
        {administrative && <label className="field">Account role<Select aria-label="Edit account role" disabled={busy || ownAccount} value={form.role} onChange={(value) => field("role", value)} options={[{ value: "ADMIN", label: "Administrator" }, { value: "MANAGER", label: "Manager" }, { value: "EMPLOYEE", label: "Technician / Employee" }]} /></label>}
      </div>
      <Typography.Paragraph type="secondary">Leave password fields blank to keep the current password.</Typography.Paragraph>
      {!administrative && <label className="field">Current password<Input.Password disabled={busy} autoComplete="current-password" value={form.currentPassword} onChange={(e) => field("currentPassword", e.target.value)} /></label>}
      <label className="field">{administrative ? "Set new password" : "New password"}<Input.Password disabled={busy} minLength={10} maxLength={200} autoComplete="new-password" value={form.password} onChange={(e) => field("password", e.target.value)} /></label>
      <label className="field">Confirm new password<Input.Password disabled={busy} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => field("confirmPassword", e.target.value)} /></label>
    </form>
  </Modal>;
}
