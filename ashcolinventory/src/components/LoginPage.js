import React, { useState } from "react";
import { api, errorMessage } from "../api";
import "./LoginPage.css";
import loginBg from "../assets/loginWarehouse.png";
import ashcolLogo from "../assets/ashcolLogoFigma.png";

export default function LoginPage({ onLogin, initialError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const cleanEmail = email.trim();
    const cleanPassword = password;
    if (/\s/.test(cleanPassword)) {
      setError("Password cannot contain spaces.");
      setBusy(false);
      return;
    }
    api("post", "/auth/login", { email: cleanEmail, password: cleanPassword })
      .then(({ data }) => {
        sessionStorage.setItem("ashcol_inventory_token", data.token);
        onLogin(data.user);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  }

  return (
    <div className="login-page-wrapper" data-node-id="432:7617">
      {/* Background with Dark Overlay */}
      <img
        src={loginBg}
        alt="Air conditioning warehouse background"
        className="login-bg-media"
      />
      <div className="login-bg-overlay" aria-hidden="true" />

      {/* Frosted Glass Login Card */}
      <div className="login-glass-card" data-node-id="432:7618">
        {/* Header */}
        <div className="login-header-group" data-node-id="432:7619">
          <img
            src={ashcolLogo}
            alt="Ashcol Logo"
            className="login-ashcol-logo"
            data-node-id="432:7731"
          />
          <h1 className="login-title" data-node-id="432:7642">
            Welcome to Ashcol
          </h1>
          <p className="login-subtitle" data-node-id="432:7643">
            Access your workspace and monitoring dashboard.
          </p>
        </div>

        {/* Error notification */}
        {(error || initialError) && (
          <div className="login-alert-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error || initialError}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="login-form" onSubmit={submit}>
          <div className="login-field">
            <label htmlFor="login-email-input" className="login-field-label" data-node-id="432:7734">
              Email
            </label>
            <div className="login-input-wrap">
              <input
                id="login-email-input"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="login-input-pill"
                data-node-id="432:7645"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password-input" className="login-field-label" data-node-id="432:7736">
              Password
            </label>
            <div className="login-input-wrap">
              <input
                id="login-password-input"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="login-input-pill with-toggle"
                data-node-id="432:7654"
              />
              <button
                type="button"
                className="login-pwd-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                data-node-id="432:7743"
              >
                {showPassword ? (
                  /* Eye off icon */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  /* Eye icon */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={busy}
            data-node-id="432:7669"
          >
            {busy ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Admin note */}
        <p className="login-admin-note" data-node-id="432:7672">
          For account access, contact your administrator.
        </p>


      </div>
    </div>
  );
}
