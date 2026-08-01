import { groupNames } from "./data";
import { getCurrentGroups, getCurrentSeason } from "./storage";
import { json } from "./telegram";
import type { Env } from "./env";
import type { Group } from "./types";

export async function handleGroupsApi(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") return json({ message: "Метод не підтримується." }, 405);
  if (!env.GROUP_APPLICATIONS) {
    const groups = groupNames.map((title, index) => ({
      id: index,
      title,
      leaders: "",
      description: "",
      time: "",
      day: "",
      address: "",
      coordinates: "",
    })) as Group[];
    return json({ groups, season: null });
  }
  const [groups, season] = await Promise.all([
    getCurrentGroups(env.GROUP_APPLICATIONS),
    getCurrentSeason(env.GROUP_APPLICATIONS),
  ]);
  if (!groups.length) {
    const fallback = groupNames.map((title, index) => ({
      id: index,
      title,
      leaders: "",
      description: "",
      time: "",
      day: "",
      address: "",
      coordinates: "",
    })) as Group[];
    return json({ groups: fallback, season });
  }
  return json({ groups, season });
}
