import assert from "node:assert/strict";
import ts from "typescript";
import fs from "node:fs";
import { makeTrip, initialState, migrateWorkspace } from "../src/model.ts";
const compiled = ts
  .transpileModule(
    fs.readFileSync(new URL("../src/proposals.ts", import.meta.url), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    },
  )
  .outputText.replace(
    /(['"])\.\/model\1/,
    JSON.stringify(new URL("../src/model.ts", import.meta.url).href),
  );
const { proposalFor, applyProposals, validateProposal } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
const trip = makeTrip();
const first = proposalFor(trip, "day-1", 0, null),
  last = proposalFor(trip, "day-1", 2, "art");
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
console.log(
  "PASS: migration preservation/idempotence; multi-edit indices; selected-only apply; stale/duplicate rejection; confirmed brief and bookings preserved.",
);
const { travelDay } = await import("../src/live/travel-day.ts");
const travelFixture = {
  timezone: "Asia/Tokyo",
  days: [{ date: "2026-10-06" }],
};
assert.equal(
  travelDay(travelFixture, new Date("2026-10-05T23:30:00Z")).index,
  0,
);
assert.equal(
  travelDay(
    { ...travelFixture, timezone: "America/Los_Angeles" },
    new Date("2026-10-05T23:30:00Z"),
  ).index,
  -1,
);
console.log("PASS: travel day uses destination timezone across midnight.");
