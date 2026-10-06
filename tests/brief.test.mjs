import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBrief } from "../src/briefLogic.ts";

const profile = { interests: ["Nature"], pace: "Balanced" };

test("explicit details are confirmed", () => {
  const b = parseBrief(
    "Three days in Chicago for two adults from Oct 16. We love local food and architecture, prefer a relaxed pace, and want a hotel under $180 a night. No flights needed.",
    profile,
  );
  assert.equal(b.status.where, "confirmed");
  assert.equal(b.status.from, "confirmed");
  assert.equal(b.origin, "Already there · no flights");
  assert.equal(b.travelers, 2);
  assert.equal(b.status.who, "confirmed");
  assert.equal(b.start, "2026-10-16");
  assert.equal(b.end, "2026-10-18");
  assert.equal(b.status.when, "confirmed");
  assert.deepEqual(b.interests, ["Local food", "Architecture"]);
  assert.equal(b.budget, 180);
  assert.equal(b.pace, "Relaxed");
});

test("missing details are assumed, from profile, or unknown — never invented", () => {
  const b = parseBrief("Something fun", profile);
  assert.equal(b.origin, "Unknown");
  assert.equal(b.status.from, "unknown");
  assert.equal(b.status.who, "assumed");
  assert.equal(b.status.when, "assumed");
  assert.equal(b.status.what, "profile");
  assert.deepEqual(b.interests, ["Nature"]);
  assert.equal(b.status.pace, "profile");
  assert.equal(b.pace, "Balanced");
});

test("a named departure city is kept, not replaced", () => {
  const b = parseBrief(
    "A weekend in Chicago from Atlanta for a couple",
    profile,
  );
  assert.equal(b.origin, "From Atlanta · travel not included");
  assert.equal(b.travelers, 2);
});

test("a date after 'from' is not mistaken for a departure city", () => {
  const b = parseBrief(
    "Four days in Chicago from Oct 20 for two adults",
    profile,
  );
  assert.equal(b.origin, "Unknown");
  assert.equal(b.start, "2026-10-20");
  assert.equal(b.end, "2026-10-23");
});
