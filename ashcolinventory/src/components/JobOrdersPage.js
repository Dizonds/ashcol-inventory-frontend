import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Empty, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import { api, errorMessage } from "../api";
import { formatJobNumber, formatMovementNumber } from "../utils/formatters";
import "./JobOrdersPage.css";

const statusColor = { OPEN: "blue", COMPLETED: "green", CANCELLED: "default" };
const emptyDraft = { title: "", customerName: "", location: "", description: "", vanId: "", assignedTechnicianId: "" };
const dateLabel = (value) => value ? new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : "—";

export default function JobOrdersPage({ user, serviceVans = [], refresh }) {
  const canManage = user.role !== "EMPLOYEE";
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [fleetVehicles, setFleetVehicles] = useState(serviceVans);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data }, accounts, fleet] = await Promise.all([
        api("get", "/job-orders"), canManage ? api("get", "/users") : Promise.resolve({ data: [] }),
        canManage ? api("get", "/service-vans") : Promise.resolve({ data: [] }),
      ]);
      setJobs(data);
      setTechnicians(accounts.data.filter((account) => account.role === "EMPLOYEE"));
      if (canManage) setFleetVehicles(fleet.data);
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, [canManage]);
  useEffect(() => { load(); }, [load, refresh]);
  useEffect(() => { setFleetVehicles(serviceVans); }, [serviceVans]);

  const assignedTechnician = (van) => technicians.find((tech) => van?.driverId
    ? tech.id === van.driverId : [tech.fullName, `${tech.fullName} (${tech.role})`].includes(van?.driverName));
  const vehicles = fleetVehicles.filter((van) => !van.isDemo);
  const selectedVan = vehicles.find((van) => van.id === draft.vanId);
  const technician = assignedTechnician(selectedVan);
  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  async function create(event) {
    event.preventDefault();
    if (busy || !draft.assignedTechnicianId) return;
    setBusy(true); setError("");
    try {
      if (editing) await api("patch", `/job-orders/${editing.id}`, draft);
      else await api("post", "/job-orders", draft);
      setCreating(false); setEditing(null); setDraft(emptyDraft);
      await load();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  function editJob(job) {
    setEditing(job); setCreating(true); setError("");
    setDraft({ title: job.title, customerName: job.customerName, location: job.location,
      description: job.description || "", vanId: job.vanId, assignedTechnicianId: String(job.assignedTechnicianId) });
  }
  async function view(job) {
    setViewing(job); setDetailsLoading(true); setDetailsError("");
    try { const { data } = await api("get", `/job-orders/${job.id}`); setViewing((current) => current?.id === job.id ? data : current); }
    catch (err) { setDetailsError(errorMessage(err)); }
    finally { setDetailsLoading(false); }
  }
  async function closeJob(job, nextStatus) {
    setBusy(true); setError("");
    try {
      await api("patch", `/job-orders/${job.id}/status`, { status: nextStatus });
      setViewing(null); await load();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  async function assignJob(job) {
    setBusy(true); setError("");
    try {
      await api("patch", `/job-orders/${job.id}/assignment`);
      await load();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  const filtered = jobs.filter((job) => (status === "ALL" || job.status === status) &&
    [job.jobNumber, formatJobNumber(job.jobNumber), job.title, job.customerName, job.location, job.technicianName, job.vanName]
      .some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase())));
  const jobActions = (job) => <Space wrap>
    <Button size="small" onClick={() => view(job)}>View details</Button>
    {job.status === "OPEN" && <>
      {canManage && <Button size="small" disabled={busy} onClick={() => editJob(job)}>Edit</Button>}
      {canManage && !job.isCurrent && <Popconfirm title={`Assign ${formatJobNumber(job.jobNumber)} to ${job.technicianName}?`} description="This becomes their current job. Any previous current job returns to the queue." onConfirm={() => assignJob(job)}>
        <Button size="small" type="primary" disabled={busy}>Assign job</Button>
      </Popconfirm>}
      {(canManage || job.isCurrent) &&
      <Popconfirm title={`Complete ${formatJobNumber(job.jobNumber)}?`} description="No more materials can be recorded for a completed job." onConfirm={() => closeJob(job, "COMPLETED")}>
        <Button size="small" disabled={busy}>Complete</Button>
      </Popconfirm>}
      {canManage && <Popconfirm title="Cancel this job?" description="Existing material usage stays in the history." onConfirm={() => closeJob(job, "CANCELLED")}>
        <Button size="small" danger disabled={busy}>Cancel job</Button>
      </Popconfirm>}
    </>}
  </Space>;

  return <div className="job-orders-page">
    {error && !creating && <Alert type="error" title={error} showIcon action={<Button onClick={load}>Retry</Button>} />}
    <Card className="job-orders-card">
      <div className="job-orders-toolbar">
        <div className="job-orders-toolbar-left">
          <div className="job-orders-title-group">
            <span className="job-orders-title-icon" aria-hidden="true">☷</span>
            <div>
              <Typography.Title level={3}>Job Orders</Typography.Title>
              <Typography.Paragraph type="secondary">{canManage ? "Create service work, assign technicians and review materials used." : "Your assigned work and material usage history."}</Typography.Paragraph>
            </div>
          </div>
          <Input.Search className="job-orders-search" aria-label="Search job orders" placeholder="Search job, customer, location or technician" value={search} onChange={(event) => setSearch(event.target.value)} allowClear />
        </div>
        <div className="job-orders-toolbar-right">
          <Select aria-label="Job status" value={status} onChange={setStatus} options={[{ value: "ALL", label: "All statuses" }, ...["OPEN", "COMPLETED", "CANCELLED"].map((value) => ({ value, label: value[0] + value.slice(1).toLowerCase() }))]} />
          <Button onClick={load} loading={loading}>Refresh</Button>
          {canManage && <button type="button" className="job-orders-create-btn" onClick={() => { setEditing(null); setDraft(emptyDraft); setError(""); setCreating(true); load(); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
            <span>Create Job Order</span>
          </button>}
        </div>
      </div>
      <div className="job-orders-table">
      <Table rowKey="id" loading={loading} dataSource={filtered} scroll={{ x: 1200 }} pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description={canManage ? "No job orders yet. Create one to assign service work." : "No job orders assigned to you yet."} /> }}
        columns={[
          { title: "Job ID", width: 140, render: (_, job) => <Typography.Text copyable>{formatJobNumber(job.jobNumber)}</Typography.Text> },
          { title: "Service job", width: 230, render: (_, job) => <div><strong>{job.title}</strong><div>{job.customerName}</div><small>{job.location}</small></div> },
          { title: "Technician", dataIndex: "technicianName", width: 160 },
          { title: "Vehicle", dataIndex: "vanName", width: 160 },
          { title: "Status", dataIndex: "status", width: 120, render: (value) => <Tag color={statusColor[value]}>{value}</Tag> },
          { title: "Assignment", width: 130, render: (_, job) => job.status === "OPEN" ? <Tag color={job.isCurrent ? "green" : "default"}>{job.isCurrent ? "Current job" : "Queued"}</Tag> : "Finished" },
          { title: "Actions", width: 330, render: (_, job) => jobActions(job) },
        ]} />
      </div>
    </Card>

    <Modal open={creating} title={editing ? `Edit ${formatJobNumber(editing.jobNumber)}` : "Create Job Order"} onCancel={() => { if (!busy) { setCreating(false); setEditing(null); } }} footer={null} maskClosable={!busy}>
      {error && <Alert type="error" title={error} showIcon />}
      <Typography.Paragraph type="secondary">{editing
        ? editing.isCurrent ? "Saving transfers this current job to the selected technician and vehicle. Their previous current job returns to the queue." : "Update the job details and technician. This job stays queued until you assign it."
        : "A Job ID is generated when you save. Choose a vehicle with an assigned technician, then use Assign job to make it their current task."}</Typography.Paragraph>
      <form onSubmit={create} className="job-order-form">
        {[{ key: "title", label: "Job title" }, { key: "customerName", label: "Customer" }, { key: "location", label: "Service location" }].map((field) =>
          <label className="field" key={field.key}>{field.label}<Input required maxLength={200} disabled={busy} value={draft[field.key]} onChange={(event) => updateDraft(field.key, event.target.value)} /></label>)}
        <label className="field">Service vehicle<Select aria-label="Job service vehicle" disabled={busy} value={draft.vanId || undefined} placeholder="Choose an assigned vehicle"
          options={vehicles.map((van) => ({ value: van.id, label: `${van.name}${assignedTechnician(van) ? "" : " — assign a technician first"}`, disabled: !assignedTechnician(van) }))}
          onChange={(value) => {
            const tech = assignedTechnician(vehicles.find((van) => van.id === value));
            setDraft((current) => ({ ...current, vanId: value, assignedTechnicianId: tech?.id || "" }));
          }} /></label>
        <label className="field">Assigned technician{editing ? <Select
          aria-label="Assigned technician" disabled={busy} value={draft.assignedTechnicianId || undefined}
          options={technicians.map((tech) => ({ value: tech.id, label: tech.fullName,
            disabled: !vehicles.some((van) => assignedTechnician(van)?.id === tech.id) }))}
          onChange={(id) => {
            const van = vehicles.find((vehicle) => assignedTechnician(vehicle)?.id === id);
            setDraft((current) => ({ ...current, assignedTechnicianId: id, vanId: van?.id || "" }));
          }} /> : <Input readOnly value={technician?.fullName || ""} placeholder="Assigned from the selected vehicle" />}</label>
        <label className="field">Description (optional)<Input.TextArea rows={3} maxLength={200} disabled={busy} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></label>
        <Space className="job-orders-form-actions"><Button onClick={() => { setCreating(false); setEditing(null); }} disabled={busy}>Cancel</Button><Button type="primary" htmlType="submit" loading={busy} disabled={!draft.assignedTechnicianId || !draft.vanId}>{editing ? "Save changes" : "Create Job Order"}</Button></Space>
      </form>
    </Modal>

    <Modal open={Boolean(viewing)} title={viewing ? `${formatJobNumber(viewing.jobNumber)} · ${viewing.title}` : "Job details"} onCancel={() => setViewing(null)} footer={null} width={1000}>
      {viewing && <>
        {detailsError && <Alert type="error" title={detailsError} showIcon />}
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} items={[
          { key: "customer", label: "Customer", children: viewing.customerName }, { key: "location", label: "Location", children: viewing.location },
          { key: "technician", label: "Technician", children: viewing.technicianName }, { key: "vehicle", label: "Vehicle", children: viewing.vanName },
          { key: "status", label: "Status", children: viewing.status }, { key: "created", label: "Created", children: dateLabel(viewing.createdAt) },
          { key: "assignment", label: "Assignment", children: viewing.isCurrent ? "Current job" : viewing.status === "OPEN" ? "Queued" : "Finished" },
          { key: "assignedBy", label: "Assigned by", children: viewing.assignedByName || "Not dispatched yet" },
          { key: "description", label: "Description", children: viewing.description || "—", span: 2 },
          ...(viewing.closedAt ? [{ key: "closed", label: "Closed", children: `${dateLabel(viewing.closedAt)} by ${viewing.closedByName}`, span: 2 }] : []),
        ]} />
        <Typography.Title level={5}>Materials used</Typography.Title>
        <Table loading={detailsLoading} rowKey="id" size="small" dataSource={viewing.movements || []} scroll={{ x: 750 }} pagination={{ pageSize: 8 }} columns={[
          { title: "Usage ID", dataIndex: "referenceId", width: 130, render: formatMovementNumber },
          { title: "Material", render: (_, entry) => <div>{entry.itemName}<div><small>{entry.sku}</small></div></div> },
          { title: "Quantity used", render: (_, entry) => `${Math.abs(entry.quantityDelta)} ${entry.unitOfMeasure}` },
          { title: "Recorded by", dataIndex: "performedByName" }, { title: "Date", dataIndex: "createdAt", render: dateLabel },
          { title: "Notes", dataIndex: "reason" },
        ]} locale={{ emptyText: "No material usage recorded for this job yet." }} />
      </>}
    </Modal>
  </div>;
}
