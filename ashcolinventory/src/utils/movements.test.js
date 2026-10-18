import { movementPresentation } from "./movements";

test.each([
  ["OPENING", "Opening Balance"], ["STOCK_IN", "Stock In"], ["STOCK_OUT", "Stock Out"],
  ["REQUEST_ISSUE", "Material Request Issue"], ["JOB_CONSUMPTION", "Material Used"],
  ["ARCHIVE", "Archived"], ["RESTORE", "Restored"], ["DETAILS", "Details Update"],
  ["TRANSFER_IN", "Transfer In"], ["TRANSFER_OUT", "Transfer Out"],
])("%s has the same readable label throughout the app", (movementType, label) => {
  expect(movementPresentation({ movementType }).label).toBe(label);
});

test("returns preserve direction internally and vehicle context is separate", () => {
  expect(movementPresentation({ movementType: "TRANSFER_OUT", isVehicleReturn: true, branchId: "VAN-01" })).toEqual({ label: "Returned", tone: "transfer-out", isVehicle: true });
  expect(movementPresentation({ movementType: "TRANSFER_IN", reason: "Emergency: Van Return to Warehouse LOCAL-WAREHOUSE", branchId: "LOCAL-WAREHOUSE" })).toEqual({ label: "Returned", tone: "transfer-out", isVehicle: false });
});
