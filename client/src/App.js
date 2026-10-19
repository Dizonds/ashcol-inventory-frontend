import React, { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
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
import LoginPage from "./pages/auth/LoginPage";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import NotificationStack from "./components/common/NotificationStack";
import useLiveUpdates from "./hooks/useLiveUpdates";
import { allowedPage, PAGE_STORAGE_KEY, PAGE_PATHS, pageFromPath, initialPage } from "./utils/navigation";
import "./App.css";


const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const InventorySection = lazy(() => import("./pages/inventory/InventorySection"));
const PostMovementPage = lazy(() => import("./pages/movements/PostMovementPage"));
const MovementsPage = lazy(() => import("./pages/movements/MovementsPage"));
const RequestsPage = lazy(() => import("./pages/requests/RequestsPage"));
const SettingsPage = lazy(() => import("./pages/users/SettingsPage"));
const CompatibilityLookupPage = lazy(() => import("./pages/model-matching/CompatibilityLookupPage"));
const SuppliersPage = lazy(() => import("./pages/suppliers/SuppliersPage"));
const ServiceVansPage = lazy(() => import("./pages/service-vehicles/ServiceVansPage"));
const JobOrdersPage = lazy(() => import("./pages/job-orders/JobOrdersPage"));

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
  const [page, setPage] = useState(initialPage);
  function navigatePage(nextPage) {
    const destination = allowedPage(nextPage, user?.role);
    if (window.location.pathname !== PAGE_PATHS[destination]) {
      window.history.pushState(null, "", PAGE_PATHS[destination]);
    }
    setPage(destination);
  }
  const [serviceVans, setServiceVans] = useState([]);
  function accountUpdated(updated, previous) {
    const renameDriver = (van) => van.driverId === updated.id ||
      (!van.driverId && [previous.fullName, `${previous.fullName} (${previous.role})`].includes(van.driverName))
      ? { ...van, driverName: updated.fullName } : van;
    setServiceVans((current) => current.map(renameDriver));
    if (updated.id === user.id) setUser(updated);
  }


  const branchId = TAGUIG_WAREHOUSE.id;
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [requests, setRequests] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const hasLoadedData = useRef(false);
  const [error, setError] = useState("");
  const [notices, setNotices] = useState([]);
  const noticeSequence = useRef(0);
  const dismissNotice = useCallback((id) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);
  function notify(type, text) {
    const notice = { id: ++noticeSequence.current, type, text };
    setNotices((current) => [notice, ...current].slice(0, 5));
  }
  const [targetId, setTargetId] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState(null);
  const [stockChartView, setStockChartView] = useState(null);
  const searchQuery = "";
  useEffect(() => {
    if (!user) setStockChartView(null);
  }, [user]);
  const [isDark, setIsDark] = useState(
    localStorage.getItem("ashcol_theme") === "dark",
  );
  const canManage = user && user.role !== "EMPLOYEE";
  const refreshData = useCallback(() => setRefresh((value) => value + 1), []);
  const endSession = useCallback(() => {
    sessionStorage.removeItem("ashcol_inventory_token");
    sessionStorage.removeItem(PAGE_STORAGE_KEY);
    hasLoadedData.current = false;
    setUser(null);
    setDataReady(false);
    setServiceVans([]);
    setItems([]);
    setBrands([]);
    setRequests([]);
    setPage("dashboard");
  }, []);
  useLiveUpdates(user?.id, refreshData, endSession);

  useEffect(() => {
    if (checking) return;
    if (!user) {
      window.history.replaceState(null, "", "/Login");
      return;
    }
    const nextPage = allowedPage(page, user.role);
    if (nextPage !== page) setPage(nextPage);
    sessionStorage.setItem(PAGE_STORAGE_KEY, nextPage);
    if (window.location.pathname !== PAGE_PATHS[nextPage]) {
      window.history.replaceState(null, "", PAGE_PATHS[nextPage]);
    }
  }, [page, user, checking]);

  useEffect(() => {
    const onPopState = () => {
      const destination = allowedPage(pageFromPath(window.location.pathname) || "dashboard", user?.role);
      setPage(destination);
      if (!checking) {
        const path = user ? PAGE_PATHS[destination] : "/Login";
        if (window.location.pathname !== path) window.history.replaceState(null, "", path);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [user, checking]);


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
          setServiceVans((current) => JSON.stringify(current) === JSON.stringify(data) ? current : data);
        }
      })
      .catch((err) => {
        if (active) {
          if (err.response?.status === 401) endSession();
          else setError(errorMessage(err));
        }
      });
    return () => {
      active = false;
    };
  }, [user, refresh, endSession]);

  useEffect(() => {
    if (!user || !branchId) return;
    let active = true;
    setLoading(!hasLoadedData.current);
    setError("");
    Promise.all([
      api("get", "/products", null, { branchId }),
      api("get", "/brands"),
      api("get", "/requests", null, { branchId }),
      api("get", "/auth/me"),
    ])
      .then(([stock, brandList, requestList, account]) => {
        if (active) {
          setItems((current) => JSON.stringify(current) === JSON.stringify(stock.data) ? current : stock.data);
          setBrands((current) => JSON.stringify(current) === JSON.stringify(brandList.data) ? current : brandList.data);
          setRequests((current) => JSON.stringify(current) === JSON.stringify(requestList.data) ? current : requestList.data);
          setUser((current) => JSON.stringify(current) === JSON.stringify(account.data) ? current : account.data);
          hasLoadedData.current = true;
          setDataReady(true);
        }
      })
      .catch((err) => {
        if (active) {
          if (!hasLoadedData.current) {
            setItems([]);
            setRequests([]);
            setDataReady(false);
          }
          setError(errorMessage(err));
          if (err.response && err.response.status === 401) {
            endSession();
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, branchId, refresh, endSession]);

  function save(method, path, data, success, params, options = {}) {
    return api(method, path, data, params)
      .then((response) => {
        if (options.refresh !== false) setRefresh((value) => value + 1);
        if (success) notify("success", success);
        return response.data;
      })
      .catch((err) => {
        notify("error", errorMessage(err));
        if (err.response && err.response.status === 401) {
          endSession();
        }
        throw err;
      });
  }
  function logout() {
    api("post", "/auth/logout")
      .then(() => {
        endSession();
        setError("");
        setNotices([]);
        setPage("dashboard");
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          endSession();
        } else notify("error", errorMessage(err));
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
        <NotificationStack notices={notices} onDismiss={dismissNotice} />

        {checking ? (
          <div className="login-wrap">
            <Spin description="Checking session">
              <div style={{ padding: 40 }} />
            </Spin>
          </div>


        ) : !user ? (
          <LoginPage
            initialError={error}
            onLogin={(account) => {
              setError("");
              setUser(account);
              setPage(allowedPage(page, account.role));
            }}
          />


        ) : (
          <>
            <Sidebar
              page={page}
              setPage={navigatePage}
              user={user}
              canManage={canManage}
            />

            <main className="app-main">
              <Header
                page={page}
                user={user}
                isDark={isDark}
                setIsDark={setIsDark}
                logout={logout}
                save={save}
                onProfileUpdate={(updated) => accountUpdated(updated, user)}
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
                <Spin spinning={loading}>
                  <Suspense fallback={<InventoryLoadingState />}>
                  {(!error || dataReady) && branchId && (
                    loading && !dataReady ? (
                      <InventoryLoadingState />
                    ) : (
                      <>
                        {canManage && <div hidden={page !== "dashboard"} aria-hidden={page !== "dashboard"}>
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
                              navigatePage("post_movement");
                            }}
                            onNavigateToInventoryWithFilter={(filter) => {
                              setInventoryFilter(filter);
                              navigatePage("inventory");
                            }}
                          />
                        </div>}
                        {page !== "dashboard" && <div className="page-transition" key={`${page}-${branchId}`}>
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
                            isDark={isDark}
                            serviceVans={serviceVans}
                            user={user}
                            branchId={branchId}
                            save={save}
                            refresh={refresh}
                            preselectedFilter={inventoryFilter}
                            onNavigateToPostMovement={() => {
                              setTargetId("");
                              navigatePage("post_movement");
                            }}
                          />
                        )}
                        {(page === "service_vehicles" || page === "service_vans") && (
                          <ServiceVansPage
                            serviceVans={serviceVans}
                            branchId={branchId}
                            user={user}
                            save={save}
                            refresh={refresh}
                          />
                        )}
                        {page === "compatibility" && (
                          <CompatibilityLookupPage
                            items={items}
                            onNavigateToItem={() => navigatePage("inventory")}
                            isDark={isDark}
                          />
                        )}
                        {page === "suppliers" && canManage && (
                          <SuppliersPage
                            user={user}
                            brands={brands}
                            save={save}
                            onBrandsChange={setBrands}
                            refresh={refresh}
                            items={items}
                            isDark={isDark}
                          />
                        )}
                        {page === "requests" && (
                          <RequestsPage
                            isDark={isDark}
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
                            brands={brands}
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
                            isDark={isDark}
                          />
                        )}
                        </div>}
                      </>
                    )
                  )}
                  </Suspense>
                </Spin>
              </div>
            </main>
          </>
        )}
      </div>
    </ConfigProvider>
  );
}
