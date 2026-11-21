export function addCalendarMonths(date, months) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function getWarrantyStatus(warranty, now = new Date()) {
  if (!warranty) return null;
  if (warranty.voidedAt) return 'VOID';
  return now >= warranty.warrantyExpiryDate ? 'EXPIRED' : 'ACTIVE';
}
