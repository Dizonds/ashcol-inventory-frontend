import React, { useState } from "react";
import {
  Card,
  Input,
  InputNumber,
  Select,
  Button,
  Alert,
  Typography,
  Radio,
  Statistic,
  Space,
  Modal,
  Descriptions,
  Table,
  Tag,
} from "antd";
import { api, errorMessage } from "../api";

const isContinuousUnit = (unit) =>
  ["METER", "FOOT", "KG", "LITER"].includes(unit);

export default function PostMovementPage({
  items,
  branchId,
  save,
  preselectedItemId,
}) {
  const preselected = items.find((item) => item.id === preselectedItemId && !item.archived);
  const [productId, setProductId] = useState(preselected?.id || "");
  const [itemType, setItemType] = useState(preselected?.itemType || "");
  const [brand, setBrand] = useState(preselected?.brand || "");
  const [operation, setOperation] = useState("STOCK_IN");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Supplier Delivery / Restock");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [review, setReview] = useState(null);
  const activeItems = items.filter((item) => !item.archived);
  const itemTypes = [...new Set(activeItems.map((item) => item.itemType).filter(Boolean))].sort();
  const brands = [...new Set(activeItems.filter((item) => item.itemType === itemType)
    .map((item) => item.brand).filter(Boolean))].sort();
  const filteredItems = itemType && brand
    ? activeItems.filter((item) => item.itemType === itemType && item.brand === brand)
    : [];
  const selected = filteredItems.find((item) => item.id === productId);
  const lowStockItems = activeItems
    .filter((item) => item.quantity === 0 || item.quantity <= item.reorderLevel)
    .sort((first, second) => {
      const firstRatio = first.quantity / Math.max(first.reorderLevel, 1);
      const secondRatio = second.quantity / Math.max(second.reorderLevel, 1);
      return firstRatio - secondRatio || first.name.localeCompare(second.name);
    });
  const depletedCount = lowStockItems.filter((item) => item.quantity === 0).length;

  function selectRestockItem(item) {
    if (busy || reviewOpen) return;
    setItemType(item.itemType);
    setBrand(item.brand);
    setProductId(item.id);
    setOperation("STOCK_IN");
    setReason("Supplier Delivery / Restock");
    setQuantity(1);
    setNotes("");
    setError("");
  }
  const stockIn = operation === "STOCK_IN";
  const reasons = stockIn
    ? [
        "Supplier Delivery / Restock",
        "Unused Material Return",
        "Defective / RMA Replacement Return",
        "Audit Correction (Surplus)",
      ]
    : [
        "Client Installation / Site Project",
        "Parts Sale",
        "Damaged / Defective Write-off",
        "Audit Correction (Shortage)",
      ];
  function submit(event) {
    event.preventDefault();
    if (busy || reviewOpen) return;
    setError("");
    if (!selected || !quantity || quantity <= 0) {
      setError("Select an item and enter a positive quantity.");
      return;
    }
    if (!stockIn && quantity > selected.quantity) {
      setError("The requested quantity exceeds available stock.");
      return;
    }
    const draft = { item: selected, productId, branchId, quantity: Number(quantity), stockIn, reason, notes };
    setBusy(true);
    api("post", "/movement-tickets", { movementType: operation })
      .then(({ data }) => {
        setReview({ ...draft, referenceId: data.referenceId });
        setReviewOpen(true);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  }

  function confirmPost() {
    if (busy || !review) return;
    setBusy(true);
    setError("");
    const path = `/products/${review.productId}/stock`;
    const data = {
      branchId: review.branchId,
      delta: review.stockIn ? review.quantity : -review.quantity,
      reason: review.reason,
      notes: review.notes,
      referenceId: review.referenceId,
    };
    save(
      "patch",
      path,
      data,
      `Stock movement ${review.referenceId} recorded.`,
    )
      .then(() => {
        setProductId("");
        setItemType("");
        setBrand("");
        setQuantity(1);
        setNotes("");
        setReviewOpen(false);
        setReview(null);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  }
  return (
    <>
      <Typography.Title level={3}>Post Stock Movement</Typography.Title>
      <Typography.Paragraph type="secondary">
        Record deliveries, returns, dispatches and explained stock corrections.
        Use Material Requests to issue an approved request.
      </Typography.Paragraph>
      <div className="post-movement-layout">
      <Card
        className="post-movement-card"
        title={
          <div className="post-movement-card-title">
            <span className="post-movement-card-icon">↕</span>
            <span>
              <strong>Record inventory movement</strong>
              <small>Update warehouse stock with a clear reason and reference.</small>
            </span>
          </div>
        }
      >
        {error && !reviewOpen && <Alert type="error" showIcon title={error} />}
        <form className="post-movement-form" onSubmit={submit}>
          <label className="field">
            Operation
            <Radio.Group
              disabled={busy || reviewOpen}
              value={operation}
              onChange={(e) => {
                const value = e.target.value;
                setOperation(value);
                setReason(
                  value === "STOCK_IN"
                    ? "Supplier Delivery / Restock"
                    : "Client Installation / Site Project",
                );
              }}
              options={[
                { label: "Stock In", value: "STOCK_IN" },
                { label: "Stock Out", value: "STOCK_OUT" },
              ]}
            />
          </label>
          <label className="field">
            Item Type
            <Select
              aria-label="Movement item type"
              showSearch
              optionFilterProp="label"
              placeholder="Select item type"
              disabled={busy || reviewOpen}
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
              aria-label="Movement brand"
              showSearch
              optionFilterProp="label"
              placeholder={itemType ? "Select brand" : "Select item type first"}
              disabled={!itemType || busy || reviewOpen}
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
            Inventory item
            <Select
              aria-label="Movement item"
              showSearch
              optionFilterProp="label"
              disabled={!itemType || !brand || busy || reviewOpen}
              value={selected?.id}
              placeholder={itemType && brand ? "Select item" : "Select item type and brand first"}
              notFoundContent="No matching items"
              onChange={(value) => {
                setProductId(value);
                setQuantity(1);
              }}
              options={filteredItems.map((item) => ({
                value: item.id,
                label: `${item.name} — ${item.sku} (${item.quantity} ${item.unitOfMeasure})`,
              }))}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              Quantity {selected ? `(${selected.unitOfMeasure})` : ""}
              <InputNumber
                disabled={busy || reviewOpen}
                min={isContinuousUnit(selected?.unitOfMeasure) ? 0.001 : 1}
                step={isContinuousUnit(selected?.unitOfMeasure) ? 0.1 : 1}
                precision={isContinuousUnit(selected?.unitOfMeasure) ? 3 : 0}
                value={quantity}
                onChange={setQuantity}
                style={{ width: "100%" }}
              />
            </label>
            <label className="field">
                Reason
                <Select
                  disabled={busy || reviewOpen}
                  value={reason}
                  onChange={setReason}
                  options={reasons.map((value) => ({ value, label: value }))}
                />
            </label>
          </div>
          <label className="field">
            Receipt, transfer reference, or explanation
            <Input.TextArea
              disabled={busy || reviewOpen}
              required
              rows={3}
              maxLength={200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          {selected && (
            <Space className="post-movement-stock-preview" size="large" wrap>
              <Statistic
                title="Available"
                value={selected.quantity}
                suffix={selected.unitOfMeasure}
              />
              <Statistic
                title="Projected source balance"
                value={
                  Math.round(
                    (selected.quantity +
                      (stockIn ? Number(quantity) : -Number(quantity))) *
                      1000,
                  ) / 1000
                }
                suffix={selected.unitOfMeasure}
              />
            </Space>
          )}
          <div className="post-movement-submit-row">
            <Button type="primary" htmlType="submit" loading={busy} disabled={!selected || reviewOpen}>
              Confirm & Post
            </Button>
          </div>
        </form>
      </Card>
      <Card
        className="post-movement-low-stock-card"
        title={
          <div className="post-movement-card-title">
            <span className="post-movement-card-icon post-movement-stock-alert-icon">!</span>
            <span>
              <strong>Low stock & depleted items</strong>
              <small>Warehouse items at or below their reorder level.</small>
            </span>
          </div>
        }
      >
        <Space wrap className="post-movement-stock-alert-summary">
          <Tag color="red">{depletedCount} depleted</Tag>
          <Tag color="orange">{lowStockItems.length - depletedCount} low stock</Tag>
        </Space>
        <Typography.Paragraph type="secondary">
          Select Restock to fill the movement form for an item.
        </Typography.Paragraph>
        <Table
          size="small"
          rowKey="id"
          dataSource={lowStockItems}
          scroll={{ x: 520 }}
          pagination={{ defaultPageSize: 6, hideOnSinglePage: true, showSizeChanger: false }}
          locale={{ emptyText: "No low-stock or depleted items." }}
          rowClassName={(item) => item.id === productId ? "post-movement-low-stock-selected" : ""}
          columns={[
            {
              title: "Item",
              width: 160,
              render: (_, item) => (
                <div>
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <Typography.Text type="secondary" className="post-movement-low-stock-sku">{item.sku}</Typography.Text>
                </div>
              ),
            },
            { title: "Brand", dataIndex: "brand", width: 85 },
            {
              title: "Available",
              width: 105,
              render: (_, item) => (
                <div className="post-movement-low-stock-quantity">
                  <strong>{item.quantity} {item.unitOfMeasure}</strong>
                  <Tag color={item.quantity === 0 ? "red" : "orange"}>
                    {item.quantity === 0 ? "Depleted" : "Low stock"}
                  </Tag>
                </div>
              ),
            },
            {
              title: "Reorder level",
              width: 90,
              render: (_, item) => `${item.reorderLevel} ${item.unitOfMeasure}`,
            },
            {
              title: "Action",
              width: 80,
              render: (_, item) => (
                <Button size="small" disabled={busy || reviewOpen} onClick={() => selectRestockItem(item)}>
                  Restock
                </Button>
              ),
            },
          ]}
        />
      </Card>
      </div>
      <Modal
        title="Review Stock Movement"
        open={reviewOpen}
        onCancel={() => {
          if (!busy) {
            setReviewOpen(false);
            setReview(null);
          }
        }}
        onOk={confirmPost}
        okText="Yes, Confirm & Post"
        confirmLoading={busy}
        okButtonProps={{ disabled: !review }}
        cancelButtonProps={{ disabled: busy }}
        closable={!busy}
        maskClosable={!busy}
      >
        {error && <Alert type="error" showIcon title={error} />}
        <Typography.Paragraph>
          Are these details correct? Please review them before posting this stock movement.
        </Typography.Paragraph>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Ticket ID">
            <Typography.Text copyable>{review?.referenceId || ""}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Operation">
            {review?.stockIn ? "Stock In" : "Stock Out"}
          </Descriptions.Item>
          <Descriptions.Item label="Inventory item">
            {review ? `${review.item.sku} — ${review.item.name}` : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Type / Category">
            {review ? `${review.item.itemType} / ${review.item.category}` : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Brand">{review?.item.brand || "—"}</Descriptions.Item>
          <Descriptions.Item label="Quantity">
            {review?.quantity} {review?.item.unitOfMeasure || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Reason">{review?.reason}</Descriptions.Item>
          <Descriptions.Item label="Explanation / reference">{review?.notes || "—"}</Descriptions.Item>
          <Descriptions.Item label="Projected balance">
            {review
              ? `${Math.round((review.item.quantity + (review.stockIn ? review.quantity : -review.quantity)) * 1000) / 1000} ${review.item.unitOfMeasure}`
              : "—"}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
}
