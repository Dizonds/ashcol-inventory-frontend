import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { StyleProvider } from "@ant-design/cssinjs";
import JobOrdersPage from "./JobOrdersPage";
import { api } from "../../api";

jest.mock("../../api", () => ({ api: jest.fn(), errorMessage: (error) => error.message }));
const technician = { id: "tech-1", fullName: "Test Technician", role: "EMPLOYEE" };
const van = { id: "VAN-1", name: "Service Van", driverId: technician.id };
const job = { id: "job-1", jobNumber: "JOB0001", title: "AC installation", customerName: "Test customer",
  location: "Taguig office", technicianName: technician.fullName, assignedTechnicianId: technician.id,
  vanId: van.id, vanName: van.name, status: "OPEN" };

test("job creation reloads saved vehicles when the parent fleet list is stale", async () => {
  let fleet = [van];
  api.mockImplementation((method, path) => Promise.resolve({ data:
    path === "/users" ? [technician] : path === "/service-vans" ? fleet : [],
  }));
  render(<StyleProvider mock="server"><JobOrdersPage user={{ role: "ADMIN" }} serviceVans={[van]} /></StyleProvider>);
  await waitFor(() => expect(api).toHaveBeenCalledWith("get", "/service-vans"));
  fleet = [van, { ...van, id: "VAN-4", name: "Newly registered vehicle" },
    { ...van, id: "DEMO-VAN-1", name: "Design placeholder", isDemo: true }];
  fireEvent.click(screen.getByRole("button", { name: "Create Job Order" }));
  await waitFor(() => expect(api.mock.calls.filter(([, path]) => path === "/service-vans")).toHaveLength(2));
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Job service vehicle" }));
  expect(await screen.findByText("Newly registered vehicle", { selector: ".ant-select-item-option-content" })).toBeInTheDocument();
  expect(screen.queryByText("Design placeholder")).not.toBeInTheDocument();
}, 15000);

test("a manager creates an assigned job and can review the materials consumed", async () => {
  let jobs = [];
  api.mockImplementation((method, path) => {
    if (method === "post") { jobs = [job]; return Promise.resolve({ data: job }); }
    if (method === "patch") { jobs = [{ ...job, isCurrent: true }]; return Promise.resolve({ data: jobs[0] }); }
    if (path === "/users") return Promise.resolve({ data: [technician] });
    if (path === "/service-vans") return Promise.resolve({ data: [van] });
    if (path === "/job-orders/job-1") return Promise.resolve({ data: { ...job, movements: [{
      id: "usage-1", referenceId: "USE0001", sku: "PIPE", itemName: "Copper pipe", quantityDelta: -2,
      unitOfMeasure: "METER", performedByName: technician.fullName, createdAt: new Date().toISOString(), reason: "Office installation",
    }] } });
    return Promise.resolve({ data: jobs });
  });
  render(<StyleProvider mock="server"><JobOrdersPage user={{ role: "MANAGER" }} serviceVans={[van]} /></StyleProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Create Job Order" }));
  const form = screen.getByRole("dialog");
  fireEvent.change(within(form).getByRole("textbox", { name: "Job title" }), { target: { value: job.title } });
  fireEvent.change(within(form).getByRole("textbox", { name: "Customer" }), { target: { value: job.customerName } });
  fireEvent.change(within(form).getByRole("textbox", { name: "Service location" }), { target: { value: job.location } });
  await waitFor(() => expect(api).toHaveBeenCalledWith("get", "/users"));
  fireEvent.mouseDown(within(form).getByRole("combobox", { name: "Job service vehicle" }));
  fireEvent.click(await screen.findByText("Service Van", { selector: ".ant-select-item-option-content" }));
  expect(within(form).getByRole("textbox", { name: "Assigned technician" })).toHaveValue(technician.fullName);
  fireEvent.click(within(form).getByRole("button", { name: "Create Job Order" }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("post", "/job-orders", expect.objectContaining({
    title: job.title, customerName: job.customerName, location: job.location, vanId: van.id, assignedTechnicianId: technician.id,
  })));
  expect(await screen.findByText("JOB - 0001")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Assign job", exact: true }));
  fireEvent.click(await screen.findByRole("button", { name: "OK", exact: true }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("patch", "/job-orders/job-1/assignment"));
  expect(await screen.findByText("Current job", { exact: true })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "View details" }));
  expect(await screen.findByText("USE - 0001")).toBeInTheDocument();
  expect(screen.getByText("2 METER")).toBeInTheDocument();
}, 15000);

test("technicians see their assigned job list without job creation controls", async () => {
  api.mockResolvedValue({ data: [job] });
  render(<StyleProvider mock="server"><JobOrdersPage user={technician} serviceVans={[van]} /></StyleProvider>);
  expect(await screen.findByText("JOB - 0001")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Create Job Order" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Assign job", exact: true })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Edit", exact: true })).not.toBeInTheDocument();
  expect(api).not.toHaveBeenCalledWith("get", "/users");
});

test.each(["ADMIN", "MANAGER"])("%s archives a closed job, reviews its history, and restores it without reopening it", async (role) => {
  let saved = { ...job, status: "COMPLETED", archived: false };
  api.mockImplementation((method, path, data, params) => {
    if (method === "delete") { saved = { ...saved, archived: true }; return Promise.resolve({ data: saved }); }
    if (method === "post") { saved = { ...saved, archived: false }; return Promise.resolve({ data: saved }); }
    if (path === "/users") return Promise.resolve({ data: [technician] });
    if (path === "/service-vans") return Promise.resolve({ data: [van] });
    if (path === "/job-orders/job-1") return Promise.resolve({ data: { ...saved, movements: [] } });
    return Promise.resolve({ data: saved.archived === Boolean(params?.archived) ? [saved] : [] });
  });
  render(<StyleProvider mock="server"><JobOrdersPage user={{ role }} serviceVans={[van]} /></StyleProvider>);
  const archive = await screen.findByRole("button", { name: "Archive job", exact: true });
  expect(archive.textContent).toBe("");
  expect(screen.queryByRole("button", { name: "Edit", exact: true })).not.toBeInTheDocument();
  fireEvent.click(archive);
  fireEvent.click(await screen.findByRole("button", { name: "OK", exact: true }));
  await waitFor(() => expect(screen.queryByText("JOB - 0001")).not.toBeInTheDocument());
  expect(api).toHaveBeenCalledWith("delete", "/job-orders/job-1");
  fireEvent.click(screen.getByRole("button", { name: "View archived jobs" }));
  expect(await screen.findByText("JOB - 0001")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Create Job Order" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "View details" }));
  expect(await screen.findByText("No material usage recorded for this job yet.")).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Restore job", exact: true }));
  fireEvent.click(await screen.findByRole("button", { name: "OK", exact: true }));
  await waitFor(() => expect(screen.queryByText("JOB - 0001")).not.toBeInTheDocument());
  expect(api).toHaveBeenCalledWith("post", "/job-orders/job-1/restore");
  fireEvent.click(screen.getByRole("button", { name: "View active jobs" }));
  expect(await screen.findByText("JOB - 0001")).toBeInTheDocument();
  expect(within(screen.getByRole("row", { name: /JOB - 0001/ })).getByText("COMPLETED")).toBeInTheDocument();
}, 15000);

test("technicians can read archived jobs but cannot archive or restore, and open jobs cannot be archived", async () => {
  api.mockImplementation((method, path, data, params) => Promise.resolve({ data:
    [{ ...job, status: params?.archived ? "CANCELLED" : "OPEN", archived: Boolean(params?.archived), isCurrent: !params?.archived }],
  }));
  render(<StyleProvider mock="server"><JobOrdersPage user={technician} serviceVans={[van]} /></StyleProvider>);
  expect(await screen.findByRole("button", { name: "Complete", exact: true })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Archive job", exact: true })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "View archived jobs" }));
  expect(await screen.findByText("CANCELLED")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Restore job", exact: true })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Complete", exact: true })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "View details" })).toBeInTheDocument();
});

