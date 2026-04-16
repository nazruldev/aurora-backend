import { defineConfig } from "drizzle-kit";
import path from "node:path";

const fileUrl =
  process.env.DATABASE_URL ||
  `file:${path.join(process.cwd(), "data", "app.db").replace(/\\/g, "/")}`;

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: fileUrl },
});
