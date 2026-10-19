import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Input,
  Checkbox,
  Space,
  Typography,
  Alert,
  Empty,
  Select,
} from "antd";
import { api, errorMessage } from "../../api";
import { formatJobNumber, formatMovementNumber } from "../../utils/formatters";
import InventoryNumberInput from "../../components/common/InventoryNumberInput";
import "./ServiceVansPage.css";

import vanL300 from "../../assets/vehicles/van_l300.jpg";
import vanSuv from "../../assets/vehicles/van_suv.jpg";
import vanPickup from "../../assets/vehicles/van_pickup.jpg";
const VEHICLE_TYPES = [
  { value: "Cargo Van", label: "Cargo Van / L300", image: vanL300 },
  { value: "Pickup", label: "Pickup", image: vanPickup },
  { value: "SUV", label: "SUV", image: vanSuv },
];

export default function ServiceVansPage({
  serviceVans = [],
  branchId,
  user,
  save,
  refresh,
  updateDemoVehicle,
  removeDemoVehicle,
}) {
  const [selectedVanId, setSelectedVanId] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' (Design 1) or 'details' (Design 2)
  const [vanItems, setVanItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [unloadItem, setUnloadItem] = useState(null);
  const [unloadQty, setUnloadQty] = useState(1);
  const [unloadBusy, setUnloadBusy] = useState(false);
  const [unloadError, setUnloadError] = useState("");
  const [unloadOverride, setUnloadOverride] = useState(false);

  const [consumeItem, setConsumeItem] = useState(null);
  const [consumeQty, setConsumeQty] = useState(1);
  const [consumeJobOrderId, setConsumeJobOrderId] = useState("");
  const [consumeJobs, setConsumeJobs] = useState([]);
  const [consumeUsageId, setConsumeUsageId] = useState("");
  const [consumeNotes, setConsumeNotes] = useState("");
  const [consumeBusy, setConsumeBusy] = useState(false);
  const [consumeError, setConsumeError] = useState("");
  const [consumeTicketLoading, setConsumeTicketLoading] = useState(false);
  const [consumeJobsLoading, setConsumeJobsLoading] = useState(false);
  const [consumeTicketAttempt, setConsumeTicketAttempt] = useState(0);
  const [consumeSubmitted, setConsumeSubmitted] = useState(false);

  const consumeValidation = {
    usageId: !consumeUsageId ? "Generate a usage ID before recording materials." : "",
    jobOrder: !consumeJobOrderId ? "A current job order is required. Ask your admin or manager to assign one." : "",
    quantity: consumeQty == null || !Number.isFinite(Number(consumeQty)) || Number(consumeQty) <= 0
      ? "Enter a quantity greater than zero."
      : Number(consumeQty) > Number(consumeItem?.quantity)
        ? "Quantity used cannot exceed the available stock."
        : "",
    notes: !consumeNotes.trim() ? "Describe where the material was used." : "",
  };
  const consumeFieldErrors = consumeSubmitted ? consumeValidation : {};

  useEffect(() => {
    if (!consumeItem || !selectedVanId) return;
    let active = true;
    setConsumeTicketLoading(true);
    setConsumeUsageId("");
    setConsumeError("");
    api("post", `/service-vans/${selectedVanId}/usage-ticket`)
      .then(({ data }) => {
        if (!active) return;
        if (typeof data?.usageId !== "string" || !/^USE\d{4,}$/.test(data.usageId)) {
          setConsumeError("A usage ID could not be generated. Please try again.");
          return;
        }
        setConsumeUsageId(data.usageId);
      })
      .catch((err) => { if (active) setConsumeError(errorMessage(err)); })
      .finally(() => { if (active) setConsumeTicketLoading(false); });
    return () => { active = false; };
  }, [consumeItem, selectedVanId, consumeTicketAttempt]);

  // Refresh the assignment in an open form without replacing its usage ticket or draft.
  useEffect(() => {
    if (!consumeItem || !selectedVanId) return;
    let active = true;
    setConsumeJobsLoading(true);
    api("get", "/job-orders", null, { vanId: selectedVanId, status: "OPEN", current: "true" })
      .then(({ data }) => {
        if (!active) return;
        setConsumeJobs(data);
        setConsumeJobOrderId(data[0]?.id || "");
      })
      .catch((err) => {
        if (!active) return;
        setConsumeJobs([]);
        setConsumeJobOrderId("");
        setConsumeError(errorMessage(err));
      })
      .finally(() => { if (active) setConsumeJobsLoading(false); });
    return () => { active = false; };
  }, [consumeItem, selectedVanId, consumeTicketAttempt, refresh]);

  const [newVanModal, setNewVanModal] = useState(false);
  const [newVanId, setNewVanId] = useState("");
  const [newVanName, setNewVanName] = useState("");
  const [newVanPlate, setNewVanPlate] = useState("");
  const [newVanType, setNewVanType] = useState("");
  const [newVanDriver, setNewVanDriver] = useState("");
  const [newVanBusy, setNewVanBusy] = useState(false);
  const [newVanError, setNewVanError] = useState("");

  const [editVanModal, setEditVanModal] = useState(false);
  const [editingVan, setEditingVan] = useState(null);
  const [editVanName, setEditVanName] = useState("");
  const [editVanPlate, setEditVanPlate] = useState("");
  const [editVanDriver, setEditVanDriver] = useState("");
  const [editVanStatus, setEditVanStatus] = useState("AVAILABLE");
  const [editVanBusy, setEditVanBusy] = useState(false);
  const [editVanError, setEditVanError] = useState("");

  const [deleteVan, setDeleteVan] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [vehicleUpdateBusy, setVehicleUpdateBusy] = useState(false);
  const [localServiceVans, setLocalServiceVans] = useState(serviceVans);
  const [vanItemCounts, setVanItemCounts] = useState({});

  const canManage = user?.role !== "EMPLOYEE";
  const isAdmin = user?.role === "ADMIN";

  const currentVan = localServiceVans.find((v) => v.id === selectedVanId);
  useEffect(() => {
    if (viewMode === "details" && !currentVan) setViewMode("list");
  }, [viewMode, currentVan]);
  const selectedVanIsDemo = Boolean(currentVan?.isDemo);
  const deleteTarget = localServiceVans.find((van) => van.id === deleteVan?.id) || deleteVan;
  const deleteBlocked = deleteTarget && (
    deleteTarget.driverId?.trim() || deleteTarget.driverName?.trim() || deleteTarget.status !== "AVAILABLE"
  );

  useEffect(() => {
    setLocalServiceVans(serviceVans);
    setSelectedVanId((currentId) =>
      currentId && serviceVans.some((van) => van.id === currentId) ? currentId : "",
    );
  }, [serviceVans]);

  useEffect(() => {
    if (
      selectedVanId &&
      localServiceVans.length > 0 &&
      !localServiceVans.some((van) => van.id === selectedVanId)
    ) {
      setSelectedVanId("");
    }
  }, [localServiceVans, selectedVanId]);

  useEffect(() => {
    if (!localServiceVans || localServiceVans.length === 0) return;
    let active = true;

    localServiceVans.forEach((van) => {
      if (van.isDemo) return;
      api("get", "/products", null, { branchId: van.id })
        .then((res) => {
          if (!active) return;
          const list = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.items)
              ? res.data.items
              : [];
          const activeItems = list.filter((item) => item.quantity > 0);
          setVanItemCounts((prev) => ({
            ...prev,
            [van.id]: activeItems.length,
          }));
        })
        .catch(() => {});
    });

    return () => {
      active = false;
    };
  }, [localServiceVans, refresh]);

  useEffect(() => {
    if (!selectedVanId || selectedVanIsDemo) {
      setVanItems([]);
      setLoading(false);
      setError("");
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
  }, [selectedVanId, refresh, selectedVanIsDemo]);

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
  }, [canManage, refresh]);

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
  const driverOptions = [
    { value: "", label: "No Driver" },
    ...availableDrivers.map((candidate) => ({
      value: candidate.id || candidate._id,
      label: `${candidate.fullName} (${candidate.role})`,
    })),
  ];
  const matchingDriver = availableDrivers.find(currentDriverMatches);
  const currentDriverValue =
    currentVan?.driverId ||
    matchingDriver?.id ||
    matchingDriver?._id ||
    (currentVan?.driverName ? "__legacy_driver__" : "");
  const currentDriverOptions = driverOptions.some(
    (option) => option.value === currentDriverValue,
  )
    ? driverOptions
    : [
        ...driverOptions,
        {
          value: currentDriverValue,
          label: currentVan?.driverName || "Assigned driver",
          disabled: true,
        },
      ];

  function getVehicleImage(van) {
    const type = { "Cab Chassis": "Cargo Van", Hatchback: "SUV", "Micro SUV": "SUV" }[van?.vehicleType] || van?.vehicleType;
    return VEHICLE_TYPES.find((vehicle) => vehicle.value === type)?.image || vanL300;
  }

  const stats = useMemo(() => {
    const total = localServiceVans.length;
    const onField = localServiceVans.filter(
      (v) => v.status === "ON_FIELD" || v.status === "ARRIVED",
    ).length;
    const available = localServiceVans.filter((v) => v.status === "AVAILABLE").length;
    const maintenance = localServiceVans.filter((v) => v.status === "MAINTENANCE").length;
    return {
      active: total,
      onField,
      available,
      maintenance,
    };
  }, [localServiceVans]);

  const filteredVans = useMemo(() => {
    return localServiceVans.filter((van) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (van.name && van.name.toLowerCase().includes(q)) ||
        (van.plateNumber && van.plateNumber.toLowerCase().includes(q)) ||
        (van.id && van.id.toLowerCase().includes(q)) ||
        (van.driverName && van.driverName.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ON_FIELD" && (van.status === "ON_FIELD" || van.status === "ARRIVED")) ||
        (statusFilter === "AVAILABLE" && van.status === "AVAILABLE") ||
        (statusFilter === "MAINTENANCE" && van.status === "MAINTENANCE");

      return matchesSearch && matchesStatus;
    });
  }, [localServiceVans, searchQuery, statusFilter]);

  function handleStatusChange(newStatus) {
    if (vehicleUpdateBusy || deleteBusy || !currentVan) return;
    if (["ON_FIELD", "ARRIVED"].includes(newStatus) && !currentVan?.driverName) {
      setError("An assigned driver/lead technician is required before marking this van as On Field.");
      return;
    }
    setError("");
    setVehicleUpdateBusy(true);
    const update = currentVan.isDemo
      ? Promise.resolve(updateDemoVehicle({ ...currentVan, status: newStatus }))
      : save(
          "patch",
          `/service-vans/${selectedVanId}/status`,
          { status: newStatus },
          `Van status updated to ${newStatus}.`,
          undefined,
          { refresh: false },
        );
    update
      .then((updatedVan) => {
        setLocalServiceVans((current) =>
          current.map((van) => (van.id === updatedVan.id ? updatedVan : van)),
        );
      })
      .catch((err) => {
        setError(errorMessage(err));
      })
      .finally(() => setVehicleUpdateBusy(false));
  }

  function handleDriverChange(driverId) {
    if (vehicleUpdateBusy || deleteBusy || driverId === "__legacy_driver__" || !currentVan) return;
    setError("");
    setVehicleUpdateBusy(true);
    const driver = usersList.find((candidate) => (candidate.id || candidate._id) === driverId);
    const update = currentVan.isDemo
      ? Promise.resolve(
          updateDemoVehicle({
            ...currentVan,
            driverId: driverId || "",
            driverName: driver?.fullName || "",
          }),
        )
      : save(
          "patch",
          `/service-vans/${selectedVanId}/driver`,
          { driverId: driverId || "" },
          "Assigned driver/technician updated.",
          undefined,
          { refresh: false },
        );
    update
      .then((updatedVan) => {
        setLocalServiceVans((current) =>
          current.map((van) => (van.id === updatedVan.id ? updatedVan : van)),
        );
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setVehicleUpdateBusy(false));
  }

  function openDelete(van) {
    setDeleteError("");
    setDeleteVan(van);
  }

  function confirmDelete() {
    if (!isAdmin || !deleteVan || deleteBlocked || deleteBusy) return;
    const vehicleId = deleteVan.id;
    setDeleteBusy(true);
    setDeleteError("");
    const removal = deleteTarget.isDemo
      ? Promise.resolve(removeDemoVehicle(vehicleId))
      : save(
          "delete",
          `/service-vans/${encodeURIComponent(vehicleId)}`,
          undefined,
          "Service vehicle deleted.",
        );
    removal
      .then(() => {
        setLocalServiceVans((current) => current.filter((van) => van.id !== vehicleId));
        if (selectedVanId === vehicleId) {
          setSelectedVanId("");
          setVanItems([]);
          setViewMode("list");
        }
        setDeleteVan(null);
      })
      .catch((err) => setDeleteError(errorMessage(err)))
      .finally(() => setDeleteBusy(false));
  }

  function openEdit(van) {
    setEditingVan(van);
    setEditVanName(van.name || "");
    setEditVanPlate(van.plateNumber || "");
    setEditVanDriver(van.driverId || "");
    setEditVanStatus(van.status || "AVAILABLE");
    setEditVanError("");
    setEditVanModal(true);
  }

  function handleEditVanSubmit(e) {
    e.preventDefault();
    if (!editingVan || editVanBusy) return;
    setEditVanBusy(true);
    setEditVanError("");

    const driver = usersList.find((u) => (u.id || u._id) === editVanDriver);
    const updatedData = {
      name: editVanName.trim(),
      plateNumber: editVanPlate.trim(),
      driverId: editVanDriver || "",
      driverName: driver ? driver.fullName : (editVanDriver ? editingVan.driverName : ""),
      status: editVanStatus,
    };

    const update = editingVan.isDemo
      ? Promise.resolve({ ...editingVan, ...updatedData })
      : save("patch", `/service-vans/${editingVan.id}`, updatedData, "Vehicle details updated.", undefined, { refresh: false });

    update.then((updated) => {
        if (editingVan.isDemo) updateDemoVehicle?.({ ...editingVan, ...updatedData });
        setLocalServiceVans((current) =>
          current.map((v) => (v.id === editingVan.id ? { ...v, ...updated } : v)),
        );
        setEditVanModal(false);
      })
      .catch((err) => setEditVanError(errorMessage(err)))
      .finally(() => setEditVanBusy(false));
  }

  const totalPages = Math.ceil((vanItems.length || 1) / pageSize);
  const pagedItems = vanItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="service-vehicles-container">
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          closable
          onClose={() => setError("")}
          style={{ marginBottom: 8 }}
        />
      )}

      <div className="sv-overview-card">
        <div className="sv-overview-header">
          <h2 className="sv-overview-title">Service Vehicles Overview</h2>

          <div className="sv-overview-actions">
            <div className="sv-search-wrap">
              <span className="sv-search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="sv-search-input"
                placeholder="Search SKU, name, or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {viewMode === "list" && <select
              className="sv-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter vehicles by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ON_FIELD">On Field</option>
              <option value="AVAILABLE">Available at Base</option>
              <option value="MAINTENANCE">Under Maintenance</option>
            </select>}

            {isAdmin && (
              <button
                type="button"
                className="sv-btn-add"
                onClick={() => {
                  const nextNumber =
                    Math.max(
                      0,
                      ...localServiceVans.map(
                        (van) => Number(van.id.match(/^VAN-(\d+)$/)?.[1]) || 0,
                      ),
                    ) + 1;
                  setNewVanId(`VAN-${String(nextNumber).padStart(2, "0")}`);
                  setNewVanName("");
                  setNewVanPlate("");
                  setNewVanType("");
                  setNewVanDriver("");
                  setNewVanError("");
                  setNewVanModal(true);
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M13 6a1 1 0 0 0-2 0v5H6a1 1 0 0 0 0 2h5v5a1 1 0 0 0 2 0v-5h5a1 1 0 0 0 0-2h-5V6Z" fill="currentColor" />
                </svg>
                <span>Add Vehicles</span>
              </button>
            )}
          </div>
        </div>

        <div className="sv-stats-row">
          <div className="sv-stat-col">
            <div className="sv-stat-number">{stats.active}</div>
            <div className="sv-stat-label-wrap">
              <span className="sv-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3h15v13H1z" />
                  <path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
              <span>Active Vehicles</span>
            </div>
          </div>

          <div className="sv-stat-col">
            <div className="sv-stat-number">{stats.onField}</div>
            <div className="sv-stat-label-wrap">
              <span className="sv-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3h15v13H1z" />
                  <path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
              <span>On Field</span>
            </div>
          </div>

          <div className="sv-stat-col">
            <div className="sv-stat-number">{stats.available}</div>
            <div className="sv-stat-label-wrap">
              <span className="sv-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3h15v13H1z" />
                  <path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
              <span>Available at Base</span>
            </div>
          </div>

          <div className="sv-stat-col">
            <div className="sv-stat-number">{stats.maintenance}</div>
            <div className="sv-stat-label-wrap">
              <span className="sv-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3h15v13H1z" />
                  <path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
              <span>Under Maintenance</span>
            </div>
          </div>
        </div>
      </div>

      {viewMode === "list" && (
        <>
          <div className="sv-section-title-wrap">
            <h3 className="sv-section-title">
              {statusFilter === "AVAILABLE"
                ? "Vehicles currently in base"
                : statusFilter === "ON_FIELD"
                  ? "Vehicles currently on field"
                  : statusFilter === "MAINTENANCE"
                    ? "Vehicles under maintenance"
                    : "Vehicles currently in base"}
            </h3>
          </div>

          {filteredVans.length === 0 ? (
            <div style={{ background: "#ffffff", padding: "40px", borderRadius: "16px", textAlign: "center" }}>
              <Empty description="No service vehicles match the current search or filter." />
            </div>
          ) : (
            <div className="sv-cards-grid">
              {filteredVans.map((van, index) => {
                const isField = van.status === "ON_FIELD" || van.status === "ARRIVED";
                const isMaint = van.status === "MAINTENANCE";
                const statusClass = isField ? "on-field" : isMaint ? "maintenance" : "available";
                const statusLabel = isField
                  ? "On Field"
                  : isMaint
                    ? "Under Maintenance"
                    : "Available at Base";
                  const loadedCount = vanItemCounts[van.id] ?? 0;
                const vehicleImg = getVehicleImage(van);

                return (
                  <div key={van.id} className="sv-card">
                    <div className="sv-card-top">
                      <div className="sv-card-info-left">
                        <div className={`sv-status-pill ${statusClass}`}>
                          <span className="sv-status-dot" />
                          <span>{statusLabel}</span>
                        </div>

                        <p className="sv-card-name">{van.name || "Service Vehicle"}</p>
                        <h4 className="sv-card-plate">{van.plateNumber || "No plate number"}</h4>
                        <p className="sv-card-van-id">Van ID: {van.id}</p>
                      </div>

                      <div className="sv-card-image-wrap">
                        <img
                          src={vehicleImg}
                          alt={van.name || van.id}
                          className="sv-card-image"
                        />
                      </div>
                    </div>

                    <div className="sv-card-shelf">
                      <div className="sv-shelf-col">
                        <span className="sv-shelf-label">Driver</span>
                        <span className="sv-shelf-value" title={van.driverName || "No Driver Assigned"}>
                          {van.driverName || "No Driver Assigned"}
                        </span>
                      </div>

                      <div className="sv-shelf-col">
                        <span className="sv-shelf-label">Loaded SKUs</span>
                        <span className="sv-shelf-value">
                          {loadedCount} {loadedCount === 1 ? "Items" : "Items"}
                        </span>
                      </div>

                      <div className="sv-shelf-col">
                        <span className="sv-shelf-label">Actions</span>
                        <div className="sv-shelf-actions">
                          <button
                            type="button"
                            className="sv-action-icon-btn primary"
                            title="View vehicle details"
                            onClick={() => {
                              setSelectedVanId(van.id);
                              setCurrentPage(1);
                              setViewMode("details");
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>

                          {canManage && (
                            <button
                              type="button"
                              className="sv-action-icon-btn"
                              title="Edit vehicle info"
                              onClick={() => openEdit(van)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {viewMode === "details" && currentVan && (
        <>
          <div className="sv-details-back-bar">
            <button
              type="button"
              className="sv-btn-back"
              onClick={() => setViewMode("list")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to all vehicles</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                className="sv-btn-back"
                style={{ color: "#ef4444" }}
                disabled={vehicleUpdateBusy}
                onClick={() => openDelete(currentVan)}
              >
                Delete Vehicle
              </button>
            )}
          </div>

          <div className="sv-details-card">
            <div className="sv-details-left">
              <div className="sv-field-box">
                <span className="sv-field-label">Vehicle Type</span>
                <div className="sv-field-input-box">{currentVan.vehicleType || "Not specified"}</div>
              </div>
              <div className="sv-status-dropdown-wrap">
                <select
                  className="sv-status-pill-select"
                  value={currentVan.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={vehicleUpdateBusy || deleteBusy}
                  aria-label="Change vehicle status"
                >
                  <option value="ON_FIELD">● On Field</option>
                  <option value="AVAILABLE">● Available at Base</option>
                  <option value="ARRIVED">● Arrived at Client Site</option>
                  <option value="MAINTENANCE">● Under Maintenance</option>
                </select>
                <span className="sv-status-pill-arrow">▼</span>
              </div>

              <div className="sv-fields-row row-3-col">
                <div className="sv-field-box">
                  <span className="sv-field-label">Plate Number</span>
                  <div className="sv-field-input-box">
                    {currentVan.plateNumber || "No plate number"}
                  </div>
                </div>

                <div className="sv-field-box">
                  <span className="sv-field-label">Van ID</span>
                  <div className="sv-field-input-box">
                    {currentVan.id}
                  </div>
                </div>

                <div className="sv-field-box">
                  <span className="sv-field-label">Loaded SKUs</span>
                  <div className="sv-field-input-box">
                    {vanItems.length} {vanItems.length === 1 ? "Items" : "Items"}
                  </div>
                </div>
              </div>

              <div className="sv-fields-row row-2-col">
                <div className="sv-field-box">
                  <span className="sv-field-label">Assigned Driver</span>
                  {canManage ? (
                    <select
                      className="sv-field-select"
                      value={currentDriverValue}
                      onChange={(e) => handleDriverChange(e.target.value)}
                      disabled={
                        deleteBusy ||
                        vehicleUpdateBusy ||
                        ["ON_FIELD", "ARRIVED"].includes(currentVan.status)
                      }
                      aria-label="Assigned driver select"
                    >
                      {currentDriverOptions.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          disabled={opt.disabled}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="sv-field-input-box">
                      {currentVan.driverName || "No Driver Assigned"}
                    </div>
                  )}
                </div>

                <div className="sv-field-box">
                  <span className="sv-field-label">Current Status</span>
                  <select
                    className="sv-field-select"
                    value={currentVan.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={deleteBusy || vehicleUpdateBusy}
                    aria-label="Current status select"
                  >
                    <option value="ON_FIELD">On Field</option>
                    <option value="AVAILABLE">Available at Base</option>
                    <option value="ARRIVED">Arrived at Client Site</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="sv-details-hero-wrap">
              <img
                src={getVehicleImage(currentVan)}
                alt={currentVan.name || currentVan.id}
                className="sv-details-hero-img"
              />
            </div>
          </div>

          <div className="sv-table-card">
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                Loading vehicle inventory...
              </div>
            ) : vanItems.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <Empty description="No parts or equipment currently loaded into this vehicle." />
              </div>
            ) : (
              <>
                <table className="sv-custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: "20%" }}>SKU</th>
                      <th style={{ width: "35%" }}>ITEM NAME</th>
                      <th style={{ width: "15%" }}>CLASSIFICATION</th>
                      <th style={{ width: "15%" }}>STOCK IN VAN</th>
                      <th style={{ width: "15%", textAlign: "right" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.map((item) => (
                      <tr key={item.id || item._id}>
                        <td className="sv-td-sku">{item.sku}</td>
                        <td>{item.name}</td>
                        <td>{item.itemType?.toUpperCase() || "PARTS"}</td>
                        <td className="sv-td-qty">
                          {item.quantity} {item.unitOfMeasure?.toUpperCase()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Space size="small">
                            {canManage ? (
                              <button
                                type="button"
                                className="sv-btn-unload"
                                onClick={() => {
                                  setUnloadItem(item);
                                  setUnloadQty(1);
                                  setUnloadError("");
                                  setUnloadOverride(false);
                                }}
                              >
                                Unload to Branch
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="sv-btn-unload"
                                style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
                                onClick={() => {
                                  setConsumeItem(item);
                                  setConsumeQty(1);
                                  setConsumeJobOrderId("");
                                  setConsumeUsageId("");
                                  setConsumeNotes("");
                                  setConsumeError("");
                                  setConsumeSubmitted(false);
                                }}
                              >
                                Record Usage
                              </button>
                            )}
                          </Space>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="sv-pagination-bar">
                  <span className="sv-pagination-text">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, vanItems.length)} to{" "}
                    {Math.min(currentPage * pageSize, vanItems.length)} of {vanItems.length} entries
                  </span>

                  <div className="sv-pagination-controls">
                    <button
                      type="button"
                      className="sv-page-btn"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      &lt;
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`sv-page-btn ${p === currentPage ? "active" : ""}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="sv-page-btn"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <Modal
        open={Boolean(unloadItem)}
        title={unloadItem ? `Unload to Branch: ${unloadItem.name}` : ""}
        onCancel={() => setUnloadItem(null)}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        {unloadItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (unloadBusy) return;
              setUnloadBusy(true);
              setUnloadError("");
              save(
                "post",
                "/transfers",
                {
                  branchId: selectedVanId,
                  destinationId: branchId,
                  productId: unloadItem.id || unloadItem._id,
                  quantity: unloadQty,
                  reason: unloadOverride
                    ? `Emergency: Van Return to Warehouse ${branchId}`
                    : `Van Return to Warehouse ${branchId}`,
                  overrideOnField: unloadOverride,
                },
                `Returned ${unloadQty} ${unloadItem.unitOfMeasure} of ${unloadItem.name} back to warehouse stock.`,
              )
                .then(() => {
                  setUnloadItem(null);
                  return api("get", "/products", null, { branchId: selectedVanId });
                })
                .then((res) => {
                  if (res && res.data) {
                    const list = Array.isArray(res.data)
                      ? res.data
                      : Array.isArray(res.data?.items)
                        ? res.data.items
                        : [];
                    setVanItems(list.filter((item) => item.quantity > 0));
                  }
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
              Return unused parts or equipment from <strong>{currentVan?.name || currentVan?.id}</strong> back to warehouse inventory.
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
            <div className="sv-modal-field">
              <label>Quantity to Return ({unloadItem.unitOfMeasure})</label>
              <InventoryNumberInput
                aria-label="Quantity to return"
                required
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
            </div>
            <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
              <button
                type="button"
                className="sv-btn-back"
                onClick={() => setUnloadItem(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sv-btn-add"
                disabled={
                  unloadBusy ||
                  unloadQty <= 0 ||
                  (currentVan?.status === "ON_FIELD" && !unloadOverride)
                }
              >
                {unloadBusy ? "Processing..." : "Confirm Return"}
              </button>
            </Space>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(consumeItem)}
        title={consumeItem ? `Record Material Used: ${consumeItem.name}` : ""}
        onCancel={() => setConsumeItem(null)}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        {consumeItem && (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (consumeBusy || consumeTicketLoading || consumeJobsLoading) return;
              setConsumeSubmitted(true);
              if (Object.values(consumeValidation).some(Boolean)) return;
              setConsumeBusy(true);
              setConsumeError("");
              save(
                "post",
                `/service-vans/${selectedVanId}/consume`,
                {
                  productId: consumeItem.id || consumeItem._id,
                  quantity: consumeQty,
                  usageId: consumeUsageId,
                  jobId: consumeJobOrderId,
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
                        (item.id || item._id) === (updatedItem.id || updatedItem._id)
                          ? updatedItem
                          : item,
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
              Available in van: {consumeItem.quantity} {consumeItem.unitOfMeasure}
            </Typography.Text>
            <div className="sv-modal-field" style={{ marginTop: 12 }}>
              <label htmlFor="consume-usage-id">Usage ID</label>
              <Input
                id="consume-usage-id"
                readOnly
                value={formatMovementNumber(consumeUsageId)}
                placeholder={consumeTicketLoading ? "Generating usage ID..." : "Usage ID unavailable"}
                aria-label="Usage ID"
                status={consumeFieldErrors.usageId ? "error" : undefined}
                aria-invalid={Boolean(consumeFieldErrors.usageId)}
                aria-describedby={consumeFieldErrors.usageId ? "consume-usage-id-error" : undefined}
                style={{ marginTop: 4 }}
              />
              {consumeFieldErrors.usageId && <Typography.Text type="danger" id="consume-usage-id-error">{consumeFieldErrors.usageId}</Typography.Text>}
              {!consumeTicketLoading && !consumeUsageId && (
                <button type="button" className="sv-btn-back" onClick={() => setConsumeTicketAttempt((attempt) => attempt + 1)}>
                  Retry Usage ID
                </button>
              )}
            </div>
            <div className="sv-modal-field">
              <label htmlFor="consume-job-order">Current Job Order *</label>
              <Input
                id="consume-job-order"
                readOnly
                value={consumeJobs[0] ? `${formatJobNumber(consumeJobs[0].jobNumber)} · ${consumeJobs[0].title}` : ""}
                placeholder={consumeJobsLoading ? "Loading current assignment..." : "No current job assigned"}
                aria-label="Current Job Order"
                status={consumeFieldErrors.jobOrder ? "error" : undefined}
                aria-invalid={Boolean(consumeFieldErrors.jobOrder)}
                aria-describedby={consumeFieldErrors.jobOrder ? "consume-job-order-error" : undefined}
                style={{ marginTop: 4 }}
              />
              {consumeFieldErrors.jobOrder && <Typography.Text type="danger" id="consume-job-order-error">{consumeFieldErrors.jobOrder}</Typography.Text>}
              {!consumeJobsLoading && consumeJobs.length === 0 && !consumeFieldErrors.jobOrder && (
                <Typography.Paragraph type="secondary">No current job assigned. Ask your admin or manager to assign a job from Job Orders.</Typography.Paragraph>
              )}
              {consumeJobOrderId && <Typography.Paragraph type="secondary">Customer: {consumeJobs[0]?.customerName} · Service location: {consumeJobs[0]?.location}</Typography.Paragraph>}
            </div>
            <div className="sv-modal-field">
              <label htmlFor="consume-quantity">Quantity Used ({consumeItem.unitOfMeasure}) *</label>
              <InventoryNumberInput
                id="consume-quantity"
                aria-label="Quantity Used"
                status={consumeFieldErrors.quantity ? "error" : undefined}
                aria-invalid={Boolean(consumeFieldErrors.quantity)}
                aria-describedby={consumeFieldErrors.quantity ? "consume-quantity-error" : undefined}
                required
                min={["METER", "FOOT", "KG", "LITER"].includes(consumeItem.unitOfMeasure) ? 0.001 : 1}
                max={consumeItem.quantity}
                step={["METER", "FOOT", "KG", "LITER"].includes(consumeItem.unitOfMeasure) ? 0.001 : 1}
                precision={["METER", "FOOT", "KG", "LITER"].includes(consumeItem.unitOfMeasure) ? 3 : 0}
                value={consumeQty}
                onChange={setConsumeQty}
                style={{ width: "100%", marginTop: 4 }}
              />
              {consumeFieldErrors.quantity && <Typography.Text type="danger" id="consume-quantity-error">{consumeFieldErrors.quantity}</Typography.Text>}
            </div>
            <div className="sv-modal-field">
              <label htmlFor="consume-notes">Notes *</label>
              <Input.TextArea
                id="consume-notes"
                status={consumeFieldErrors.notes ? "error" : undefined}
                aria-invalid={Boolean(consumeFieldErrors.notes)}
                aria-describedby={consumeFieldErrors.notes ? "consume-notes-error" : undefined}
                required
                maxLength={200}
                value={consumeNotes}
                onChange={(event) => setConsumeNotes(event.target.value)}
                placeholder="Describe where the material was installed/used"
                rows={3}
                style={{ marginTop: 4 }}
              />
              {consumeFieldErrors.notes && <Typography.Text type="danger" id="consume-notes-error">{consumeFieldErrors.notes}</Typography.Text>}
            </div>
            <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
              <button
                type="button"
                className="sv-btn-back"
                onClick={() => setConsumeItem(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sv-btn-add"
                disabled={consumeBusy || consumeTicketLoading || consumeJobsLoading}
              >
                {consumeBusy ? "Saving..." : "Record Usage"}
              </button>
            </Space>
          </form>
        )}
      </Modal>

      <Modal
        open={newVanModal}
        title="Add New Service Vehicle"
        onCancel={() => setNewVanModal(false)}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newVanBusy) return;
            if (!newVanType) { setNewVanError("Select a vehicle type."); return; }
            setNewVanBusy(true);
            setNewVanError("");
            const driver = usersList.find((u) => (u.id || u._id) === newVanDriver);
            save(
              "post",
              "/service-vans",
              {
                id: newVanId.trim(),
                name: newVanName.trim(),
                plateNumber: newVanPlate.trim(),
                vehicleType: newVanType,
                driverId: newVanDriver,
                driverName: driver ? driver.fullName : "",
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
          <div className="sv-modal-field">
            <label>Vehicle ID / Code</label>
            <Input aria-label="Vehicle ID" readOnly value={newVanId} style={{ marginTop: 4 }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Generated automatically.
            </Typography.Text>
          </div>
          <div className="sv-modal-field">
            <label>Vehicle Name / Description</label>
            <Input
              required
              placeholder="e.g. Field Service Van Charlie"
              aria-label="Vehicle name"
              maxLength={200}
              value={newVanName}
              onChange={(e) => setNewVanName(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <div className="sv-modal-field">
            <label>Vehicle Type</label>
            <Select aria-label="New vehicle type" placeholder="Select vehicle type" value={newVanType || undefined}
              disabled={newVanBusy} onChange={setNewVanType}
              options={VEHICLE_TYPES.map(({ value, label }) => ({ value, label }))} style={{ width: "100%", marginTop: 4 }} />
            {newVanType && <figure className="sv-vehicle-type-preview">
              <img src={getVehicleImage({ vehicleType: newVanType })}
                alt={`${VEHICLE_TYPES.find((type) => type.value === newVanType)?.label} vehicle preview`} />
              <figcaption>Photo selected automatically by vehicle type.</figcaption>
            </figure>}
          </div>
          <div className="sv-modal-field">
            <label>Vehicle Plate Number</label>
            <Input
              placeholder="e.g. NCD-1982"
              aria-label="Vehicle plate number"
              maxLength={200}
              value={newVanPlate}
              onChange={(e) => setNewVanPlate(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <div className="sv-modal-field">
            <label>Assigned Lead Technician / Driver (optional)</label>
            <Select
              aria-label="New vehicle driver"
              showSearch
              optionFilterProp="label"
              allowClear
              placeholder="Select technician"
              value={newVanDriver}
              onChange={(val) => setNewVanDriver(val || "")}
              style={{ width: "100%", marginTop: 4 }}
              options={driverOptions}
            />
          </div>
          <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
            <button
              type="button"
              className="sv-btn-back"
              onClick={() => setNewVanModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sv-btn-add"
              disabled={newVanBusy || !newVanId.trim() || !newVanName.trim() || !newVanType}
            >
              {newVanBusy ? "Registering..." : "Register Vehicle"}
            </button>
          </Space>
        </form>
      </Modal>

      <Modal
        open={editVanModal}
        title={editingVan ? `Edit Vehicle: ${editingVan.id}` : "Edit Vehicle"}
        onCancel={() => setEditVanModal(false)}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        {editingVan && (
          <form onSubmit={handleEditVanSubmit}>
            {editVanError && (
              <Alert
                type="error"
                showIcon
                message={editVanError}
                style={{ marginBottom: 12 }}
              />
            )}
            <div className="sv-modal-field">
              <label>Vehicle Name</label>
              <Input
                required
                value={editVanName}
                onChange={(e) => setEditVanName(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
            <div className="sv-modal-field">
              <label>Plate Number</label>
              <Input
                value={editVanPlate}
                onChange={(e) => setEditVanPlate(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
            <div className="sv-modal-field">
              <label>Assigned Driver</label>
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder="Select technician"
                value={editVanDriver}
                onChange={(val) => setEditVanDriver(val || "")}
                style={{ width: "100%", marginTop: 4 }}
                options={driverOptions}
              />
            </div>
            <div className="sv-modal-field">
              <label>Status</label>
              <Select
                value={editVanStatus}
                onChange={(val) => setEditVanStatus(val)}
                style={{ width: "100%", marginTop: 4 }}
                options={[
                  { value: "AVAILABLE", label: "Available at Base" },
                  { value: "ON_FIELD", label: "On Field" },
                  { value: "ARRIVED", label: "Arrived at Client Site" },
                  { value: "MAINTENANCE", label: "Under Maintenance" },
                ]}
              />
            </div>
            <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
              <button
                type="button"
                className="sv-btn-back"
                onClick={() => setEditVanModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sv-btn-add"
                disabled={editVanBusy}
              >
                {editVanBusy ? "Saving..." : "Save Changes"}
              </button>
            </Space>
          </form>
        )}
      </Modal>

      <Modal
        title="Delete Service Vehicle"
        open={Boolean(deleteVan)}
        onCancel={() => !deleteBusy && setDeleteVan(null)}
        onOk={confirmDelete}
        okText="Delete Vehicle"
        okButtonProps={{ danger: true, disabled: Boolean(deleteBlocked) }}
        cancelButtonProps={{ disabled: deleteBusy }}
        confirmLoading={deleteBusy}
        closable={!deleteBusy}
        maskClosable={false}
      >
        {deleteBlocked ? (
          <Alert
            type="warning"
            showIcon
            title="Vehicle is busy"
            description="Unassign its driver and set it to Available before deleting it."
          />
        ) : (
          <Typography.Paragraph>
            Delete {deleteTarget?.name}? The vehicle must have no stock or open requests.
            Its past stock movements and request history will be kept.
          </Typography.Paragraph>
        )}
        {deleteError && <Alert type="error" showIcon title={deleteError} />}
      </Modal>
    </div>
  );
}
