import React, { useState } from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { StyleProvider } from "@ant-design/cssinjs";
import SuppliersPage from "./SuppliersPage";
import { api } from "../../api";

jest.mock("../../api", () => ({ api: jest.fn(), errorMessage: (error) => error.message }));

test("suppliers can be archived, viewed in archives and restored without deleting their records", async () => {
  const supplier = { id: "supplier-1", name: "Carrier Supply", phone: "09171234567", archived: false };
  let archived = false;
  api.mockImplementation((method, path, data, params) => Promise.resolve({ data: Boolean(params?.archived) === archived ? [{ ...supplier, archived }] : [] }));
  const save = jest.fn().mockImplementation(async (method, path) => {
    archived = method === "delete";
    return { ...supplier, archived };
  });
  render(<StyleProvider mock="server"><SuppliersPage user={{ role: "MANAGER" }} save={save} /></StyleProvider>);
  expect(await screen.findByText("Carrier Supply")).toBeInTheDocument();
  expect(screen.queryByTitle("Delete Supplier")).not.toBeInTheDocument();
  fireEvent.click(screen.getByTitle("Archive Supplier"));
  const confirmation = await screen.findByRole("dialog");
  fireEvent.click(within(confirmation).getByRole("button", { name: "Archive Supplier" }));
  await waitFor(() => expect(screen.queryByText("Carrier Supply")).not.toBeInTheDocument());
  expect(save).toHaveBeenCalledWith("delete", "/suppliers/supplier-1", null, "Supplier archived.");
  fireEvent.click(screen.getByRole("button", { name: "View Archives" }));
  expect(await screen.findByText("Carrier Supply")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Archived Suppliers" })).toBeInTheDocument();
  expect(screen.queryByTitle("Edit Supplier")).not.toBeInTheDocument();
  fireEvent.click(screen.getByTitle("Restore Supplier"));
  await waitFor(() => expect(screen.queryByText("Carrier Supply")).not.toBeInTheDocument());
  expect(save).toHaveBeenCalledWith("post", "/suppliers/supplier-1/restore", null, "Supplier restored.");
  fireEvent.click(screen.getByRole("button", { name: "View Active Suppliers" }));
  expect(await screen.findByText("Carrier Supply")).toBeInTheDocument();
  expect(screen.getByText("09171234567")).toBeInTheDocument();
});

test("technicians can view archives but cannot archive or restore suppliers", async () => {
  api.mockResolvedValue({ data: [{ id: "supplier-1", name: "Carrier Supply" }] });
  render(<StyleProvider mock="server"><SuppliersPage user={{ role: "EMPLOYEE" }} save={jest.fn()} /></StyleProvider>);
  await screen.findByText("Carrier Supply");
  expect(screen.queryByTitle("Archive Supplier")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "View Archives" }));
  await screen.findByText("Carrier Supply");
  expect(screen.queryByTitle("Restore Supplier")).not.toBeInTheDocument();
});

test("brands expand below suppliers and new brands use the shared save flow", async () => {
  api.mockResolvedValue({ data: [] });
  const save = jest.fn().mockRejectedValueOnce(new Error("Unable to save brand.")).mockResolvedValueOnce({ name: "Daikin" });
  const props = { user: { role: "ADMIN" }, save, brands: [{ name: "Carrier" }] };
  const { rerender } = render(<StyleProvider mock="server"><SuppliersPage {...props} /></StyleProvider>);
  expect(screen.getByText("Carrier")).not.toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Show Brands" }));
  expect(screen.getByText("Carrier")).toBeInTheDocument();
  const input = screen.getByLabelText("New brand name");
  fireEvent.change(input, { target: { value: " carrier " } });
  fireEvent.submit(screen.getByRole("form", { name: "Add brand" }));
  expect(screen.getByText("This brand already exists.")).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: " Daikin " } });
  fireEvent.submit(screen.getByRole("form", { name: "Add brand" }));
  expect(await screen.findByText("Unable to save brand.")).toBeInTheDocument();
  expect(input).toHaveValue(" Daikin ");
  fireEvent.submit(screen.getByRole("form", { name: "Add brand" }));
  await waitFor(() => expect(input).toHaveValue(""));
  expect(save).toHaveBeenLastCalledWith("post", "/brands", { name: "Daikin" }, "Brand added.", undefined, { refresh: false });
  rerender(<StyleProvider mock="server"><SuppliersPage {...props} brands={[...props.brands, { name: "Daikin" }]} /></StyleProvider>);
  expect(screen.getByText("Daikin")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Hide Brands" }));
  expect(screen.getByText("Daikin")).not.toBeVisible();
});

test("logos preload on entering Suppliers and stay mounted when Brands is toggled", async () => {
  api.mockImplementation((method, path) => Promise.resolve({ data: path.endsWith("/logo")
    ? { logoUrl: "https://upload.wikimedia.org/logo.svg", sourceUrl: "https://commons.wikimedia.org/" }
    : [] }));
  render(<StyleProvider mock="server"><SuppliersPage user={{ role: "ADMIN" }} brands={[{ id: "brand-preload", name: "Daikin" }]} /></StyleProvider>);
  const image = await screen.findByAltText("Daikin");
  expect(api).toHaveBeenCalledWith("get", "/brands/brand-preload/logo");
  expect(image).toHaveAttribute("loading", "eager");
  expect(image).not.toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Show Brands" }));
  expect(image).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Hide Brands" }));
  expect(image).not.toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Show Brands" }));
  expect(screen.getByAltText("Daikin")).toBe(image);
  expect(api.mock.calls.filter(([, path]) => path === "/brands/brand-preload/logo")).toHaveLength(1);
});

