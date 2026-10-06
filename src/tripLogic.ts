// Trip arithmetic shared by the day board, the swap panel and the validator.
// All travel times are estimates from the sample map coordinates.
import {
  getPlace,
  places,
  type Place,
  type State,
  type Trip,
} from "./model.ts";

/** Fixture durations like "90 min" or "2 hours" → minutes. */
export function minutesOf(duration: string): number | null {
  const n = parseFloat(duration);
  if (Number.isNaN(n)) return null;
  return /hour|hr/i.test(duration) ? n * 60 : n;
}

// The sample map spans roughly 4 km; one coordinate unit ≈ 40 m.
const METRES_PER_UNIT = 40;
const WALK_M_PER_MIN = 80;

export type Leg = { minutes: number; mode: "walk" | "transit"; text: string };

/** Estimated time between two stops: walk up to 25 min, otherwise transit. */
export function travelBetween(a: Place, b: Place): Leg {
  const metres = Math.hypot(a.x - b.x, a.y - b.y) * METRES_PER_UNIT;
  const walk = Math.max(3, Math.round(metres / WALK_M_PER_MIN));
  if (walk <= 25)
    return { minutes: walk, mode: "walk", text: `≈ ${walk} min walk` };
  const transit = Math.round(metres / 250 + 8);
  return {
    minutes: transit,
    mode: "transit",
    text: `≈ ${transit} min by transit`,
  };
}

/** Total minutes for a list of stops: time at each stop plus travel between them. */
export function dayMinutes(ids: string[]) {
  const stops = ids.map(getPlace).filter(Boolean);
  let visit = 0,
    travel = 0;
  stops.forEach((p, i) => {
    visit += minutesOf(p.duration) || 0;
    if (i > 0) travel += travelBetween(stops[i - 1], p).minutes;
  });
  return { visit, travel, total: visit + travel };
}

export const formatMinutes = (m: number) => {
  const h = Math.floor(m / 60),
    rest = Math.round(m % 60);
  return h ? (rest ? `${h} h ${rest} min` : `${h} h`) : `${rest} min`;
};

export const paceLimits: Record<string, { stops: number; minutes: number }> = {
  Relaxed: { stops: 3, minutes: 6 * 60 },
  Balanced: { stops: 4, minutes: 8 * 60 },
  "Packed with discovery": { stops: 6, minutes: 10 * 60 },
};

export const nightlyPrice = (stay: Place) =>
  Number(stay.price.match(/\d+/)?.[0]) || 0;

/** A labelled estimate: nights × rooms × nightly price, plus taxes. */
export function stayEstimate(stay: Place, trip: Trip) {
  const nights = Math.max(1, trip.days.length - 1);
  const rooms = Math.max(1, Math.ceil(trip.brief.travelers / 2));
  const nightly = nightlyPrice(stay);
  const subtotal = nightly * nights * rooms;
  const taxes = Math.round(subtotal * 0.174);
  return { nights, rooms, nightly, subtotal, taxes, total: subtotal + taxes };
}

export type Fix =
  | { kind: "choose-stay" }
  | { kind: "edit-brief" }
  | { kind: "swap"; dayId: string; index: number }
  | { kind: "complete-days" }
  | { kind: "confirm-origin" };

export type Issue = {
  id: string;
  message: string;
  fix?: Fix & { label: string };
};

const dayCount = (trip: Trip) =>
  Math.round(
    (Date.parse(trip.brief.end) - Date.parse(trip.brief.start)) / 86400000,
  ) + 1;

const isLocal = (origin: string) =>
  /already there|no flights|local/i.test(origin);

/**
 * Checks a trip against the brief the traveller confirmed. A trip is only
 * "ready" when this returns nothing.
 */
