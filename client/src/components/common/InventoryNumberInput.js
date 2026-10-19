import React from "react";
import { InputNumber } from "antd";


export default function InventoryNumberInput({ precision = 0, min = 0, max = 100000000, ...props }) {
  const pattern = precision === 0 ? /^\d*$/ : new RegExp(`^\\d*(?:\\.\\d{0,${precision}})?$`);
  const clean = (value) => {
    const [whole, ...fraction] = String(value ?? "").replace(/[^\d.]/g, "").split(".");
    return precision && fraction.length ? `${whole}.${fraction.join("").slice(0, precision)}` : whole;
  };
  const accepts = (input, text) => {
    const value = input.value;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? start;
    return pattern.test(value.slice(0, start) + text + value.slice(end));
  };
  return (
    <InputNumber
      {...props}
      min={min}
      max={max}
      precision={precision}
      controls={false}
      inputMode={precision ? "decimal" : "numeric"}
      onChangeCapture={(event) => {

        if (!pattern.test(event.target.value)) event.target.value = clean(event.target.value);
      }}
      onKeyDown={(event) => {
        if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && !accepts(event.target, event.key)) event.preventDefault();
      }}
      onBeforeInput={(event) => {
        if (event.data && !accepts(event.target, event.data)) event.preventDefault();
      }}
      onPaste={(event) => {
        if (!accepts(event.target, event.clipboardData.getData("text"))) event.preventDefault();
      }}
      formatter={(value, { userTyping, input }) => {
        if (!userTyping) return value === "" || value == null ? "" : precision === 2 ? Number(value).toFixed(2) : String(value);
        return clean(input);
      }}
    />
  );
}
