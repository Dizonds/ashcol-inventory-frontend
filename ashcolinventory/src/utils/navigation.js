export const PAGE_STORAGE_KEY = "ashcol_inventory_page";
const pages = new Set([
  "dashboard", "inventory", "requests", "movements", "service_vehicles",
  "job_orders", "compatibility", "suppliers", "post_movement", "user_management",
]);

export function allowedPage(page, role) {
  if (page === "service_vans") return "service_vehicles";
  if (!pages.has(page)) return "dashboard";
  if (page === "user_management" && role !== "ADMIN") return "dashboard";
  if (page === "post_movement" && !["ADMIN", "MANAGER"].includes(role)) return "dashboard";
  return page;
}
