import { pgTable, text, timestamp, integer, numeric, uuid, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { check, index } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["admin", "barista"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "qr_code"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["completed", "pending", "cancelled"]);
export const inventoryStatusEnum = pgEnum("inventory_status", ["in_stock", "low_stock", "out_of_stock"]);
export const productTypeEnum = pgEnum("product_type", ["menu", "retail", "raw_material"]);

// --- Better Auth Tables ---

export const user = pgTable("user", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	role: roleEnum("role").notNull().default("barista"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
	id: uuid("id").primaryKey().defaultRandom(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: uuid("id").primaryKey().defaultRandom(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: uuid("id").primaryKey().defaultRandom(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Shift Management ---

export const shifts = pgTable("shifts", {
	id: uuid("id").primaryKey().defaultRandom(),
	openedBy: uuid("opened_by").notNull().references(() => user.id),
	openedAt: timestamp("opened_at").notNull().defaultNow(),
	closedAt: timestamp("closed_at"),
	openingCash: numeric("opening_cash", { precision: 12, scale: 2 }).notNull().default("0"),
	countedCash: numeric("counted_cash", { precision: 12, scale: 2 }),
	expectedCash: numeric("expected_cash", { precision: 12, scale: 2 }),
	note: text("note"),
});

// --- Shop Configuration (singleton row) ---

export const shopSettings = pgTable("shop_settings", {
	id: text("id").primaryKey().default("default"),
	shopName: text("shop_name").notNull().default("The Atelier"),
	address: text("address").notNull().default(""),
	phone: text("phone").notNull().default(""),
	receiptFooter: text("receipt_footer").notNull().default("Terima kasih!"),
	currency: text("currency").notNull().default("IDR"),
	taxEnabled: boolean("tax_enabled").notNull().default(false),
	taxRatePercent: numeric("tax_rate_percent", { precision: 5, scale: 2 }).notNull().default("0"),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Core POS Entities ---

export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
	price: numeric("price", { precision: 12, scale: 2 }).notNull(),
	category: text("category").notNull(),
	type: productTypeEnum("type").notNull().default("menu"),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inventory = pgTable(
	"inventory",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
		currentStock: integer("current_stock").notNull().default(0),
		unit: text("unit").notNull(), // e.g., grams, pieces, liters
		supplier: text("supplier"),
		status: inventoryStatusEnum("status").notNull().default("in_stock"),
		lastRestocked: timestamp("last_restocked"),
	},
	(t) => [check("inventory_stock_non_negative", sql`${t.currentStock} >= 0`)]
);

export const transactions = pgTable(
	"transactions",
	{
	id: uuid("id").primaryKey().defaultRandom(),
	cashierId: uuid("cashier_id").notNull().references(() => user.id),
	shiftId: uuid("shift_id").references(() => shifts.id),
	subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
	taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
	discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
	paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }),
	changeAmount: numeric("change_amount", { precision: 12, scale: 2 }),
	totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
	paymentMethod: paymentMethodEnum("payment_method").notNull(),
	status: transactionStatusEnum("status").notNull().default("completed"),
	customerName: text("customer_name"),
	tableNumber: text("table_number"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [
		index("transactions_created_at_idx").on(t.createdAt),
		index("transactions_status_idx").on(t.status),
		index("transactions_shift_id_idx").on(t.shiftId),
	]
);

export const transactionItems = pgTable(
	"transaction_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		transactionId: uuid("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
		productId: uuid("product_id").notNull().references(() => products.id),
		quantity: integer("quantity").notNull(),
		priceAtTime: numeric("price_at_time", { precision: 12, scale: 2 }).notNull(),
	},
	(t) => [index("transaction_items_transaction_id_idx").on(t.transactionId)]
);

// Recipe Ingredients — maps a menu product to raw_material products
export const recipeIngredients = pgTable("recipe_ingredients", {
	id: uuid("id").primaryKey().defaultRandom(),
	menuProductId: uuid("menu_product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
	rawMaterialId: uuid("raw_material_id").notNull().references(() => products.id, { onDelete: "cascade" }),
	quantityNeeded: numeric("quantity_needed", { precision: 10, scale: 2 }).notNull().default("1"),
	unit: text("unit").notNull().default("pcs"),
});

// --- Relations ---

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	transactions: many(transactions),
	shifts: many(shifts),
}));

export const shiftRelations = relations(shifts, ({ one, many }) => ({
	cashier: one(user, { fields: [shifts.openedBy], references: [user.id] }),
	transactions: many(transactions),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
	inventory: one(inventory, { fields: [products.id], references: [inventory.productId] }),
	transactionItems: many(transactionItems),
	recipesAsMenu: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
	menuProduct: one(products, { fields: [recipeIngredients.menuProductId], references: [products.id] }),
	rawMaterial: one(products, { fields: [recipeIngredients.rawMaterialId], references: [products.id] }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
	product: one(products, { fields: [inventory.productId], references: [products.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
	cashier: one(user, { fields: [transactions.cashierId], references: [user.id] }),
	shift: one(shifts, { fields: [transactions.shiftId], references: [shifts.id] }),
	items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
	transaction: one(transactions, { fields: [transactionItems.transactionId], references: [transactions.id] }),
	product: one(products, { fields: [transactionItems.productId], references: [products.id] }),
}));
