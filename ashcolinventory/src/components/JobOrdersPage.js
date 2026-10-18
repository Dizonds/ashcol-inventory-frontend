import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Descriptions, Empty, Input, Modal, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { api, errorMessage } from "../api";
import { formatJobNumber, formatMovementNumber } from "../utils/formatters";
import "./JobOrdersPage.css";

const statusColor = { OPEN: "blue", COMPLETED: "green", CANCELLED: "default" };
const emptyDraft = { title: "", customerName: "", location: "", description: "", vanId: "", assignedTechnicianId: "" };
const dateLabel = (value) => value ? new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : "—";

const actionIconPaths = {
  view: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0",
  edit: "m16 3 5 5-12 12-6 1 1-6Z M14 5l5 5",
  assign: "m3 3 19 9-19 9 4-9-4-9Z M7 12h15",
  complete: "m5 12 4 4L19 6",
  cancel: "m6 6 12 12 M6 18 18 6",
  archive: "M3 4h18v4H3Z M5 8v12h14V8 M9 12h6",
  restore: "M4 4v6h6 M4 10a8 8 0 1 1 1 8",
  refresh: "M20 4v6h-6 M20 10a8 8 0 1 0-1 8",
  list: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
};
function JobActionIcon({ name }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={actionIconPaths[name]} /></svg>;
}

