import React, { useState, useEffect } from "react";
import {
  ConfigProvider,
  theme,
  Alert,
  Button,
  Card,
  Select,
  Space,
  Spin,
  Skeleton,
} from "antd";
import { api, errorMessage } from "./api";
import LoginPage from "./components/LoginPage";
import DashboardPage from "./components/DashboardPage";
import InventorySection from "./components/InventorySection";
import PostMovementPage from "./components/PostMovementPage";
import MovementsPage from "./components/MovementsPage";
import RequestsPage from "./components/RequestsPage";
import SettingsPage from "./components/SettingsPage";
import CompatibilityLookupPage from "./components/CompatibilityLookupPage";
import SuppliersPage from "./components/SuppliersPage";
import ServiceVansPage from "./components/ServiceVansPage";
import {
  Widget5BoldDuotoneIcon,
  BoxBoldDuotoneIcon,
  BusBoldDuotoneIcon,
  ScannerBoldDuotoneIcon,
  BuildingsBoldDuotoneIcon,
  CartLargeBoldDuotoneIcon,
  TransferVerticalBoldDuotoneIcon,
  ClipboardListBoldDuotoneIcon,
  MapPointBoldDuotoneIcon,
  UsersGroupTwoRoundedBoldDuotoneIcon,
  ShopBoldDuotoneIcon
} from "@solar-icons/react";
import "./App.css";

