// Screens visited by check-ui.mjs. Each one starts from empty local storage.
const sampleTrip = async (page) => {
  await page.goto(page.url().split("#")[0] + "#plan");
  await page.getByRole("button", { name: /sample trip/i }).first().click();
  await page.locator(".trip-artifact").waitFor();
};

export const screens = [
  { name: "plan-welcome", hash: "#plan" },
  { name: "home", hash: "#home" },
  { name: "ideas", hash: "#ideas" },
  { name: "trips", hash: "#trips" },
  { name: "discover", hash: "#discover" },
  { name: "saved", hash: "#saved" },
  { name: "taste", hash: "#taste" },
  { name: "community", hash: "#community" },
  { name: "messages", hash: "#messages" },
  { name: "settings", hash: "#settings" },
  { name: "notifications", hash: "#notifications" },
  { name: "trip", setup: sampleTrip },
  {
    name: "trip-place-panel",
    setup: async (page) => {
      await sampleTrip(page);
      await page.locator(".activity-content").first().click();
      await page.locator(".detail-panel").waitFor();
    },
  },
  {
    name: "trip-swap-panel",
    setup: async (page) => {
      await sampleTrip(page);
      await page.locator(".activity-swap").first().click();
      await page.locator(".swap-panel").waitFor();
    },
  },
];
