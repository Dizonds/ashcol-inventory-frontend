import React, { useState, useEffect, useMemo } from "react";
import {
  ConfigProvider,
  theme,
  Alert,
  Button,
  Card,
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
import JobOrdersPage from "./components/JobOrdersPage";
import { DEMO_SERVICE_VEHICLES } from "./data/demoServiceVehicles";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./App.css";

const TAGUIG_WAREHOUSE = {
  id: "LOCAL-WAREHOUSE",
  name: "ASHCOL Taguig Warehouse",
};

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
  const [serviceVans, setServiceVans] = useState([]);
  const [demoServiceVans, setDemoServiceVans] = useState(() =>
    DEMO_SERVICE_VEHICLES.map((vehicle) => ({ ...vehicle })),
  );
  const serviceVehicleList = useMemo(() => {
    const visibleDemos = user?.role === "EMPLOYEE"
      ? demoServiceVans.filter((van) => van.driverId === user.id || van.driverName === user.fullName)
      : demoServiceVans;
    return [...serviceVans, ...visibleDemos];
  }, [serviceVans, demoServiceVans, user]);

  function updateDemoVehicle(vehicle) {
    setDemoServiceVans((current) => current.map((van) => van.id === vehicle.id ? vehicle : van));
    setNotice({ type: "success", text: "Service vehicle updated." });
    return vehicle;
  }

  function removeDemoVehicle(id) {
    setDemoServiceVans((current) => current.filter((van) => van.id !== id));
    setNotice({ type: "success", text: "Service vehicle deleted." });
  }
  function accountUpdated(updated, previous) {
    const renameDriver = (van) => van.driverId === updated.id ||
      (!van.driverId && [previous.fullName, `${previous.fullName} (${previous.role})`].includes(van.driverName))
      ? { ...van, driverName: updated.fullName } : van;
    setServiceVans((current) => current.map(renameDriver));
    setDemoServiceVans((current) => current.map(renameDriver));
    if (updated.id === user.id) setUser(updated);
  }
  // The main inventory view is the fixed Taguig warehouse for every role.
  // Employee-specific van access is handled inside Service Vehicles.
  const branchId = TAGUIG_WAREHOUSE.id;
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [requests, setRequests] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [targetId, setTargetId] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState(null);
  const [stockChartView, setStockChartView] = useState(null);
  const [searchQuery] = useState("");
  useEffect(() => {
    if (!user) setStockChartView(null);
  }, [user]);
  const [isDark, setIsDark] = useState(
    localStorage.getItem("ashcol_theme") === "dark",
  );
  const canManage = user && user.role !== "EMPLOYEE";

  // Keep page 100% full screen without shrinking html viewport
  useEffect(() => {
    document.documentElement.style.zoom = "";
  }, []);

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
    if (user.branchId !== TAGUIG_WAREHOUSE.id) {
      setError("This account is not assigned to the Taguig warehouse.");
    }
    api("get", "/service-vans")
      .then(({ data }) => {
        if (active && Array.isArray(data)) {
          setServiceVans(data);
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

  function save(method, path, data, success, params, options = {}) {
    return api(method, path, data, params)
      .then((response) => {
        if (options.refresh !== false) setRefresh((value) => value + 1);
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
        setServiceVans([]);
        setItems([]);
        setRequests([]);
        setDataReady(false);
        setError("");
        setNotice(null);
        setPage("dashboard");
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          sessionStorage.removeItem("ashcol_inventory_token");
          setUser(null);
        } else setNotice({ type: "error", text: errorMessage(err) });
      });
  }
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
              setPage("dashboard");
            }}
          />

        /* ── MAIN APP ── */
        ) : (
          <>
            {/* SIDEBAR */}
            <Sidebar
              page={page}
              setPage={setPage}
              user={user}
              canManage={canManage}
            />

            {/* MAIN CONTENT */}
            <main className="app-main">
              <Header
                page={page}
                user={user}
                loading={loading}
                setRefresh={setRefresh}
                isDark={isDark}
                setIsDark={setIsDark}
                logout={logout}
                save={save}
                onProfileUpdate={(updated) => accountUpdated(updated, user)}
                pendingCount={requests.filter((r) => r.status === "PENDING").length}
              />

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
                            user={user}
                            stockChartView={stockChartView}
                            onStockChartViewSave={setStockChartView}
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
                            items={
                              searchQuery
                                ? items.filter(
                                    (i) =>
                                      (i.productName || i.name || "")
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase()) ||
                                      (i.sku || "")
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase())
                                  )
                                : items
                            }
                            brands={brands}
                            serviceVans={serviceVans}
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
                            serviceVans={serviceVehicleList}
                            updateDemoVehicle={updateDemoVehicle}
                            removeDemoVehicle={removeDemoVehicle}
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
                            isDark={isDark}
                          />
                        )}
                        {page === "suppliers" && (
                          <SuppliersPage
                            user={user}
                            save={save}
                            refresh={refresh}
                            items={items}
                            isDark={isDark}
                          />
                        )}
                        {page === "requests" && (
                          <RequestsPage
                            items={items}
                            requests={requests}
                            user={user}
                            serviceVans={serviceVans}
                            branchId={branchId}
                            save={save}
                          />
                        )}
                        {page === "job_orders" && (
                          <JobOrdersPage user={user} serviceVans={serviceVans} refresh={refresh} />
                        )}
                        {page === "post_movement" && canManage && (
                          <PostMovementPage
                            items={items}
                            branchId={branchId}
                            user={user}
                            save={save}
                            preselectedItemId={targetId}
                          />
                        )}
                        {page === "movements" && (
                          <MovementsPage
                            branchId={branchId}
                            refresh={refresh}
                          />
                        )}
                        {page === "user_management" && user.role === "ADMIN" && (
                          <SettingsPage
                            section="users"
                            onUserUpdate={accountUpdated}
                            user={user}
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
