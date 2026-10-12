import React, { useState } from "react";
import { Card, Table, Typography, Space, Select, Tag, Alert, Row, Col, Statistic } from "antd";

export default function CompatibilityLookupPage({ items, onNavigateToItem }) {
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const acUnits = items.filter(
    (item) => item.itemType === "AC Unit" && !item.archived,
  );

  const selectedUnit = acUnits.find((item) => item.id === selectedUnitId);

  // Find matching parts for this unit
  const matchingParts = selectedUnit
    ? items.filter((part) => {
        if (part.id === selectedUnit.id || part.archived) return false;
        // Check if explicitly listed in part.compatibleModels (either by unit SKU or name)
        const hasExplicitMatch =
          Array.isArray(part.compatibleModels) &&
          part.compatibleModels.some(
            (model) =>
              model.toUpperCase() === selectedUnit.sku.toUpperCase() ||
              model.toUpperCase() === selectedUnit.name.toUpperCase(),
          );
        // Also match universal installation materials/tools if by brand/category
        const isBrandMatch =
          part.brand &&
          part.brand.toLowerCase() === selectedUnit.brand.toLowerCase();

        return hasExplicitMatch || isBrandMatch;
      })
    : [];

  const inStockMatches = matchingParts.filter((p) => p.quantity > 0);
  const outOfStockMatches = matchingParts.filter((p) => p.quantity === 0);

  const columns = [
    {
      title: "SKU",
      dataIndex: "sku",
      render: (sku) => <strong>{sku}</strong>,
    },
    {
      title: "Part / Material Name",
      dataIndex: "name",
    },
    {
      title: "Classification",
      render: (_, item) => (
        <span>
          <Tag color="blue">{item.itemType}</Tag>
          <Tag>{item.category}</Tag>
        </span>
      ),
    },
    {
      title: "Capacity / Spec",
      dataIndex: "capacity",
      render: (cap) => cap || <em style={{ color: "#888" }}>Standard</em>,
    },
    {
      title: "In Stock",
      render: (_, item) =>
        item.quantity > 0 ? (
          <Tag color="green">
            {item.quantity} {item.unitOfMeasure}
          </Tag>
        ) : (
          <Tag color="red">Out of stock</Tag>
        ),
    },
    {
      title: "Supplier",
      dataIndex: "supplier",
      render: (sup) => sup || "—",
    },
  ];

  return (
    <>
      <Typography.Title level={3}>Model Compatibility Lookup</Typography.Title>
      <Typography.Paragraph type="secondary">
        Select an AC unit model to instantly look up all verified compatible
        refrigerants, copper tubing, compressors, capacitors, and installation
        parts in your Taguig warehouse inventory.
      </Typography.Paragraph>

      <Card style={{ marginBottom: 20 }}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <strong>Select Target AC Unit Model:</strong>
            <div style={{ marginTop: 8 }}>
              <Select
                showSearch
                style={{ width: "100%", maxWidth: 600 }}
                placeholder="Choose an AC Unit (e.g. Carrier Crystal, Daikin Inverter...)"
                value={selectedUnitId || undefined}
                onChange={setSelectedUnitId}
                optionFilterProp="label"
                options={acUnits.map((unit) => ({
                  value: unit.id,
                  label: `${unit.sku} — ${unit.brand} ${unit.name} (${unit.capacity || "AC"})`,
                }))}
              />
            </div>
          </div>

          {selectedUnit && (
            <Alert
              type="info"
              showIcon
              message={
                <div>
                  <strong>
                    {selectedUnit.brand} — {selectedUnit.name}
                  </strong>{" "}
                  ({selectedUnit.sku})
                  <div>
                    Category: {selectedUnit.category} | Spec:{" "}
                    {selectedUnit.capacity || "N/A"} | Current Stock:{" "}
                    {selectedUnit.quantity} {selectedUnit.unitOfMeasure}
                  </div>
                </div>
              }
            />
          )}
        </Space>
      </Card>

      {selectedUnit && (
        <>
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Matched Supplies"
                  value={matchingParts.length}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Available in Stock"
                  value={inStockMatches.length}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Out of Stock"
                  value={outOfStockMatches.length}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title={`Compatible Supplies & Parts for ${selectedUnit.sku}`}
            extra={
              <Tag color="cyan">
                {matchingParts.length} matching item(s) found
              </Tag>
            }
          >
            <Table
              rowKey="id"
              dataSource={matchingParts}
              columns={columns}
              pagination={{ pageSize: 8 }}
              locale={{
                emptyText:
                  "No specific compatible parts logged yet for this model. Edit spare parts in the catalog to add this model.",
              }}
            />
          </Card>
        </>
      )}
    </>
  );
}
