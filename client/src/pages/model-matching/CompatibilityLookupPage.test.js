import { render, screen } from "@testing-library/react";
import CompatibilityLookupPage from "./CompatibilityLookupPage";

test("compatibility requires an explicit model mapping and keeps units separate", () => {
  const base = { unitOfMeasure: "PCS", quantity: 3, itemType: "Spare Part", category: "Compressors", brand: "Carrier", name: "Part", sku: "PART" };
  render(<CompatibilityLookupPage items={[
    { ...base, id: "ac", itemType: "AC Unit", name: "AC One", sku: "AC-1" },
    { ...base, id: "same-brand", name: "Unverified same brand" },
    { ...base, id: "compressor", name: "Unverified compressor", brand: "Other" },
    { ...base, id: "prefix", name: "Wrong model", compatibleModels: ["AC-10"] },
    { ...base, id: "explicit", name: "Confirmed compressor", compatibleModels: ["AC-1"] },
    { ...base, id: "tubing", name: "Confirmed tubing", quantity: 1.25, unitOfMeasure: "METER", compatibleModels: ["ac-1"] },
    { ...base, id: "archived", name: "Archived part", compatibleModels: ["AC-1"], archived: true },
  ]} />);
  expect(screen.getByText("Confirmed compressor")).toBeInTheDocument();
  expect(screen.getByText("Confirmed tubing")).toBeInTheDocument();
  for (const text of ["Unverified same brand", "Unverified compressor", "Wrong model", "Archived part"]) expect(screen.queryByText(text)).not.toBeInTheDocument();
  expect(screen.getByText("3 PCS · 1.25 METER")).toBeInTheDocument();
});
