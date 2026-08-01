import { env as cloudflareEnv } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import type { Env } from "../worker/env";

export function getDb() {
  const env = cloudflareEnv as unknown as Env;
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Bind a D1 database named `DB` in your Wrangler config to use the database."
    );
  }

  return drizzle(env.DB, { schema });
}
