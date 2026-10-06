// Screens visited by check-ui.mjs. Each starts from empty local storage.
const base = (page) => page.url().split("#")[0];
const sampleTrip = async (page) => {
  await page.goto(base(page) + "#/trips");
  await page
    .getByRole("button", { name: /sample chicago trip/i })
    .first()
    .click();
  await page.locator(".artifact").waitFor();
};
const go = (hash) => async (page) => {
  await page.goto(base(page) + hash);
  await page.waitForTimeout(150);
};

export const screens = [
  { name: "trips-first-visit", hash: "#/trips" },
  {
    name: "trips-list",
    setup: async (page) => {
      await sampleTrip(page);
      await go("#/trips")(page);
      await page.locator(".trip-card").first().waitFor();
    },
  },
  {
    name: "new-trip-brief",
    setup: async (page) => {
      await go("#/trip/new")(page);
      await page.getByRole("button", { name: /food-filled/i }).click();
      await page.locator(".brief-card").waitFor();
    },
  },
  { name: "trip-itinerary", setup: sampleTrip },
  {
    name: "trip-place-panel",
    setup: async (page) => {
      await sampleTrip(page);
      await page.locator(".stop-main").first().click();
      await page.locator(".why-fits").waitFor();
    },
  },
  {
    name: "trip-swap-panel",
    setup: async (page) => {
      await sampleTrip(page);
      await page
        .getByRole("button", { name: /^Swap / })
        .first()
        .click();
      await page.locator(".swap-option").first().waitFor();
    },
  },
  {
    name: "trip-suggestions",
    setup: async (page) => {
      await sampleTrip(page);
      await page.getByRole("button", { name: /plan for rain/i }).click();
      await page.locator(".suggestion").waitFor();
    },
  },
  {
    name: "trip-visit-panel",
    setup: async (page) => {
      await sampleTrip(page);
      await page
        .getByRole("button", { name: /^More for / })
        .first()
        .click();
      await page.getByRole("menuitem", { name: /visited/i }).click();
      await page.locator(".star-picker").waitFor();
    },
  },
  {
    name: "trip-ideas",
    setup: async (page) => {
      await sampleTrip(page);
      await page.goto(page.url().replace("/itinerary", "/ideas"));
      await page.waitForTimeout(150);
    },
  },
  {
    name: "trip-bookings",
    setup: async (page) => {
      await sampleTrip(page);
      await page.goto(page.url().replace("/itinerary", "/bookings"));
      await page.waitForTimeout(150);
    },
  },
  { name: "discover-places", hash: "#/discover/places" },
  { name: "discover-itineraries", hash: "#/discover/itineraries" },
  { name: "discover-people", hash: "#/discover/people" },
  { name: "member-panel", hash: "#/discover/people?member=maya" },
  {
    name: "itinerary-panel",
    hash: "#/discover/itineraries?itinerary=food-culture",
  },
  { name: "place-panel-discover", hash: "#/discover/places?place=gage" },
  { name: "saved", hash: "#/saved" },
  {
    name: "saved-collection",
    setup: async (page) => {
      await go("#/saved")(page);
      await page
        .locator(".page-actions")
        .getByRole("button", { name: /new collection/i })
        .click();
      await page.waitForTimeout(150);
    },
  },
  { name: "inbox", hash: "#/inbox" },
  { name: "you-taste", hash: "#/you/taste" },
  { name: "you-account", hash: "#/you/account" },
  { name: "settings-general", hash: "#/settings/general" },
  { name: "settings-preview", hash: "#/settings/preview" },
  { name: "settings-privacy", hash: "#/settings/privacy" },
  { name: "settings-moderation", hash: "#/settings/moderation" },
];
