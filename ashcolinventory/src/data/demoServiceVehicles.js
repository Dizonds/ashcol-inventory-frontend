export const DEMO_SERVICE_VEHICLES = [
  { id: "DEMO-VAN-01", name: "Demo Service Vehicle Alpha", plateNumber: "DEMO-001" },
  { id: "DEMO-VAN-02", name: "Demo Service Vehicle Bravo", plateNumber: "DEMO-002" },
  { id: "DEMO-VAN-03", name: "Demo Service Vehicle Charlie", plateNumber: "DEMO-003" },
  { id: "DEMO-VAN-04", name: "Demo Service Vehicle Delta", plateNumber: "DEMO-004" },
  { id: "DEMO-VAN-05", name: "Demo Service Vehicle Echo", plateNumber: "DEMO-005" },
].map((vehicle) => ({
  ...vehicle,
  isDemo: true,
  status: "AVAILABLE",
  driverId: "",
  driverName: "",
}));
