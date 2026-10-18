import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { StyleProvider } from "@ant-design/cssinjs";
import App from "./App";
import { api } from "./api";
import { subscribeToUpdates } from "./liveUpdates";
import { PAGE_STORAGE_KEY } from "./utils/navigation";

jest.mock("./api", () => ({ api: jest.fn(), errorMessage: (err) => err.message }));
jest.mock("./liveUpdates", () => ({ subscribeToUpdates: jest.fn() }));
jest.mock("@solar-icons/react", () => ({ BusBoldDuotoneIcon: () => null }));
jest.mock("@ant-design/icons", () => ({ EyeOutlined: () => null }));

const user = { id: "admin-1", fullName: "Live Admin", role: "ADMIN", branchId: "LOCAL-WAREHOUSE" };
beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem("ashcol_inventory_token", "login-token");
  subscribeToUpdates.mockImplementation(() => () => {});
});
afterEach(() => sessionStorage.clear());

test("restores the current page and keeps the open brand panel and draft during live updates", async () => {
  sessionStorage.setItem(PAGE_STORAGE_KEY, "suppliers");
  let brands = [{ id: "brand-1", name: "Carrier" }];
  api.mockImplementation((method, path) => Promise.resolve({ data: path === "/auth/me" ? user : path === "/brands" ? brands : [] }));
  const { unmount } = render(<StyleProvider mock="server"><App /></StyleProvider>);
  expect(await screen.findByRole("heading", { name: "Suppliers List" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show Brands" }));
  fireEvent.change(screen.getByLabelText("New brand name"), { target: { value: "Unsaved draft" } });
  brands = [...brands, { id: "brand-2", name: "Apple", createdAt: "2026-10-16T00:00:00Z" }];
  act(() => subscribeToUpdates.mock.calls[0][0].onChange());
  expect(await screen.findByText("Apple")).toBeVisible();
  expect(screen.getByRole("button", { name: "Hide Brands" })).toBeInTheDocument();
  expect(screen.getByLabelText("New brand name")).toHaveValue("Unsaved draft");
  fireEvent.click(screen.getByRole("button", { name: "Service Vehicles", exact: true }));
  await waitFor(() => expect(sessionStorage.getItem(PAGE_STORAGE_KEY)).toBe("service_vehicles"));
  unmount();
  render(<StyleProvider mock="server"><App /></StyleProvider>);
  expect(await screen.findByRole("heading", { name: "Service Vehicles Overview" })).toBeInTheDocument();
});

test("expired live sessions clear the remembered page and show login", async () => {
  sessionStorage.setItem(PAGE_STORAGE_KEY, "suppliers");
  api.mockImplementation((method, path) => Promise.resolve({ data: path === "/auth/me" ? user : [] }));
  render(<StyleProvider mock="server"><App /></StyleProvider>);
  await screen.findByRole("heading", { name: "Suppliers List" });
  act(() => subscribeToUpdates.mock.calls[0][0].onUnauthorized());
  expect(await screen.findByRole("button", { name: /sign in/i })).toBeInTheDocument();
  expect(sessionStorage.getItem(PAGE_STORAGE_KEY)).toBeNull();
  expect(sessionStorage.getItem("ashcol_inventory_token")).toBeNull();
});
