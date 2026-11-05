import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionUrl) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL in environment");
}

export default defineConfig({
	schema: "./src/lib/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: connectionUrl,
	},
});
