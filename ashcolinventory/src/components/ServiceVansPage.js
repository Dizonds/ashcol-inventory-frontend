import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Modal,
  Input,
  InputNumber,
  Space,
  Typography,
  Alert,
  Empty,
} from "antd";
import { BusBoldDuotoneIcon } from "@solar-icons/react";
import { api, errorMessage } from "../api";

export default function ServiceVansPage({
  serviceVans,
  branchId,
  user,
  save,
  refresh,
}) {
  const [selectedVanId, setSelectedVanId] = useState(
    serviceVans[0]?.id || "",
  );
  const [vanItems, setVanItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unloadItem, setUnloadItem] = useState(null);
  const [unloadQty, setUnloadQty] = useState(1);
  const [unloadBusy, setUnloadBusy] = useState(false);
  const [unloadError, setUnloadError] = useState("");
  const [newVanModal, setNewVanModal] = useState(false);
  const [newVanId, setNewVanId] = useState("");
  const [newVanName, setNewVanName] = useState("");
  const [newVanPlate, setNewVanPlate] = useState("");
  const [newVanDriver, setNewVanDriver] = useState("");
  const [newVanBusy, setNewVanBusy] = useState(false);
  const [newVanError, setNewVanError] = useState("");
  const canManage = user?.role !== "EMPLOYEE";
  const isAdmin = user?.role === "ADMIN";

  const currentVan = serviceVans.find((v) => v.id === selectedVanId);

  useEffect(() => {
    if (!selectedVanId && serviceVans.length > 0) {
      setSelectedVanId(serviceVans[0].id);
    }
  }, [serviceVans, selectedVanId]);

  useEffect(() => {
    if (!selectedVanId) {
      setVanItems([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    api("get", "/products", null, { branchId: selectedVanId })
      .then((res) => {
        if (active) {
          const list = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.items)
              ? res.data.items
              : [];
          setVanItems(list.filter((item) => item.quantity > 0));
        }
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedVanId, refresh]);

  const [assigningDriver, setAssigningDriver] = useState(false);
  const [driverInput, setDriverInput] = useState("");
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    const req = api("get", "/users");
    if (req && typeof req.then === "function") {
      req
        .then((res) => {
          if (active && res && Array.isArray(res.data)) {
            setUsersList(res.data);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [canManage]);

  function handleStatusChange(newStatus) {
    if (["ON_FIELD", "ARRIVED"].includes(newStatus) && !currentVan?.driverName) {
      setError("An assigned driver/lead technician is required before marking this van as En Route or Arrived.");
      return;
    }
    setError("");
    save(
      "patch",
      `/service-vans/${selectedVanId}/status`,
      { status: newStatus },
      `Van status updated to ${newStatus}.`,
    ).catch((err) => {
      setError(errorMessage(err));
    });
  }

  function handleAssignDriver() {
    save(
      "patch",
      `/service-vans/${selectedVanId}/driver`,
      { driverName: driverInput },
      "Assigned driver/technician updated.",
    )
      .then(() => setAssigningDriver(false))
      .catch(() => {});
  }

  const columns = [
    { title: "SKU", dataIndex: "sku" },
    { title: "Item Name", dataIndex: "name" },
    { title: "Classification", dataIndex: "itemType" },
    {
      title: "Stock in Van",
      render: (_, item) => (
        <Tag color="cyan">
          {item.quantity} {item.unitOfMeasure}
        </Tag>
      ),
    },
    ...(canManage
      ? [
          {
            title: "Actions",
            render: (_, item) => (
              <Button
                size="small"
                onClick={() => {
                  setUnloadItem(item);
                  setUnloadQty(1);
                  setUnloadError("");
                }}
              >
                📥 Return to Warehouse
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <Card
      title={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><BusBoldDuotoneIcon size={22} /> Mobile Service Vehicles Inventory & Field Tracking</span>}
      extra={
        <Space wrap>
          <strong>Select Vehicle:</strong>
          <Select
            value={selectedVanId || undefined}
            onChange={setSelectedVanId}
            style={{ minWidth: 260 }}
            options={serviceVans.map((van) => ({
              value: van.id,
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <BusBoldDuotoneIcon size={16} />
                  {van.name} ({van.plateNumber ? `${van.plateNumber} · ` : ""}{van.status})
                </span>
              ),
            }))}
          />
          {isAdmin && (
            <Button
              type="primary"
              onClick={() => {
                setNewVanId(`VAN-${String(serviceVans.length + 1).padStart(2, "0")}`);
                setNewVanName("");
                setNewVanPlate("");
                setNewVanDriver("");
                setNewVanError("");
                setNewVanModal(true);
              }}
            >
              + Add New Service Vehicle
            </Button>
          )}
        </Space>
      }
    >
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
        />
      )}

      {currentVan && (
        <Card
          type="inner"
          title={`Vehicle Details: ${currentVan.name}`}
          style={{ marginBottom: 16, background: "rgba(5, 150, 105, 0.04)" }}
          extra={
            <Space wrap>
              <span>Quick Status:</span>
              <Button
                size="small"
                type={currentVan.status === "ON_FIELD" ? "primary" : "default"}
                onClick={() => handleStatusChange("ON_FIELD")}
              >
                🚀 En Route
              </Button>
              <Button
                size="small"
                type={currentVan.status === "ARRIVED" ? "primary" : "default"}
                style={
                  currentVan.status === "ARRIVED"
                    ? { backgroundColor: "#854d0e", borderColor: "#854d0e" }
                    : {}
                }
                onClick={() => handleStatusChange("ARRIVED")}
              >
                📍 Arrived at Site
              </Button>
              <Button
                size="small"
                type={currentVan.status === "AVAILABLE" ? "primary" : "default"}
                onClick={() => handleStatusChange("AVAILABLE")}
              >
                🟢 Available / Base
              </Button>
              {canManage && (
                <Button
                  size="small"
                  danger={currentVan.status === "MAINTENANCE"}
                  type={currentVan.status === "MAINTENANCE" ? "primary" : "default"}
                  onClick={() => handleStatusChange("MAINTENANCE")}
                >
                  🟠 Maintenance
                </Button>
              )}
            </Space>
          }
        >
          <Space orientation="horizontal" size="large" wrap>
            <div>
              <Typography.Text type="secondary">Plate Number: </Typography.Text>
              <strong>{currentVan.plateNumber || "N/A"}</strong>
            </div>
            <div>
              <Typography.Text type="secondary">Van ID: </Typography.Text>
              <code>{currentVan.id}</code>
            </div>
            <div>
              <Typography.Text type="secondary">Assigned Driver / Lead Tech: </Typography.Text>
              {assigningDriver ? (
                <Space style={{ marginTop: 4 }}>
                  <Select
                    showSearch
                    placeholder="Choose technician"
                    style={{ minWidth: 200 }}
                    value={driverInput || undefined}
                    onChange={setDriverInput}
                    options={usersList.map((u) => ({
                      value: `${u.fullName} (${u.role})`,
                      label: `${u.fullName} (${u.role})`,
                    }))}
                  />
                  <Button size="small" type="primary" onClick={handleAssignDriver}>
                    Save
                  </Button>
                  <Button size="small" onClick={() => setAssigningDriver(false)}>
                    Cancel
                  </Button>
                </Space>
              ) : (
                <Space>
                  <Tag color="geekblue">
                    👤 {currentVan.driverName || "No Driver Assigned"}
                  </Tag>
                  {canManage && (
                    <Button
                      size="small"
                      type="link"
                      onClick={() => {
                        setDriverInput(currentVan.driverName || "");
                        setAssigningDriver(true);
                      }}
                    >
                      Change
                    </Button>
                  )}
                </Space>
              )}
            </div>
            <div>
              <Typography.Text type="secondary">Live Status: </Typography.Text>
              <Tag
                color={
                  currentVan.status === "AVAILABLE"
                    ? "green"
                    : currentVan.status === "ARRIVED"
                      ? "gold"
                      : currentVan.status === "ON_FIELD"
                        ? "blue"
                        : "orange"
                }
              >
                {currentVan.status === "ARRIVED"
                  ? "📍 ARRIVED AT CLIENT SITE"
                  : currentVan.status === "ON_FIELD"
                    ? "🚀 EN ROUTE / ON FIELD"
                    : currentVan.status === "AVAILABLE"
                      ? "🟢 AVAILABLE AT BASE"
                      : "🟠 MAINTENANCE / REPAIR"}
              </Tag>
            </div>
            <div>
              <Typography.Text type="secondary">Loaded SKUs: </Typography.Text>
              <strong>{vanItems.length} items</strong>
            </div>
          </Space>
        </Card>
      )}

      {serviceVans.length === 0 ? (
        <Empty description="No service vehicles configured. Administrators can add vehicles here." />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={vanItems}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      )}

      {/* Unload modal */}
      <Modal
        open={Boolean(unloadItem)}
        title={unloadItem ? `📥 Return to Warehouse: ${unloadItem.name}` : ""}
        onCancel={() => setUnloadItem(null)}
        footer={null}
        destroyOnClose
      >
        {unloadItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setUnloadBusy(true);
              setUnloadError("");
              save(
                "post",
                "/transfers",
                {
                  branchId: selectedVanId,
                  destinationId: branchId,
                  productId: unloadItem.id,
                  quantity: unloadQty,
                  reason: `Van Return to Taguig Warehouse ${branchId}`,
                },
                `Returned ${unloadQty} ${unloadItem.unitOfMeasure} of ${unloadItem.name} back to warehouse stock.`,
              )
                .then(() => {
                  setUnloadItem(null);
                })
                .catch((err) => {
                  setUnloadError(errorMessage(err));
                })
                .finally(() => setUnloadBusy(false));
            }}
          >
            {unloadError && (
              <Alert
                type="error"
                showIcon
                message={unloadError}
                style={{ marginBottom: 12 }}
              />
            )}
            <p>
              Return unused parts or equipment from the van back to the warehouse
              warehouse.
            </p>
            <div style={{ marginBottom: 12 }}>
              <Typography.Text type="secondary">
                Quantity currently in van:{" "}
                <strong>
                  {unloadItem.quantity} {unloadItem.unitOfMeasure}
                </strong>
              </Typography.Text>
            </div>
            <label className="field" style={{ display: "block", marginBottom: 16 }}>
              Quantity to Return ({unloadItem.unitOfMeasure})
              <InputNumber
                min={
                  ["METER", "FOOT", "KG", "LITER"].includes(unloadItem.unitOfMeasure)
                    ? 0.001
                    : 1
                }
                max={unloadItem.quantity}
                step={
                  ["METER", "FOOT", "KG", "LITER"].includes(unloadItem.unitOfMeasure)
                    ? 0.1
                    : 1
                }
                precision={
                  ["METER", "FOOT", "KG", "LITER"].includes(unloadItem.unitOfMeasure)
                    ? 3
                    : 0
                }
                value={unloadQty}
                onChange={setUnloadQty}
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setUnloadItem(null)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={unloadBusy}
                disabled={unloadQty <= 0}
              >
                Confirm Return to Warehouse
              </Button>
            </Space>
          </form>
        )}
      </Modal>

      {/* Register new Service Vehicle Modal */}
      <Modal
        open={newVanModal}
        title={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><BusBoldDuotoneIcon size={20} />Register New Service Vehicle</span>}
        onCancel={() => setNewVanModal(false)}
        footer={null}
        destroyOnClose
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNewVanBusy(true);
            setNewVanError("");
            save(
              "post",
              "/service-vans",
              {
                id: newVanId.trim(),
                name: newVanName.trim(),
                plateNumber: newVanPlate.trim(),
                driverName: newVanDriver.trim(),
                status: "AVAILABLE",
              },
              `New Service Vehicle "${newVanName}" registered successfully!`,
            )
              .then(() => {
                setNewVanModal(false);
                setSelectedVanId(newVanId.trim());
              })
              .catch((err) => {
                setNewVanError(errorMessage(err));
              })
              .finally(() => setNewVanBusy(false));
          }}
        >
          {newVanError && (
            <Alert
              type="error"
              showIcon
              message={newVanError}
              style={{ marginBottom: 12 }}
            />
          )}
          <label className="field" style={{ display: "block", marginBottom: 12 }}>
            Vehicle ID / Code
            <Input
              required
              placeholder="e.g. VAN-03"
              value={newVanId}
              onChange={(e) => setNewVanId(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </label>
          <label className="field" style={{ display: "block", marginBottom: 12 }}>
            Vehicle Name / Description
            <Input
              required
              placeholder="e.g. Field Service Vehicle Charlie"
              value={newVanName}
              onChange={(e) => setNewVanName(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </label>
          <label className="field" style={{ display: "block", marginBottom: 12 }}>
            Vehicle Plate Number
            <Input
              placeholder="e.g. NCD-9876"
              value={newVanPlate}
              onChange={(e) => setNewVanPlate(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </label>
          <label className="field" style={{ display: "block", marginBottom: 16 }}>
            Assigned Lead Technician / Driver (optional)
            <Select
              showSearch
              allowClear
              placeholder="Select technician"
              value={newVanDriver || undefined}
              onChange={(val) => setNewVanDriver(val || "")}
              style={{ width: "100%", marginTop: 4 }}
              options={usersList.map((u) => ({
                value: `${u.fullName} (${u.role})`,
                label: `${u.fullName} (${u.role})`,
              }))}
            />
          </label>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setNewVanModal(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={newVanBusy}
              disabled={!newVanId.trim() || !newVanName.trim()}
            >
              Register Vehicle
            </Button>
          </Space>
        </form>
      </Modal>
    </Card>
  );
}
