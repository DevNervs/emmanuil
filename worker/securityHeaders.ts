/** Shared edge headers for Pages (`pages.ts`) and vinext SSR (`index.ts`) workers. */
export function withSecurityHeaders(
  response: Response,
  { isHtml = false }: { isHtml?: boolean } = {},
): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  if (!headers.has("Content-Security-Policy")) {
    headers.set(
      "Content-Security-Policy",
      "upgrade-insecure-requests; frame-ancestors 'self'",
    );
  }
  if (isHtml) {
    // Short CDN cache for HTML so content/SEO updates propagate; hashed assets stay immutable via _headers.
    headers.set("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function redirectToHttps(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.protocol !== "http:") return null;
  // Keep local/dev and unit-test fetches on http://localhost working.
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
  url.protocol = "https:";
  return Response.redirect(url.toString(), 301);
}
