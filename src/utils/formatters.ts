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
 * Formats a currency number in INR with 2 decimals (e.g. ₹ 1,50,000.00)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/**
 * Parses a user-entered amount string into a 2-decimal number.
 */
export function parseAmount(value: string | number): number {
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(2));
}

/**
 * Ensures a member or doctor name always starts with "Dr. " prefix.
 * e.g., "Basheer" -> "Dr. Basheer"
 * e.g., "Dr. George Paul" -> "Dr. George Paul"
 */
export function ensureDoctorPrefix(name: string): string {
  if (!name || !name.trim()) return "Dr. Unnamed";
  let trimmed = name.trim();
  if (/^dr\.?\s*/i.test(trimmed)) {
    trimmed = trimmed.replace(/^dr\.?\s*/i, "");
  }
  trimmed = trimmed.trim();
  if (!trimmed) return "Dr. Unnamed";
  return `Dr. ${trimmed}`;
}
