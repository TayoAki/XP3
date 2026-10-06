// Turns a free-text request into a brief, recording for each field whether
// the traveller said it, it came from their profile, or it was assumed.
import {
  defaultBrief,
  type Brief,
  type BriefField,
  type FieldStatus,
} from "./model.ts";

const numbers: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
};
const num = (w: string) => numbers[w.toLowerCase()] ?? Number(w);

const interestWords: [RegExp, string][] = [
  [/\bfood|eat|restaurant|dining|lunch|dinner\b/i, "Local food"],
  [/architect/i, "Architecture"],
  [/\bart\b|museum|galler/i, "Art & culture"],
  [/nature|park|outdoor|lake/i, "Nature"],
  [/hidden|off the beaten|local favou?rite/i, "Hidden gems"],
  [/value|cheap|afford|budget-friendly/i, "Good value"],
  [/nightlife|\bbars?\b|cocktail|club/i, "Nightlife"],
];

const months = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export function parseBrief(
  text: string,
  profile: { interests: string[]; pace: string },
): Brief {
  const status: Partial<Record<BriefField, FieldStatus>> = {};
  const brief: Brief = { ...defaultBrief, prompt: text, status };

  status.where = /chicago/i.test(text) ? "confirmed" : "assumed";

  if (
    /no flights?|already (there|in)|staycation|\blocal\b|live (in|near) chicago/i.test(
      text,
    )
  ) {
    brief.origin = "Already there · no flights";
    status.from = "confirmed";
  } else {
    const from = text.match(/\bfrom ([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?)/);
    if (from && !months.includes(from[1].slice(0, 3).toLowerCase())) {
      brief.origin = `From ${from[1]} · travel not included`;
      status.from = "confirmed";
    } else {
      brief.origin = "Unknown";
      status.from = "unknown";
    }
  }

  const party =
    text.match(
      /\b(\d+|one|two|three|four|five|six|seven)\s+(adults|people|travell?ers|friends|of us|guests)\b/i,
    ) || text.match(/\bfor (two|three|four|five|six|\d+)\b/i);
  if (party) {
    brief.travelers = num(party[1]);
    status.who = "confirmed";
  } else if (/\bcouple\b/i.test(text)) {
    brief.travelers = 2;
    status.who = "confirmed";
  } else if (/\bsolo\b|just me|by myself/i.test(text)) {
    brief.travelers = 1;
    status.who = "confirmed";
  } else status.who = "assumed";

  let length = 3;
  const days = text.match(
    /\b(\d+|one|two|three|four|five|six|seven)[- ](day|night)s?\b/i,
  );
  if (days)
    length = Math.min(7, num(days[1]) + (/night/i.test(days[2]) ? 1 : 0));
  else if (/weekend/i.test(text)) length = 3;
  const date = text.match(
    new RegExp(`\\b(${months.join("|")})[a-z]*\\.? (\\d{1,2})\\b`, "i"),
  );
  if (date) {
    const m = months.indexOf(date[1].slice(0, 3).toLowerCase()) + 1;
    brief.start = `2026-${String(m).padStart(2, "0")}-${String(Number(date[2])).padStart(2, "0")}`;
    status.when = "confirmed";
  } else status.when = "assumed";
  brief.end = addDays(brief.start, length - 1);

  const interests = interestWords
    .filter(([re]) => re.test(text))
    .map(([, label]) => label);
  if (interests.length) {
    brief.interests = interests;
    status.what = "confirmed";
  } else {
    brief.interests = profile.interests.length
      ? profile.interests
      : defaultBrief.interests;
    status.what = profile.interests.length ? "profile" : "assumed";
  }

  const budget = text.match(/\$(\d+)/);
  if (budget) {
    brief.budget = Number(budget[1]);
    status.budget = "confirmed";
  } else status.budget = "assumed";

  if (/relax|slow|easy|unhurried|laid.back/i.test(text)) {
    brief.pace = "Relaxed";
    status.pace = "confirmed";
  } else if (/packed|busy|see everything|lots/i.test(text)) {
    brief.pace = "Packed with discovery";
    status.pace = "confirmed";
  } else {
    brief.pace = profile.pace;
    status.pace = "profile";
  }
  return brief;
}

export const statusLabel: Record<FieldStatus, string> = {
  confirmed: "Confirmed",
  profile: "From your profile",
  assumed: "Assumed",
  unknown: "Unknown",
};
