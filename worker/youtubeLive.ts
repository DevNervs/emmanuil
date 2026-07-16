const channelLiveUrl = "https://www.youtube.com/@EmmanuilCV/live";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=30, s-maxage=45, stale-while-revalidate=60",
  },
});

export async function handleYouTubeLive(request: Request): Promise<Response> {
  if (request.method !== "GET") return json({ live: false }, 405);

  try {
    const response = await fetch(channelLiveUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.7",
        "User-Agent": "Mozilla/5.0 (compatible; EmmanuilChurch/1.0)",
      },
      redirect: "follow",
    });
    if (!response.ok) return json({ live: false, available: false }, 502);

    const html = await response.text();
    const canonical = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"&]+)[^"]*"/i);
    const isLiveNow = /["\\]isLiveNow["\\]\s*:\s*true/i.test(html);
    const videoId = canonical?.[1]?.replace(/[^a-zA-Z0-9_-]/g, "");

    return json(videoId && isLiveNow ? { live: true, videoId } : { live: false });
  } catch {
    return json({ live: false, available: false }, 502);
  }
}
