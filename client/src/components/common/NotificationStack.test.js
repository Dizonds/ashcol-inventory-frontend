import { render, screen, fireEvent, act, within } from "@testing-library/react";
import NotificationStack from "./NotificationStack";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("each stacked notice expires after its own three seconds and exit animation", () => {
  const onDismiss = jest.fn();
  const first = { id: 1, type: "success", text: "Brand added." };
  const second = { id: 2, type: "success", text: "Supplier registered." };
  const { rerender } = render(<NotificationStack notices={[first]} onDismiss={onDismiss} />);
  act(() => jest.advanceTimersByTime(1500));
  rerender(<NotificationStack notices={[second, first]} onDismiss={onDismiss} />);
  expect(screen.getByTestId(`notice-layer-${second.id}`)).toHaveStyle({ "--stack-index": "0" });
  expect(screen.getByTestId(`notice-layer-${first.id}`)).toHaveStyle({ "--stack-index": "1" });
  act(() => jest.advanceTimersByTime(1500));
  expect(screen.getAllByRole("status").find((notice) => within(notice).queryByText(first.text))).toHaveClass("is-leaving");
  expect(screen.getAllByRole("status").find((notice) => within(notice).queryByText(second.text))).not.toHaveClass("is-leaving");
  expect(onDismiss).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(320));
  expect(onDismiss).toHaveBeenCalledWith(1);
  act(() => jest.advanceTimersByTime(1180));
  expect(screen.getAllByRole("status").find((notice) => within(notice).queryByText(second.text))).toHaveClass("is-leaving");
  act(() => jest.advanceTimersByTime(320));
  expect(onDismiss).toHaveBeenLastCalledWith(2);
  expect(onDismiss).toHaveBeenCalledTimes(2);
});

test("manual dismissal uses the exit animation and cleans up timers on unmount", () => {
  const onDismiss = jest.fn();
  const notice = { id: 1, type: "error", text: "Unable to save brand." };
  const { unmount } = render(<NotificationStack notices={[notice]} onDismiss={onDismiss} />);
  expect(screen.getByRole("alert")).toHaveTextContent(notice.text);
  fireEvent.click(screen.getByRole("button", { name: `Dismiss notification: ${notice.text}` }));
  expect(screen.getByRole("alert")).toHaveClass("is-leaving");
  act(() => jest.advanceTimersByTime(320));
  expect(onDismiss).toHaveBeenCalledTimes(1);
  unmount();
  act(() => jest.runOnlyPendingTimers());
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
