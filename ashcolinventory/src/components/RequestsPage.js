import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Input,
  InputNumber,
  Select,
  Alert,
  Typography,
  Space,
  Popconfirm,
} from "antd";
import { api, errorMessage } from "../api";

const isContinuousUnit = (unit) =>
  ["METER", "FOOT", "KG", "LITER"].includes(unit);
const requestNumber = (entry) => entry.requestNumber || entry.workOrderId || entry.id;
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
  branchId,
  save,
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
    if (!reference || !selectedItem || busy) return;
    setBusy(true);
    setError("");
    save(
      "post",
      "/requests",
      { branchId, productId, requestId: reference.id, quantityNeeded: quantity, notes },
      `Material request ${reference.requestNumber} submitted.`,
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
        fulfillment checks availability and deducts it once. Search a request ID
        to see its status and history.
      </Typography.Paragraph>
      {error && (
        <Alert type="error" title={error} style={{ marginBottom: 16 }} />
      )}
      <Card
        title="Warehouse requests"
        extra={
          user.role === "EMPLOYEE" && (
            <Button
              type="primary"
              loading={busy}
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
          dataSource={requests.filter(
            (entry) => (filter === "ALL" || entry.status === filter) &&
              [requestNumber(entry), entry.id, entry.workOrderId, entry.sku, entry.itemName, entry.brand, entry.itemType, entry.requestedByName]
                .some((value) => String(value || "").toLowerCase().includes(search.trim().toLowerCase())),
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
            {
              title: "Status",
              render: (_, entry) => (
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
              render: (_, entry) =>
                user.role !== "EMPLOYEE" && (
                  <Space wrap>
                    {entry.status === "PENDING" && (
                      <Button
                        disabled={busy}
                        onClick={() => transition(entry, "APPROVED")}
                      >
                        Approve
                      </Button>
                    )}
                    {["PENDING", "APPROVED"].includes(entry.status) && (
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
                    {entry.status === "APPROVED" && (
                      <Popconfirm
                        title="Issue these materials and deduct stock?"
                        onConfirm={() => transition(entry, "FULFILLED")}
                      >
                        <Button type="primary" disabled={busy}>
                          Fulfill
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                ),
            },
          ]}
        />
      </Card>
      <Modal
        title="New material request"
        open={user.role === "EMPLOYEE" && open}
        onCancel={() => !busy && setOpen(false)}
        footer={null}
      >
        {error && <Alert type="error" title={error} />}
        <form onSubmit={submit}>
          <label className="field">
            Item Type
            <Select
              aria-label="Request item type"
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
          <label className="field">
            Brand
            <Select
              aria-label="Request brand"
              showSearch
              optionFilterProp="label"
              placeholder={itemType ? "Select brand" : "Select item type first"}
              disabled={!itemType}
              value={brand || undefined}
              onChange={(value) => {
                setBrand(value);
                setProductId("");
                setQuantity(1);
              }}
              options={brands.map((value) => ({ value, label: value }))}
            />
          </label>
          <label className="field">
            Item
            <Select
              aria-label="Request item"
              showSearch
              optionFilterProp="label"
              placeholder={itemType && brand ? "Select item" : "Select item type and brand first"}
              disabled={!itemType || !brand}
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
          <label className="field">
            Request ID
            <Input
              readOnly
              value={reference?.requestNumber || ""}
            />
          </label>
          <label className="field">
            Quantity {selectedItem ? `(${selectedItem.unitOfMeasure})` : ""}
            <InputNumber
              min={isContinuousUnit(selectedItem?.unitOfMeasure) ? 0.001 : 1}
              step={isContinuousUnit(selectedItem?.unitOfMeasure) ? 0.1 : 1}
              precision={isContinuousUnit(selectedItem?.unitOfMeasure) ? 3 : 0}
              value={quantity}
              onChange={setQuantity}
              style={{ width: "100%" }}
            />
          </label>
          <label className="field">
            Notes
            <Input.TextArea
              maxLength={200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <Button
            htmlType="submit"
            type="primary"
            loading={busy}
            disabled={!selectedItem || !reference}
          >
            Submit request
          </Button>
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
