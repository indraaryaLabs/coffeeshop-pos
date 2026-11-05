export interface Product {
	id: string;
	name: string;
	description: string | null;
	price: number;
	category: string;
	image: string;
	badge?: string;
	stock?: number;
	type?: "menu" | "retail" | "raw_material";
	unavailableReason?: string;
}

export const categories = [
	{ label: "Semua", value: "all" },
	{ label: "Kopi", value: "coffee" },
	{ label: "Non-Kopi", value: "non-coffee" },
	{ label: "Makanan", value: "food" },
	{ label: "Merchandise", value: "merchandise" },
] as const;

export type CategoryValue = (typeof categories)[number]["value"];

export type PaymentMethod = "cash" | "card" | "qr_code";
