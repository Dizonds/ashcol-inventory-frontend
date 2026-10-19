import axios from "axios";

// Relative /api uses the development proxy, or a same-origin deployment proxy.
export const API_BASE = process.env.REACT_APP_API_URL || "/api";
export function api(method, path, data, params) {
  const token = sessionStorage.getItem("ashcol_inventory_token");
  return axios({
    method,
    url: API_BASE + path,
    data,
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
export function errorMessage(error) {
  if (error.response && error.response.data && error.response.data.error)
    return error.response.data.error;
  return "Cannot reach the inventory server. Check the connection and try again.";
}