export function validateTrip(trip: Trip, state?: State): Issue[] {
  const issues: Issue[] = [];
  const brief = trip.brief;
  if (dayCount(trip) !== trip.days.length)
    issues.push({
      id: "dates",
      message: `Your dates cover ${dayCount(trip)} days but the plan has ${trip.days.length}.`,
      fix: { kind: "edit-brief", label: "Review dates" },
    });
  if (!brief.origin || /unknown/i.test(brief.origin))
    issues.push({
      id: "origin",
      message:
        "Where you’re starting from isn’t confirmed, so no travel to Chicago is included.",
      fix: { kind: "confirm-origin", label: "Confirm departure" },
    });
  if (
    isLocal(brief.origin) &&
    trip.bookings.some((b) => /flight|airline|✈/i.test(b.name + b.note))
  )
    issues.push({
      id: "flights",
      message:
        "This is a local trip with no flights, but a flight is listed in your bookings.",
      fix: { kind: "edit-brief", label: "Review brief" },
    });
  const stay = trip.stayId ? getPlace(trip.stayId) : undefined;
  if (stay && nightlyPrice(stay) > brief.budget) {
    const est = stayEstimate(stay, trip);
    issues.push({
      id: "budget",
      message: `${stay.name} is $${est.nightly}/night, over your $${brief.budget} target (about $${est.total.toLocaleString()} for ${est.nights} nights incl. estimated taxes).`,
      fix: { kind: "choose-stay", label: "Compare stays" },
    });
  }
  if (
    !stay &&
    !places.some((p) => p.kind === "stay" && nightlyPrice(p) <= brief.budget)
  )
    issues.push({
      id: "no-stay",
      message: `No sample stay fits your $${brief.budget} nightly target.`,
      fix: { kind: "edit-brief", label: "Adjust budget" },
    });
  const limit = paceLimits[brief.pace] || paceLimits.Balanced;
  trip.days.forEach((d, i) => {
    if (!d.places.length) return;
    const { total } = dayMinutes(d.places);
    if (d.places.length > limit.stops || total > limit.minutes)
      issues.push({
        id: `pace-${d.id}`,
        message: `Day ${i + 1} has ${d.places.length} stops and about ${formatMinutes(total)}, more than a ${brief.pace.toLowerCase()} day.`,
        fix: {
          kind: "swap",
          dayId: d.id,
          index: d.places.length - 1,
          label: "Lighten the day",
        },
      });
  });
  if (trip.days.some((d) => !d.places.length))
    issues.push({
      id: "empty",
      message: "Some days don’t have any stops yet.",
      fix: { kind: "complete-days", label: "Fill empty days" },
    });
  const excluded = trip.excludedPlaces || [];
  trip.days.forEach((d) =>
    d.places.forEach((id, j) => {
      if (excluded.includes(id))
        issues.push({
          id: `excluded-${d.id}-${j}`,
          message: `${getPlace(id).name} is in the plan, but you marked it as not right for this trip.`,
          fix: { kind: "swap", dayId: d.id, index: j, label: "Swap it" },
        });
    }),
  );
  if (state?.lessLike?.length)
    trip.days.forEach((d) =>
      d.places.forEach((id, j) => {
        if (state.lessLike!.includes(id) && !excluded.includes(id))
          issues.push({
            id: `less-${d.id}-${j}`,
            message: `${getPlace(id).name} is in the plan, but you asked to see less like it.`,
            fix: { kind: "swap", dayId: d.id, index: j, label: "Swap it" },
          });
      }),
    );
  return issues;
}

export type SwapResult = {
  trip: Trip;
  removed?: string;
  traded?: { dayId: string; index: number };
};

/**
 * The one way a slot changes: replace it, trade it with a place elsewhere in
 * the trip, or (placeId null) leave it free. Returns a new trip.
 */
export function applySwapTo(
  trip: Trip,
  dayId: string,
  index: number,
  placeId: string | null,
): SwapResult {
  const next = structuredClone(trip);
  const day = next.days.find((d) => d.id === dayId);
  const from = day?.places[index];
  if (!day || !from) return { trip: next };
  if (!placeId) {
    day.places.splice(index, 1);
    return { trip: next, removed: from };
  }
  const there = next.days.find((d) => d.places.includes(placeId));
  if (there) {
    const otherIndex = there.places.indexOf(placeId);
    there.places[otherIndex] = from;
    day.places[index] = placeId;
    return { trip: next, traded: { dayId: there.id, index: otherIndex } };
  }
  day.places[index] = placeId;
  return { trip: next, removed: from };
}

type Proposal = {
  tripId: string;
  revision: number;
  dayId: string;
  index: number;
  before: string;
  after: string | null;
};

/**
 * After the trip changes, keep each pending proposal whose target stop still
 * exists (following it if it moved within its day) and drop the rest.
 */
export function rebaseProposals<P extends Proposal>(
  proposals: P[],
  trip: Trip,
): P[] {
  return proposals.flatMap((p) => {
    if (p.tripId !== trip.id) return [p];
    const day = trip.days.find((d) => d.id === p.dayId);
    if (!day) return [];
    const index =
      day.places[p.index] === p.before ? p.index : day.places.indexOf(p.before);
    if (index < 0 || p.after === p.before) return [];
    return [{ ...p, index, revision: trip.revision || 0 }];
  });
}
