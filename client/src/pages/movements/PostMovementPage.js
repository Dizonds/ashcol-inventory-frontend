import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Modal,
  Descriptions,
  Typography,
} from "antd";
import { api, errorMessage } from "../../api";
import { formatMovementNumber } from "../../utils/formatters";
import InventoryNumberInput from "../../components/common/InventoryNumberInput";
import "./PostMovementPage.css";

const isContinuousUnit = (unit) =>
  ["METER", "FOOT", "KG", "LITER"].includes(unit);

export default function PostMovementPage({
  items = [],
  brands: catalogBrands = [],
  branchId,
  save,
  preselectedItemId,
}) {
  const activeItems = useMemo(
    () => items.filter((item) => !item.archived),
    [items],
  );

  const [productId, setProductId] = useState("");
  const appliedPreselection = useRef(null);
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


  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;


  useEffect(() => {
    let active = true;
    setReferenceId("");
    setTicketLoading(true);
    setError("");
    api("post", "/movement-tickets", { movementType: operation })
      .then(({ data }) => {
        if (active) setReferenceId(data.referenceId);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setTicketLoading(false);
      });
    return () => {
      active = false;
    };
  }, [operation, ticketVersion]);


  useEffect(() => {
    if (!preselectedItemId) appliedPreselection.current = null;
    if (preselectedItemId && appliedPreselection.current !== preselectedItemId) {
      const target = activeItems.find((i) => i.id === preselectedItemId);
      if (target) {
        appliedPreselection.current = preselectedItemId;
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
    return [
      ...new Set([
        "AC Unit", "Material / Part", "Spare Part", "Consumable", "Tool / Equipment",
        ...activeItems.map((item) => item.itemType).filter(Boolean),
      ]),
    ].sort();
  }, [activeItems]);

  const brands = useMemo(() => {
    const list = itemType
      ? activeItems.filter((item) => item.itemType === itemType)
      : activeItems;
    return [
      ...new Set([
        ...catalogBrands.map((entry) => typeof entry === "string" ? entry : entry.name).filter(Boolean),
        ...list.map((item) => item.brand).filter(Boolean),
      ]),
    ].sort();
  }, [activeItems, itemType, catalogBrands]);

  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const matchType = !itemType || item.itemType === itemType;
      const matchBrand = !brand || item.brand === brand;
      return matchType && matchBrand;
    });
  }, [activeItems, itemType, brand]);

  const selected = activeItems.find((item) => item.id === productId);


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

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

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
  function changeOperation(nextOperation) {
    if (busy || reviewOpen || nextOperation === operation) return;
    setOperation(nextOperation);
    setItemType("");
    setBrand("");
    setProductId("");
    setReason(nextOperation === "STOCK_IN"
      ? "Supplier Delivery / Restock"
      : "Client Installation / Site Project");
  }

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
    if (busy || reviewOpen || ticketLoading || !referenceId) return;
    setError("");
    if (!selected || !quantity || quantity <= 0) {
      setError("Select an item and enter a positive quantity.");
      return;
    }
    if (!notes.trim()) {
      setError("Enter a receipt, reference, or explanation.");
      return;
    }
    if (!stockIn && quantity > selected.quantity) {
      setError("The requested quantity exceeds available stock.");
      return;
    }
    setReview({
      item: selected,
      productId,
      branchId,
      quantity: Number(quantity),
      stockIn,
      reason,
      notes,
      referenceId,
    });
    setReviewOpen(true);
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
        <div className="pm-card pm-form-card">
          <h2 className="pm-card-title">Record Inventory Movement</h2>

          <form className="pm-form" onSubmit={submit}>
            <div className="pm-field-group">
              <label className="pm-field-label">Select Operation</label>
              <div
                className="pm-operation-radios"
                role="radiogroup"
                aria-label="Select Operation"
              >
                <label
                  className={`pm-radio-btn ${stockIn ? "active" : ""}`}
                  role="radio"
                  aria-checked={stockIn}
                  tabIndex={0}
                  onClick={() => changeOperation("STOCK_IN")}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      changeOperation("STOCK_IN");
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="operation"
                    value="STOCK_IN"
                    aria-label="Stock In"
                    checked={stockIn}
                    onChange={() => {}}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
                  />
                  <div className="pm-radio-circle">
                    {stockIn && <div className="pm-radio-dot" />}
                  </div>
                  <span>Stock In</span>
                </label>

                <label
                  className={`pm-radio-btn ${!stockIn ? "active" : ""}`}
                  role="radio"
                  aria-checked={!stockIn}
                  tabIndex={0}
                  onClick={() => changeOperation("STOCK_OUT")}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      changeOperation("STOCK_OUT");
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="operation"
                    value="STOCK_OUT"
                    aria-label="Stock Out"
                    checked={!stockIn}
                    onChange={() => {}}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
                  />
                  <div className="pm-radio-circle">
                    {!stockIn && <div className="pm-radio-dot" />}
                  </div>
                  <span>Stock Out</span>
                </label>
              </div>
            </div>

            <div className="pm-field-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="pm-field-label" htmlFor="pm-transaction-id">
                  Transaction ID
                </label>
                {!ticketLoading && !referenceId && (
                  <button
                    type="button"
                    className="pm-btn-retry"
                    onClick={() => setTicketVersion((v) => v + 1)}
                  >
                    Retry transaction ID
                  </button>
                )}
              </div>
              <div className="pm-input-wrap">
                <input
                  id="pm-transaction-id"
                  aria-label="Transaction ID"
                  type="text"
                  readOnly
                  className="pm-input-readonly"
                  value={formatMovementNumber(referenceId) || ""}
                  placeholder={
                    ticketLoading
                      ? "Generating transaction ID..."
                      : "Transaction ID unavailable"
                  }
                />
              </div>
            </div>

            <div className="pm-form-row-2col">
              <div className="pm-field-group">
                <label className="pm-field-label" htmlFor="pm-type">
                  Type
                </label>
                <div className="pm-select-wrap">
                  <select
                    id="pm-type"
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

              <div className="pm-field-group">
                <label className="pm-field-label" htmlFor="pm-brand">
                  Brand
                </label>
                <div className="pm-select-wrap">
                  <select
                    id="pm-brand"
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

            <div className="pm-form-row-2col">
              <div className="pm-field-group">
                <label className="pm-field-label" htmlFor="pm-item">
                  Item
                </label>
                <div className="pm-select-wrap">
                  <select
                    id="pm-item"
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

              <div className="pm-field-group">
                <label className="pm-field-label" htmlFor="pm-quantity">
                  Quantity {selected ? `(${selected.unitOfMeasure})` : ""}
                </label>
                <div className="pm-input-wrap">
                  <InventoryNumberInput
                    id="pm-quantity"
                    aria-label="Quantity"
                    required
                    className="pm-input-number"
                    placeholder="Select Quantity"
                    disabled={busy || reviewOpen}
                    min={isContinuousUnit(selected?.unitOfMeasure) ? 0.001 : 1}
                    step={isContinuousUnit(selected?.unitOfMeasure) ? 0.001 : 1}
                    precision={isContinuousUnit(selected?.unitOfMeasure) ? 3 : 0}
                    value={quantity}
                    onChange={setQuantity}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>

            <div className="pm-field-group">
              <label className="pm-field-label" htmlFor="pm-reason">
                Select a Reason
              </label>
              <div className="pm-select-wrap">
                <select
                  id="pm-reason"
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

            <div className="pm-field-group">
              <label className="pm-field-label" htmlFor="pm-notes">
                Receipt, transfer reference, or explanation
              </label>
              <textarea
                id="pm-notes"
                aria-label="Receipt, transfer reference, or explanation"
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

            <button
              type="submit"
              className="pm-btn-confirm"
              aria-label="Confirm & Post"
              disabled={
                busy ||
                !selected ||
                quantity <= 0 ||
                reviewOpen ||
                ticketLoading ||
                !referenceId
              }
            >
              {busy ? "Processing..." : "Confirm and Post"}
            </button>
          </form>
        </div>

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
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#6b7280",
                        }}
                      >
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
                          <td className="pm-td-item">
                            <div>{item.name}</div>
                            <div className="pm-td-sku-sub">{item.sku}</div>
                          </td>

                          <td>{item.brand || "N/A"}</td>

                          <td className="pm-td-qty">
                            {item.quantity} {item.unitOfMeasure}
                          </td>

                          <td>
                            {item.reorderLevel} {item.unitOfMeasure}
                          </td>

                          <td>
                            <div className="pm-action-cell">
                              <button
                                type="button"
                                className="pm-btn-restock"
                                disabled={busy || reviewOpen}
                                onClick={() => selectRestockItem(item)}
                              >
                                Restock
                              </button>

                              {isDepleted ? (
                                <span className="pm-badge-reorder">REORDER</span>
                              ) : (
                                <span className="pm-badge-low-stock">
                                  LOW STOCK
                                </span>
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

          <div className="pm-pagination-bar">
            <span className="pm-pagination-text">
              Showing{" "}
              {lowStockItems.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}{" "}
              to {Math.min(currentPage * pageSize, lowStockItems.length)} of{" "}
              {lowStockItems.length} entries
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
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
        okButtonProps={{ disabled: !review, "aria-label": "Yes, Confirm & Post" }}
        cancelButtonProps={{ disabled: busy }}
        closable={!busy}
      >
        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            style={{ marginBottom: 12 }}
          />
        )}
        <Typography.Paragraph>
          Are these details correct? Please review them before posting this stock
          movement.
        </Typography.Paragraph>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Transaction ID">
            <Typography.Text copyable>
              {formatMovementNumber(review?.referenceId) || ""}
            </Typography.Text>
            { }
            <span style={{ display: "none" }}>{review?.referenceId}</span>
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
          <Descriptions.Item label="Brand">
            {review?.item.brand || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Quantity">
            {review?.quantity} {review?.item.unitOfMeasure || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Reason">
            {review?.reason}
          </Descriptions.Item>
          <Descriptions.Item label="Explanation / reference">
            {review?.notes || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Projected balance">
            {review
              ? `${
                  Math.round(
                    (review.item.quantity +
                      (review.stockIn ? review.quantity : -review.quantity)) *
                      1000,
                  ) / 1000
                } ${review.item.unitOfMeasure}`
              : "—"}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
}
