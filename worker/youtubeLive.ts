import { YOUTUBE_API_KEY } from "./youtubeConfig";
import { DEFAULT_CHANNEL_ID } from "./youtubeChannels";

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

const SEARCH_INTERVAL_MS = 2 * 60 * 1000;
const VIDEO_CHECK_INTERVAL_MS = 60 * 1000;
const API_BASE = "https://www.googleapis.com/youtube/v3";

type LiveCache = {
  videoId?: string;
  lastSearchAt: number;
  lastVideoCheckAt: number;
};

const liveCache: LiveCache = { lastSearchAt: 0, lastVideoCheckAt: 0 };

async function findLiveVideoId(channelId: string, apiKey: string): Promise<string | undefined> {
  const url = `${API_BASE}/search?part=snippet&channelId=${channelId}&eventType=live&type=video&maxResults=1&key=${apiKey}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return undefined;
  const data = (await response.json()) as { items?: { id?: { videoId?: string } }[] };
  return cleanVideoId(data.items?.[0]?.id?.videoId);
}

async function isVideoLive(videoId: string, apiKey: string): Promise<boolean> {
  const url = `${API_BASE}/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${apiKey}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return false;
  const data = (await response.json()) as {
    items?: {
      snippet?: { liveBroadcastContent?: string };
      liveStreamingDetails?: { actualEndTime?: string };
    }[];
  };
  const item = data.items?.[0];
  if (!item) return false;
  if (item.snippet?.liveBroadcastContent !== "live") return false;
  if (item.liveStreamingDetails?.actualEndTime) return false;
  return true;
}

export async function handleYouTubeLive(request: Request): Promise<Response> {
  if (request.method !== "GET") return json({ live: false }, 405);

  const apiKey = YOUTUBE_API_KEY;
  const channelId = DEFAULT_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return json({ live: false, available: false }, 503);
  }

  const now = Date.now();

  // Если есть videoId, периодически проверяем, не закончился ли ефир.
  if (liveCache.videoId) {
    if (now - liveCache.lastVideoCheckAt < VIDEO_CHECK_INTERVAL_MS) {
      return json({ live: true, videoId: liveCache.videoId });
    }

    const stillLive = await isVideoLive(liveCache.videoId, apiKey);
    liveCache.lastVideoCheckAt = now;

    if (stillLive) {
      return json({ live: true, videoId: liveCache.videoId });
    }

    liveCache.videoId = undefined;
  }

  // Периодически ищем новый live на канале.
  if (now - liveCache.lastSearchAt >= SEARCH_INTERVAL_MS || !liveCache.lastSearchAt) {
    const videoId = await findLiveVideoId(channelId, apiKey);
    liveCache.lastSearchAt = now;

    if (videoId) {
      liveCache.videoId = videoId;
      liveCache.lastVideoCheckAt = now;
      return json({ live: true, videoId });
    }
  }

  return json({ live: false });
}
