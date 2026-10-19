export function formatMoney(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}


export function formatRequestNumber(value) {
  if (typeof value !== "string") return value;
  const match = value.match(/^REQ\s*-?\s*(\d+)$/i);
  return match ? `REQ - ${match[1]}` : value;
}

export function formatMovementNumber(value) {
  if (typeof value !== "string") return value;
  const match = value.match(/^(STI|STO|TRI|TRO|VAN|USE)\s*-?\s*(\d+)$/i);
  return match ? `${match[1].toUpperCase()} - ${match[2]}` : value;
}

export function formatJobNumber(value) {
  if (typeof value !== "string") return value;
  const match = value.match(/^JOB\s*-?\s*(\d+)$/i);
  return match ? `JOB - ${match[1]}` : value;
}
