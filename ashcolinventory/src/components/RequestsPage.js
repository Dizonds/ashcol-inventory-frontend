import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Input,
  Select,
  Alert,
  Typography,
  Space,
  Popconfirm,
  Checkbox,
  Descriptions,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { api, errorMessage } from "../api";
import InventoryNumberInput from "./InventoryNumberInput";
import { formatRequestNumber } from "../utils/formatters";
import "./RequestsPage.css";

const isContinuousUnit = (unit) =>
  ["METER", "FOOT", "KG", "LITER"].includes(unit);
const requestNumber = (entry) => formatRequestNumber(entry.requestNumber || entry.workOrderId || entry.id);
const formatDate = (value) => new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila" });
const requestHistory = (entry) => entry.history?.length ? entry.history : [
  { status: "PENDING", performedByName: entry.requestedByName, at: entry.createdAt },
  ...(entry.reviewedAt ? [{ status: entry.status === "DENIED" ? "DENIED" : "APPROVED", performedByName: entry.reviewedByName, at: entry.reviewedAt, reason: entry.decisionReason }] : []),
  ...(entry.fulfilledAt ? [{ status: "FULFILLED", performedByName: entry.fulfilledByName, at: entry.fulfilledAt }] : []),
];

export default function RequestsPage({
  items,
  requests,
  user,
  serviceVans = [],
  branchId,
  save,
  isDark = false,
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [itemType, setItemType] = useState("");
  const [brand, setBrand] = useState("");
  const [reference, setReference] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [denying, setDenying] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedEntries, setDeletedEntries] = useState([]);
  const canManage = ["ADMIN", "MANAGER"].includes(user.role);
  const assignedVan = serviceVans.find((van) => !van.isDemo && (van.driverId
    ? String(van.driverId) === String(user.id)
    : [user.fullName, `${user.fullName} (${user.role})`].includes(van.driverName)));
  const ownsRequest = (entry) => String(entry.requestedBy) === String(user.id);
  useEffect(() => {
    if (!showDeleted) return;
    let active = true;
    api("get", "/requests", null, { branchId, includeDeleted: true })
      .then(({ data }) => { if (active) setDeletedEntries(data.filter((entry) => entry.deletedAt)); })
      .catch((err) => { if (active) setError(errorMessage(err)); });
    return () => { active = false; };
  }, [showDeleted, branchId, requests]);
  function deleteRequest() {
    if (!deleting || busy) return;
    setBusy(true); setError("");
    save("delete", `/requests/${deleting.id}`, { branchId }, `Request ${requestNumber(deleting)} deleted.`)
      .then(() => setDeleting(null))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  }
  const activeItems = items.filter((item) => !item.archived);
  const itemTypes = [...new Set(activeItems.map((item) => item.itemType).filter(Boolean))].sort();
  const brands = [...new Set(activeItems
    .filter((item) => item.itemType === itemType)
    .map((item) => item.brand).filter(Boolean))].sort();
  const filteredItems = itemType && brand
    ? activeItems.filter((item) => item.itemType === itemType && item.brand === brand)
    : [];
  const selectedItem = filteredItems.find((item) => item.id === productId);
  function newRequest() {
    if (!assignedVan) return;
    setBusy(true);
    setError("");
    api("get", "/requests/reference")
      .then(({ data }) => {
        setReference(data);
        setItemType("");
        setBrand("");
        setProductId("");
        setQuantity(1);
        setNotes("");
        setOpen(true);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  }
  function submit(event) {
    event.preventDefault();
    if (!reference || !selectedItem || !assignedVan || busy) return;
    setBusy(true);
    setError("");
    save(
      "post",
      "/requests",
      { branchId, productId, requestId: reference.id, quantityNeeded: quantity, notes },
      `Material request ${formatRequestNumber(reference.requestNumber)} submitted.`,
    )
      .then(() => {
        setOpen(false);
        setProductId("");
        setReference(null);
        setQuantity(1);
        setNotes("");
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  }
  function transition(request, status) {
    setBusy(true);
    setError("");
    return save(
      "patch",
      `/requests/${request.id}`,
      { branchId, status, decisionReason },
      `Request ${status.toLowerCase()}.`,
    )
      .then(() => {
        setDenying(null);
        setDecisionReason("");
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  }
  return (
    <>
      <Typography.Title level={3}>Material Requests</Typography.Title>
      <Typography.Paragraph type="secondary">
        Request → Approve → Fulfill. Approval does not reserve stock;
        fulfillment transfers available warehouse stock into the technician's assigned vehicle once. Search a request ID
        to see its status and history.
      </Typography.Paragraph>
      {user.role === "EMPLOYEE" && !assignedVan && <Alert type="warning" showIcon
        title="You need an assigned service vehicle before requesting materials. Ask your admin or manager to assign one."
        style={{ marginBottom: 16 }} />}
      {error && !deleting && !open && (
        <Alert type="error" title={error} style={{ marginBottom: 16 }} />
      )}
      <Card
        title={user.role === "EMPLOYEE" ? "My requests" : "Warehouse requests"}
        extra={
          user.role === "EMPLOYEE" && (
            <Button
              type="primary"
              loading={busy}
              disabled={!assignedVan}
              onClick={newRequest}
            >
              New Request
            </Button>
          )
        }
      >
        <Input
          aria-label="Search requests"
          placeholder="Search request ID, item, or requester"
          allowClear
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setFilter("ALL");
          }}
          style={{ maxWidth: 480, marginBottom: 16, marginRight: 12 }}
        />
        <Select
          value={filter}
          onChange={setFilter}
          style={{ width: 180, marginBottom: 16 }}
          options={["ALL", "PENDING", "APPROVED", "DENIED", "FULFILLED"].map(
            (value) => ({ value, label: value }),
          )}
        />
        <Table
          rowKey="id"
          dataSource={[...requests, ...(showDeleted ? deletedEntries : [])].filter(
            (entry) => (user.role !== "EMPLOYEE" || ownsRequest(entry)) &&
              (filter === "ALL" || entry.status === filter) &&
              [requestNumber(entry), entry.id, entry.workOrderId, entry.sku, entry.itemName, entry.brand, entry.itemType, entry.requestedByName]
                .some((value) => String(value || "").toLowerCase().includes(formatRequestNumber(search.trim()).toLowerCase())),
          )}
          scroll={{ x: 1300 }}
          pagination={{ defaultPageSize: 10 }}
          expandable={{
            expandedRowRender: (entry) => (
              <div>
                <p>Notes: {entry.notes || "None"}</p>
                <p>
                  Reviewed by: {entry.reviewedByName || "Not reviewed"}{" "}
                  {entry.decisionReason && `— ${entry.decisionReason}`}
                </p>
                <p>Fulfilled by: {entry.fulfilledByName || "Not fulfilled"}</p>
                <Typography.Text strong>Request history</Typography.Text>
                <ol>
                  {requestHistory(entry).map((event, index) => (
                    <li key={index}>
                      {event.status} — {event.performedByName || "Unknown"} — {formatDate(event.at)}
                      {event.reason && ` — ${event.reason}`}
                    </li>
                  ))}
                </ol>
              </div>
            ),
          }}
          columns={[
            {
              title: "Requested",
              render: (_, entry) =>
                new Date(entry.createdAt).toLocaleString("en-PH", {
                  timeZone: "Asia/Manila",
                }),
            },
            { title: "Request ID", render: (_, entry) => <Typography.Text copyable>{requestNumber(entry)}</Typography.Text> },
            {
              title: "Item",
              render: (_, entry) => `${entry.sku} — ${entry.itemName}`,
            },
            {
              title: "Type / Category",
              render: (_, entry) => (
                <div className="table-type-cat">
                  <span className="table-type-label">{entry.itemType || "—"}</span>
                  <span className="table-cat-label">{entry.category || ""}</span>
                </div>
              ),
            },
            { title: "Brand", dataIndex: "brand", render: (value) => value || "—" },
            {
              title: "Quantity",
              render: (_, entry) =>
                `${entry.quantityNeeded} ${entry.unitOfMeasure}`,
            },
            { title: "Requested by", dataIndex: "requestedByName" },
            { title: "Receiving vehicle", dataIndex: "destinationVanName", render: (value) => value || "Not recorded" },
            {
              title: "Status",
              render: (_, entry) => entry.deletedAt ? <Tag>Deleted ({entry.status.toLowerCase()})</Tag> : (
                <Tag
                  color={
                    {
                      PENDING: "orange",
                      APPROVED: "blue",
                      DENIED: "red",
                      FULFILLED: "green",
                    }[entry.status]
                  }
                >
                  {entry.status}
                </Tag>
              ),
            },
            {
              title: "Actions",
              render: (_, entry) => (
                <Space wrap>
                  {entry.status === "DENIED" && (
                    <Button icon={<EyeOutlined />} aria-label={`View denied request ${requestNumber(entry)}`}
                      title="View request details and denial reason" onClick={() => setViewing(entry)} />
                  )}
                {(canManage || (user.role === "EMPLOYEE" && ownsRequest(entry) && entry.status === "PENDING")) && !entry.deletedAt && (
                  <Space wrap>
                    <Button danger disabled={busy} onClick={() => { setError(""); setDeleting(entry); }}>Delete</Button>
                    {canManage && entry.status === "PENDING" && (
                      <Button
                        disabled={busy}
                        onClick={() => transition(entry, "APPROVED")}
                      >
                        Approve
                      </Button>
                    )}
                    {canManage && ["PENDING", "APPROVED"].includes(entry.status) && (
                      <Button
                        disabled={busy}
                        danger
                        onClick={() => {
                          setDenying(entry);
                          setDecisionReason("");
                        }}
                      >
                        Deny
                      </Button>
                    )}
                    {canManage && entry.status === "APPROVED" && (
                      <Popconfirm
                        title="Transfer these materials to the technician's vehicle?"
                        description={entry.destinationVanName ? `Receiving vehicle: ${entry.destinationVanName}` : "The technician must have an assigned vehicle."}
                        onConfirm={() => transition(entry, "FULFILLED")}
                      >
                        <Button type="primary" disabled={busy}>
                          Fulfill
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                )}
                </Space>
              ),
            },
          ]}
        />
        <Checkbox checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} style={{ marginTop: 16 }}>
          Show deleted requests
        </Checkbox>
      </Card>
      <Modal title="Denied request details" open={Boolean(viewing)} onCancel={() => setViewing(null)}
        footer={<Button onClick={() => setViewing(null)}>Close</Button>}>
        {viewing && (
          <>
            <Descriptions column={1} size="small" bordered items={[
              { key: "id", label: "Request ID", children: requestNumber(viewing) },
              { key: "status", label: "Status", children: <Tag color="red">DENIED</Tag> },
              { key: "item", label: "Item", children: viewing.itemName },
              { key: "sku", label: "SKU", children: viewing.sku },
              { key: "type", label: "Type / Category", children: [viewing.itemType, viewing.category].filter(Boolean).join(" / ") || "Not specified" },
              { key: "brand", label: "Brand", children: viewing.brand || "Not specified" },
              { key: "quantity", label: "Quantity", children: `${viewing.quantityNeeded} ${viewing.unitOfMeasure}` },
              { key: "requester", label: "Requested by", children: viewing.requestedByName },
              { key: "requested", label: "Requested at", children: formatDate(viewing.createdAt) },
              { key: "notes", label: "Notes", children: <span style={{ whiteSpace: "pre-wrap" }}>{viewing.notes || "None"}</span> },
              { key: "reviewer", label: "Denied by", children: viewing.reviewedByName || "Not recorded" },
              { key: "reviewed", label: "Denied at", children: viewing.reviewedAt ? formatDate(viewing.reviewedAt) : "Not recorded" },
            ]} />
            <Typography.Title level={5}>Denial reason</Typography.Title>
            <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>
              {viewing.decisionReason || "No denial reason recorded."}
            </Typography.Paragraph>
          </>
        )}
      </Modal>
      <Modal title="Delete Material Request" open={Boolean(deleting)} onOk={deleteRequest}
        onCancel={() => !busy && setDeleting(null)} okText="Delete Request"
        okButtonProps={{ danger: true }} cancelButtonProps={{ disabled: busy }} confirmLoading={busy} closable={!busy} maskClosable={!busy}>
        <Typography.Paragraph>Delete {deleting ? requestNumber(deleting) : ""} from the request list? Stock balances and ledger entries will stay unchanged. Its history remains available under Show deleted requests.</Typography.Paragraph>
        {error && <Alert type="error" showIcon title={error} />}
      </Modal>
      <Modal
        title={
          <div className="material-request-heading">
            <span className="material-request-heading-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="m4 7.5 8 4.5 8-4.5M12 12v9M8 5.25l8 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h2>New material request</h2>
              <p>Choose the materials you need for your assigned vehicle.</p>
            </div>
          </div>
        }
        className={`material-request-modal${isDark ? " material-request-modal-dark" : ""}`}
        width={720}
        centered
        open={user.role === "EMPLOYEE" && open}
        onCancel={() => !busy && setOpen(false)}
        closable={!busy}
        maskClosable={!busy}
        footer={null}
      >
        <form className="material-request-form" onSubmit={submit}>
          <div className="material-request-content">
            {error && <Alert type="error" showIcon title={error} className="material-request-error" />}
            <div className="material-request-summary">
              <div className="material-request-reference">
                <span className="material-request-caption">Request ID</span>
                <strong>{formatRequestNumber(reference?.requestNumber) || "Pending"}</strong>
              </div>
              <div className="material-request-vehicle">
                <span className="material-request-caption">Receiving vehicle</span>
                <strong>{assignedVan?.name || "No vehicle assigned"}</strong>
                {assignedVan?.plateNumber && <span className="material-request-plate">{assignedVan.plateNumber}</span>}
              </div>
            </div>
            <h3 className="material-request-section-title">Material details</h3>
            <div className="material-request-grid">
              <label className="material-request-field" htmlFor="request-item-type">
                Item Type
                <Select
                  id="request-item-type"
                  classNames={{ popup: { root: isDark ? "material-request-popup-dark" : "" } }}
                  aria-label="Request item type"
                  size="large"
                  disabled={busy}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select item type"
                  value={itemType || undefined}
                  onChange={(value) => {
                    setItemType(value);
                    setBrand("");
                    setProductId("");
                    setQuantity(1);
                  }}
                  options={itemTypes.map((value) => ({ value, label: value }))}
                />
              </label>
              <label className="material-request-field" htmlFor="request-brand">
                Brand
                <Select
                  id="request-brand"
                  classNames={{ popup: { root: isDark ? "material-request-popup-dark" : "" } }}
                  aria-label="Request brand"
                  size="large"
                  showSearch
                  optionFilterProp="label"
                  placeholder={itemType ? "Select brand" : "Select item type first"}
                  disabled={!itemType || busy}
                  value={brand || undefined}
                  onChange={(value) => {
                    setBrand(value);
                    setProductId("");
                    setQuantity(1);
                  }}
                  options={brands.map((value) => ({ value, label: value }))}
                />
              </label>
              <label className="material-request-field material-request-full-width" htmlFor="request-item">
                Item
                <Select
                  id="request-item"
                  classNames={{ popup: { root: isDark ? "material-request-popup-dark" : "" } }}
                  aria-label="Request item"
                  size="large"
                  showSearch
                  optionFilterProp="label"
                  placeholder={itemType && brand ? "Select item" : "Select item type and brand first"}
                  disabled={!itemType || !brand || busy}
                  notFoundContent="No matching items"
                  value={selectedItem?.id}
                  onChange={(value) => {
                    setProductId(value);
                    setQuantity(1);
                  }}
                  options={filteredItems.map((item) => ({
                    value: item.id,
                    label: `${item.name} — ${item.sku} (${item.unitOfMeasure})`,
                  }))}
                />
              </label>
              <label className="material-request-field" htmlFor="request-quantity">
                Quantity {selectedItem ? `(${selectedItem.unitOfMeasure})` : ""}
                <InventoryNumberInput
                  required
                  id="request-quantity"
                  aria-label="Request quantity"
                  size="large"
                  disabled={!selectedItem || busy}
                  min={isContinuousUnit(selectedItem?.unitOfMeasure) ? 0.001 : 1}
                  step={isContinuousUnit(selectedItem?.unitOfMeasure) ? 0.1 : 1}
                  precision={isContinuousUnit(selectedItem?.unitOfMeasure) ? 3 : 0}
                  value={quantity}
                  onChange={setQuantity}
                  style={{ width: "100%" }}
                />
              </label>
              <div className="material-request-availability" aria-live="polite">
                <span className="material-request-caption">Available at warehouse</span>
                <strong>{selectedItem ? `${selectedItem.quantity} ${selectedItem.unitOfMeasure}` : "Select an item to view stock"}</strong>
              </div>
              <label className="material-request-field material-request-full-width" htmlFor="request-notes">
                <span>Notes <span className="material-request-optional">(optional)</span></span>
                <Input.TextArea
                  id="request-notes"
                  aria-label="Request notes"
                  rows={3}
                  disabled={busy}
                  placeholder="e.g. Materials for an AC installation at the client's site"
                  maxLength={200}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <span className="material-request-notes-count">{notes.length}/200 characters</span>
              </label>
            </div>
          </div>
          <div className="material-request-actions">
            <Button size="large" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              size="large"
              htmlType="submit"
              aria-label="Submit request"
              type="primary"
              loading={busy}
              disabled={!selectedItem || !reference || !assignedVan || !quantity || quantity <= 0}
            >
              Submit request
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        title="Reason for denial"
        open={Boolean(denying)}
        onCancel={() => !busy && setDenying(null)}
        onOk={() => transition(denying, "DENIED")}
        confirmLoading={busy}
        okButtonProps={{ disabled: !decisionReason.trim() }}
      >
        {error && <Alert type="error" title={error} />}
        <Input.TextArea
          value={decisionReason}
          maxLength={200}
          onChange={(e) => setDecisionReason(e.target.value)}
        />
      </Modal>
    </>
  );
}
