import React, { useState } from "react";
import { api, errorMessage } from "../api";
import "./LoginPage.css";
import loginBg from "../assets/loginBgFigma.png";
import ashcolLogo from "../assets/ashcolLogoFigma.png";
import googleIcon from "../assets/googleIcon.svg";

export default function LoginPage({ onLogin, initialError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const defaultAccounts = [
    { fullName: "Admin Master", role: "ADMIN", email: "hatdog@hat.com", password: "hatdog@hat.com" },
    { fullName: "Miguel Reyes", role: "MANAGER", email: "manager@ashcol.com", password: "hatdog@hat.com" },
    { fullName: "Adrian Santos", role: "EMPLOYEE", email: "technician@ashcol.com", password: "hatdog@hat.com" },
    { fullName: "Carlo Navarro", role: "EMPLOYEE", email: "technician2@ashcol.com", password: "hatdog@hat.com" },
    { fullName: "Joshua Cruz", role: "EMPLOYEE", email: "technician3@ashcol.com", password: "hatdog@hat.com" },
    { fullName: "Rafael Garcia", role: "EMPLOYEE", email: "technician4@ashcol.com", password: "hatdog@hat.com" },
  ];

  const [demoAccounts] = useState(() => {
    try {
      const local = JSON.parse(localStorage.getItem("ashcol_demo_users") || "[]");
      const map = new Map();
      defaultAccounts.forEach((a) => map.set(a.email, a));
      local.forEach((a) => map.set(a.email, a));
      return Array.from(map.values());
    } catch (e) {
      return defaultAccounts;
    }
  });

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
        alt="Ashcol Fleet and Logistics Background"
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

        {/* Divider */}
        <div className="login-divider" data-node-id="432:7660">
          <div className="login-divider-line" />
          <span className="login-divider-text">or</span>
          <div className="login-divider-line" />
        </div>

        {/* Google Continue Button */}
        <button
          type="button"
          className="login-google-btn"
          onClick={() => {
            setError("Google sign-in is not configured yet. Please sign in with your email and password.");
          }}
          data-node-id="432:7665"
        >
          <img src={googleIcon} alt="Google" className="login-google-icon" />
          <span>Continue with Google</span>
        </button>

        {/* Admin note */}
        <p className="login-admin-note" data-node-id="432:7672">
          For account access, contact your administrator.
        </p>

        {/* Quick Demo Access (Helpful for testing credentials) */}
        <div className="login-demo-section">
          <span className="login-demo-title">Quick Demo Fill:</span>
          <div className="login-demo-chips">
            {demoAccounts.map((acc) => {
              const icon =
                acc.role === "ADMIN" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ) : acc.role === "MANAGER" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                );
              return (
                <button
                  key={acc.email}
                  type="button"
                  className="login-demo-chip"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password || "hatdog@hat.com");
                  }}
                >
                  {icon}
                  <span>{acc.fullName.split(" ")[0]} ({acc.role})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
