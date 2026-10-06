// A bounded, local stand-in for the planning assistant. It understands a few
// kinds of change request and turns them into concrete, reviewable
// proposals; it never edits the trip itself.
import { places, getPlace, type State, type Trip } from "./model.ts";
import { proposalFor, type EditProposal } from "./proposals.ts";
import { tasteMatch } from "./taste.ts";

export type Interpretation =
  | { kind: "proposals"; proposals: EditProposal[]; reply: string }
  | { kind: "open-swap"; dayId: string; index: number; reply: string }
  | { kind: "unclear"; reply: string };

const words: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
};

function targetDays(text: string, trip: Trip, scope: string | null) {
  if (scope) return trip.days.filter((d) => d.id === scope.split(":")[0]);
  const n = text.match(/day\s*(\d+|one|two|three|four|five|six|seven)/i)?.[1];
  if (n) {
    const day = trip.days[(words[n.toLowerCase()] ?? Number(n)) - 1];
    return day ? [day] : [];
  }
  if (/every day|all days|each day|whole trip/i.test(text)) return trip.days;
  return [];
}

function slotFromText(text: string, length: number) {
  if (/morning|first/i.test(text)) return 0;
  if (/afternoon|middle/i.test(text)) return Math.min(1, length - 1);
  if (/evening|last|night|dinner/i.test(text)) return length - 1;
  return null;
}

const norm = (t: string) => t.toLowerCase().replace(/[’‘]/g, "'");
// Words that describe a place rather than name it.
const generic = new Set([
  "the",
  "chicago",
  "park",
  "center",
  "river",
  "walk",
  "local",
  "food",
  "architecture",
  "art",
  "arts",
  "culture",
  "cultural",
  "outdoor",
  "indoor",
  "free",
  "easy",
  "pace",
]);

/** True when the text names the place (full name or a distinctive word of it). */
export function mentionsPlace(text: string, name: string) {
  const t = norm(text);
  const n = norm(name).replace(/^the /, "");
  if (t.includes(n)) return true;
  return n
    .split(/[^a-z']+/)
    .filter((w) => w.length >= 4 && !generic.has(w))
    .some((w) => new RegExp(`\\b${w.replace(/'s$/, "")}`).test(t));
}

export function interpret(
  text: string,
  trip: Trip,
  scope: string | null,
  state: State,
): Interpretation {
  const days = targetDays(text, trip, scope);
  const scopeIndex = scope ? Number(scope.split(":")[1]) : null;
  const named = places.find(
    (p) => p.kind !== "stay" && mentionsPlace(text, p.name),
  );
  const proposals: EditProposal[] = [];
  const used = new Set<string>();

  // Weather: replace outdoor stops with indoor ones.
  if (/rain|weather|indoor|storm|cold/i.test(text)) {
    const scopeDays = days.length ? days : trip.days;
    const without: string[] = [];
    const indoor = places
      .filter((p) => p.kind !== "stay" && p.tags.includes("Indoor"))
      .sort((a, b) => tasteMatch(b, state).score - tasteMatch(a, state).score);
    for (const day of scopeDays)
      day.places.forEach((id, i) => {
        if (scopeIndex !== null && i !== scopeIndex) return;
        if (!getPlace(id).tags.includes("Outdoor")) return;
        const pick = indoor.find(
          (p) => !day.places.includes(p.id) && !used.has(p.id),
        );
        if (!pick) {
          without.push(getPlace(id).name);
          return;
        }
        used.add(pick.id);
        const p = proposalFor(trip, day.id, i, pick.id);
        if (p) proposals.push(p);
      });
    return proposals.length
      ? {
          kind: "proposals",
          proposals,
          reply:
            `I found ${proposals.length} outdoor ${proposals.length === 1 ? "stop" : "stops"} to swap for something indoor. Review each one; nothing changes until you apply it.` +
            (without.length
              ? ` No indoor alternative is left for ${without.join(" and ")}.`
              : ""),
        }
      : {
          kind: "unclear",
          reply: "Those days are already indoors. Nothing to change for rain.",
        };
  }

  // Pace: free the last stop of each targeted day.
  if (/slow|tired|fewer|less|rest|relax|lighter/i.test(text)) {
    if (!days.length && scopeIndex === null)
      return {
        kind: "unclear",
        reply:
          "Which day should be slower? Try “slow day 2 down”, or use Swap on a stop.",
      };
    for (const day of days) {
      if (day.places.length < 2) continue;
      const index = scopeIndex ?? day.places.length - 1;
      const p = proposalFor(trip, day.id, index, null);
      if (p) proposals.push(p);
    }
    return proposals.length
      ? {
          kind: "proposals",
          proposals,
          reply: `I’d free up ${proposals.length === 1 ? "one stop" : `${proposals.length} stops`} so there’s room to breathe. Freed stops stay in this trip’s ideas.`,
        }
      : { kind: "unclear", reply: "That day already has very few stops." };
  }

  // A named place: put it in the scoped slot, or the slot the text points at.
  if (named) {
    const day = days[0];
    if (!day)
      return {
        kind: "unclear",
        reply: `Where should ${named.name} go? Name a day (“day 2 afternoon”), or use Swap on a stop.`,
      };
    const index = scopeIndex ?? slotFromText(text, day.places.length) ?? 0;
    const p = proposalFor(trip, day.id, index, named.id);
    return p && p.before !== named.id
      ? {
          kind: "proposals",
          proposals: [p],
          reply: `Here’s ${named.name} in place of ${getPlace(p.before).name}. Review it in the panel.`,
        }
      : { kind: "unclear", reply: `${named.name} is already there.` };
  }

  // Anything else that asks for a change opens the options for that slot.
  if (
    /swap|replace|instead|alternative|something else|change|different/i.test(
      text,
    ) &&
    days[0]
  ) {
    const day = days[0];
    const index = scopeIndex ?? slotFromText(text, day.places.length) ?? 0;
    return {
      kind: "open-swap",
      dayId: day.id,
      index,
      reply: "Here are options for that stop, ranked by your taste.",
    };
  }

  return {
    kind: "unclear",
    reply:
      "In this preview I can swap stops, plan around rain, or slow a day down. Try “rain on day 2”, “slow day 1 down”, or use Swap on any stop.",
  };
}
