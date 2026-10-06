import { test } from "node:test";
import assert from "node:assert/strict";
import { makeTrip, initialState } from "../src/model.ts";
import { interpret } from "../src/assistant.ts";

const state = { ...initialState };

test("rain on the whole trip queues one indoor swap per outdoor stop", () => {
  const trip = makeTrip();
  const r = interpret("It might rain, keep us indoors", trip, null, state);
  assert.equal(r.kind, "proposals");
  // Outdoor stops: bean, walk (day 1), river (day 2); only two indoor places exist.
  assert.equal(r.proposals.length, 2);
  assert.equal(
    new Set(r.proposals.map((p) => p.after)).size,
    2,
    "no indoor place used twice",
  );
  assert.match(
    r.reply,
    /No indoor alternative is left for Chicago Architecture River Cruise/,
  );
});

test("slow a named day frees its last stop", () => {
  const trip = makeTrip();
  const r = interpret("slow day 2 down please", trip, null, state);
  assert.equal(r.kind, "proposals");
  assert.equal(r.proposals.length, 1);
  assert.equal(r.proposals[0].dayId, "day-2");
  assert.equal(r.proposals[0].after, null);
});

test("pace request without a day asks which day", () => {
  const r = interpret("we're tired", makeTrip(), null, state);
  assert.equal(r.kind, "unclear");
});

test("a named place in a scoped slot becomes one proposal", () => {
  const trip = makeTrip();
  const r = interpret("Let's do Lou Malnati's instead", trip, "day-1:1", state);
  assert.equal(r.kind, "proposals");
  assert.equal(r.proposals[0].index, 1);
  assert.equal(r.proposals[0].after, "pizza");
});

test("a vague change request opens the options for that stop", () => {
  const r = interpret(
    "something different for day 3 evening",
    makeTrip(),
    null,
    state,
  );
  assert.equal(r.kind, "open-swap");
  assert.equal(r.dayId, "day-3");
  assert.equal(r.index, 2);
});

test("taste words don't count as naming a place", async () => {
  const { mentionsPlace } = await import("../src/assistant.ts");
  assert.ok(mentionsPlace("Lou Malnati's instead", "Lou Malnati’s Pizzeria"));
  assert.ok(mentionsPlace("can we do the gage", "The Gage"));
  assert.ok(
    !mentionsPlace("we love architecture", "Chicago Architecture River Cruise"),
  );
  assert.ok(
    mentionsPlace("the cruise please", "Chicago Architecture River Cruise"),
  );
});
