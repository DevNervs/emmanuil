const channelLiveUrl = "https://www.youtube.com/@EmmanuilCV/live";
const channelStreamsUrl = "https://www.youtube.com/@EmmanuilCV/streams";

const requestHeaders = {
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=10, s-maxage=15, stale-while-revalidate=15",
  },
});

const cleanVideoId = (value?: string) => {
  const videoId = value?.replace(/[^a-zA-Z0-9_-]/g, "");
  return videoId && videoId.length === 11 ? videoId : undefined;
};

const videoIdFromUrl = (value?: string) => {
  if (!value) return undefined;
  try {
    const url = new URL(value.replaceAll("\\u0026", "&"));
    return cleanVideoId(url.searchParams.get("v") ?? url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1]);
  } catch {
    return undefined;
  }
};

/** Extract the active broadcast from either a watch page or a channel/streams page. */
export function extractLiveVideoId(source: string, responseUrl?: string) {
  const redirectedVideoId = videoIdFromUrl(responseUrl);
  if (redirectedVideoId && /\/watch(?:\?|$)/.test(responseUrl ?? "")) return redirectedVideoId;

  // YouTube sometimes serializes its page data with escaped quotes.
  const html = source.replaceAll('\\"', '"');
  const isLiveNow = /"isLiveNow"\s*:\s*true/i.test(html);

  if (isLiveNow) {
    const directUrl = html.match(/<(?:link|meta)[^>]+(?:href|content)="(https:\/\/(?:www\.)?youtube\.com\/watch\?v=[^"&]+)[^"]*"/i)?.[1]
      ?? html.match(/"canonicalUrl"\s*:\s*"(https:\/\/(?:www\.)?youtube\.com\/watch\?v=[^"]+)"/i)?.[1];
    const directVideoId = videoIdFromUrl(directUrl);
    if (directVideoId) return directVideoId;
  }

  // On channel pages the canonical URL remains the channel URL. Locate the
  // video renderer nearest to YouTube's live badge instead of relying on it.
  const liveMarkers = [
    /"isLiveNow"\s*:\s*true/gi,
    /"style"\s*:\s*"BADGE_STYLE_TYPE_LIVE_NOW"/gi,
    /"style"\s*:\s*"LIVE"/gi,
  ];

  for (const markerPattern of liveMarkers) {
    for (const marker of html.matchAll(markerPattern)) {
      const beforeMarker = html.slice(Math.max(0, (marker.index ?? 0) - 30_000), marker.index);
      const candidates = [...beforeMarker.matchAll(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g)];
      const videoId = cleanVideoId(candidates.at(-1)?.[1]);
      if (videoId) return videoId;
    }
  }

  return undefined;
}

async function inspectYouTubePage(url: string) {
  const response = await fetch(url, {
    headers: requestHeaders,
    redirect: "follow",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`YouTube returned ${response.status}`);
  return extractLiveVideoId(await response.text(), response.url);
}

export async function handleYouTubeLive(request: Request): Promise<Response> {
  if (request.method !== "GET") return json({ live: false }, 405);

  const checks = await Promise.allSettled([
    inspectYouTubePage(channelLiveUrl),
    inspectYouTubePage(channelStreamsUrl),
  ]);
  const videoId = checks.find((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled" && Boolean(result.value))?.value;

  if (videoId) return json({ live: true, videoId });
  if (checks.some((result) => result.status === "fulfilled")) return json({ live: false });
  return json({ live: false, available: false }, 502);
}
