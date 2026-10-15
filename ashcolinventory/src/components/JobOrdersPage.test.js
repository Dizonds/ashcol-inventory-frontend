import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { StyleProvider } from "@ant-design/cssinjs";
import JobOrdersPage from "./JobOrdersPage";
import { api } from "../api";

jest.mock("../api", () => ({ api: jest.fn(), errorMessage: (error) => error.message }));
const technician = { id: "tech-1", fullName: "Test Technician", role: "EMPLOYEE" };
const van = { id: "VAN-1", name: "Service Van", driverId: technician.id };
const job = { id: "job-1", jobNumber: "JOB0001", title: "AC installation", customerName: "Test customer",
  location: "Taguig office", technicianName: technician.fullName, assignedTechnicianId: technician.id,
  vanId: van.id, vanName: van.name, status: "OPEN" };

test("a manager creates an assigned job and can review the materials consumed", async () => {
  let jobs = [];
  api.mockImplementation((method, path) => {
    if (method === "post") { jobs = [job]; return Promise.resolve({ data: job }); }
    if (method === "patch") { jobs = [{ ...job, isCurrent: true }]; return Promise.resolve({ data: jobs[0] }); }
    if (path === "/users") return Promise.resolve({ data: [technician] });
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
  expect(await screen.findByText("USE0001")).toBeInTheDocument();
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

test.each(["MANAGER", "ADMIN"])("%s can edit a job and change its technician with the matching vehicle", async (role) => {
  const nextTech = { id: "tech-2", fullName: "Next Technician", role: "EMPLOYEE" };
  const nextVan = { id: "VAN-2", name: "Next Van", driverId: nextTech.id };
  let jobs = [{ ...job, isCurrent: true }];
  api.mockImplementation((method, path, data) => {
    if (method === "patch") { jobs = [{ ...jobs[0], ...data, technicianName: nextTech.fullName, vanName: nextVan.name }]; return Promise.resolve({ data: jobs[0] }); }
    return Promise.resolve({ data: path === "/users" ? [technician, nextTech] : jobs });
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