test("an archive failure keeps the job visible and displays the server error", async () => {
  api.mockImplementation((method, path) => {
    if (method === "delete") return Promise.reject(new Error("The job could not be archived."));
    return Promise.resolve({ data: path === "/users" ? [technician] : path === "/service-vans" ? [van] : [{ ...job, status: "CANCELLED" }] });
  });
  render(<StyleProvider mock="server"><JobOrdersPage user={{ role: "ADMIN" }} serviceVans={[van]} /></StyleProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Archive job", exact: true }));
  fireEvent.click(await screen.findByRole("button", { name: "OK", exact: true }));
  expect(await screen.findByText("The job could not be archived.")).toBeInTheDocument();
  expect(screen.getByText("JOB - 0001")).toBeInTheDocument();
});

test.each(["MANAGER", "ADMIN"])("%s can edit a job and change its technician with the matching vehicle", async (role) => {
  const nextTech = { id: "tech-2", fullName: "Next Technician", role: "EMPLOYEE" };
  const nextVan = { id: "VAN-2", name: "Next Van", driverId: nextTech.id };
  let jobs = [{ ...job, isCurrent: true }];
  api.mockImplementation((method, path, data) => {
    if (method === "patch") { jobs = [{ ...jobs[0], ...data, technicianName: nextTech.fullName, vanName: nextVan.name }]; return Promise.resolve({ data: jobs[0] }); }
    return Promise.resolve({ data: path === "/users" ? [technician, nextTech] : path === "/service-vans" ? [van, nextVan] : jobs });
  });
  render(<StyleProvider mock="server"><JobOrdersPage user={{ role }} serviceVans={[van, nextVan]} /></StyleProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Edit", exact: true }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByRole("textbox", { name: "Job title" })).toHaveValue(job.title);
  fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: "Assigned technician" }));
  fireEvent.click(await screen.findByText(nextTech.fullName, { selector: ".ant-select-item-option-content" }));
  expect(within(dialog).getByText(nextVan.name)).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("patch", "/job-orders/job-1", expect.objectContaining({
    title: job.title, assignedTechnicianId: nextTech.id, vanId: nextVan.id,
  })));
  expect(await screen.findByText(nextTech.fullName, { selector: "td" })).toBeInTheDocument();
}, 15000);
