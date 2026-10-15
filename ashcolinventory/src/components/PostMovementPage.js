import React, { useState, useEffect, useMemo } from "react";
import {
  Alert,
  Modal,
  Descriptions,
  Typography,
} from "antd";
import { api, errorMessage } from "../api";
import "./PostMovementPage.css";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [review, setReview] = useState(null);

  // Pagination for Low stock & depleted items
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Handle preselected item from props
  useEffect(() => {
    if (preselectedItemId) {
      const target = activeItems.find((i) => i.id === preselectedItemId);
      if (target) {
        setItemType(target.itemType || "");
        setBrand(target.brand || "");
        setProductId(target.id);
        setOperation("STOCK_IN");
        setReason("Supplier Delivery / Restock");
        setQuantity(1);
      }
    }
  }, [preselectedItemId, activeItems]);

  const itemTypes = useMemo(() => {
    return [...new Set(activeItems.map((item) => item.itemType).filter(Boolean))].sort();
  }, [activeItems]);

  const brands = useMemo(() => {
    const list = itemType
      ? activeItems.filter((item) => item.itemType === itemType)
      : activeItems;
    return [...new Set(list.map((item) => item.brand).filter(Boolean))].sort();
  }, [activeItems, itemType]);

  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const matchType = !itemType || item.itemType === itemType;
      const matchBrand = !brand || item.brand === brand;
      return matchType && matchBrand;
    });
  }, [activeItems, itemType, brand]);

  const selected = activeItems.find((item) => item.id === productId);

  // Low stock & depleted items list
  const lowStockItems = useMemo(() => {
    return activeItems
      .filter((item) => item.quantity === 0 || item.quantity <= item.reorderLevel)
      .sort((a, b) => {
        const aRatio = a.quantity / Math.max(a.reorderLevel, 1);
        const bRatio = b.quantity / Math.max(b.reorderLevel, 1);
        return aRatio - bRatio || a.name.localeCompare(b.name);
      });
  }, [activeItems]);

  const totalPages = Math.ceil((lowStockItems.length || 1) / pageSize);
  const pagedLowStockItems = lowStockItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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
    const draft = {
      item: selected,
      productId,
      branchId,
      quantity: Number(quantity),
      stockIn,
      reason,
      notes,
    };
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
    <div className="pm-container">
      {error && !reviewOpen && (
        <Alert
          type="error"
          showIcon
          message={error}
          closable
          onClose={() => setError("")}
          style={{ marginBottom: 8 }}
        />
      )}

      <div className="pm-layout">
        {/* ── LEFT CARD: RECORD INVENTORY MOVEMENT (Figma Node 570:9055) ── */}
        <div className="pm-card pm-form-card">
          <h2 className="pm-card-title">Record Inventory Movement</h2>

          <form className="pm-form" onSubmit={submit}>
            {/* Select Operation (Figma Node 571:9354) */}
            <div className="pm-field-group">
              <label className="pm-field-label">Select Operation</label>
              <div className="pm-operation-radios">
                {/* Stock In */}
                <div
                  className={`pm-radio-btn ${stockIn ? "active" : ""}`}
                  onClick={() => {
                    if (busy || reviewOpen) return;
                    setOperation("STOCK_IN");
                    setReason("Supplier Delivery / Restock");
                  }}
                >
                  <div className="pm-radio-circle">
                    {stockIn && <div className="pm-radio-dot" />}
                  </div>
                  <span>Stock In</span>
                </div>

                {/* Stock Out */}
                <div
                  className={`pm-radio-btn ${!stockIn ? "active" : ""}`}
                  onClick={() => {
                    if (busy || reviewOpen) return;
                    setOperation("STOCK_OUT");
                    setReason("Client Installation / Site Project");
                  }}
                >
                  <div className="pm-radio-circle">
                    {!stockIn && <div className="pm-radio-dot" />}
                  </div>
                  <span>Stock Out</span>
                </div>
              </div>
            </div>

            {/* Row: Type & Brand (Figma Node 573:9504) */}
            <div className="pm-form-row-2col">
              {/* Type */}
              <div className="pm-field-group">
                <label className="pm-field-label">Type</label>
                <div className="pm-select-wrap">
                  <select
                    className="pm-select"
                    value={itemType}
                    disabled={busy || reviewOpen}
                    onChange={(e) => {
                      setItemType(e.target.value);
                      setBrand("");
                      setProductId("");
                    }}
                    aria-label="Select an Item Type"
                  >
                    <option value="">Select an Item Type</option>
                    {itemTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <span className="pm-select-arrow">▼</span>
                </div>
              </div>

              {/* Brand */}
              <div className="pm-field-group">
                <label className="pm-field-label">Brand</label>
                <div className="pm-select-wrap">
                  <select
                    className="pm-select"
                    value={brand}
                    disabled={busy || reviewOpen}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      setProductId("");
                    }}
                    aria-label="Select a Brand"
                  >
                    <option value="">Select a Brand</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <span className="pm-select-arrow">▼</span>
                </div>
              </div>
            </div>

            {/* Row: Item & Quantity (Figma Node 571:9383) */}
            <div className="pm-form-row-2col">
              {/* Item */}
              <div className="pm-field-group">
                <label className="pm-field-label">Item</label>
                <div className="pm-select-wrap">
                  <select
                    className="pm-select"
                    value={productId}
                    disabled={busy || reviewOpen}
                    onChange={(e) => {
                      const id = e.target.value;
                      setProductId(id);
                      const itm = activeItems.find((i) => i.id === id);
                      if (itm) {
                        if (!itemType) setItemType(itm.itemType || "");
                        if (!brand) setBrand(itm.brand || "");
                      }
                    }}
                    aria-label="Select an Item"
                  >
                    <option value="">Select an Item</option>
                    {filteredItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.quantity} {item.unitOfMeasure})
                      </option>
                    ))}
                  </select>
                  <span className="pm-select-arrow">▼</span>
                </div>
              </div>

              {/* Quantity */}
              <div className="pm-field-group">
                <label className="pm-field-label">
                  Quantity {selected ? `(${selected.unitOfMeasure})` : ""}
                </label>
                <div className="pm-input-wrap">
                  <input
                    type="number"
                    className="pm-input-number"
                    placeholder="Select Quantity"
                    disabled={busy || reviewOpen}
                    min={isContinuousUnit(selected?.unitOfMeasure) ? 0.001 : 1}
                    step={isContinuousUnit(selected?.unitOfMeasure) ? 0.1 : 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Select a Reason (Figma Node 571:9367) */}
            <div className="pm-field-group">
              <label className="pm-field-label">Select a Reason</label>
              <div className="pm-select-wrap">
                <select
                  className="pm-select"
                  value={reason}
                  disabled={busy || reviewOpen}
                  onChange={(e) => setReason(e.target.value)}
                  aria-label="Select a Reason"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <span className="pm-select-arrow">▼</span>
              </div>
            </div>

            {/* Receipt, transfer reference, or explanation (Figma Node 571:9411) */}
            <div className="pm-field-group">
              <label className="pm-field-label">
                Receipt, transfer reference, or explanation
              </label>
              <textarea
                className="pm-textarea"
                placeholder="Write notes in here..."
                required
                rows={3}
                maxLength={200}
                value={notes}
                disabled={busy || reviewOpen}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Stock Balance Preview */}
            {selected && (
              <div className="pm-stock-preview">
                <span>
                  Available: <strong>{selected.quantity} {selected.unitOfMeasure}</strong>
                </span>
                <span>
                  Projected balance:{" "}
                  <strong>
                    {Math.round(
                      (selected.quantity +
                        (stockIn ? Number(quantity) : -Number(quantity))) *
                        1000,
                    ) / 1000}{" "}
                    {selected.unitOfMeasure}
                  </strong>
                </span>
              </div>
            )}

            {/* Confirm and Post Button (Figma Node 573:10183) */}
            <button
              type="submit"
              className="pm-btn-confirm"
              disabled={busy || !selected || quantity <= 0 || reviewOpen}
            >
              {busy ? "Processing..." : "Confirm and Post"}
            </button>
          </form>
        </div>

        {/* ── RIGHT CARD: LOW STOCK & DEPLETED ITEMS (Figma Node 573:9585) ── */}
        <div className="pm-card pm-table-card">
          <div>
            <h2 className="pm-card-title" style={{ marginBottom: "20px" }}>
              Low stock &amp; depleted items
            </h2>

            <div className="pm-table-container">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th style={{ width: "32%" }}>ITEM</th>
                    <th style={{ width: "18%" }}>BRAND</th>
                    <th style={{ width: "16%" }}>AVAILABLE</th>
                    <th style={{ width: "16%" }}>REORDER LEVEL</th>
                    <th style={{ width: "18%" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                        No low-stock or depleted items at this warehouse.
                      </td>
                    </tr>
                  ) : (
                    pagedLowStockItems.map((item) => {
                      const isDepleted = item.quantity === 0;
                      const isSelected = item.id === productId;

                      return (
                        <tr
                          key={item.id}
                          className={isSelected ? "pm-row-selected" : ""}
                        >
                          {/* Item Name & SKU */}
                          <td className="pm-td-item">
                            <div>{item.name}</div>
                            <div className="pm-td-sku-sub">{item.sku}</div>
                          </td>

                          {/* Brand */}
                          <td>{item.brand || "N/A"}</td>

                          {/* Available */}
                          <td className="pm-td-qty">
                            {item.quantity} {item.unitOfMeasure}
                          </td>

                          {/* Reorder Level */}
                          <td>
                            {item.reorderLevel} {item.unitOfMeasure}
                          </td>

                          {/* Action */}
                          <td>
                            <div className="pm-action-cell">
                              <button
                                type="button"
                                className="pm-btn-restock"
                                onClick={() => selectRestockItem(item)}
                              >
                                Restock
                              </button>

                              {isDepleted ? (
                                <span className="pm-badge-reorder">REORDER</span>
                              ) : (
                                <span className="pm-badge-low-stock">LOW STOCK</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
          <Descriptions.Item label="Ticket ID">
            <Typography.Text copyable>{review?.referenceId || ""}</Typography.Text>
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
