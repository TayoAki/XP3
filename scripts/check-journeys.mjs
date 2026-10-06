// End-to-end acceptance checks for docs/xpmatch-plan.md workstreams B–G.
// Serves dist/ with `vite preview` and drives the app in Chromium.
// Usage: npm run build && node scripts/check-journeys.mjs [--only=B]
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const port = 4197;
const base = `http://127.0.0.1:${port}/`;
const server = spawn(
  "npx",
  ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  { stdio: "ignore" },
);
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 250));
}
const browser = await chromium.launch();
const STORAGE = "xpmatch-journey-preview-v1";

async function open(width = 1440, seed) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    isMobile: width < 500,
    hasTouch: width < 500,
  });
  await context.route(/images\.unsplash\.com|fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  if (seed) await context.addInitScript(([k, v]) => localStorage.setItem(k, v), [STORAGE, JSON.stringify(seed)]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.errors = errors;
  await page.goto(base + "#/trips");
  return page;
}
const close = (page) => page.context().close();
const state = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORAGE);
const sample = async (page) => {
  await page.goto(base + "#/trips");
  await page.getByRole("button", { name: /sample chicago trip/i }).first().click();
  await page.locator(".artifact").waitFor();
};
const dayStops = (page, n) =>
  page.locator(".day-col").nth(n - 1).locator(".stop-text strong").allTextContents();
const panelTitle = (page) => page.locator(".side-panel:not(.is-summary) .side-panel-title h2").textContent();
const swapStop = (page, name) => page.getByRole("button", { name: `Swap ${name}` }).first().click();
const fit = async (page) => Number((await page.locator(".fit-score").textContent()).match(/\d+/)[0]);

const results = [];
async function check(group, name, fn) {
  if (only && !group.startsWith(only)) return;
  try {
    await fn();
    results.push([group, name, true]);
    console.log(`✓ ${group} · ${name}`);
  } catch (e) {
    results.push([group, name, false]);
    console.log(`✗ ${group} · ${name}\n    ${e.message.split("\n").slice(0, 4).join("\n    ")}`);
  }
}

// ---------------- B. Swap ----------------
await check("B", "every option shows time, walking and day-total impact, plus the brief", async () => {
  const page = await open();
  await sample(page);
  await swapStop(page, "Millennium Park");
  const options = page.locator(".swap-group .swap-option");
  const n = await options.count();
  assert.ok(n >= 3, "options listed");
  for (let i = 0; i < n; i++) assert.match(await options.nth(i).locator(".impact").textContent(), /Day 1 total ≈/);
  assert.match(await page.locator(".swap-group .impact").first().textContent(), /min (to|from) /);
  assert.match(await page.locator(".constraints").textContent(), /2 travelers.*Relaxed.*\$200\/night.*no flights/);
  await close(page);
});

await check("B", "replacing a booked stop warns that the booking isn’t cancelled", async () => {
  const page = await open();
  await sample(page);
  await page.getByRole("button", { name: "Bookings", exact: true }).first().click();
  await page.getByLabel("Name").fill("The Gage dinner, 7:30pm");
  await page.getByLabel("Confirmation number").fill("GAGE-42");
  await page.getByRole("button", { name: /add reservation/i }).click();
  await page.getByRole("button", { name: "Itinerary", exact: true }).first().click();
  await swapStop(page, "The Gage");
  assert.match(await page.locator(".booking-warning").textContent(), /reservation for The Gage \(GAGE-42\).*won’t cancel/);
  await close(page);
});

await check("B", "two suggestions: skip one, apply the other; only that stop changes; Undo restores", async () => {
  const page = await open();
  await sample(page);
  await page.getByRole("button", { name: /plan for rain/i }).click();
  await page.locator(".suggestion").waitFor();
  assert.match(await page.locator(".suggestion header").textContent(), /1 of 2/);
  await page.locator(".suggestion").getByRole("button", { name: /skip/i }).click();
  await page.locator(".suggestion").getByRole("button", { name: /^apply$/i }).click();
  assert.deepEqual(await dayStops(page, 1), ["Millennium Park", "The Gage", "Chicago Cultural Center"]);
  assert.deepEqual(await dayStops(page, 2), ["Chicago Architecture River Cruise", "The Purple Pig", "Lou Malnati’s Pizzeria"]);
  await page.locator(".status-bar").getByRole("button", { name: /undo/i }).click();
  assert.deepEqual(await dayStops(page, 1), ["Millennium Park", "The Gage", "Chicago Riverwalk"]);
  await close(page);
});

