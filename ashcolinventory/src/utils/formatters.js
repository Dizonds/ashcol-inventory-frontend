export function formatMoney(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

// Display request references consistently without changing their stored values.
export function formatRequestNumber(value) {
  if (typeof value !== "string") return value;
  const match = value.match(/^REQ\s*-?\s*(\d+)$/i);
  return match ? `REQ - ${match[1]}` : value;
}

export function formatMovementNumber(value) {
  if (typeof value !== "string") return value;
  const match = value.match(/^(STI|STO)\s*-?\s*(\d+)$/i);
  return match ? `${match[1].toUpperCase()} - ${match[2]}` : value;
}

export function formatJobNumber(value) {
  if (typeof value !== "string") return value;
  const match = value.match(/^JOB\s*-?\s*(\d+)$/i);
  return match ? `JOB - ${match[1]}` : value;
}
