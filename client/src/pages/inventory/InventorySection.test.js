import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { StyleProvider } from "@ant-design/cssinjs";
import InventorySection from "./InventorySection";
import InventoryNumberInput from "../../components/common/InventoryNumberInput";
import { api } from "../../api";

jest.mock("../../api", () => ({ api: jest.fn(), errorMessage: (error) => error.message }));
jest.mock("@solar-icons/react/bold-duotone/bus", () => ({ BusIcon: () => null }));

test("register item groups fields and saves numeric amounts with zero reorder level", async () => {
  api.mockResolvedValue({ data: [] });
  const save = jest.fn().mockResolvedValue({});
  render(<StyleProvider mock="server"><InventorySection items={[]} brands={[{ name: "Carrier" }]} user={{ role: "ADMIN" }} branchId="LOCAL-WAREHOUSE" save={save} /></StyleProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Register Item" }));
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByRole("heading", { name: "Item details" })).toBeInTheDocument();
  expect(dialog.getByRole("heading", { name: "Stock & pricing" })).toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText("SKU / model"), { target: { value: "AC-001" } });
  fireEvent.change(dialog.getByLabelText("Item name"), { target: { value: "Test air conditioner" } });
  for (const [label, value] of [["Opening quantity", "3"], ["Unit cost (PHP)", "1500.25"], ["Selling price (PHP)", "2000.50"], ["Reorder level", "0"]]) {
    const input = dialog.getByRole("spinbutton", { name: label });
    fireEvent.change(input, { target: { value } });
    expect(fireEvent.keyDown(input, { key: "a" })).toBe(false);
    expect(fireEvent.keyDown(input, { key: "e" })).toBe(false);
    expect(fireEvent.keyDown(input, { key: "-" })).toBe(false);
    expect(fireEvent.paste(input, { clipboardData: { getData: () => "invalid 12" } })).toBe(false);
  }
  fireEvent.click(dialog.getByRole("button", { name: "Save item" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith("post", "/products", expect.objectContaining({ sku: "AC-001", quantity: 3, unitCost: 1500.25, listPrice: 2000.5, reorderLevel: 0 }), "Inventory item saved."));
});

test("numeric inputs allow measured fractions but reject fractions for whole units", () => {
  render(<StyleProvider mock="server"><InventoryNumberInput aria-label="Measured quantity" precision={3} /><InventoryNumberInput aria-label="Whole quantity" precision={0} /></StyleProvider>);
  const measured = screen.getByRole("spinbutton", { name: "Measured quantity" });
  const whole = screen.getByRole("spinbutton", { name: "Whole quantity" });
  expect(fireEvent.paste(measured, { clipboardData: { getData: () => "1.125" } })).toBe(true);
  expect(fireEvent.paste(whole, { clipboardData: { getData: () => "1.125" } })).toBe(false);
  expect(fireEvent.paste(measured, { clipboardData: { getData: () => "1.1234" } })).toBe(false);
  fireEvent.change(measured, { target: { value: "abc" } });
  expect(measured).not.toHaveValue("abc");
});
