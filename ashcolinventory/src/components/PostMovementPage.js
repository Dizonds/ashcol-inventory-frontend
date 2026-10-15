import React, { useState } from "react";
import {
  Alert,
  Modal,
  Descriptions,
  Typography,
} from "antd";
import { api, errorMessage } from "../api";

const isContinuousUnit = (unit) =>
  ["METER", "FOOT", "KG", "LITER"].includes(unit);

export default function PostMovementPage({
  items = [],
  branchId,
  save,
  preselectedItemId,
}) {
  const activeItems = useMemo(() => items.filter((item) => !item.archived), [items]);

  const [productId, setProductId] = useState("");
  const [itemType, setItemType] = useState("");
  const [brand, setBrand] = useState("");
  const [operation, setOperation] = useState("STOCK_IN");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Supplier Delivery / Restock");
  const [notes, setNotes] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketVersion, setTicketVersion] = useState(0);
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
    setItemType(item.itemType || "");
    setBrand(item.brand || "");
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
        "Service Van Return",
      ]
    : [
        "Client Installation / Site Project",
        "Parts Sale",
        "Damaged / Defective Write-off",
        "Audit Correction (Shortage)",
        "Service Van Stock Dispatch",
      ];

  function submit(event) {
    event.preventDefault();
    if (busy || reviewOpen || ticketLoading || !referenceId) return;
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
      `Stock movement ${formatMovementNumber(review.referenceId)} recorded.`,
    )
      .then(() => {
        setProductId("");
        setItemType("");
        setBrand("");
        setQuantity(1);
        setNotes("");
        setReferenceId("");
        setTicketVersion((version) => version + 1);
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

          {/* Pagination Bar (Figma Node 573:9772) */}
          <div className="pm-pagination-bar">
            <span className="pm-pagination-text">
              Showing {lowStockItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, lowStockItems.length)} of {lowStockItems.length} entries
            </span>

            <div className="pm-pagination-controls">
              <button
                type="button"
                className="pm-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pm-page-btn ${p === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="pm-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Stock Movement Confirmation Modal */}
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
        {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 12 }} />}
        <Typography.Paragraph>
          Are these details correct? Please review them before posting this stock movement.
        </Typography.Paragraph>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Transaction ID">
            <Typography.Text copyable>{formatMovementNumber(review?.referenceId) || ""}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Operation">
            {review?.stockIn ? "Stock In (+)" : "Stock Out (-)"}
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
    </div>
  );
}