await check("B", "Apply all applies every valid suggestion at once", async () => {
  const page = await open();
  await sample(page);
  await page.getByRole("button", { name: /plan for rain/i }).click();
  await page.getByRole("button", { name: /apply all 2 suggestions/i }).click();
  const day1 = await dayStops(page, 1);
  assert.ok(!day1.includes("Millennium Park") && !day1.includes("Chicago Riverwalk"), day1.join(", "));
  await close(page);
});

await check("B", "an out-of-date suggestion can’t be applied", async () => {
  const page = await open();
  await sample(page);
  await page.getByRole("button", { name: /plan for rain/i }).click();
  await page.locator(".side-panel").getByRole("button", { name: "Close panel" }).click();
  await page.getByRole("button", { name: "More for The Gage" }).first().click();
  await page.getByRole("menuitem", { name: "Move earlier" }).click();
  await page.getByRole("button", { name: "Review", exact: true }).click();
  assert.match(await page.locator(".suggestion").textContent(), /no longer applies/);
  assert.equal(await page.locator(".suggestion").getByRole("button", { name: /^apply$/i }).count(), 0);
  await close(page);
});

await check("B", "free a slot, then add it back to another day from the trip’s ideas", async () => {
  const page = await open();
  await sample(page);
  await swapStop(page, "Chicago Riverwalk");
  await page.getByRole("button", { name: /leave this slot free/i }).click();
  assert.deepEqual(await dayStops(page, 1), ["Millennium Park", "The Gage"]);
  await page.getByRole("button", { name: "Ideas", exact: true }).first().click();
  await page.getByRole("button", { name: /add to a day/i }).click();
  await page.getByRole("button", { name: /add to end of day 2/i }).click();
  assert.equal((await dayStops(page, 2)).at(-1), "Chicago Riverwalk");
  const s = await state(page);
  assert.equal(s.collections.find((c) => c.tripId === s.activeId).placeIds.length, 0, "ideas emptied");
  await close(page);
});

await check("B", "swap, trade and place flows work on a phone", async () => {
  const page = await open(390);
  await sample(page);
  await swapStop(page, "Millennium Park");
  await page.locator(".swap-option").first().getByRole("button", { name: /swap in|trade slots/i }).click();
  await page.locator(".toast").waitFor();
  assert.notEqual((await dayStops(page, 1))[0], "Millennium Park");
  await page.locator(".stop-main").first().click();
  await page.getByRole("button", { name: /move in trip/i }).click();
  assert.match(await panelTitle(page), /Where should .* go\?/);
  await close(page);
});

// ---------------- C. Shell ----------------
await check("C", "old pages are two clicks away on desktop", async () => {
  const page = await open();
  const reach = async (rail, then, expect) => {
    await page.locator(".rail").getByRole("button", { name: new RegExp(`^${rail}\\b`) }).click();
    if (then) await then();
    await page.locator(expect).first().waitFor({ timeout: 3000 });
  };
  await reach("Settings", () => page.locator(".context-sidebar").getByRole("button", { name: /moderation/i }).click(), "#settings-moderation");
  await reach("Discover", () => page.getByRole("button", { name: "People", exact: true }).click(), ".member-card");
  await reach("Inbox", null, ".update-list, .empty");
  await reach("Saved", null, ".page-head");
  await page.locator(".rail").getByRole("button", { name: "You" }).click();
  await page.locator(".familiar-list").waitFor();
  await close(page);
});

