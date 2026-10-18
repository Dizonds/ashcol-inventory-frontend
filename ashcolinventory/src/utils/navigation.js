export const PAGE_STORAGE_KEY = "ashcol_inventory_page";
export const PAGE_PATHS = {
  dashboard: "/DashBoard",
  inventory: "/Inventory",
  requests: "/Requests",
  movements: "/Movements",
  service_vehicles: "/ServiceVehicles",
  job_orders: "/JobOrders",
  compatibility: "/ModelMatching",
  suppliers: "/Suppliers",
  post_movement: "/PostMovement",
  user_management: "/UserManagement",
};

export function pageFromPath(pathname) {
  const normalized = pathname.replace(/\/+$/, "").toLowerCase();
  return Object.keys(PAGE_PATHS).find(page => PAGE_PATHS[page].toLowerCase() === normalized);
}

export function initialPage() {
  if (window.location.pathname === "/") {
    return sessionStorage.getItem(PAGE_STORAGE_KEY) || "dashboard";
  }
  return pageFromPath(window.location.pathname) || "dashboard";
}
const pages = new Set([
  "dashboard", "inventory", "requests", "movements", "service_vehicles",
  "job_orders", "compatibility", "suppliers", "post_movement", "user_management",
]);

export function allowedPage(page, role) {
  const homePage = role === "EMPLOYEE" ? "inventory" : "dashboard";
  if (page === "service_vans") return "service_vehicles";
  if (!pages.has(page)) return homePage;
  if (page === "dashboard" && role === "EMPLOYEE") return homePage;
  if (page === "suppliers" && role === "EMPLOYEE") return homePage;
  if (page === "user_management" && role !== "ADMIN") return homePage;
  if (page === "post_movement" && !["ADMIN", "MANAGER"].includes(role)) return homePage;
  return page;
}
