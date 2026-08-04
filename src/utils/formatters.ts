/**
 * Utility functions for date formatting and currency formatting.
 */

/**
 * Formats YYYY-MM-DD or ISO date string into DD-MM-YYYY format.
 * Example: '2026-06-15' -> '15-06-2026'
 */
export function formatDateDMY(dateStr?: string | null): string {
  if (!dateStr || dateStr.trim() === "") return "-";
  const trimmed = dateStr.trim();

  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }

  // If ISO string like 2026-06-15T10:00:00.000Z
  if (trimmed.includes("T")) {
    const datePart = trimmed.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [yyyy, mm, dd] = datePart.split("-");
      return `${dd}-${mm}-${yyyy}`;
    }
  }

  // Fallback try Date object
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, "0");
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const yyyy = parsed.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  return trimmed;
}

/**
 * Formats a currency number in INR (e.g. ₹ 1,50,000)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