test("employees can view brands without adding them", async () => {
  api.mockResolvedValue({ data: [] });
  render(<StyleProvider mock="server"><SuppliersPage user={{ role: "EMPLOYEE" }} brands={[{ name: "Carrier" }]} /></StyleProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Show Brands" }));
  expect(screen.getByText("Carrier")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add Brand" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove Carrier" })).not.toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText("Loading suppliers...")).not.toBeInTheDocument());
});

test("brand remove button saves deletion and shows failures", async () => {
  api.mockResolvedValue({ data: [] });
  const save = jest.fn().mockRejectedValueOnce(new Error("Could not remove brand.")).mockResolvedValueOnce({ success: true });
  const props = { user: { role: "ADMIN" }, save, brands: [{ id: "brand-1", name: "Carrier" }] };
  const { rerender } = render(<StyleProvider mock="server"><SuppliersPage {...props} /></StyleProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Show Brands" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove Carrier" }));
  expect(await screen.findByText("Could not remove brand.")).toBeInTheDocument();
  expect(screen.getByText("Carrier")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Remove Carrier" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Remove Carrier" })).toBeEnabled());
  expect(save).toHaveBeenLastCalledWith("delete", "/brands/brand-1", null, "Brand removed.", undefined, { refresh: false });
  rerender(<StyleProvider mock="server"><SuppliersPage {...props} brands={[]} /></StyleProvider>);
  expect(screen.queryByText("Carrier")).not.toBeInTheDocument();
  expect(screen.getByText("No brands registered yet.")).toBeInTheDocument();
});

test("adding and removing brands updates the open cards without reloading page data", async () => {
  api.mockResolvedValue({ data: [] });
  const save = jest.fn()
    .mockResolvedValueOnce({ id: "brand-2", name: "Apple", createdAt: "2026-10-16T10:00:00Z" })
    .mockResolvedValueOnce({ success: true });
  function Page() {
    const [brands, setBrands] = useState([{ id: "brand-1", name: "Carrier", createdAt: "2026-10-15T10:00:00Z" }]);
    return <StyleProvider mock="server"><SuppliersPage user={{ role: "ADMIN" }} brands={brands} onBrandsChange={setBrands} save={save} /></StyleProvider>;
  }
  render(<Page />);
  fireEvent.click(screen.getByRole("button", { name: "Show Brands" }));
  const input = screen.getByLabelText("New brand name");
  fireEvent.change(input, { target: { value: "Apple" } });
  fireEvent.submit(screen.getByRole("form", { name: "Add brand" }));
  expect(await screen.findByText("Apple")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Hide Brands" })).toHaveAttribute("aria-expanded", "true");
  expect(input).toHaveValue("");
  expect(Array.from(screen.getAllByRole("listitem"), (card) => card.title)).toEqual(["Carrier", "Apple"]);
  fireEvent.click(screen.getByRole("button", { name: "Remove Apple" }));
  await waitFor(() => expect(screen.queryByText("Apple")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Hide Brands" })).toBeInTheDocument();
  expect(screen.getByText("Carrier")).toBeInTheDocument();
  expect(api.mock.calls.filter(([, path]) => path === "/suppliers")).toHaveLength(1);
});

test("supplier registration filters phone letters and validates before saving", async () => {
  api.mockResolvedValue({ data: [] });
  const save = jest.fn().mockResolvedValue({ id: "supplier-1", name: "Test Supplier" });
  render(<StyleProvider mock="server"><SuppliersPage user={{ role: "ADMIN" }} save={save} /></StyleProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Register Supplier" }));
  const name = screen.getByLabelText("Company / Supplier Name *");
  const phone = screen.getByLabelText("Phone Number");
  const email = screen.getByLabelText("Email Address");
  for (const [typed, completed] of [["hi@g", "hi@gmail.com"], ["hi@A", "hi@ashcol.com"], ["hi@example.com", "hi@example.com"], ["hi@gmail.co", "hi@gmail.co"]]) {
    fireEvent.change(email, { target: { value: typed } });
    fireEvent.blur(email);
    expect(email).toHaveValue(completed);
  }
  fireEvent.change(name, { target: { value: "   " } });
  fireEvent.submit(screen.getByRole("form", { name: "Register supplier" }));
  expect(await screen.findByText("Supplier name is required.")).toBeInTheDocument();
  fireEvent.change(name, { target: { value: " Test Supplier " } });
  fireEvent.change(phone, { target: { value: "abc0917xyz" } });
  expect(phone).toHaveValue("0917");
  fireEvent.submit(screen.getByRole("form", { name: "Register supplier" }));
  expect(await screen.findByText(/Phone number must contain/)).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(phone, { target: { value: "+63 917 845 2310" } });
  fireEvent.change(email, { target: { value: "invalid" } });
  fireEvent.submit(screen.getByRole("form", { name: "Register supplier" }));
  expect(await screen.findByText("Enter a valid supplier email address.")).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(email, { target: { value: "SUPPLIER@EXAMPLE.COM" } });
  fireEvent.submit(screen.getByRole("form", { name: "Register supplier" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith("post", "/suppliers", expect.objectContaining({ name: "Test Supplier", phone: "+63 917 845 2310", email: "supplier@example.com" }), "Supplier registered."));
});
