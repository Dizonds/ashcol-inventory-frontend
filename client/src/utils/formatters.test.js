import { formatMovementNumber } from "./formatters";

test.each([
  ["TRI0001", "TRI - 0001"], ["TRO9128", "TRO - 9128"], ["tri - 10000", "TRI - 10000"],
  ["STI0001", "STI - 0001"], ["STO0002", "STO - 0002"], ["TRA26T8V8", "TRA26T8V8"],
  ["VAN0001", "VAN - 0001"],
  ["USE0003", "USE - 0003"], ["use - 10000", "USE - 10000"],
])("formats movement reference %s", (value, expected) => {
  expect(formatMovementNumber(value)).toBe(expected);
});
