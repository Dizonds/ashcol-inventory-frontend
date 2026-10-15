import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { StyleProvider } from "@ant-design/cssinjs";
import ServiceVansPage from "./ServiceVansPage";
import PostMovementPage from "./PostMovementPage";
import { api } from "../api";

jest.mock("../api", () => ({ api: jest.fn(), errorMessage: (error) => error.message }));

test("record usage automatically shows the manager-assigned job without a dropdown", async () => {
  const item = { id: "item-1", name: "Copper pipe", sku: "PIPE", quantity: 5, unitOfMeasure: "PCS" };
  const job = { id: "job-1", jobNumber: "JOB0001", title: "AC installation", customerName: "Test customer", location: "Taguig" };
  let finishTicket;
  const ticket = new Promise((resolve) => { finishTicket = resolve; });
  api.mockImplementation((method, path) => path.endsWith("/usage-ticket")
    ? ticket : Promise.resolve({ data: path === "/job-orders" ? [job] : [item] }));
  const save = jest.fn().mockResolvedValue({ ...item, quantity: 4 });
  render(<StyleProvider mock="server"><ServiceVansPage
    serviceVans={[{ id: "VAN-1", name: "Service Van", status: "AVAILABLE", driverName: "Technician" }]}
    user={{ id: "tech-1", role: "EMPLOYEE" }} save={save}
  /></StyleProvider>);
  fireEvent.click(screen.getByTitle("View vehicle details"));
  fireEvent.click(await screen.findByRole("button", { name: "Record Usage" }));
  const dialog = screen.getByRole("dialog");
  const idField = within(dialog).getByRole("textbox", { name: "Usage ID" });
  expect(idField).toHaveAttribute("readonly");
  expect(within(dialog).getByRole("button", { name: "Record Usage" })).toBeDisabled();
  finishTicket({ data: { usageId: "USE0001" } });
  await waitFor(() => expect(idField).toHaveValue("USE0001"));
  fireEvent.change(within(dialog).getByPlaceholderText("Describe where the material was installed/used"), {
    target: { value: "Office installation" },
  });
  const currentJob = within(dialog).getByRole("textbox", { name: "Current Job Order" });
  expect(currentJob).toHaveAttribute("readonly");
  expect(currentJob).toHaveValue("JOB - 0001 · AC installation");
  expect(within(dialog).queryByRole("combobox", { name: "Job Order" })).not.toBeInTheDocument();
  expect(within(dialog).getByText("Customer: Test customer · Service location: Taguig")).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Record Usage" })).toBeEnabled();
  fireEvent.click(within(dialog).getByRole("button", { name: "Record Usage" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(
    "post", "/service-vans/VAN-1/consume",
    { productId: "item-1", quantity: 1, usageId: "USE0001", jobOrderId: "job-1", notes: "Office installation" },
    "Material usage recorded successfully.", undefined, { refresh: false },
  ));
});

test("record usage can retry when an ID response is missing", async () => {
  const item = { id: "item-1", name: "Copper pipe", sku: "PIPE", quantity: 5, unitOfMeasure: "PCS" };
  let attempts = 0;
  api.mockImplementation((method, path) => {
    if (path.endsWith("/usage-ticket")) {
      attempts += 1;
      return Promise.resolve({ data: attempts === 1 ? { workOrderId: "JOB0001" } : { usageId: "USE0002" } });
    }
    return Promise.resolve({ data: path === "/job-orders" ? [] : [item] });
  });
  render(<StyleProvider mock="server"><ServiceVansPage
    serviceVans={[{ id: "VAN-1", name: "Service Van", status: "AVAILABLE", driverName: "Technician" }]}
    user={{ id: "tech-1", role: "EMPLOYEE" }} save={jest.fn()}
  /></StyleProvider>);
  fireEvent.click(screen.getByTitle("View vehicle details"));
  fireEvent.click(await screen.findByRole("button", { name: "Record Usage" }));
  fireEvent.click(await screen.findByRole("button", { name: "Retry Usage ID" }));
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Usage ID" })).toHaveValue("USE0002"));
  expect(attempts).toBe(2);
  expect(screen.getByText("No current job assigned. Ask your admin or manager to assign a job from Job Orders.")).toBeInTheDocument();
  expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Record Usage" })).toBeDisabled();
  expect(screen.queryByText("A usage ID could not be generated. Please try again.")).not.toBeInTheDocument();
});

test.each([
  ["Stock In", "STI0001", "STI - 0001", 1],
  ["Stock Out", "STO0001", "STO - 0001", -1],
])("post movement generates a %s transaction ID without a job field", async (operation, rawId, displayedId, delta) => {
  api.mockImplementation((method, path, data) => Promise.resolve({ data: {
    referenceId: data.movementType === "STOCK_OUT" ? "STO0001" : "STI0001",
  } }));
  const save = jest.fn().mockResolvedValue({});
  render(<StyleProvider mock="server"><PostMovementPage
    branchId="LOCAL-WAREHOUSE" preselectedItemId="item-1" save={save}
    items={[{ id: "item-1", name: "Copper pipe", sku: "PIPE", quantity: 5,
      itemType: "Material / Part", category: "Piping", brand: "Carrier", unitOfMeasure: "PCS", reorderLevel: 0 }]}
  /></StyleProvider>);
  if (operation === "Stock Out") fireEvent.click(screen.getByRole("radio", { name: operation }));
  const transactionField = screen.getByRole("textbox", { name: "Transaction ID" });
  expect(transactionField).toHaveAttribute("readonly");
  await waitFor(() => expect(transactionField).toHaveValue(displayedId));
  expect(screen.queryByRole("textbox", { name: /Job \/ Work Order/ })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox", { name: "Receipt, transfer reference, or explanation" }), {
    target: { value: "Materials for scheduled installation" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Confirm & Post", exact: true }));
  const review = await screen.findByRole("dialog");
  expect(within(review).getByText(displayedId)).toBeInTheDocument();
  fireEvent.click(within(review).getByRole("button", { name: "Yes, Confirm & Post" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(
    "patch", "/products/item-1/stock", expect.objectContaining({ referenceId: rawId, delta }),
    `Stock movement ${displayedId} recorded.`,
  ));
  expect(save.mock.calls[0][2]).not.toHaveProperty("workOrderId");
});
