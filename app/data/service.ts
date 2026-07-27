import { serviceLocations, type ServiceLocation } from "./locations";

export type NextServiceSlot = {
  time: "10:00" | "17:00";
  isToday: boolean;
  isTomorrow: boolean;
  dayLabel: string;
  whenLabel: string;
  locations: ServiceLocation[];
};

const kyivParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = get("weekday"); // Mon, Tue, ... Sun
  return {
    weekday,
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
};

const locationsForTime = (time: "10:00" | "17:00") =>
  serviceLocations.filter((location) => location.time.includes(time));

/** Next Sunday service in Europe/Kyiv (10:00 or 17:00). */
export function getNextService(now = new Date()): NextServiceSlot {
  const kyiv = kyivParts(now);
  const minutesNow = kyiv.hour * 60 + kyiv.minute;
  const isSunday = kyiv.weekday === "Sun";

  let time: "10:00" | "17:00" = "10:00";
  let daysAhead = 0;

  if (isSunday && minutesNow < 10 * 60) {
    time = "10:00";
  } else if (isSunday && minutesNow < 17 * 60) {
    time = "17:00";
  } else {
    // After Sunday 17:00 or any other weekday → next Sunday 10:00
    const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(kyiv.weekday);
    daysAhead = weekdayIndex === 0 ? 7 : 7 - weekdayIndex;
    time = "10:00";
  }

  const isToday = daysAhead === 0;
  const isTomorrow = daysAhead === 1;
  const dayLabel = isToday ? "Сьогодні" : isTomorrow ? "Завтра" : "Неділя";
  const whenLabel = `${dayLabel} о ${time}`;

  return {
    time,
    isToday,
    isTomorrow,
    dayLabel,
    whenLabel,
    locations: locationsForTime(time),
  };
}
