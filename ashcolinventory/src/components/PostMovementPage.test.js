import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StyleProvider } from "@ant-design/cssinjs";
import PostMovementPage from "./PostMovementPage";
import { api } from "../api";

jest.mock("../api", () => ({ api: jest.fn(), errorMessage: (error) => error.message }));
const testingRender = render;
function renderPage(ui) {
  return testingRender(<StyleProvider mock="server">{ui}</StyleProvider>);
}

test("movement filters retain supported types and saved brands with empty inventory", async () => {
  api.mockResolvedValue({ data: { referenceId: "STI0001" } });
  const save = jest.fn();
  renderPage(<PostMovementPage items={[]} brands={[{ name: "Carrier" }, { name: "Kembla" }]} branchId="LOCAL-WAREHOUSE" save={save} />);
  const type = screen.getByLabelText("Select an Item Type");
  const brand = screen.getByLabelText("Select a Brand");
  expect(Array.from(type.options, (option) => option.value)).toEqual(expect.arrayContaining([
    "AC Unit", "Material / Part", "Spare Part", "Consumable", "Tool / Equipment",
  ]));
  fireEvent.change(type, { target: { value: "Consumable" } });
  expect(Array.from(brand.options, (option) => option.value)).toEqual(["", "Carrier", "Kembla"]);
  fireEvent.change(brand, { target: { value: "Kembla" } });
  await waitFor(() => expect(screen.getByLabelText("Transaction ID")).toHaveValue("STI - 0001"));
  expect(screen.getByRole("button", { name: "Confirm & Post" })).toBeDisabled();
  expect(save).not.toHaveBeenCalled();
});

test("live inventory changes preserve the movement draft after a preselected restock", async () => {
  api.mockResolvedValue({ data: { referenceId: "STI0001" } });
  const item = { id: "unit-1", name: "Carrier AC", itemType: "AC Unit", brand: "Carrier", quantity: 1, reorderLevel: 2, unitOfMeasure: "UNIT" };
  const props = { items: [item], branchId: "LOCAL-WAREHOUSE", save: jest.fn(), preselectedItemId: item.id };
  const { rerender } = renderPage(<PostMovementPage {...props} />);
  fireEvent.click(screen.getByText("Stock Out", { exact: true }));
  fireEvent.change(screen.getByLabelText("Select an Item"), { target: { value: item.id } });
  fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Receipt, transfer reference, or explanation"), { target: { value: "Keep this draft" } });
  rerender(<StyleProvider mock="server"><PostMovementPage {...props} items={[{ ...item, quantity: 5 }]} /></StyleProvider>);
  expect(screen.getByLabelText("Select an Item")).toHaveValue(item.id);
  expect(screen.getByLabelText("Quantity")).toHaveValue("2");
  expect(screen.getByLabelText("Receipt, transfer reference, or explanation")).toHaveValue("Keep this draft");
  expect(screen.getByText("Stock Out", { exact: true }).closest("label")).toHaveAttribute("aria-checked", "true");
  await waitFor(() => expect(screen.getByLabelText("Transaction ID")).toHaveValue("STI - 0001"));
});

test("switching operations clears stale filters so stock-in items remain selectable", async () => {
  api.mockImplementation((method, path, data) => Promise.resolve({ data: { referenceId: data.movementType === "STOCK_OUT" ? "STO0002" : "STI0001" } }));
  const items = [
    { id: "unit-1", name: "Carrier AC", itemType: "AC Unit", brand: "Carrier", quantity: 0, reorderLevel: 2, unitOfMeasure: "UNIT" },
    { id: "part-1", name: "Daikin Compressor", itemType: "Spare Part", brand: "Daikin", quantity: 3, reorderLevel: 1, unitOfMeasure: "PCS" },
    { id: "archived-1", name: "Archived item", itemType: "AC Unit", brand: "Carrier", archived: true, quantity: 0, reorderLevel: 0 },
  ];
  const save = jest.fn();
  renderPage(<PostMovementPage items={items} brands={[{ name: "Carrier" }, { name: "Daikin" }, { name: "Apple" }]} branchId="LOCAL-WAREHOUSE" save={save} preselectedItemId="unit-1" />);
  const type = screen.getByLabelText("Select an Item Type");
  const brand = screen.getByLabelText("Select a Brand");
  const item = screen.getByLabelText("Select an Item");
  expect(item).toHaveValue("unit-1");
  fireEvent.click(screen.getByText("Stock Out", { exact: true }));
  expect(type).toHaveValue("");
  expect(brand).toHaveValue("");
  expect(item).toHaveValue("");
  fireEvent.change(type, { target: { value: "Spare Part" } });
  fireEvent.change(brand, { target: { value: "Apple" } });
  expect(Array.from(item.options, (option) => option.value)).toEqual([""]);
  fireEvent.click(screen.getByText("Stock In", { exact: true }));
  expect(type).toHaveValue("");
  expect(brand).toHaveValue("");
  expect(Array.from(item.options, (option) => option.value)).toEqual(["", "unit-1", "part-1"]);
  fireEvent.change(item, { target: { value: "unit-1" } });
  expect(item).toHaveValue("unit-1");
  const stockOut = screen.getByText("Stock Out", { exact: true }).closest("label");
  fireEvent.keyDown(stockOut, { key: "Enter" });
  expect(item).toHaveValue("");
  expect(Array.from(item.options, (option) => option.value)).toEqual(["", "unit-1", "part-1"]);
  await waitFor(() => expect(screen.getByLabelText("Transaction ID")).toHaveValue("STO - 0002"));
  expect(save).not.toHaveBeenCalled();
});

