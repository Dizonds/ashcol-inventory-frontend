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
  Checkbox,
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
  const [unloadOverride, setUnloadOverride] = useState(false);
  const [consumeItem, setConsumeItem] = useState(null);
  const [consumeQty, setConsumeQty] = useState(1);
  const [consumeWorkOrder, setConsumeWorkOrder] = useState("");
  const [consumeNotes, setConsumeNotes] = useState("");
  const [consumeBusy, setConsumeBusy] = useState(false);
  const [consumeError, setConsumeError] = useState("");
  const [newVanModal, setNewVanModal] = useState(false);
  const [newVanId, setNewVanId] = useState("");
  const [newVanName, setNewVanName] = useState("");
  const [newVanPlate, setNewVanPlate] = useState("");
  const [newVanDriver, setNewVanDriver] = useState("");
  const [newVanBusy, setNewVanBusy] = useState(false);
  const [newVanError, setNewVanError] = useState("");
  const [localServiceVans, setLocalServiceVans] = useState(serviceVans);
  const canManage = user?.role !== "EMPLOYEE";
  const isAdmin = user?.role === "ADMIN";

  const currentVan = localServiceVans.find((v) => v.id === selectedVanId);

  useEffect(() => {
    // Preserve the user's current vehicle when the parent refreshes the list
    // after a status/driver update. Previously the list refresh could fall
    // back to the first vehicle (often Bravo) while the selected update was
    // still being applied.
    if (serviceVans.length === 0) return;
    setLocalServiceVans(serviceVans);
    setSelectedVanId((currentId) =>
      currentId && serviceVans.some((van) => van.id === currentId)
        ? currentId
        : serviceVans[0]?.id || "",
    );
  }, [serviceVans]);

  useEffect(() => {
    if (
      selectedVanId &&
      localServiceVans.length > 0 &&
      !localServiceVans.some((van) => van.id === selectedVanId)
    ) {
      setSelectedVanId(localServiceVans[0]?.id || "");
    }
  }, [localServiceVans, selectedVanId]);

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

  const assignedVehicles = localServiceVans.filter((van) => van.id !== selectedVanId);
  const currentDriverMatches = (candidate) => {
    const candidateId = candidate.id || candidate._id;
    return (
      candidateId === currentVan?.driverId ||
      candidate.fullName === currentVan?.driverName ||
      `${candidate.fullName} (${candidate.role})` === currentVan?.driverName
    );
  };
  const availableDrivers = usersList.filter((candidate) => {
    const candidateId = candidate.id || candidate._id;
    const alreadyAssigned = assignedVehicles.some(
      (van) =>
        van.driverId === candidateId ||
        van.driverName === candidate.fullName ||
        van.driverName === `${candidate.fullName} (${candidate.role})`,
    );
    return !alreadyAssigned || currentDriverMatches(candidate);
  });

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
      undefined,
      { refresh: false },
    )
      .then((updatedVan) => {
        setLocalServiceVans((current) =>
          current.map((van) => (van.id === updatedVan.id ? updatedVan : van)),
        );
      })
      .catch((err) => {
        setError(errorMessage(err));
      });
  }

  function handleDriverChange(driverId) {
    save(
      "patch",
      `/service-vans/${selectedVanId}/driver`,
      { driverId: driverId || "" },
      "Assigned driver/technician updated.",
      undefined,
      { refresh: false },
    )
      .then((updatedVan) => {
        setLocalServiceVans((current) =>
          current.map((van) => (van.id === updatedVan.id ? updatedVan : van)),
        );
      })
      .catch((err) => setError(errorMessage(err)));
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
                  setUnloadOverride(false);
                }}
              >
                📥 Return to Warehouse
              </Button>
            ),
          },
        ]
      : [
          {
            title: "Actions",
            render: (_, item) => (
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  setConsumeItem(item);
                  setConsumeQty(1);
                  setConsumeWorkOrder("");
                  setConsumeNotes("");
                  setConsumeError("");
                }}
              >
                Record Material Used
              </Button>
            ),
          },
        ]),
  ];

  return (
    <Card
      title={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><BusBoldDuotoneIcon size={22} /> Mobile Service Vehicles Inventory & Field Tracking</span>}
      extra={
        <Space wrap>
          {canManage && <strong>Select Vehicle:</strong>}
          {canManage && <Select
            value={selectedVanId || undefined}
            onChange={setSelectedVanId}
            style={{ minWidth: 260 }}
             options={localServiceVans.map((van) => ({
              value: van.id,
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <BusBoldDuotoneIcon size={16} />
                  {van.name} ({van.plateNumber ? `${van.plateNumber} · ` : ""}{van.status})
                </span>
              ),
            }))}
          />}
          {isAdmin && (
            <Button
              type="primary"
              onClick={() => {
                 setNewVanId(`VAN-${String(localServiceVans.length + 1).padStart(2, "0")}`);
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
           extra={null}
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
              {canManage ? (
                <Space style={{ marginTop: 4 }}>
                  <Select
                    showSearch
                    allowClear
                    placeholder="No Driver Assigned"
                    style={{ minWidth: 240 }}
                    value={currentVan.driverId || undefined}
                    onChange={handleDriverChange}
                    disabled={["ON_FIELD", "ARRIVED"].includes(currentVan.status)}
                     options={availableDrivers.map((u) => ({
                       value: u.id || u._id,
                      label: `${u.fullName} (${u.role})`,
                    }))}
                  />
                  {["ON_FIELD", "ARRIVED"].includes(currentVan.status) && (
                    <Typography.Text type="secondary">
                      Driver locked after dispatch/site arrival
                    </Typography.Text>
                  )}
                </Space>
              ) : (
                <Space>
                  <Tag color="geekblue">
                    👤 {currentVan.driverName || "No Driver Assigned"}
                  </Tag>
                </Space>
              )}
            </div>
            <div>
              <Typography.Text type="secondary">Live Status: </Typography.Text>
               <Select
                 size="small"
                 value={currentVan.status}
                 onChange={handleStatusChange}
                 style={{ minWidth: 190, marginLeft: 8 }}
                 options={[
                   { value: "AVAILABLE", label: "AVAILABLE AT BASE" },
                   { value: "ON_FIELD", label: "EN ROUTE / ON FIELD" },
                   { value: "ARRIVED", label: "ARRIVED AT CLIENT SITE" },
                   { value: "MAINTENANCE", label: "MAINTENANCE / REPAIR" },
                 ]}
               />
            </div>
            <div>
              <Typography.Text type="secondary">Loaded SKUs: </Typography.Text>
              <strong>{vanItems.length} items</strong>
            </div>
          </Space>
        </Card>
      )}

      {localServiceVans.length === 0 ? (
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

      {/* Record material used modal */}
      <Modal
        open={Boolean(consumeItem)}
        title={consumeItem ? `Record Material Used: ${consumeItem.name}` : ""}
        onCancel={() => setConsumeItem(null)}
        footer={null}
        destroyOnClose
      >
        {consumeItem && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setConsumeBusy(true);
              setConsumeError("");
              save(
                "post",
                `/service-vans/${selectedVanId}/consume`,
                {
                  productId: consumeItem.id,
                  quantity: consumeQty,
                  workOrderId: consumeWorkOrder,
                  notes: consumeNotes,
                },
                "Material usage recorded successfully.",
                undefined,
                { refresh: false },
              )
                .then((updatedItem) => {
                  setVanItems((current) =>
                    current
                      .map((item) =>
                        item.id === updatedItem.id ? updatedItem : item,
                      )
                      .filter((item) => item.quantity > 0),
                  );
                  setConsumeItem(null);
                })
                .catch((err) => setConsumeError(errorMessage(err)))
                .finally(() => setConsumeBusy(false));
            }}
          >
            {consumeError && (
              <Alert
                type="error"
                showIcon
                message={consumeError}
                style={{ marginBottom: 12 }}
              />
            )}
            <Typography.Text type="secondary">
              Available: {consumeItem.quantity} {consumeItem.unitOfMeasure}
            </Typography.Text>
            <label className="field" style={{ display: "block", marginTop: 12 }}>
              Job / Work Order
              <Input
                required
                value={consumeWorkOrder}
                onChange={(event) => setConsumeWorkOrder(event.target.value)}
                placeholder="e.g. JOB-2026-001"
                style={{ marginTop: 4 }}
              />
            </label>
            <label className="field" style={{ display: "block", marginTop: 12 }}>
              Quantity Used ({consumeItem.unitOfMeasure})
              <InputNumber
                required
                min={consumeItem.unitOfMeasure === "UNIT" ? 1 : 0.001}
                max={consumeItem.quantity}
                step={consumeItem.unitOfMeasure === "UNIT" ? 1 : 0.1}
                precision={consumeItem.unitOfMeasure === "UNIT" ? 0 : 3}
                value={consumeQty}
                onChange={setConsumeQty}
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>
            <label className="field" style={{ display: "block", marginTop: 12 }}>
              Notes
              <Input.TextArea
                required
                value={consumeNotes}
                onChange={(event) => setConsumeNotes(event.target.value)}
                placeholder="Describe where the material was used"
                rows={3}
                style={{ marginTop: 4 }}
              />
            </label>
            <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
              <Button onClick={() => setConsumeItem(null)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={consumeBusy}
                disabled={
                  consumeQty <= 0 ||
                  !consumeWorkOrder.trim() ||
                  !consumeNotes.trim()
                }
              >
                Record Usage
              </Button>
            </Space>
          </form>
        )}
      </Modal>

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
                   reason: unloadOverride
                     ? `Emergency: Van Return to Taguig Warehouse ${branchId}`
                     : `Van Return to Taguig Warehouse ${branchId}`,
                   overrideOnField: unloadOverride,
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
            {currentVan?.status === "ON_FIELD" && (
              <Checkbox
                checked={unloadOverride}
                onChange={(event) => setUnloadOverride(event.target.checked)}
                style={{ marginBottom: 16 }}
              >
                Emergency override: unload while vehicle is on field
              </Checkbox>
            )}
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
                disabled={
                  unloadQty <= 0 ||
                  (currentVan?.status === "ON_FIELD" && !unloadOverride)
                }
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
                 driverId: newVanDriver,
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
               options={availableDrivers.map((u) => ({
                 value: u.id || u._id,
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
