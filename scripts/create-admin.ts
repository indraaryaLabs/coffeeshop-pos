import { randomUUID } from "crypto";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/lib/db";
import { account, user } from "../src/lib/db/schema";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !password) {
    console.error("❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD. Set them in .env (see .env.example).");
    process.exit(1);
  }

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (existing.length > 0) {
    console.error(`❌ An account with email ${email} already exists.`);
    process.exit(1);
  }

  const userId = randomUUID();
  const passwordHash = await hashPassword(password);

  await db.insert(user).values({
    id: userId,
    name,
    email,
    role: "admin",
  });

  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  });

  console.log(`✅ Admin account created: ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Admin creation failed:");
  console.error(error);
  process.exit(1);
});
