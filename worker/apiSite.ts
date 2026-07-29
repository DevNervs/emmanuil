import { getSiteConfig } from "./storage";
import { json } from "./telegram";
import type { Env } from "./env";

export async function handleSiteApi(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return json({ message: "Method not allowed" }, 405);
  }
  if (!env.GROUP_APPLICATIONS) {
    return json({ message: "KV not configured" }, 503);
  }
  const config = await getSiteConfig(env.GROUP_APPLICATIONS);
  return json(config);
}
