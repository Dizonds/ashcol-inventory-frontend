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

test("each bar opens all daily movements and dragging does not open details", () => {
  const createdAt = new Date().toISOString();
  render(<StockActivityChart initialView={{ chartMode: "bar" }} movementHistory={[
    { id: "in", createdAt, movementType: "STOCK_IN", quantityDelta: 4 },
    { id: "out", createdAt, movementType: "STOCK_OUT", quantityDelta: -9 },
  ]} />);
  for (const label of ["Stock In", "Stock Out", "Net Balance"]) {
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
