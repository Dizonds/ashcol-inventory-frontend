import { render, waitFor } from "@testing-library/react";
import { StyleProvider } from "@ant-design/cssinjs";
import DashboardPage from "./DashboardPage";
import { api } from "../api";

jest.mock("../api", () => ({ api: jest.fn() }));

test("warehouse chart does not count the vehicle's matching transfer receipts as new stock", async () => {
  const branchId = "LOCAL-WAREHOUSE";
  const createdAt = new Date().toISOString();
  const movements = [
    { id: "vehicle-request", branchId: "VAN-1", movementType: "TRANSFER_IN", quantityDelta: 2, createdAt },
    { id: "warehouse-request", branchId, movementType: "REQUEST_ISSUE", quantityDelta: -2, createdAt },
    { id: "vehicle-loadout", branchId: "VAN-1", movementType: "TRANSFER_IN", quantityDelta: 1, createdAt },
    { id: "warehouse-loadout", branchId, movementType: "TRANSFER_OUT", quantityDelta: -1, createdAt },
    { id: "opening", branchId, movementType: "OPENING", quantityDelta: 3, createdAt },
  ];
  api.mockImplementation((method, path, body, params) => Promise.resolve({ data: path === "/analytics"
    ? { fastMoving: [], slowMoving: [] }
    : { items: movements.slice((params.page - 1) * 2, params.page * 2), total: 5, pageSize: 2 } }));
  const { container } = render(<StyleProvider mock="server"><DashboardPage branchId={branchId} items={[]} requests={[]} /></StyleProvider>);
  await waitFor(() => expect(container.querySelector(".chip-stock-in .metric-chip-val")).toHaveTextContent("+3"));
  expect(container.querySelector(".chip-stock-out .metric-chip-val")).toHaveTextContent("-3");
  expect(container.querySelector(".chip-net .metric-chip-val")).toHaveTextContent("+0");
  expect(container.querySelector(".chip-activity")).toHaveTextContent("3 ledger records");
  const calls = api.mock.calls.filter(([, path]) => path === "/movements");
  expect(calls).toHaveLength(3);
  for (const [, , , params] of calls) expect(params).toEqual(expect.objectContaining({ branchId, scope: "branch" }));
});
