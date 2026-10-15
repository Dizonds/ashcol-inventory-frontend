import {
  render as testingRender,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { StyleProvider } from "@ant-design/cssinjs";
import App from "./App";
import LoginPage from "./components/LoginPage";
import InventorySection from "./components/InventorySection";
import PostMovementPage from "./components/PostMovementPage";
import DashboardPage from "./components/DashboardPage";
import { api } from "./api";

jest.mock("./api", () => ({
  api: jest.fn(),
  errorMessage: (error) => error.message,
}));
// CRA's older jsdom cannot parse all Ant Design 6 CSS. Browser tests cover styling.
function render(ui) {
  return testingRender(<StyleProvider mock="server">{ui}</StyleProvider>);
}
const item = {
  id: "item-1",
  sku: "AC-UNIT",
  name: "Test air conditioner",
  branchId: "LOCAL-WAREHOUSE",
  itemType: "AC Unit",
  category: "Split Type",
  brand: "Carrier",
  capacity: "1 HP",
  quantity: 3,
  unitCost: 100,
  listPrice: 150,
  unitOfMeasure: "UNIT",
  reorderLevel: 0,
};
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  jest.clearAllMocks();
});

test("opens on real login rather than a default manager account", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.queryByText("Branches & Accounts")).not.toBeInTheDocument();
  expect(api).not.toHaveBeenCalled();
});

test("rejected login keeps the user signed out and shows the error", async () => {
  api.mockRejectedValue(new Error("Invalid email or password."));
  const onLogin = jest.fn();
  render(<LoginPage onLogin={onLogin} />);
  fireEvent.change(screen.getByLabelText("Work email"), {
    target: { value: "tech@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "wrong-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(
    await screen.findByText("Invalid email or password."),
  ).toBeInTheDocument();
  expect(onLogin).not.toHaveBeenCalled();
  expect(sessionStorage.getItem("ashcol_inventory_token")).toBeNull();
});

test("employee can inspect stock but cannot edit, archive or post it", () => {
  render(
    <InventorySection
      items={[item]}
      brands={[]}
      user={{ role: "EMPLOYEE" }}
      branchId="LOCAL-WAREHOUSE"
      save={jest.fn()}
    />,
  );
  expect(
    screen.queryByRole("button", { name: "Edit" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Archive" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Post Movement" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Specs" }));
  expect(screen.getByText("Item specifications")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Save item" }),
  ).not.toBeInTheDocument();
});

test("manager specification save excludes quantity", async () => {
  const save = jest.fn().mockResolvedValue(item);
  render(
    <InventorySection
      items={[item]}
      brands={[{ name: "Carrier" }]}
      user={{ role: "MANAGER" }}
      branchId="LOCAL-WAREHOUSE"
      save={save}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByLabelText("Current stock (read only)")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Save item" }));
  await waitFor(() => expect(save).toHaveBeenCalled());
  expect(save.mock.calls[0][2].quantity).toBeUndefined();
  expect(save.mock.calls[0][2].reorderLevel).toBe(0);
});

test("failed movement preserves entered data so it can be corrected", async () => {
  api.mockResolvedValue({ data: { referenceId: "STI0001" } });
  const save = jest.fn().mockRejectedValue(new Error("Connection failed"));
  render(
    <PostMovementPage
      items={[item]}
      branches={[]}
      branchId="LOCAL-WAREHOUSE"
      user={{ role: "MANAGER" }}
      save={save}
      preselectedItemId={item.id}
    />,
  );
  fireEvent.change(
    screen.getByLabelText("Receipt, transfer reference, or explanation"),
    { target: { value: "Receipt 100" } },
  );
  await waitFor(() => expect(screen.getByRole("button", { name: "Confirm & Post" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Confirm & Post" }));
  expect(await screen.findByText("STI0001")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Yes, Confirm & Post" }));
  expect(await screen.findByText("Connection failed")).toBeInTheDocument();
  expect(
    screen.getByLabelText("Receipt, transfer reference, or explanation"),
  ).toHaveValue("Receipt 100");
  expect(save.mock.calls[0][2].delta).toBe(1);
  expect(save.mock.calls[0][2].referenceId).toBe("STI0001");
});

test("dashboard separates units and distinguishes cost from selling value", () => {
  const tubing = {
    ...item,
    id: "tube",
    sku: "TUBE",
    itemType: "Material / Part",
    category: "Copper Tubing",
    quantity: 2.5,
    unitOfMeasure: "METER",
    unitCost: 20,
    listPrice: 30,
  };
  render(
    <DashboardPage items={[item, tubing]} requests={[]} canManage={false} />,
  );
  expect(screen.getByText("3 UNIT")).toBeInTheDocument();
  expect(screen.getByText("2.5 METER")).toBeInTheDocument();
  expect(screen.getByText("₱350.00")).toBeInTheDocument();
  expect(screen.getByText("₱525.00")).toBeInTheDocument();
});