export default function JobOrdersPage({ user, serviceVans = [], refresh }) {
  const canManage = user.role !== "EMPLOYEE";
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [fleetVehicles, setFleetVehicles] = useState(serviceVans);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [archived, setArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const loadSequence = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError("");
    try {
      const [{ data }, accounts, fleet] = await Promise.all([
        api("get", "/job-orders", null, { archived }), canManage ? api("get", "/users") : Promise.resolve({ data: [] }),
        canManage ? api("get", "/service-vans") : Promise.resolve({ data: [] }),
      ]);
      if (sequence !== loadSequence.current) return;
      setJobs(data);
      setTechnicians(accounts.data.filter((account) => account.role === "EMPLOYEE"));
      if (canManage) setFleetVehicles(fleet.data);
    } catch (err) { if (sequence === loadSequence.current) setError(errorMessage(err)); }
    finally { if (sequence === loadSequence.current) setLoading(false); }
  }, [canManage, archived]);
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
  async function archiveJob(job) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (archived) await api("post", `/job-orders/${job.id}/restore`);
      else await api("delete", `/job-orders/${job.id}`);
      await load();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  const filtered = jobs.filter((job) => (status === "ALL" || job.status === status) &&
    [job.jobNumber, formatJobNumber(job.jobNumber), job.title, job.customerName, job.location, job.technicianName, job.vanName]
      .some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase())));
  const jobActions = (job) => <Space size={8} className="job-orders-actions">
    <Tooltip title="View details"><Button className="job-orders-action-btn" aria-label="View details" icon={<JobActionIcon name="view" />} onClick={() => view(job)} /></Tooltip>
    {!archived && job.status === "OPEN" && <>
      {canManage && <Tooltip title="Edit"><Button className="job-orders-action-btn" aria-label="Edit" icon={<JobActionIcon name="edit" />} disabled={busy} onClick={() => editJob(job)} /></Tooltip>}
      {canManage && !job.isCurrent && <Popconfirm title={`Assign ${formatJobNumber(job.jobNumber)} to ${job.technicianName}?`} description="This becomes their current job. Any previous current job returns to the queue." onConfirm={() => assignJob(job)}>
        <Tooltip title="Assign job"><Button className="job-orders-action-btn" aria-label="Assign job" icon={<JobActionIcon name="assign" />} type="primary" disabled={busy} /></Tooltip>
      </Popconfirm>}
      {(canManage || job.isCurrent) &&
      <Popconfirm title={`Complete ${formatJobNumber(job.jobNumber)}?`} description="No more materials can be recorded for a completed job." onConfirm={() => closeJob(job, "COMPLETED")}>
        <Tooltip title="Complete"><Button className="job-orders-action-btn" aria-label="Complete" icon={<JobActionIcon name="complete" />} disabled={busy} /></Tooltip>
      </Popconfirm>}
      {canManage && <Popconfirm title="Cancel this job?" description="Existing material usage stays in the history." onConfirm={() => closeJob(job, "CANCELLED")}>
        <Tooltip title="Cancel job"><Button className="job-orders-action-btn" aria-label="Cancel job" icon={<JobActionIcon name="cancel" />} danger disabled={busy} /></Tooltip>
      </Popconfirm>}
    </>}
    {canManage && (archived || ["COMPLETED", "CANCELLED"].includes(job.status)) &&
      <Popconfirm title={archived ? "Restore this job order?" : "Archive this job order?"}
        description={archived ? "The job returns to the active list with its existing status and history." : "The job moves to Archived Jobs. Its details and material usage are kept."}
        onConfirm={() => archiveJob(job)}>
        <Tooltip title={archived ? "Restore job" : "Archive job"}><Button className="job-orders-action-btn"
          aria-label={archived ? "Restore job" : "Archive job"} icon={<JobActionIcon name={archived ? "restore" : "archive"} />} disabled={busy} /></Tooltip>
      </Popconfirm>}
  </Space>;

  return <div className="job-orders-page">
    {error && !creating && <Alert type="error" title={error} showIcon action={<Button onClick={load}>Retry</Button>} />}
    {archived && <Alert type="info" title="Archived Jobs" description={canManage
      ? "Archived jobs keep their details and material usage history. Restore a job to return it to the active list."
      : "Your archived jobs keep their details and material usage history. An admin or manager can restore them."} showIcon />}
    <Card className="job-orders-card">
      <div className="job-orders-toolbar">
        <div className="job-orders-toolbar-left">
          <Input.Search className="job-orders-search" aria-label="Search job orders" placeholder="Search job, customer, location or technician" value={search} onChange={(event) => setSearch(event.target.value)} allowClear />
        </div>
        <div className="job-orders-toolbar-right">
          <Select aria-label="Job status" value={status} onChange={setStatus} options={[{ value: "ALL", label: "All statuses" }, ...["OPEN", "COMPLETED", "CANCELLED"].map((value) => ({ value, label: value[0] + value.slice(1).toLowerCase() }))]} />
          <Tooltip title="Refresh"><Button className="job-orders-action-btn" aria-label="Refresh" icon={<JobActionIcon name="refresh" />} onClick={load} loading={loading} /></Tooltip>
          <Tooltip title={archived ? "View active jobs" : "View archived jobs"}><Button className="job-orders-action-btn"
            aria-label={archived ? "View active jobs" : "View archived jobs"} aria-pressed={archived}
            type={archived ? "primary" : "default"} icon={<JobActionIcon name={archived ? "list" : "archive"} />}
            disabled={busy} onClick={() => { ++loadSequence.current; setJobs([]); setArchived(!archived); setSearch(""); setStatus("ALL"); }} /></Tooltip>
          {canManage && !archived && <button type="button" className="job-orders-create-btn" onClick={() => { setEditing(null); setDraft(emptyDraft); setError(""); setCreating(true); load(); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
            <span>Create Job Order</span>
          </button>}
        </div>
      </div>
      <div className="job-orders-table">
      <Table rowKey="id" loading={loading} dataSource={filtered} scroll={{ x: 1200 }} pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description={archived ? "No archived job orders." : canManage ? "No job orders yet. Create one to assign service work." : "No job orders assigned to you yet."} /> }}
        columns={[
          { title: "Job ID", width: 140, render: (_, job) => <Typography.Text copyable>{formatJobNumber(job.jobNumber)}</Typography.Text> },
          { title: "Service job", width: 230, render: (_, job) => <div><strong>{job.title}</strong><div>{job.customerName}</div><small>{job.location}</small></div> },
          { title: "Technician", dataIndex: "technicianName", width: 160 },
          { title: "Vehicle", dataIndex: "vanName", width: 160 },
          { title: "Status", dataIndex: "status", width: 120, render: (value) => <Tag color={statusColor[value]}>{value}</Tag> },
          { title: "Assignment", width: 130, render: (_, job) => job.status === "OPEN" ? <Tag color={job.isCurrent ? "green" : "default"}>{job.isCurrent ? "Current job" : "Queued"}</Tag> : "Finished" },
          { title: "Actions", width: 220, render: (_, job) => jobActions(job) },
        ]} />
      </div>
    </Card>

    <Modal open={creating} title={editing ? `Edit ${formatJobNumber(editing.jobNumber)}` : "Create Job Order"} onCancel={() => { if (!busy) { setCreating(false); setEditing(null); } }} footer={null} maskClosable={false}>
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

    <Modal open={Boolean(viewing)} title={viewing ? `${formatJobNumber(viewing.jobNumber)} · ${viewing.title}` : "Job details"} onCancel={() => setViewing(null)} footer={null} width={1000} maskClosable={false}>
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
