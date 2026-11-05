/**
 * Currency formatting helpers. Pure functions — safe to import from
 * client and server components alike.
 */

export function formatIDR(value: number): string {
	return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export function formatCompactIDR(value: number): string {
	if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
	if (Math.abs(value) >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
	return formatIDR(value);
}

/**
 * Rounds a monetary value to 2 decimal places.
 */
export function roundMoney(value: number): number {
	return Math.round(value * 100) / 100;
}

/**
 * Short, human-friendly transaction reference shown on receipts and tables.
 * Uses the trailing characters of the UUID so references stay distinct even
 * when many ids share a prefix (e.g. synthetic seed data).
 */
export function shortId(id: string): string {
	return id.slice(-8).toUpperCase();
}
