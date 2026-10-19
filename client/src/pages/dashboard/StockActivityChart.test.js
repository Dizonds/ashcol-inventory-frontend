import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import StockActivityChart from "./StockActivityChart";

jest.mock("antd", () => ({
  Tooltip: ({ children }) => children,
  Modal: ({ open, title, children, onCancel }) => open ? (
    <div role="dialog" aria-label={title}>
      {children}<button onClick={onCancel}>Close details</button>
    </div>
  ) : null,
  Table: ({ dataSource }) => <p>Records: {dataSource.length}</p>,
}));

test("zooming in while hovering a recent day keeps the chart usable", () => {
  render(<StockActivityChart />);
  const viewport = screen.getByRole("region", { name: /Interactive stock chart/ });
  viewport.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 820, bottom: 320, width: 820, height: 320,
  });
  fireEvent.mouseMove(viewport, { clientX: 790, clientY: 100 });
  expect(screen.getByRole("img", { name: "Stock movement activity trend chart" })).toBeInTheDocument();

  // The hovered index belonged to a longer date range before zooming in.
  expect(() => {
    for (let step = 0; step < 5; step += 1) {
      fireEvent.keyDown(viewport, { key: "+" });
    }
  }).not.toThrow();
  expect(screen.getByRole("img", { name: "Stock movement activity trend chart" })).toBeInTheDocument();
  expect(() => fireEvent.mouseMove(viewport, { clientX: 600, clientY: 100 })).not.toThrow();
});

test("individual unit selections filter pieces and measured stock", () => {
  const createdAt = new Date().toISOString();
  render(<StockActivityChart movementHistory={[
    { id: "pieces", createdAt, movementType: "STOCK_IN", quantityDelta: 3, unitOfMeasure: "PCS" },
    { id: "meters", createdAt, movementType: "STOCK_IN", quantityDelta: 1.25, unitOfMeasure: "METER" },
  ]} />);
  const selector = screen.getByRole("combobox", { name: "Chart unit of measure" });
  fireEvent.change(selector, { target: { value: "PCS" } });
  expect(screen.getByText((_, element) => element.matches(".chip-stock-in .metric-chip-val"))).toHaveTextContent("+3");
  fireEvent.change(selector, { target: { value: "METER" } });
  expect(screen.getByText((_, element) => element.matches(".chip-stock-in .metric-chip-val"))).toHaveTextContent("+1.25");
});

