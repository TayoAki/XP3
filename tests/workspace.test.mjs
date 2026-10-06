// Collections, migration and routing. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeTrip,
  initialState,
  migrateWorkspace,
  SAVED_ID,
} from "../src/model.ts";
import {
  isSaved,
  toggleSaved,
  toggleItinerarySaved,
  isItinerarySaved,
  tripIdeas,
  keepAsIdeas,
  savedViewCollections,
} from "../src/collections.ts";
import { parseHash, toHash } from "../src/routes.ts";

test("migration folds every legacy list into collections without loss", () => {
  const trip = makeTrip();
  const legacy = {
    ...initialState,
    trips: [trip],
    saved: ["gage", "river"],
    savedItineraries: ["food-culture"],
    ideaIds: ["river", "art"],
    researchNotes: { river: "Keep this note" },
  };
  const migrated = migrateWorkspace(legacy);
  assert.deepEqual(migrated.trips, legacy.trips);
  assert.deepEqual(migrated.researchNotes, legacy.researchNotes);
  const saved = migrated.collections.find((c) => c.id === SAVED_ID);
  assert.deepEqual(saved.placeIds, ["gage", "river"]);
  assert.deepEqual(saved.itineraryIds, ["food-culture"]);
  const ideas = migrated.collections.find((c) => c.id === "legacy-ideas");
  assert.deepEqual(ideas.placeIds, ["river", "art"]);
  assert.ok(migrated.collections.some((c) => c.tripId === trip.id));
  assert.deepEqual(migrated.saved, []);
  assert.deepEqual(migrated.ideaIds, []);
});

test("migration is idempotent", () => {
  const once = migrateWorkspace({
    ...initialState,
    trips: [makeTrip()],
    saved: ["gage"],
  });
  assert.deepEqual(migrateWorkspace(once), once);
  assert.deepEqual(migrateWorkspace(migrateWorkspace(once)), once);
});

test("a place saved anywhere lands in exactly one predictable collection", () => {
  let state = migrateWorkspace({ ...initialState });
  state = toggleSaved(state, "gage");
  assert.ok(isSaved(state, "gage"));
  const holding = state.collections.filter((c) => c.placeIds.includes("gage"));
  assert.deepEqual(
    holding.map((c) => c.id),
    [SAVED_ID],
  );
  state = toggleSaved(state, "gage");
  assert.ok(!isSaved(state, "gage"));
  state = toggleItinerarySaved(state, "food-culture");
  assert.ok(isItinerarySaved(state, "food-culture"));
});

test("places leaving a trip go to that trip's Ideas", () => {
  const trip = makeTrip();
  let state = migrateWorkspace({ ...initialState, trips: [trip] });
  state = keepAsIdeas(state, trip.id, ["walk", "walk", "bean"]);
  assert.deepEqual(tripIdeas(state, trip.id).placeIds, ["walk", "bean"]);
  assert.ok(!savedViewCollections(state).some((c) => c.tripId));
});

test("routes round-trip and legacy hashes still resolve", () => {
  const cases = [
    { route: { view: "trips", tab: "upcoming" } },
    { route: { view: "trips", tab: "past" } },
    {
      route: { view: "trip", id: "abc", tab: "itinerary", day: "day-2" },
      panel: { kind: "place", id: "gage" },
    },
    { route: { view: "trip", id: "new", tab: "itinerary" } },
    {
      route: { view: "discover", tab: "people" },
      panel: { kind: "member", id: "maya" },
    },
    { route: { view: "saved", collection: "legacy-ideas" } },
    { route: { view: "inbox" } },
    { route: { view: "you", tab: "account" } },
    { route: { view: "settings", section: "preview" } },
  ];
  for (const loc of cases) {
    const parsed = parseHash(toHash(loc));
    assert.deepEqual(parsed.route, loc.route, toHash(loc));
    assert.deepEqual(parsed.panel, loc.panel);
  }
  assert.deepEqual(parseHash("#plan", "t1").route, {
    view: "trip",
    id: "t1",
    tab: "itinerary",
  });
  assert.deepEqual(parseHash("#plan", null).route, {
    view: "trip",
    id: "new",
    tab: "itinerary",
  });
  assert.deepEqual(parseHash("#community").route, {
    view: "discover",
    tab: "people",
  });
  assert.deepEqual(parseHash("").route, { view: "trips", tab: "upcoming" });
  assert.deepEqual(parseHash("#/trips?tab=drafts").route, {
    view: "trips",
    tab: "drafts",
  });
});
