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
} from "antd";
import { errorMessage } from "../api";

const isContinuousUnit = (unit) =>
  ["METER", "FOOT", "KG", "LITER"].includes(unit);

export default function PostMovementPage({
  items,
  branchId,
  save,
  preselectedItemId,
}) {
  const [productId, setProductId] = useState(preselectedItemId || "");
  const [operation, setOperation] = useState("STOCK_IN");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Supplier Delivery / Restock");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = items.filter((item) => item.id === productId)[0];
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
    setError("");
    if (!selected || !quantity || quantity <= 0) {
      setError("Select an item and enter a positive quantity.");
      return;
    }
    if (!stockIn && quantity > selected.quantity) {
      setError("The requested quantity exceeds available stock.");
      return;
    }
    setBusy(true);
    const path = `/products/${productId}/stock`;
    const data = { branchId, delta: stockIn ? quantity : -quantity, reason, notes };
    save(
      "patch",
      path,
      data,
      "Stock movement recorded.",
    )
      .then(() => {
        setProductId("");
        setQuantity(1);
        setNotes("");
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
      <Card style={{ maxWidth: 820 }}>
        {error && <Alert type="error" showIcon title={error} />}
        <form onSubmit={submit}>
          <label className="field">
            Operation
            <Radio.Group
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
            Inventory item
            <Select
              showSearch
              optionFilterProp="label"
              value={productId || undefined}
              placeholder="Select a SKU"
              onChange={setProductId}
              options={items.map((item) => ({
                value: item.id,
                label: `${item.sku} — ${item.name} (${item.quantity} ${item.unitOfMeasure})`,
              }))}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              Quantity {selected ? `(${selected.unitOfMeasure})` : ""}
              <InputNumber
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
                  value={reason}
                  onChange={setReason}
                  options={reasons.map((value) => ({ value, label: value }))}
                />
            </label>
          </div>
          <label className="field">
            Receipt, transfer reference, or explanation
            <Input.TextArea
              required
              rows={3}
              maxLength={200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          {selected && (
            <Space size="large" wrap style={{ marginBottom: 20 }}>
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
          <div>
            <Button type="primary" htmlType="submit" loading={busy}>
              Confirm & Post
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
