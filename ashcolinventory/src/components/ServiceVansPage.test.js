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
  await waitFor(() => expect(idField).toHaveValue("USE - 0001"));
  fireEvent.click(within(dialog).getByRole("button", { name: "Record Usage" }));
  const notes = within(dialog).getByPlaceholderText("Describe where the material was installed/used");
  expect(notes).toHaveAttribute("aria-invalid", "true");
  expect(within(dialog).getByText("Describe where the material was used.")).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(within(dialog).getByPlaceholderText("Describe where the material was installed/used"), {
    target: { value: "Office installation" },
  });
  expect(notes).toHaveAttribute("aria-invalid", "false");
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

test("vehicle edit uses one save and keeps the form open when the atomic save fails", async () => {
  api.mockResolvedValue({ data: [] });
  const van = { id: "VAN-EDIT", name: "Original vehicle", plateNumber: "OLD-001", status: "AVAILABLE", driverId: "", driverName: "" };
  const save = jest.fn().mockRejectedValueOnce(new Error("Driver assignment changed. Try again.")).mockResolvedValueOnce({ ...van, name: "Renamed vehicle", plateNumber: "NEW-002" });
  render(<StyleProvider mock="server"><ServiceVansPage serviceVans={[van]} user={{ role: "MANAGER" }} save={save} /></StyleProvider>);
  fireEvent.click(screen.getByTitle("Edit vehicle info"));
  const dialog = within(screen.getByRole("dialog"));
  const inputs = dialog.getAllByRole("textbox");
  fireEvent.change(inputs[0], { target: { value: "Renamed vehicle" } });
  fireEvent.change(inputs[1], { target: { value: "NEW-002" } });
  fireEvent.click(dialog.getByRole("button", { name: "Save Changes" }));
  expect(await dialog.findByText("Driver assignment changed. Try again.")).toBeInTheDocument();
  expect(save).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledWith("patch", "/service-vans/VAN-EDIT", expect.objectContaining({ name: "Renamed vehicle", plateNumber: "NEW-002", driverId: "", status: "AVAILABLE" }), "Vehicle details updated.", undefined, { refresh: false });
  fireEvent.click(dialog.getByRole("button", { name: "Save Changes" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByText("Renamed vehicle")).toBeInTheDocument();
});

test("record usage can retry when an ID response is missing", async () => {
  const item = { id: "item-1", name: "Copper pipe", sku: "PIPE", quantity: 5, unitOfMeasure: "PCS" };
  let attempts = 0;
  const save = jest.fn();
  api.mockImplementation((method, path) => {
    if (path.endsWith("/usage-ticket")) {
      attempts += 1;
      return Promise.resolve({ data: attempts === 1 ? { workOrderId: "JOB0001" } : { usageId: "USE0002" } });
    }
    return Promise.resolve({ data: path === "/job-orders" ? [] : [item] });
  });
  render(<StyleProvider mock="server"><ServiceVansPage
    serviceVans={[{ id: "VAN-1", name: "Service Van", status: "AVAILABLE", driverName: "Technician" }]}
    user={{ id: "tech-1", role: "EMPLOYEE" }} save={save}
  /></StyleProvider>);
  fireEvent.click(screen.getByTitle("View vehicle details"));
  fireEvent.click(await screen.findByRole("button", { name: "Record Usage" }));
  fireEvent.click(await screen.findByRole("button", { name: "Retry Usage ID" }));
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Usage ID" })).toHaveValue("USE - 0002"));
  expect(attempts).toBe(2);
  expect(screen.getByText("No current job assigned. Ask your admin or manager to assign a job from Job Orders.")).toBeInTheDocument();
  const dialog = screen.getByRole("dialog");
  const record = within(dialog).getByRole("button", { name: "Record Usage" });
  expect(record).toBeEnabled();
  fireEvent.click(record);
  fireEvent.click(record);
  const jobField = within(dialog).getByRole("textbox", { name: "Current Job Order" });
  expect(jobField).toHaveAttribute("aria-invalid", "true");
  expect(jobField).toHaveClass("ant-input-status-error");
  expect(within(dialog).getByText("A current job order is required. Ask your admin or manager to assign one.")).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  expect(screen.queryByText("A usage ID could not be generated. Please try again.")).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  fireEvent.click(await screen.findByRole("button", { name: "Record Usage" }));
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Usage ID" })).toHaveValue("USE - 0002"));
  expect(screen.getByRole("textbox", { name: "Current Job Order" })).toHaveAttribute("aria-invalid", "false");
});

test("record usage highlights an empty quantity and clears the error when corrected", async () => {
  const item = { id: "item-1", name: "Copper pipe", sku: "PIPE", quantity: 5, unitOfMeasure: "PCS" };
  const job = { id: "job-1", jobNumber: "JOB0001", title: "AC installation" };
  api.mockImplementation((method, path) => Promise.resolve({ data: path.endsWith("/usage-ticket") ? { usageId: "USE0004" } : path === "/job-orders" ? [job] : [item] }));
  const save = jest.fn();
  render(<StyleProvider mock="server"><ServiceVansPage
    serviceVans={[{ id: "VAN-1", name: "Service Van", status: "AVAILABLE", driverName: "Technician" }]}
    user={{ id: "tech-1", role: "EMPLOYEE" }} save={save}
  /></StyleProvider>);
  fireEvent.click(screen.getByTitle("View vehicle details"));
  fireEvent.click(await screen.findByRole("button", { name: "Record Usage" }));
  const dialog = screen.getByRole("dialog");
  await waitFor(() => expect(within(dialog).getByRole("textbox", { name: "Usage ID" })).toHaveValue("USE - 0004"));
  const quantity = within(dialog).getByRole("spinbutton", { name: "Quantity Used" });
  expect(fireEvent.paste(quantity, { clipboardData: { getData: () => "0.5" } })).toBe(false);
  fireEvent.change(quantity, { target: { value: "" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Record Usage" }));
  expect(quantity).toHaveAttribute("aria-invalid", "true");
  expect(within(dialog).getByText("Enter a quantity greater than zero.")).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(quantity, { target: { value: "2" } });
  expect(quantity).toHaveAttribute("aria-invalid", "false");
  expect(within(dialog).queryByText("Enter a quantity greater than zero.")).not.toBeInTheDocument();
});

test("a newly assigned current job appears in an open usage form without clearing the draft", async () => {
  const item = { id: "item-1", name: "Copper pipe", sku: "PIPE", quantity: 5, unitOfMeasure: "PCS" };
  let jobs = [];
  api.mockImplementation((method, path) => Promise.resolve({ data: path.endsWith("/usage-ticket") ? { usageId: "USE0005" } : path === "/job-orders" ? jobs : [item] }));
  const props = { serviceVans: [{ id: "VAN-1", name: "Service Van", status: "AVAILABLE", driverName: "Technician" }], user: { id: "tech-1", role: "EMPLOYEE" }, save: jest.fn() };
  const { rerender } = render(<StyleProvider mock="server"><ServiceVansPage {...props} refresh={0} /></StyleProvider>);
  fireEvent.click(screen.getByTitle("View vehicle details"));
  fireEvent.click(await screen.findByRole("button", { name: "Record Usage" }));
  await screen.findByText("No current job assigned. Ask your admin or manager to assign a job from Job Orders.");
  fireEvent.change(screen.getByPlaceholderText("Describe where the material was installed/used"), { target: { value: "Keep this draft" } });
  jobs = [{ id: "job-new", jobNumber: "JOB0002", title: "Newly assigned job" }];
  rerender(<StyleProvider mock="server"><ServiceVansPage {...props} refresh={1} /></StyleProvider>);
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Current Job Order" })).toHaveValue("JOB - 0002 · Newly assigned job"));
  expect(screen.getByPlaceholderText("Describe where the material was installed/used")).toHaveValue("Keep this draft");
  expect(screen.getByRole("textbox", { name: "Usage ID" })).toHaveValue("USE - 0005");
  expect(api.mock.calls.filter(([, path]) => path.endsWith("/usage-ticket"))).toHaveLength(1);
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
  if (operation === "Stock Out") {
    fireEvent.click(screen.getByRole("radio", { name: operation }));
    fireEvent.change(screen.getByLabelText("Select an Item"), { target: { value: "item-1" } });
  }
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
