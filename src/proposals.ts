import { type Trip, getPlace } from "./model";
export type EditProposal = {
  tripId: string;
  revision: number;
  dayId: string;
  index: number;
  before: string;
  after: string | null;
  label: string;
};
export function validateProposal(trip: Trip, p: EditProposal) {
  return (
    trip.id === p.tripId &&
    (trip.revision || 0) === p.revision &&
    trip.days.find((d) => d.id === p.dayId)?.places[p.index] === p.before
  );
}
export function applyProposals(trip: Trip, edits: EditProposal[]) {
  if (new Set(edits.map((p) => p.dayId + ":" + p.index)).size !== edits.length)
    throw new Error("Choose one change per activity.");
  if (edits.some((p) => !validateProposal(trip, p)))
    throw new Error(
      "The itinerary changed. Review a fresh proposal before applying.",
    );
  const next = structuredClone(trip);
  for (const p of [...edits].sort((a, b) => b.index - a.index)) {
    const d = next.days.find((d) => d.id === p.dayId)!;
    if (p.after) d.places[p.index] = p.after;
    else d.places.splice(p.index, 1);
  }
  next.revision = (trip.revision || 0) + 1;
  return next;
}
export function proposalFor(
  trip: Trip,
  dayId: string,
  index: number,
  after: string | null,
): EditProposal | null {
  const before = trip.days.find((d) => d.id === dayId)?.places[index];
  return before
    ? {
        tripId: trip.id,
        revision: trip.revision || 0,
        dayId,
        index,
        before,
        after,
        label: `${getPlace(before).name} → ${after ? getPlace(after).name : "Free time · retained as an idea"}`,
      }
    : null;
}
