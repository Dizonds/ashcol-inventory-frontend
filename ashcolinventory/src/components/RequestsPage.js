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
import { errorMessage } from "../api";

const isContinuousUnit = (unit) =>
  ["METER", "FOOT", "KG", "LITER"].includes(unit);

export default function RequestsPage({
  items,
  requests,
  user,
  branchId,
  save,
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [denying, setDenying] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [filter, setFilter] = useState("ALL");
  const selectedItem = items.find((item) => item.id === productId);
  function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    save(
      "post",
      "/requests",
      { branchId, productId, workOrderId, quantityNeeded: quantity, notes },
      "Material request submitted.",
    )
      .then(() => {
        setOpen(false);
        setProductId("");
        setWorkOrderId("");
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
        fulfillment checks availability and deducts it once. Job references are
        entered manually, not verified against the live portal.
      </Typography.Paragraph>
      {error && (
        <Alert type="error" title={error} style={{ marginBottom: 16 }} />
      )}
      <Card
        title="Warehouse requests"
        extra={
          <Button
            type="primary"
            onClick={() => {
              setOpen(true);
              setError("");
            }}
          >
            New Request
          </Button>
        }
      >
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
            (entry) => filter === "ALL" || entry.status === filter,
          )}
          scroll={{ x: 1100 }}
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
            { title: "Job reference", dataIndex: "workOrderId" },
            {
              title: "Item",
              render: (_, entry) => `${entry.sku} — ${entry.itemName}`,
            },
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
        open={open}
        onCancel={() => !busy && setOpen(false)}
        footer={null}
      >
        {error && <Alert type="error" title={error} />}
        <form onSubmit={submit}>
          <label className="field">
            Item
            <Select
              showSearch
              optionFilterProp="label"
              value={productId || undefined}
              onChange={setProductId}
              options={items.map((item) => ({
                value: item.id,
                label: `${item.sku} — ${item.name} (${item.unitOfMeasure})`,
              }))}
            />
          </label>
          <label className="field">
            Job / work-order reference
            <Input
              required
              value={workOrderId}
              maxLength={200}
              onChange={(e) => setWorkOrderId(e.target.value)}
              placeholder="e.g. AC-001"
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
            disabled={!productId}
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
