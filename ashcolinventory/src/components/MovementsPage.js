import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Input,
  Select,
  Space,
  Alert,
  Typography,
} from "antd";
import { api, errorMessage } from "../api";

export default function MovementsPage({ branchId, refresh }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api("get", "/movements", null, { branchId, page, pageSize, search, type })
      .then(({ data }) => {
        if (active) {
          setRows(data.items);
          setTotal(data.total);
        }
      })
      .catch((err) => {
        if (active) {
          setError(errorMessage(err));
          setRows([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [branchId, page, pageSize, search, type, refresh]);
  return (
    <>
      <Typography.Title level={3}>Stock Movements Ledger</Typography.Title>
      <Typography.Paragraph type="secondary">
        Search the full retained warehouse history. Times are displayed in
        Philippine time. Legacy records may lack a verified actor or balance.
      </Typography.Paragraph>
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="SKU, item, job, person or reference"
            allowClear
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            style={{ width: 330, maxWidth: "100%" }}
          />
          <Select
            value={type}
            onChange={(value) => {
              setType(value);
              setPage(1);
            }}
            style={{ width: 190 }}
            options={[
              "",
              "OPENING",
              "STOCK_IN",
              "STOCK_OUT",
              "TRANSFER_IN",
              "TRANSFER_OUT",
              "REQUEST_ISSUE",
              "DETAILS",
              "ARCHIVE",
              "RESTORE",
            ].map((value) => ({ value, label: value || "All movement types" }))}
          />
        </Space>
        {error && <Alert type="error" title={error} />}
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          scroll={{ x: 1300 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (next, size) => {
              setPage(size === pageSize ? next : 1);
              setPageSize(size);
            },
          }}
          columns={[
            {
              title: "Timestamp (PH)",
              render: (_, entry) =>
                entry.createdAt
                  ? new Date(entry.createdAt).toLocaleString("en-PH", {
                      timeZone: "Asia/Manila",
                    })
                  : entry.date || "Legacy: not recorded",
            },
            {
              title: "SKU / item",
              render: (_, entry) => (
                <div>
                  {entry.sku}
                  <br />
                  {entry.itemName}
                </div>
              ),
            },
            {
              title: "Type",
              render: (_, entry) => (
                <Tag
                  color={
                    entry.quantityDelta > 0
                      ? "green"
                      : entry.quantityDelta < 0
                        ? "red"
                        : "default"
                  }
                >
                  {entry.movementType}
                </Tag>
              ),
            },
            {
              title: "Change",
              render: (_, entry) =>
                `${entry.quantityDelta > 0 ? "+" : ""}${entry.quantityDelta} ${entry.unitOfMeasure || ""}`,
            },
            {
              title: "Before → after",
              render: (_, entry) =>
                entry.beforeQuantity === undefined
                  ? "Legacy: not recorded"
                  : `${entry.beforeQuantity} → ${entry.afterQuantity}`,
            },
            {
              title: "Performed by",
              render: (_, entry) =>
                entry.performedByName || "Legacy: not recorded",
            },
            {
              title: "Ticket / Reference ID",
              render: (_, entry) => {
                const ticket = entry.referenceId;
                if (!ticket) return <span style={{ color: "#9ca3af" }}>—</span>;
                const isTra = ticket.startsWith("TRA");
                const isSti = ticket.startsWith("STI");
                const isSto = ticket.startsWith("STO");
                const color = isTra ? "purple" : isSti ? "green" : isSto ? "volcano" : "blue";
                const icon = isTra ? "🔄 " : isSti ? "📥 " : isSto ? "📤 " : "📋 ";
                return (
                  <Tag
                    color={color}
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    {icon}
                    {ticket}
                  </Tag>
                );
              },
            },
            { title: "Reason", dataIndex: "reason" },
          ]}
        />
      </Card>
    </>
  );
}
