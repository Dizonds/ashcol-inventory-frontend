import { render, screen, fireEvent } from "@testing-library/react";
import BrandLogo from "./BrandLogo";
import { api } from "../../api";

jest.mock("../../api", () => ({ api: jest.fn() }));

test("brand card requests a logo from the backend and shows only the image", async () => {
  api.mockResolvedValue({ data: { logoUrl: "https://upload.wikimedia.org/logo.svg", sourceUrl: "https://commons.wikimedia.org/wiki/File:Logo.svg" } });
  render(<BrandLogo brand={{ id: "brand-1", name: "Daikin" }} />);
  const image = await screen.findByRole("img", { name: "Daikin" });
  expect(api).toHaveBeenCalledWith("get", "/brands/brand-1/logo");
  expect(image).toHaveAttribute("src", "https://upload.wikimedia.org/logo.svg");
  expect(screen.queryByText("Daikin")).not.toBeInTheDocument();
  fireEvent.error(image);
  expect(screen.getByText("Daikin")).toBeInTheDocument();
});

test("unavailable logo API keeps the brand name readable", async () => {
  api.mockRejectedValue(new Error("Offline"));
  render(<BrandLogo brand={{ id: "brand-2", name: "Kembla" }} />);
  expect(await screen.findByText("Kembla")).toBeInTheDocument();
});
