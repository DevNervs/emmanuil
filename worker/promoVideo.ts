import { json } from "./telegram";
import type { Env } from "./env";

type PromoVideoMetadata = {
  contentType?: string;
  filename?: string;
  size?: number;
};

function parseRange(value: string | null, size: number): { start: number; end: number } | null {
  if (!value) return null;
  const match = value.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

export async function handlePromoVideo(request: Request, env: Env, id: string): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ message: "Method not allowed" }, 405);
  }
  if (!env.GROUP_APPLICATIONS || !/^[a-f0-9-]{20,}$/.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const [bytes, metadataText] = await Promise.all([
    env.GROUP_APPLICATIONS.get(`promo-video:${id}`, "arrayBuffer"),
    env.GROUP_APPLICATIONS.get(`promo-video-meta:${id}`),
  ]);
  if (!bytes) return new Response("Not found", { status: 404 });
  let metadata: PromoVideoMetadata = {};
  try {
    metadata = metadataText ? JSON.parse(metadataText) as PromoVideoMetadata : {};
  } catch {
    // The video can still be served with safe defaults.
  }
  const size = bytes.byteLength;
  const contentType = metadata.contentType || "video/mp4";
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": contentType,
  });
  const requestedRange = request.headers.get("Range");
  const range = parseRange(requestedRange, size);

  if (requestedRange && !range) {
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  if (range) {
    const chunk = bytes.slice(range.start, range.end + 1);
    headers.set("Content-Length", String(chunk.byteLength));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    return new Response(request.method === "HEAD" ? null : chunk, { status: 206, headers });
  }

  headers.set("Content-Length", String(size));
  return new Response(request.method === "HEAD" ? null : bytes, { status: 200, headers });
}
