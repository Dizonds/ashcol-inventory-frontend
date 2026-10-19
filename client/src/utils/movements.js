const types = {
  OPENING: ["Opening Balance", "stock-in"],
  STOCK_IN: ["Stock In", "stock-in"],
  STOCK_OUT: ["Stock Out", "stock-out"],
  TRANSFER_IN: ["Transfer In", "transfer-in"],
  TRANSFER_OUT: ["Transfer Out", "transfer-out"],
  REQUEST_ISSUE: ["Material Request Issue", "stock-out"],
  JOB_CONSUMPTION: ["Material Used", "stock-out"],
  ARCHIVE: ["Archived", "default"],
  RESTORE: ["Restored", "stock-in"],
  DETAILS: ["Details Update", "default"],
};

export function movementPresentation(entry) {
  const type = String(entry.movementType || "").toUpperCase().replace(/ /g, "_");
  const transfer = type === "TRANSFER_IN" || type === "TRANSFER_OUT";
  const returned = transfer && (entry.isVehicleReturn ?? /^(Emergency:\s*)?Van Return to Warehouse(?:\s|$)/i.test(entry.reason || ""));
  const [label, tone] = returned ? ["Returned", "transfer-out"] : types[type] || [type.replace(/_/g, " ") || "Movement", "default"];
  return { label, tone, isVehicle: Boolean(transfer && entry.branchId && entry.branchId !== "LOCAL-WAREHOUSE") };
}
