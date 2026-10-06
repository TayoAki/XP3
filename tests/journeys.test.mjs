// Logic checks for trip edits and workspace migration. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeTrip, initialState, migrateWorkspace } from "../src/model.ts";
import {
  proposalFor,
  applyProposals,
  validateProposal,
} from "../src/proposals.ts";

test("proposals apply only selected edits, by index, and reject stale ones", () => {
  const trip = makeTrip();
  const first = proposalFor(trip, "day-1", 0, null);
  const last = proposalFor(trip, "day-1", 2, "art");
  const next = applyProposals(trip, [first, last]);
  assert.deepEqual(next.days[0].places, ["gage", "art"]);
  assert.deepEqual(next.brief, trip.brief);
  assert.deepEqual(next.bookings, trip.bookings);
  assert.deepEqual(next.days[1], trip.days[1]);
  assert.deepEqual(trip.days[0].places, ["bean", "gage", "walk"]);
  assert.equal(validateProposal({ ...trip, revision: 1 }, first), false);
  assert.throws(() => applyProposals({ ...trip, revision: 1 }, [first]));
  assert.throws(() => applyProposals(trip, [first, first]));
  assert.deepEqual(applyProposals(trip, [last]).days[0].places, [
    "bean",
    "gage",
    "art",
  ]);
});

test("workspace migration preserves data and is idempotent", () => {
  const trip = makeTrip();
  const legacy = {
    ...initialState,
    trips: [trip],
    ideaIds: ["river", "art"],
    researchNotes: { river: "Keep this note" },
  };
  const migrated = migrateWorkspace(legacy);
  assert.deepEqual(migrated.trips, legacy.trips);
  assert.deepEqual(migrated.researchNotes, legacy.researchNotes);
  assert.deepEqual(migrated.collections[0].placeIds, ["river", "art"]);
  assert.deepEqual(migrateWorkspace(migrated), migrated);
});
