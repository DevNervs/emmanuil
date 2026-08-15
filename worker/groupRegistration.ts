import { resolveCurrentGroups, saveAndNotify, toGroupName } from "./applications";
import { escapeHtml, json } from "./telegram";
import type { Env } from "./env";

export async function handleGroupRegistration(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ message: "Метод не підтримується." }, 405);
  if ((request.headers.get("content-length") ?? "0").length > 7 || Number(request.headers.get("content-length") ?? 0) > 12_000) {
    return json({ message: "Завеликий запит." }, 413);
  }
  let body: { name?: unknown; phone?: unknown; groups?: unknown; website?: unknown; startedAt?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ message: "Некоректні дані анкети." }, 400);
  }
  if (body.website) return json({ message: "Заявку прийнято." });
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const currentGroups = await resolveCurrentGroups(env);
  const validGroupIds = new Set(currentGroups.map((g) => g.id));
  const groups = Array.isArray(body.groups)
    ? [...new Set(body.groups.filter((item): item is number => Number.isInteger(item) && validGroupIds.has(item)))]
    : [];
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if (Date.now() - startedAt < 1_500 || Date.now() - startedAt > 86_400_000) {
    return json({ message: "Оновіть сторінку та заповніть анкету ще раз." }, 400);
  }
  if (name.length < 2 || name.length > 100) return json({ message: "Вкажіть, будь ласка, прізвище та ім’я." }, 400);
  if (phone.length < 9 || phone.length > 20) return json({ message: "Вкажіть коректний номер телефону." }, 400);
  if (!groups.length || groups.length > 2) return json({ message: "Оберіть одну або дві домашні групи." }, 400);

  const id = crypto.randomUUID().slice(0, 8);
  const selectedGroupNames = groups.map((groupId) => {
    const group = currentGroups.find((g) => g.id === groupId);
    return group ? toGroupName(group) : `Група №${groupId}`;
  });
  const groupList = selectedGroupNames.map((groupName, order) => `${order + 1}. ${escapeHtml(groupName)}`).join("\n");
  const detailsHtml = `<b>Обрані групи:</b>\n${groupList}`;
  return saveAndNotify(env, {
    id,
    type: "group",
    name,
    phone,
    groups,
    groupNames: selectedGroupNames,
  }, "Нова заявка на домашню групу", detailsHtml);
}
