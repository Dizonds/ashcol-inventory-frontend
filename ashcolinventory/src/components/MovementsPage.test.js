import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { StyleProvider } from "@ant-design/cssinjs";
import MovementsPage from "./MovementsPage";
import { api } from "../api";

jest.mock("../api", () => ({ api: jest.fn(), errorMessage: (error) => error.message }));

test("ledger shows a single VAN receipt for request deliveries and searches it", async () => {
  const common = { createdAt: new Date().toISOString(), sku: "PIPE", itemName: "Copper pipe", unitOfMeasure: "PCS", beforeQuantity: 0, afterQuantity: 1 };
  api.mockResolvedValue({ data: { items: [
    { ...common, id: "out", movementType: "TRANSFER_OUT", quantityDelta: -1, transferNumber: "TRO0001", referenceId: "TRA-LEGACY" },
    { ...common, id: "in", movementType: "TRANSFER_IN", quantityDelta: 1, transferNumber: "TRI0001", referenceId: "TRA-LEGACY" },
    { ...common, id: "receipt", branchId: "VAN-01", movementType: "TRANSFER_IN", quantityDelta: 2, transferNumber: "TRI0002", vehicleReceiptNumber: "VAN0001", referenceId: "request-id", requestNumber: "REQ0002" },
    { ...common, id: "archived", movementType: "ARCHIVE", quantityDelta: 0, beforeQuantity: 0, afterQuantity: 0 },
    { ...common, id: "restored", movementType: "RESTORE", quantityDelta: 0, beforeQuantity: 0, afterQuantity: 0 },
  ], total: 5 } });
  render(<StyleProvider mock="server"><MovementsPage branchId="LOCAL-WAREHOUSE" /></StyleProvider>);
  expect(await screen.findByText("TRO - 0001")).toBeInTheDocument();
  expect(screen.getByText("TRI - 0001")).toBeInTheDocument();
  expect(screen.getByText("VAN - 0001")).toBeInTheDocument();
  const receiptRow = within(screen.getByText("VAN - 0001").closest("tr"));
  expect(receiptRow.getByText("Transfer In")).toBeInTheDocument();
  expect(receiptRow.getByText("Vehicle")).toBeInTheDocument();
  expect(within(screen.getByText("TRO - 0001").closest("tr")).queryByText("Vehicle")).not.toBeInTheDocument();
  expect(screen.getByText("Archived", { selector: ".movement-badge" })).toBeInTheDocument();
  expect(screen.getByText("Restored", { selector: ".movement-badge" })).toBeInTheDocument();
  expect(screen.queryByText("Stock In", { selector: ".movement-badge" })).not.toBeInTheDocument();
  expect(screen.queryByText("Stock Out", { selector: ".movement-badge" })).not.toBeInTheDocument();
  expect(screen.queryByText("REQ - 0002")).not.toBeInTheDocument();
  expect(screen.queryByText("TRI - 0002")).not.toBeInTheDocument();
  expect(screen.queryByText("TRA-LEGACY")).not.toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("Search SKU, item, or reference"), { target: { value: "VAN - 0001" } });
  await waitFor(() => expect(api).toHaveBeenLastCalledWith("get", "/movements", null, expect.objectContaining({ search: "VAN0001" })));
});

test("technician usage displays Material Used and a formatted searchable USE reference", async () => {
  api.mockResolvedValue({ data: { items: [
    { id: "usage", createdAt: new Date().toISOString(), branchId: "VAN-01", sku: "PIPE", itemName: "Copper pipe", unitOfMeasure: "PCS", movementType: "JOB_CONSUMPTION", quantityDelta: -2, beforeQuantity: 3, afterQuantity: 1, referenceId: "USE0003", jobOrderId: "job-id", workOrderId: "JOB0001" },
  ], total: 1 } });
  render(<StyleProvider mock="server"><MovementsPage branchId="VAN-01" /></StyleProvider>);
  expect(await screen.findByText("USE - 0003")).toBeInTheDocument();
  expect(screen.getByText("Material Used", { selector: ".movement-badge" })).toBeInTheDocument();
  expect(screen.queryByText("Stock Out", { selector: ".movement-badge" })).not.toBeInTheDocument();
  expect(screen.getByText("-2 PCS")).toBeInTheDocument();
  expect(screen.getByText("JOB - 0001")).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("Search SKU, item, or reference"), { target: { value: "USE - 0003" } });
  await waitFor(() => expect(api).toHaveBeenLastCalledWith("get", "/movements", null, expect.objectContaining({ search: "USE0003" })));
});

test("returns show Returned on both sides and keep the vehicle badge on the vehicle row", async () => {
  const common = { createdAt: new Date().toISOString(), sku: "PIPE", itemName: "Copper pipe", unitOfMeasure: "PCS" };
  api.mockResolvedValue({ data: { items: [
    { ...common, id: "warehouse", branchId: "LOCAL-WAREHOUSE", movementType: "TRANSFER_IN", quantityDelta: 1, beforeQuantity: 11, afterQuantity: 12, transferNumber: "TRI0003", reason: "Van Return to Warehouse LOCAL-WAREHOUSE" },
    { ...common, id: "van", branchId: "VAN-01", movementType: "TRANSFER_OUT", quantityDelta: -1, beforeQuantity: 1, afterQuantity: 0, transferNumber: "TRO0002", isVehicleReturn: true, reason: "Unused materials" },
  ], total: 2 } });
  render(<StyleProvider mock="server"><MovementsPage branchId="LOCAL-WAREHOUSE" /></StyleProvider>);
  const warehouse = within((await screen.findByText("TRI - 0003")).closest("tr"));
  const vehicle = within(screen.getByText("TRO - 0002").closest("tr"));
  expect(warehouse.getByText("Returned")).toBeInTheDocument();
  expect(warehouse.queryByText("Vehicle")).not.toBeInTheDocument();
  expect(vehicle.getByText("Returned")).toBeInTheDocument();
  expect(vehicle.getByText("Vehicle")).toBeInTheDocument();
  expect(screen.queryByText("Transfer In", { selector: ".movement-badge" })).not.toBeInTheDocument();
  expect(screen.queryByText("Transfer Out", { selector: ".movement-badge" })).not.toBeInTheDocument();
  expect(warehouse.getByText("11 → 12")).toBeInTheDocument();
  expect(vehicle.getByText("1 → 0")).toBeInTheDocument();
});
