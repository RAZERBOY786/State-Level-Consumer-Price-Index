// Shared helpers used across all chart components.
// The raw CSV has a few data-entry typos and stray whitespace in the
// month column ("Auust", "Macrh", "October ", "November "), plus the
// month column itself is called "Name", not "Month". Normalizing here
// once means every component agrees on the same clean values.

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_SHORT: Record<string, string> = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
  September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
};

const MONTH_FIXES: Record<string, string> = {
  auust: 'August',
  macrh: 'March',
};

export function normalizeMonth(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const fixed = MONTH_FIXES[trimmed.toLowerCase()];
  if (fixed) return fixed;
  // Title-case fallback in case of stray casing issues
  const match = MONTHS.find(m => m.toLowerCase() === trimmed.toLowerCase());
  return match || trimmed;
}

const NON_STATE_COLUMNS = ['Year', 'Sector', 'Name', 'Month', 'Date'];

export function getStateKeys(row: any): string[] {
  if (!row) return [];
  return Object.keys(row).filter(key => !NON_STATE_COLUMNS.includes(key));
}

export function formatStateName(key: string): string {
  return key.replace(/_/g, ' ');
}

export function normalizeRow(row: any) {
  return { ...row, Name: normalizeMonth(row.Name) };
}