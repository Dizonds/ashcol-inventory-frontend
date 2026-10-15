import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import StockActivityChart from "./StockActivityChart";

jest.mock("antd", () => ({
  Tooltip: ({ children }) => children,
  Modal: () => null,
  Table: () => null,
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
