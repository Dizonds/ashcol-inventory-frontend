import { allowedPage } from "./navigation";

test("remembered pages remain available to the correct roles", () => {
  expect(allowedPage("service_vehicles", "EMPLOYEE")).toBe("service_vehicles");
  expect(allowedPage("suppliers", "MANAGER")).toBe("suppliers");
  expect(allowedPage("user_management", "ADMIN")).toBe("user_management");
});

test("invalid or unauthorized remembered pages fall back to Overview", () => {
  expect(allowedPage("user_management", "EMPLOYEE")).toBe("dashboard");
  expect(allowedPage("user_management", "MANAGER")).toBe("dashboard");
  expect(allowedPage("post_movement", "EMPLOYEE")).toBe("dashboard");
  expect(allowedPage("unknown", "ADMIN")).toBe("dashboard");
});
