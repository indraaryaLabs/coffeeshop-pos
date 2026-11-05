import { create } from "zustand";
import type { Product } from "@/lib/catalog";

export interface CartItem {
	product: Product;
	quantity: number;
	notes?: string;
}

interface CartStore {
	items: CartItem[];
	orderNumber: number;
	orderType: "dine_in" | "take_away";

	addItem: (product: Product) => void;
	removeItem: (productId: string) => void;
	incrementItem: (productId: string) => void;
	decrementItem: (productId: string) => void;
	removeAll: (productId: string) => void;
	updateNotes: (productId: string, notes: string) => void;
	clearCart: () => void;
	setOrderType: (type: "dine_in" | "take_away") => void;

	subtotal: () => number;
	itemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
	items: [],
	orderNumber: 1,
	orderType: "dine_in",

	addItem: (product: Product) => {
		set((state) => {
			const existing = state.items.find((i) => i.product.id === product.id);
			if (existing) {
				return {
					items: state.items.map((i) =>
						i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
					),
				};
			}
			return { items: [...state.items, { product, quantity: 1 }] };
		});
	},

	removeItem: (productId: string) => {
		set((state) => {
			const item = state.items.find((i) => i.product.id === productId);
			// Tap decrement on the last unit removes the whole line (Square-style).
			if (item && item.quantity <= 1) {
				return { items: state.items.filter((i) => i.product.id !== productId) };
			}
			return {
				items: state.items.map((i) =>
					i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
				),
			};
		});
	},

	incrementItem: (productId: string) => {
		set((state) => ({
			items: state.items.map((i) =>
				i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i
			),
		}));
	},

	decrementItem: (productId: string) => {
		set((state) => {
			const item = state.items.find((i) => i.product.id === productId);
			if (item && item.quantity <= 1) {
				return { items: state.items.filter((i) => i.product.id !== productId) };
			}
			return {
				items: state.items.map((i) =>
					i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
				),
			};
		});
	},

	removeAll: (productId: string) => {
		set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) }));
	},

	updateNotes: (productId: string, notes: string) => {
		set((state) => ({
			items: state.items.map((i) => (i.product.id === productId ? { ...i, notes } : i)),
		}));
	},

	clearCart: () => {
		set((state) => ({ items: [], orderNumber: state.orderNumber + 1 }));
	},

	setOrderType: (type) => set({ orderType: type }),

	subtotal: () => {
		return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
	},

	itemCount: () => {
		return get().items.reduce((sum, item) => sum + item.quantity, 0);
	},
}));