test("Overall unit combines movements in Line and Bar and persists on return", () => {
  const createdAt = new Date().toISOString();
  const onViewSave = jest.fn();
  const movementHistory = [
    { id: "pieces", createdAt, movementType: "STOCK_IN", quantityDelta: 3, unitOfMeasure: "PCS" },
    { id: "meters", createdAt, movementType: "STOCK_IN", quantityDelta: 1.25, unitOfMeasure: "METER" },
    { id: "dispatch", createdAt, movementType: "STOCK_OUT", quantityDelta: -0.5, unitOfMeasure: "METER" },
  ];
  const view = render(<StockActivityChart movementHistory={movementHistory} onViewSave={onViewSave} />);
  fireEvent.change(screen.getByLabelText("Chart unit of measure"), { target: { value: "OVERALL" } });
  for (const mode of ["Line", "Bar"]) {
    fireEvent.click(screen.getByRole("button", { name: mode, exact: true }));
    expect(screen.getByLabelText("Chart unit of measure")).toHaveValue("OVERALL");
    expect(screen.getByText(/Daily movement flow.*mixed units/)).toBeInTheDocument();
    expect(screen.getByText((_, element) => element.matches(".chip-stock-in .metric-chip-val"))).toHaveTextContent("+4.25");
    expect(screen.getByText((_, element) => element.matches(".chip-stock-out .metric-chip-val"))).toHaveTextContent("0.5");
    fireEvent.keyDown(screen.getByRole("button", { name: /^View Stock In details/ }), { key: "Enter" });
    expect(screen.getByText("Records: 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
  }
  view.unmount();
  const saved = onViewSave.mock.calls[0][0];
  expect(saved).toEqual(expect.objectContaining({ chartMode: "bar", unitOfMeasure: "OVERALL" }));
  render(<StockActivityChart movementHistory={movementHistory} initialView={saved} />);
  expect(screen.getByLabelText("Chart unit of measure")).toHaveValue("OVERALL");
});

test("bar selection survives leaving and returning to the chart", () => {
  const onViewSave = jest.fn();
  const movementHistory = [{
    id: "restock", createdAt: new Date().toISOString(),
    movementType: "STOCK_IN", quantityDelta: 5,
  }];
  const view = render(<StockActivityChart movementHistory={movementHistory} onViewSave={onViewSave} />);
  fireEvent.click(screen.getByRole("button", { name: "Bar", exact: true }));
  expect(screen.getByRole("button", { name: /^View Stock In details/ })).toHaveAttribute("height");
  view.unmount();
  expect(onViewSave).toHaveBeenCalledWith(expect.objectContaining({ chartMode: "bar" }));
  render(<StockActivityChart movementHistory={movementHistory} initialView={onViewSave.mock.calls[0][0]} />);
  expect(screen.getByRole("button", { name: "Bar", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("button", { name: "Net Movement", exact: true })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Line", exact: true }));
  expect(screen.getByRole("button", { name: "Line", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("Overall mode and its unit survive leaving and returning to the chart", () => {
  const onViewSave = jest.fn();
  const props = { branchId: "LOCAL-WAREHOUSE", items: [{ quantity: 5, unitOfMeasure: "PCS" }],
    movementHistory: [{ branchId: "LOCAL-WAREHOUSE", createdAt: new Date().toISOString(), unitOfMeasure: "PCS", quantityDelta: 5 }], onViewSave };
  const view = render(<StockActivityChart {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Overall", exact: true }));
  fireEvent.change(screen.getByLabelText("Chart unit of measure"), { target: { value: "PCS" } });
  expect(screen.getByTestId("stock-balance-current")).toHaveTextContent("5 PCS");
  view.unmount();
  const saved = onViewSave.mock.calls[0][0];
  expect(saved).toEqual(expect.objectContaining({ chartMode: "overall", overallUnit: "PCS" }));
  render(<StockActivityChart {...props} initialView={saved} />);
  expect(screen.getByRole("button", { name: "Overall", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByLabelText("Chart unit of measure")).toHaveValue("PCS");
  fireEvent.click(screen.getByRole("button", { name: "Line", exact: true }));
  expect(screen.getByRole("img", { name: "Stock movement activity trend chart" })).toBeInTheDocument();
});

test("Overall supports navigation, axis stretching, details, expansion, and saved camera", () => {
  const now = new Date();
  const old = new Date(now); old.setDate(old.getDate() - 30);
  const onViewSave = jest.fn(), onExpandedChange = jest.fn();
  const props = { branchId: "LOCAL-WAREHOUSE", items: [{ quantity: 15, unitOfMeasure: "PCS" }],
    movementHistory: [
      { id: "old", branchId: "LOCAL-WAREHOUSE", createdAt: old.toISOString(), unitOfMeasure: "PCS", quantityDelta: 10, itemName: "Old stock" },
      { id: "recent", branchId: "LOCAL-WAREHOUSE", createdAt: now.toISOString(), unitOfMeasure: "PCS", quantityDelta: 5, itemName: "Recent stock" },
    ], initialView: { chartMode: "overall" }, onViewSave, onExpandedChange };
  const view = render(<StockActivityChart {...props} />);
  const viewport = screen.getByRole("region", { name: "Interactive overall stock chart" });
  viewport.getBoundingClientRect = () => ({ left: 0, top: 0, width: 820, height: 320 });
  const path = () => screen.queryByTestId('stock-balance-line').getAttribute("d");
  const originalPath = path();
  fireEvent.click(screen.getByRole("button", { name: "Zoom in", exact: true }));
  expect(path()).not.toEqual(originalPath);
  fireEvent.click(screen.getByRole("button", { name: "Reset", exact: true }));
  fireEvent.keyDown(screen.getByRole("button", { name: /^1 stock movement: 15 mixed units/ }), { key: "Enter" });
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("Records: 1")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close details" }));
  const originalPointerEvent = window.PointerEvent;
  window.PointerEvent = MouseEvent;
  try {
    const point = screen.getByRole("button", { name: /^1 stock movement: 15 mixed units/ });
    fireEvent.pointerDown(point, { clientX: 400, clientY: 100 });
    fireEvent.pointerMove(viewport, { clientX: 650, clientY: 100 });
    fireEvent.pointerUp(viewport, { clientX: 650, clientY: 100 });
    fireEvent.click(point);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^1 stock movement: 15 mixed units/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Latest", exact: true }));
    expect(screen.getByRole("button", { name: /^1 stock movement: 15 mixed units/ })).toBeInTheDocument();
    const beforeStretch = path();
    fireEvent.pointerDown(viewport, { clientX: 20, clientY: 150 });
    fireEvent.pointerMove(viewport, { clientX: 20, clientY: 130 });
    fireEvent.pointerUp(viewport, { clientX: 20, clientY: 130 });
    expect(path()).not.toEqual(beforeStretch);
    fireEvent.click(screen.getByRole("button", { name: "Auto scale", exact: true }));
    fireEvent.pointerDown(viewport, { clientX: 400, clientY: 310 });
    fireEvent.pointerMove(viewport, { clientX: 350, clientY: 310 });
    fireEvent.pointerUp(viewport, { clientX: 350, clientY: 310 });
    fireEvent.wheel(viewport, { clientX: 400, deltaY: 100 });
  } finally { window.PointerEvent = originalPointerEvent; }
  fireEvent.click(screen.getByRole("button", { name: "Expand chart" }));
  expect(onExpandedChange).toHaveBeenCalledWith(true);
  view.unmount();
  const saved = onViewSave.mock.calls[0][0];
  expect(saved.visibleDays).toBeGreaterThan(7);
  expect(saved.chartMode).toBe("overall");
  render(<StockActivityChart {...props} initialView={saved} />);
  expect(screen.getByRole("region", { name: "Interactive overall stock chart" })).toBeInTheDocument();
});

test("each bar opens all daily movements and dragging does not open details", () => {
  const createdAt = new Date().toISOString();
  render(<StockActivityChart initialView={{ chartMode: "bar" }} movementHistory={[
    { id: "in", createdAt, movementType: "STOCK_IN", quantityDelta: 4 },
    { id: "out", createdAt, movementType: "STOCK_OUT", quantityDelta: -9 },
  ]} />);
  for (const label of ["Stock In", "Stock Out", "Net Change"]) {
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^View ${label} details`) }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Records: 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
  }
  const originalPointerEvent = window.PointerEvent;
  window.PointerEvent = MouseEvent;
  try {
    const bar = screen.getByRole("button", { name: /^View Stock In details/ });
    const viewport = screen.getByRole("region", { name: /Interactive stock chart/ });
    fireEvent.pointerDown(bar, { clientX: 200, clientY: 100 });
    fireEvent.pointerMove(viewport, { clientX: 230, clientY: 100 });
    fireEvent.pointerUp(viewport, { clientX: 230, clientY: 100 });
    fireEvent.click(bar);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  } finally {
    window.PointerEvent = originalPointerEvent;
  }
});
