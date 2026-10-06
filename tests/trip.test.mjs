// Trip arithmetic and validation. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeTrip, getPlace, defaultBrief } from "../src/model.ts";
import {
  minutesOf,
  travelBetween,
  dayMinutes,
  stayEstimate,
  validateTrip,
} from "../src/tripLogic.ts";

test("durations and travel estimates", () => {
  assert.equal(minutesOf("90 min"), 90);
  assert.equal(minutesOf("2 hours"), 120);
  const near = travelBetween(getPlace("bean"), getPlace("art"));
  assert.equal(near.mode, "walk");
  assert.ok(near.minutes >= 3 && near.minutes <= 25);
  const day = dayMinutes(["bean", "gage", "walk"]);
  assert.equal(day.visit, 45 + 75 + 45);
  assert.ok(day.travel > 0);
});

test("stay estimate shows nights × rooms × price plus taxes", () => {
  const trip = makeTrip();
  const est = stayEstimate(getPlace("hotel-loop"), trip);
  assert.equal(est.nights, 2);
  assert.equal(est.rooms, 1);
  assert.equal(est.subtotal, 378);
  assert.equal(est.total, est.subtotal + est.taxes);
});

test("a sample trip matching its brief is ready", () => {
  const trip = { ...makeTrip(), stayId: "hotel-loop" };
  assert.deepEqual(validateTrip(trip), []);
});

test("validator flags over-budget stays, unconfirmed origin, flights, pace and empty days", () => {
  const base = makeTrip();
  const ids = (t) => validateTrip(t).map((i) => i.id);
  assert.ok(
    ids({
      ...base,
      stayId: "hotel-river",
      brief: { ...base.brief, budget: 190 },
    }).includes("budget"),
  );
  assert.ok(
    ids({ ...base, brief: { ...base.brief, origin: "Unknown" } }).includes(
      "origin",
    ),
  );
  assert.ok(
    ids({
      ...base,
      bookings: [{ name: "United flight", reference: "X", note: "" }],
    }).includes("flights"),
  );
  const busy = structuredClone(base);
  busy.days[0].places = ["bean", "gage", "walk", "art", "river"];
  assert.ok(ids(busy).includes("pace-day-1"));
  const empty = structuredClone(base);
  empty.days[1].places = [];
  assert.ok(ids(empty).includes("empty"));
  const wrongDates = { ...base, brief: { ...defaultBrief, end: "2026-10-19" } };
  assert.ok(ids(wrongDates).includes("dates"));
});

import { applySwapTo, rebaseProposals } from "../src/tripLogic.ts";
import { proposalFor } from "../src/proposals.ts";

test("swap, trade and free a slot", () => {
  const trip = makeTrip();
  const swapped = applySwapTo(trip, "day-1", 0, "cultural");
  // cultural is on day 3, so this is a trade
  assert.equal(swapped.trip.days[0].places[0], "cultural");
  assert.equal(swapped.trip.days[2].places[1], "bean");
  assert.deepEqual(swapped.traded, { dayId: "day-3", index: 1 });
  const freed = applySwapTo(trip, "day-1", 2, null);
  assert.deepEqual(freed.trip.days[0].places, ["bean", "gage"]);
  assert.equal(freed.removed, "walk");
  assert.deepEqual(
    trip.days[0].places,
    ["bean", "gage", "walk"],
    "input untouched",
  );
});

test("pending proposals follow their stop after another change", () => {
  const trip = makeTrip();
  const a = proposalFor(trip, "day-1", 0, null);
  const b = proposalFor(trip, "day-1", 2, "art");
  const c = proposalFor(trip, "day-2", 1, "cultural");
  const after = applySwapTo(trip, "day-1", 0, null).trip;
  after.revision = 1;
  const rebased = rebaseProposals([b, c], after);
  assert.equal(rebased.length, 2);
  assert.equal(rebased[0].index, 1, "walk moved from index 2 to 1");
  assert.equal(rebased[0].revision, 1);
  assert.equal(rebased[1].index, 1);
  const gone = rebaseProposals([a], after);
  assert.equal(gone.length, 0, "a proposal whose stop is gone is dropped");
});
