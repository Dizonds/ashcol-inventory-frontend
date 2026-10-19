import { allowedPage } from "./navigation";

test("remembered pages remain available to the correct roles", () => {
  expect(allowedPage("service_vehicles", "EMPLOYEE")).toBe("service_vehicles");
  expect(allowedPage("suppliers", "MANAGER")).toBe("suppliers");
  expect(allowedPage("user_management", "ADMIN")).toBe("user_management");
});

test("invalid or unauthorized remembered pages fall back to the role's home page", () => {
  expect(allowedPage("user_management", "EMPLOYEE")).toBe("inventory");
  expect(allowedPage("user_management", "MANAGER")).toBe("dashboard");
  expect(allowedPage("post_movement", "EMPLOYEE")).toBe("inventory");
  expect(allowedPage("dashboard", "EMPLOYEE")).toBe("inventory");
  expect(allowedPage("suppliers", "EMPLOYEE")).toBe("inventory");
  expect(allowedPage("unknown", "EMPLOYEE")).toBe("inventory");
  expect(allowedPage("unknown", "ADMIN")).toBe("dashboard");
});