await check("C", "settings sections are two taps away on a phone", async () => {
  const page = await open(390);
  await page.locator(".tab-bar").getByRole("button", { name: "You" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  for (const id of ["general", "preview", "privacy", "moderation"])
    assert.equal(await page.locator(`#settings-${id}`).count(), 1, id);
  await close(page);
});

await check("C", "reloading restores the view, day and selected place", async () => {
  const page = await open();
  await sample(page);
  await page.getByRole("button", { name: "Day 2", exact: true }).first().click();
  await page.locator(".stop-main").first().click();
  const url = page.url();
  assert.match(url, /\/itinerary\?day=day-2&place=river$/);
  await page.reload();
  await page.locator(".why-fits").waitFor();
  assert.equal(page.url(), url);
  assert.equal(await panelTitle(page), "Chicago Architecture River Cruise");
  assert.equal(await page.getByRole("button", { name: "Day 2", exact: true }).first().getAttribute("aria-pressed"), "true");
  await close(page);
});

await check("C", "the browser Back button moves between views", async () => {
  const page = await open();
  await page.locator(".rail").getByRole("button", { name: "Discover" }).click();
  await page.locator(".rail").getByRole("button", { name: "Saved" }).click();
  await page.goBack();
  assert.match(page.url(), /#\/discover\/places/);
  await page.goBack();
  assert.match(page.url(), /#\/trips/);
  await close(page);
});

await check("C", "focus order follows the layout: rail → sidebar → main → panel", async () => {
  const page = await open();
  await sample(page);
  await page.locator(".stop-main").first().click();
  const order = await page.evaluate(() => {
    const els = [".rail", ".context-sidebar", ".shell-main", ".side-panel"].map((s) => document.querySelector(s));
    return els.every((el, i) => i === 0 || els[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert.ok(order);
  await close(page);
});

// ---------------- D. Merging ----------------
await check("D", "legacy saved places, ideas and itineraries migrate into collections", async () => {
  const page = await open(1440, {
    trips: [],
    activeId: null,
    saved: ["gage"],
    savedItineraries: ["food-culture"],
    ideaIds: ["river"],
    interests: ["Local food"],
    pace: "Relaxed",
    reviews: [],
    notifications: [],
    offline: false,
    demoMember: false,
  });
  await page.goto(base + "#/saved");
  assert.match(await page.locator(".place-grid").textContent(), /The Gage/);
  assert.match(await page.locator(".saved-itineraries").textContent(), /A food and culture weekend/);
  const s = await state(page);
  assert.deepEqual(s.collections.find((c) => c.id === "legacy-ideas").placeIds, ["river"]);
  assert.deepEqual(s.saved, []);
  await close(page);
});

await check("D", "saving from a card or the panel uses the one Saved collection", async () => {
  const page = await open();
  await page.goto(base + "#/discover/places");
  await page.getByRole("button", { name: "Save The Gage" }).click();
  await page.locator(".place-card-name", { hasText: "Millennium Park" }).click();
  await page.locator(".side-panel-foot").getByRole("button", { name: /^save$/i }).click();
  const s = await state(page);
  const holding = (id) => s.collections.filter((c) => c.placeIds.includes(id)).map((c) => c.id);
  assert.deepEqual(holding("gage"), ["saved"]);
  assert.deepEqual(holding("bean"), ["saved"]);
  await close(page);
});

await check("D", "the quick start and the Taste page edit the same taste", async () => {
  const page = await open();
  await page.locator(".quickstart").getByRole("button", { name: "Nature" }).click();
  await page.getByRole("button", { name: /save my taste/i }).click();
  await page.goto(base + "#/you/taste");
  assert.equal(await page.locator(".taste-main").getByRole("button", { name: "Nature" }).getAttribute("aria-pressed"), "true");
  await close(page);
});

await check("D", "no more than 10 dialog types", async () => {
  const src = fs.readFileSync("src/app/context.tsx", "utf8");
  const union = src.slice(src.indexOf("export type Modal ="), src.indexOf(";", src.indexOf("export type Modal =")));
  const count = (union.match(/\|\s*"/g) || []).length;
  assert.ok(count <= 10, `${count} dialog types`);
});

// ---------------- E. Chat → brief → trip ----------------
await check("E", "one sentence → brief with field statuses → a complete trip", async () => {
  const page = await open();
  await page.locator(".start-composer textarea").fill(
    "Three days in Chicago for two adults from Oct 16, local food and architecture, relaxed, under $200 a night, no flights",
  );
  await page.keyboard.press("Enter");
  await page.locator(".brief-card").waitFor();
  const statuses = await page.locator(".brief-list .field-status").allTextContents();
  assert.deepEqual(statuses, ["Confirmed", "Confirmed", "Confirmed", "Confirmed", "Confirmed"]);
  await page.getByRole("button", { name: /build my trip/i }).click();
  await page.locator(".artifact").waitFor({ timeout: 5000 });
  assert.equal(await page.locator(".day-col").count(), 3);
  assert.equal(await page.locator(".stay-card").count(), 2);
  assert.ok((await page.locator(".artifact .route-map .map-pin").count()) >= 5);
  await close(page);
});

await check("E", "an unmentioned departure stays unknown; confirming ‘no flights’ fixes it", async () => {
  const page = await open();
  await page.locator(".start-composer textarea").fill("Three relaxed days in Chicago for two");
  await page.keyboard.press("Enter");
  await page.locator(".brief-card").waitFor();
  assert.match(await page.locator(".brief-list li").nth(1).textContent(), /Unknown.*won’t guess/);
  await page.getByRole("button", { name: /i’m already there/i }).click();
  assert.match(await page.locator(".brief-list li").nth(1).textContent(), /Confirmed.*Already there · no flights/);
  await page.getByRole("button", { name: /build my trip/i }).click();
  await page.locator(".artifact").waitFor({ timeout: 5000 });
  assert.match(await page.locator(".ready-line").textContent(), /no flights added/);
  const s = await state(page);
  assert.ok(!s.trips[0].bookings.some((b) => /flight/i.test(b.name)));
  await close(page);
});

await check("E", "an over-budget stay is flagged with its price basis", async () => {
  const page = await open();
  await sample(page);
  await page.locator(".brief-chip").click();
  await page.getByLabel("Hotel budget / night ($)").fill("150");
  await page.getByRole("button", { name: /save brief/i }).click();
  await page.locator(".stay-card", { hasText: "River Hotel" }).getByRole("button", { name: /choose this stay/i }).click();
  const issue = await page.locator(".issue-list").textContent();
  assert.match(issue, /River Hotel is \$198\/night, over your \$150 target \(about \$\d[\d,]* for 2 nights incl\. estimated taxes\)/);
  await close(page);
});

await check("E", "a hotel, a map pin and a stop each open exactly that place", async () => {
  const page = await open();
  await sample(page);
  await page.locator(".stay-name", { hasText: "Central Loop Hotel" }).click();
  assert.equal(await panelTitle(page), "Central Loop Hotel");
  await page.locator(".artifact .route-map").getByRole("button", { name: "Explore The Gage on route" }).click();
  assert.equal(await panelTitle(page), "The Gage");
  await page.locator(".stop-main", { hasText: "Chicago Riverwalk" }).click();
  assert.equal(await panelTitle(page), "Chicago Riverwalk");
  await close(page);
});

await check("E", "the chat draft and scroll position survive leaving and coming back", async () => {
  const page = await open();
  await sample(page);
  await page.locator(".composer-box textarea").fill("Maybe something with a view");
  await page.locator(".chat-scroll").evaluate((el) => (el.scrollTop = 500));
  await page.waitForTimeout(100);
  await page.locator(".rail").getByRole("button", { name: "Discover" }).click();
  await page.goBack();
  await page.locator(".artifact").waitFor();
  assert.equal(await page.locator(".composer-box textarea").inputValue(), "Maybe something with a view");
  const top = await page.locator(".chat-scroll").evaluate((el) => el.scrollTop);
  assert.ok(Math.abs(top - 500) < 40, `scrollTop ${top}`);
  await close(page);
});

await check("E", "a failed build keeps the brief, and Retry makes exactly one trip", async () => {
  const page = await open();
  await page.goto(base + "#/settings/preview");
  await page.getByRole("button", { name: /fail the next build once/i }).click();
  await page.locator(".rail").getByRole("button", { name: "Trips" }).click();
  await page.getByRole("button", { name: /food-filled/i }).click();
  await page.getByRole("button", { name: /build my trip/i }).click();
  await page.locator(".generation-error").waitFor({ timeout: 5000 });
  assert.equal(await page.locator(".brief-card").count(), 1, "brief kept");
  await page.getByRole("button", { name: /retry/i }).click();
  await page.locator(".artifact").waitFor({ timeout: 5000 });
  assert.equal((await state(page)).trips.length, 1);
  await close(page);
});

// ---------------- F. Research & taste ----------------
await check("F", "fit says when evidence is too thin", async () => {
  const page = await open(1440, {
    trips: [],
    activeId: null,
    interests: [],
    pace: "Balanced",
    reviews: [],
    notifications: [],
    offline: false,
    demoMember: false,
  });
  await page.goto(base + "#/discover/places?place=pizza");
  assert.match(await page.locator(".why-fits").textContent(), /Not enough evidence yet/);
  await close(page);
});

await check("F", "correcting a reason lowers the score and Undo restores it", async () => {
  const page = await open();
  await page.goto(base + "#/discover/places?place=gage");
  const before = await fit(page);
  await page.getByRole("button", { name: /local food isn’t me/i }).click();
  const after = await fit(page);
  assert.ok(after < before, `${before} → ${after}`);
  await page.locator(".toast").getByRole("button", { name: "Undo" }).click();
  assert.equal(await fit(page), before);
  await close(page);
});

await check("F", "private visit feedback never appears publicly, and shows what changed", async () => {
  const page = await open();
  await sample(page);
  await page.getByRole("button", { name: "More for The Gage" }).first().click();
  await page.getByRole("menuitem", { name: /mark as visited/i }).click();
  await page.getByRole("button", { name: "5 stars" }).click();
  await page.locator(".side-panel-foot").getByRole("button", { name: /save/i }).click();
  assert.match(await page.locator(".change-list").textContent(), /The Gage\s*\d+\s*\d+/);
  await page.goto(base + "#/discover/people");
  assert.match(await page.locator(".own-reviews").textContent(), /Reviews you publish appear here/);
  assert.equal((await state(page)).reviews.filter((r) => r.public).length, 0);
  await close(page);
});

await check("F", "publishing then deleting a review updates fit everywhere", async () => {
  const page = await open();
  await page.goto(base + "#/discover/places?place=pizza");
  const before = await fit(page);
  await page.getByRole("button", { name: /write one/i }).click();
  await page.getByRole("button", { name: "5 stars" }).click();
  await page.getByLabel("What was it like?").fill("Worth the wait, great crust.");
  await page.getByRole("button", { name: /save review/i }).click();
  const after = await fit(page);
  assert.ok(after > before, `${before} → ${after}`);
  await page.goto(base + "#/discover/people");
  await page.getByRole("button", { name: "Delete review" }).click();
  await page.locator(".dialog").getByRole("button", { name: /delete/i }).click();
  await page.goto(base + "#/discover/places?place=pizza");
  assert.equal(await fit(page), before);
  await close(page);
});

await check("F", "evidence types are separate and member reviews are labelled as samples", async () => {
  const page = await open();
  await page.goto(base + "#/discover/places?place=gage");
  const text = await page.locator(".side-panel").textContent();
  assert.match(text, /Ratings elsewhere.*sample aggregate · not live/);
  assert.match(text, /Member reviews/);
  assert.match(text, /Sample reviews by fictional members/);
  assert.match(text, /In member itineraries/);
  await page.locator(".side-panel").getByRole("button", { name: "Quiet spaces", exact: true }).click();
  assert.ok((await page.locator(".side-panel .review").count()) >= 1);
  await close(page);
});

// ---------------- G. Onboarding & return ----------------
await check("G", "skipping taste setup still reaches planning; it can be finished later", async () => {
  const page = await open();
  await page.locator(".quickstart").getByRole("button", { name: "Skip", exact: true }).click();
  assert.equal(await page.locator(".quickstart").count(), 0);
  assert.equal(await page.locator(".start-composer textarea").count(), 1);
  await page.goto(base + "#/you/taste");
  await page.locator(".taste-main").getByRole("button", { name: "Wellness" }).click();
  assert.ok((await state(page)).interests.includes("Wellness"));
  await close(page);
});

await check("G", "a dismissed tip stays dismissed and Help brings it back", async () => {
  const page = await open();
  await sample(page);
  const tip = page.locator(".hint", { hasText: "Tap any stop" });
  await tip.getByRole("button", { name: "Dismiss tip" }).click();
  await page.reload();
  await page.locator(".artifact").waitFor();
  assert.equal(await tip.count(), 0);
  await page.locator(".status-bar").getByRole("button", { name: "Help" }).click();
  await page.getByRole("menuitem", { name: /show tips again/i }).click();
  assert.equal(await tip.count(), 1);
  await close(page);
});

await check("G", "the trip list shows status, last change and specific open decisions; Resume restores context", async () => {
  const page = await open();
  await sample(page);
  await page.getByRole("button", { name: "Day 3", exact: true }).first().click();
  await page.locator(".stop-main").first().click();
  await page.locator(".rail").getByRole("button", { name: "Trips" }).click();
  const card = await page.locator(".trip-card").first().textContent();
  assert.match(card, /Planning/);
  assert.match(card, /Worked on/);
  assert.match(card, /Choose where to stay/);
  await page.getByRole("button", { name: /resume/i }).click();
  assert.match(page.url(), /day=day-3&place=art/);
  await close(page);
});

await check("G", "no empty state is a dead end", async () => {
  const page = await open();
  for (const hash of ["#/trips?tab=drafts", "#/trips?tab=past", "#/saved", "#/inbox"]) {
    await page.goto(base + hash);
    if (hash === "#/inbox") {
      const mark = page.getByRole("button", { name: /mark all read/i });
      if (await mark.count()) await mark.click();
    }
    const empties = page.locator(".empty");
    const n = await empties.count();
    if (hash.includes("tab=")) {
      // Drafts and Past only show once a trip exists.
      continue;
    }
    assert.ok(n > 0, `${hash} has an empty state`);
    for (let i = 0; i < n; i++) assert.ok((await empties.nth(i).locator("button").count()) > 0, `${hash} empty state ${i} has an action`);
  }
  await sample(page);
  for (const tab of ["drafts", "past"]) {
    await page.goto(base + `#/trips?tab=${tab}`);
    assert.ok((await page.locator(".empty button").count()) > 0, tab);
  }
  await page.goto(page.url().split("#")[0] + "#/trips");
  await page.getByRole("button", { name: /resume/i }).click();
  await page.getByRole("button", { name: "Ideas", exact: true }).first().click();
  assert.ok((await page.locator(".empty button").count()) > 0, "trip ideas");
  await close(page);
});

await check("G", "nothing claims to be saved to an account", async () => {
  const page = await open();
  await sample(page);
  for (const hash of ["#/trips", "#/you/account", "#/settings/general", "#/saved"]) {
    await page.goto(base + hash);
    assert.doesNotMatch(await page.locator("body").textContent(), /saved to (your )?account/i, hash);
  }
  await close(page);
});

await check("G", "the invite card appears after the first trip and stays dismissed", async () => {
  const page = await open();
  await sample(page);
  await page.locator(".invite-card").getByRole("button", { name: "Not now" }).click();
  await page.reload();
  await page.locator(".artifact").waitFor();
  assert.equal(await page.locator(".invite-card").count(), 0);
  await close(page);
});

await browser.close();
server.kill();
const failed = results.filter((r) => !r[2]);
console.log(`\n${results.length - failed.length}/${results.length} acceptance checks passed.`);
process.exit(failed.length ? 1 : 0);
