CREATE TYPE "public"."product_type" AS ENUM('menu', 'retail', 'raw_material');--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_product_id" uuid NOT NULL,
	"raw_material_id" uuid NOT NULL,
	"quantity_needed" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opened_by" uuid NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"opening_cash" numeric(12, 2) DEFAULT '0' NOT NULL,
	"counted_cash" numeric(12, 2),
	"expected_cash" numeric(12, 2),
	"note" text
);
--> statement-breakpoint
CREATE TABLE "shop_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"shop_name" text DEFAULT 'The Atelier' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"receipt_footer" text DEFAULT 'Terima kasih!' NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"tax_enabled" boolean DEFAULT false NOT NULL,
	"tax_rate_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "type" "product_type" DEFAULT 'menu' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "shift_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "subtotal" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "paid_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "change_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "customer_name" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "table_number" text;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_menu_product_id_products_id_fk" FOREIGN KEY ("menu_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_raw_material_id_products_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_opened_by_user_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_items_transaction_id_idx" ON "transaction_items" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_shift_id_idx" ON "transactions" USING btree ("shift_id");--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_stock_non_negative" CHECK ("inventory"."current_stock" >= 0);