function InventoryLoadingState() {
  return (
    <div className="inventory-loading" role="status" aria-live="polite">
      <div className="loading-heading">
        <Skeleton active title={{ width: 220 }} paragraph={{ rows: 1, width: 320 }} />
      </div>
      <div className="loading-metrics">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item} className="loading-card">
            <Skeleton active title={{ width: "42%" }} paragraph={{ rows: 1, width: "68%" }} />
          </Card>
        ))}
      </div>
      <Card className="loading-table-card">
        <Skeleton active title={{ width: "28%" }} paragraph={{ rows: 6 }} />
      </Card>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [targetId, setTargetId] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState(null);
  const [isDark, setIsDark] = useState(
    localStorage.getItem("ashcol_theme") === "dark",
  );
  const canManage = user && user.role !== "EMPLOYEE";

  useEffect(() => {
    let active = true;
    if (!sessionStorage.getItem("ashcol_inventory_token")) {
      setChecking(false);
      return;
    }
    api("get", "/auth/me")
      .then(({ data }) => {
        if (active) setUser(data);
      })
      .catch((err) => {
        if (active) {
          if (err.response && err.response.status === 401)
            sessionStorage.removeItem("ashcol_inventory_token");
          setError(errorMessage(err));
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api("get", "/branches")
      .then(({ data }) => {
        if (active) {
          setBranches(data);
          setBranchId((current) => current || user.branchId);
        }
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [user, refresh]);

  useEffect(() => {
    if (!user || !branchId) return;
    let active = true;
    setDataReady(false);
    setLoading(true);
    setError("");
    Promise.all([
      api("get", "/products", null, { branchId }),
      api("get", "/brands"),
      api("get", "/requests", null, { branchId }),
    ])
      .then(([stock, brandList, requestList]) => {
        if (active) {
          setItems(stock.data);
          setBrands(brandList.data);
          setRequests(requestList.data);
          setDataReady(true);
        }
      })
      .catch((err) => {
        if (active) {
          setItems([]);
          setRequests([]);
          setDataReady(false);
          setError(errorMessage(err));
          if (err.response && err.response.status === 401) {
            sessionStorage.removeItem("ashcol_inventory_token");
            setUser(null);
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, branchId, refresh]);

  function save(method, path, data, success, params) {
    return api(method, path, data, params)
      .then((response) => {
        setRefresh((value) => value + 1);
        setNotice({ type: "success", text: success });
        return response.data;
      })
      .catch((err) => {
        setNotice({ type: "error", text: errorMessage(err) });
        if (err.response && err.response.status === 401) {
          sessionStorage.removeItem("ashcol_inventory_token");
          setUser(null);
        }
        throw err;
      });
  }
  function logout() {
    api("post", "/auth/logout")
      .then(() => {
        sessionStorage.removeItem("ashcol_inventory_token");
        setUser(null);
        setBranchId("");
        setItems([]);
        setRequests([]);
        setBranches([]);
        setDataReady(false);
        setError("");
        setNotice(null);
        setPage("dashboard");
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          sessionStorage.removeItem("ashcol_inventory_token");
          setUser(null);
          setBranchId("");
        } else setNotice({ type: "error", text: errorMessage(err) });
      });
  }
  const navigation = [
    { id: "dashboard", label: "Overview", icon: <Widget5BoldDuotoneIcon size={22} /> },
    { id: "inventory", label: "Inventory Catalog", icon: <BoxBoldDuotoneIcon size={22} /> },
    { id: "service_vehicles", label: "Service Vehicles", icon: <BusBoldDuotoneIcon size={22} /> },
    { id: "compatibility", label: "Model Matching", icon: <ScannerBoldDuotoneIcon size={22} /> },
    { id: "suppliers", label: "Suppliers & Vendors", icon: <BuildingsBoldDuotoneIcon size={22} /> },
    { id: "requests", label: "Material Requests", icon: <CartLargeBoldDuotoneIcon size={22} /> },
    ...(canManage ? [{ id: "post_movement", label: "Post Movement", icon: <TransferVerticalBoldDuotoneIcon size={22} /> }] : []),
    { id: "movements", label: "Stock Ledger", icon: <ClipboardListBoldDuotoneIcon size={22} /> },
    ...(user && user.role === "ADMIN"
      ? [
          { id: "branches", label: "Branches", icon: <MapPointBoldDuotoneIcon size={22} /> },
          { id: "user_management", label: "User Management", icon: <UsersGroupTwoRoundedBoldDuotoneIcon size={22} /> },
        ]
      : []),
  ];
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#059669",
          borderRadius: 10,
          fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          colorBgContainer: isDark ? "#152018" : "#ffffff",
          colorBgElevated:  isDark ? "#1a2a20" : "#ffffff",
          colorBorder:      isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
          colorText:        isDark ? "#e0ede7" : "#111b14",
          colorTextSecondary: isDark ? "#8ab09a" : "#4a5e55",
          colorTextPlaceholder: isDark ? "#4d7060" : "#8fa99c",
        },
      }}
    >
      <div className={`inventory-app ${isDark ? "dark" : ""}`}>

        {/* ── CHECKING SESSION ── */}
        {checking ? (
          <div className="login-wrap">
            <Spin description="Checking session">
              <div style={{ padding: 40 }} />
            </Spin>
          </div>

        /* ── LOGIN PAGE ── */
        ) : !user ? (
          <LoginPage
            initialError={error}
            onLogin={(account) => {
              setError("");
              setUser(account);
              setBranchId(account.branchId);
              setPage("dashboard");
            }}
          />

        /* ── MAIN APP ── */
        ) : (
          <>
            {/* SIDEBAR */}
            <aside className="app-sidebar">
              <div className="sidebar-logo">
                <img src="/assets/ash-logo.jpg" alt="ASHCOL" />
                <h2>ASHCOL</h2>
              </div>

              <div className="sidebar-section-title">NAVIGATION</div>

              <nav className="app-nav" aria-label="Inventory navigation">
                {navigation.map((entry) => (
                  <button
                    key={entry.id}
                    className={`nav-btn ${page === entry.id ? "active" : ""}`}
                    onClick={() => setPage(entry.id)}
                    title={entry.label}
                  >
                    {entry.icon}
                    <span>{entry.label}</span>
                  </button>
                ))}
              </nav>

              <div className="sidebar-bottom">
                <div className="sidebar-section-title">USER ACCOUNT</div>
                <div className="user-profile">
                  <div className="user-avatar">{user.fullName.charAt(0)}</div>
                  <div className="user-info">
                    <strong>{user.fullName}</strong>
                    <span>{user.role}</span>
                  </div>
                </div>
                <div className="sidebar-actions">
                  <button
                    className="sidebar-action-btn"
                    onClick={() => {
                      setIsDark(!isDark);
                      localStorage.setItem("ashcol_theme", !isDark ? "dark" : "light");
                    }}
                    title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
                  >
                    <span className="action-icon" style={{ fontSize: 16 }}>{isDark ? "☀️" : "🌙"}</span>
                    <span className="btn-label">{isDark ? "Light mode" : "Dark mode"}</span>
                  </button>
                  <button className="sidebar-action-btn" onClick={logout} title="Log out">
                    <span className="action-icon" style={{ fontSize: 16 }}>↩</span>
                    <span className="btn-label">Log out</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="app-main">
              <header className="main-header">
                <h1>{navigation.find((n) => n.id === page)?.label || "Dashboard"}</h1>
                <div className="branch-toolbar">
                  <strong>Branch</strong>
                  <Select
                    aria-label="Current branch"
                    value={branchId || undefined}
                    style={{ minWidth: 200 }}
                    disabled={user.role !== "ADMIN"}
                    options={branches
                      .filter((branch) => branch.branchType !== "SERVICE_VAN")
                      .map((branch) => ({
                        value: branch.id,
                        label: (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <ShopBoldDuotoneIcon size={16} />
                            {branch.name}
                          </span>
                        ),
                      }))}
                    onChange={(value) => {
                      setBranchId(value);
                      setItems([]);
                      setRequests([]);
                      setTargetId("");
                    }}
                  />
                  <Button loading={loading} onClick={() => setRefresh(refresh + 1)}>
                    Refresh
                  </Button>
                </div>
              </header>

              <div className="main-content">
                {error && (
                  <Alert
                    type="error"
                    showIcon
                    title="Inventory could not be loaded"
                    description={
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 4 }}>
                        <span>{error}</span>
                        <Button
                          size="small"
                          danger
                          loading={loading}
                          onClick={() => {
                            setError("");
                            setRefresh((r) => r + 1);
                          }}
                        >
                          Retry Connection
                        </Button>
                      </div>
                    }
                    style={{ marginBottom: 16 }}
                  />
                )}
                {notice && (
                  <Alert
                    type={notice.type}
                    title={notice.text}
                    showIcon
                    closable
                    onClose={() => setNotice(null)}
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Spin spinning={loading}>
                  {!error && branchId && (
                    loading && !dataReady ? (
                      <InventoryLoadingState />
                    ) : (
                      <div className="page-transition" key={`${page}-${branchId}`}>
                        {page === "dashboard" && (
                          <DashboardPage
                            items={items}
                            requests={requests}
                            branchId={branchId}
                            canManage={canManage}
                            onRestockItem={(id) => {
                              setTargetId(id);
                              setPage("post_movement");
                            }}
                            onNavigateToInventoryWithFilter={(filter) => {
                              setInventoryFilter(filter);
                              setPage("inventory");
                            }}
                          />
                        )}
                        {page === "inventory" && (
                          <InventorySection
                            items={items}
                            brands={brands}
                            branches={branches}
                            user={user}
                            branchId={branchId}
                            save={save}
                            preselectedFilter={inventoryFilter}
                            onNavigateToPostMovement={() => {
                              setTargetId("");
                              setPage("post_movement");
                            }}
                          />
                        )}
                        {(page === "service_vehicles" || page === "service_vans") && (
                          <ServiceVansPage
                            branches={branches}
                            branchId={branchId}
                            user={user}
                            save={save}
                            refresh={refresh}
                          />
                        )}
                        {page === "compatibility" && (
                          <CompatibilityLookupPage
                            items={items}
                            onNavigateToItem={() => setPage("inventory")}
                          />
                        )}
                        {page === "suppliers" && (
                          <SuppliersPage user={user} save={save} refresh={refresh} />
                        )}
                        {page === "requests" && (
                          <RequestsPage
                            items={items}
                            requests={requests}
                            user={user}
                            branchId={branchId}
                            save={save}
                          />
                        )}
                        {page === "post_movement" && canManage && (
                          <PostMovementPage
                            items={items}
                            branches={branches}
                            branchId={branchId}
                            user={user}
                            save={save}
                            preselectedItemId={targetId}
                          />
                        )}
                        {page === "movements" && (
                          <MovementsPage branchId={branchId} refresh={refresh} />
                        )}
                        {page === "branches" && user.role === "ADMIN" && (
                          <SettingsPage
                            section="branches"
                            branches={branches}
                            save={save}
                            refresh={refresh}
                          />
                        )}
                        {page === "user_management" && user.role === "ADMIN" && (
                          <SettingsPage
                            section="users"
                            branches={branches}
                            save={save}
                            refresh={refresh}
                          />
                        )}
                      </div>
                    )
                  )}
                </Spin>
              </div>
            </main>
          </>
        )}
      </div>
    </ConfigProvider>
  );
}
