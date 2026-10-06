# XPMatch: the complete plan

Written October 6, 2026. **This document replaces [redesign-plan.md](redesign-plan.md)** and folds in:
- the competitor research archive from October 5 (Mindtrip, Wanderlog, Layla, Boop);
- the earlier XPMatch build records;
- a code and screenshot review of the current frontend.

Evidence IDs (such as `LA08` or `WA04`) refer to steps in that archive.

Nothing in this plan is implemented yet unless it says **Done**.

---

## 1. What we are building

**One sentence:** describe a trip in plain language, get a whole trip you can trust, and see why every place fits *you*. Taste comes from real member reviews and your own feedback.

The core loop, from the product direction you recorded:

```
Describe the trip in chat
  → the AI shows the brief it understood (confirmed vs. assumed), which you can edit
  → a complete trip appears inside the chat (map, stays, days)
  → click anything → research it in the side panel (photos/map first, then why it fits, reviews, facts)
  → swap / add / move, with an impact preview → apply → undo
  → save, share, travel
  → after a visit: a private rating or a public review
  → the taste profile updates → better matches next time
```

**Agreed choices, which stay as they are:**
- blue branding;
- the chat embedded in the trip, with the composer docked at the bottom;
- the map above the itinerary;
- two-column stay recommendations;
- a side panel for research and changes;
- guest-first exploration, with no wall before value.

**What we will not do:**
- invent reviews, ratings or availability;
- claim the matching is better than plain ratings before the pilot proves it;
- let the AI break a constraint you confirmed (Layla did this in `LA08`);
- add features faster than we make them fit together.

---

## 2. Where we are today

### What works, as a frontend demo with Chicago sample data
- **Chat to trip.** You can go from a chat message to an editable brief to a generated trip, shown as map, stays and a day board.
- **Research panel.** It has photos, overview, reviews and research tabs; fit explanations that break down the score and let you correct a reason; and comparison of up to three places.
- **Swapping (Done Oct 6).** Every way to swap now goes through one side panel:
  - the Swap button on each card;
  - assistant suggestions;
  - "Choose for itinerary".

  It ranks alternatives with reasons, can trade two slots or leave a slot free, and keeps removed places in your ideas. Undo works, and an out-of-date suggestion is detected.
- **Planning without dates:** named Ideas collections, then a step that adds dates.
- **Inspiration:** sample member itineraries, saved separately from owned trips, with "Use this itinerary".
- **Taste profile:** private ratings, likes and dislikes by quality, and a summary of what it has learned.
- **Recovery states (simulated):** offline, expired access, failed generation, storage failure.
- **Trip checks** (`checkTrip` in `src/model.ts`): flags an over-budget stay, dates that don't match the day count, and empty days.

### What is simulated or missing
- **Data and AI:**
  - No live AI. The chat recognises only swap, weather and pace requests.
  - No sign-in or server. Everything lives in the browser's local storage.
  - Photos, ratings, reviews and fit scores are illustrative.
  - Opening hours, availability and cancellation terms are unknown.
- **Trip logistics:**
  - No travel times between stops.
  - No hotel check-in or check-out inside the days.
  - No real booking import.
- **Collaboration, messaging and offline** are local simulations.
- **The journey test script is broken.** `scripts/check-journeys.mjs` passes its proposal checks, then crashes importing `src/live/travel-day.ts`, which is not in this repo.

### The real problem: coherence

Your own assessment, recorded in the archive, is that the app has missed its intent. The review found why:

| Symptom | Evidence in the code |
|---|---|
| Three layers of navigation | A sidebar with 9 items plus extras, a "journey bar", and a page header. Home and Plan a trip render the same screen. |
| Five ways to "keep something" | Saved places, `ideaIds`, collections, saved itineraries, and "Pin alternative" |
| Duplicate surfaces | Two trip lists. Three taste editors. Four ways into bookings, three into Share, three offline toggles. |
| Too many pop-ups | About 30 modal variants remain. They are the default way to do anything. |
| Controls too small and too close | Map pins are 27px and many buttons are 30–36px. Rows of 4–5 controls sit 8–10px apart. 7–8px text appears 37 times. |
| No design system | About 259 colour values, no spacing scale, about 15 corner radii, 10 breakpoints |

### Scorecard (1–10)

- Competitor scores combine first-hand runs from the archive with published reviews.
- Mindtrip and Layla were adjusted after the archive. Mindtrip's guides route allows a guest trip and its setup can be skipped. Layla broke a confirmed constraint.
- The XPMatch target assumes Workstreams A–G (frontend) are done. Collaboration stays low until there is a backend (Workstream H).

| | Navigation | Onboarding / time to value | Planning workspace | Explainability | Trust in constraints | Collaboration | Polish / touch targets | Mobile |
|---|---|---|---|---|---|---|---|---|
| Mindtrip | 7 | 7 | 8 | 5 | 6 | 8 | 8 | 7 |
| Wanderlog | 7 | 7 | 9 | 4 | 7 | 9 | 6 | 6 |
| Layla | 6 | 8 | 6 | 5 | 3 | 3 | 7 | 7 |
| **XPMatch now** | **3** | **6** | **6** | **8** | **7*** | **2** | **4** | **4** |
| **XPMatch target** | 8 | 8 | 8 | 9 | 8* | 4 | 8 | 7 |

\*On sample data only. Real trust in constraints needs real generation and real data (Workstream H).

---

## 3. Rules every workstream follows

**Spacing and touch**
- At least **44×44px** hit area on touch screens, and at least 40px for dense desktop icons. A visual mark can be smaller than its hit area.
- At least **8px** between neighbouring controls, **12px** inside rows of actions, and **24px** between a primary action and a destructive one.
- At most **one primary action** per region. At most **three visible actions** per row; the rest go in a "…" menu.

**Type, colour and shape**
- Type scale `12 / 14 / 16 / 20 / 28 / 40`, with nothing below 12px. The serif face is used only for page titles.
- **No small uppercase labels above headings** ("YOUR TRAVEL ASSISTANT" and the like). Delete them.
- Spacing scale `4 8 12 16 24 32 48 64`.
- About 12 named colour variables (`--ink`, `--muted`, `--line`, `--surface`, `--brand`, `--brand-strong`, `--brand-soft`, `--success`, `--warning`, `--danger`, `--focus`…) and no raw colour values.
- Corner radii `6 / 10 / 16`, plus fully round.

**Pop-ups.** Modals are used only for:
- confirming something destructive;
- Share;
- creating a trip.

Everything else opens in the side panel, a tab, or a sheet on mobile.

**Honesty.** Every price, opening hour, rating or photo carries its source or says "unknown". Text never says a plan is "saved to your account" unless it was.

**Identity.** A place has one ID across chat, cards, pins, collections and the side panel. Wanderlog once opened the wrong place (`W10`).

**Verification.** Each slice ships with:
- a production build;
- browser checks at **1440px and 390px**;
- its acceptance checks below, run in a real browser;
- no console errors.

---

## 4. Workstreams

They are ordered by what unblocks the next one. Each lists **why** (with evidence), **what**, **done when** (acceptance checks), and the **main files** involved.

### A. Foundations (about 1 week)

**Why:** every later workstream needs shared components, design tokens and a working test harness.

**What**
1. **Delete dead code:**
   - the `ideas`, `return-hub` and `replan` modals in `App.tsx`;
   - `JourneyHub.Ideas` and `ReturnHub`;
   - the unused `Inbox.onSource` prop;
   - the `.live-*` and `.connected-workspace` CSS;
   - the duplicate `.filter-row` and `.inspiration-grid` rules;
   - uses of the undefined `var(--border)`.
2. **Add a token file** (`src/tokens.css`) and move `styles.css` onto it, one area at a time.
3. **Shared components** in `src/ui/`:
   - `Button`, with `primary | secondary | ghost | danger` variants and `sm | md` sizes;
   - `IconButton`, `Chip`, `Segmented`, `Sheet` and `Panel`.

   Replace the bare `className="button"` uses in `Inbox.tsx` and `Inspiration.tsx`.
4. **Fix touch targets and tiny text.** The list of offenders: `.map-pin`, `.save-button`, `.send-button`, `.icon-button`, `.text-button`, `.filter-row button`, `.day-filters button`, `.journey-bar button`, `.review-actions button`, `.activity-menu button`, the gallery controls, and all 7–8px text.
5. **Repair `scripts/check-journeys.mjs`.** Remove or restore the `src/live/travel-day.ts` import. Add a `test` script to `package.json`.
6. **Add `scripts/check-ui.mjs`,** a Playwright script that fails the run on:
   - an interactive element under 44px at 390px wide;
   - two neighbouring controls closer than 8px;
   - text under 12px;
   - horizontal scrolling;
   - console errors.

**Done when**
- `npm run build` and `npm test` both pass.
- `check-ui` passes on every page at 390px and 1440px.
- There are no colour values outside the token file in new or touched CSS.

### B. Finish the swap experience (2–3 days, can start right away)

**Why:**
- Your acceptance check says *"A swap shows before/after timing, transfers and affected bookings; undo restores the previous version."*
- Journey 3 of the five-journey plan asks for the confirmed constraints to show, for booking conflicts to be flagged, and for several suggestions to be applied together.
- Folding the review pop-up into the panel on Oct 6 dropped three things it had: queuing several suggestions, the confirmed-brief summary, and the booking warning.

**What**
1. **Impact line on every option** in `SwapPanel.tsx`:
   - the change in duration;
   - an estimated walk before and after the stops either side, using the sample map coordinates and clearly labelled "estimate";
   - the day's new total time;
   - whether it is still within the brief's pace.
2. **Constraints line** under the panel header: "Oct 16–18 · 2 travelers · Relaxed · $200/night · no flights", with an **Edit brief** link.
3. **Booking warning** when the activity being replaced matches a booking in the trip: "You have a reservation for The Gage. Swapping won't cancel it."
4. **Queued suggestions.**
   - The assistant can propose changes to several activities.
   - Each queued change shows a "Suggested" badge on its itinerary card, and there is a "2 suggested changes · Review" bar.
   - The panel steps through them (Apply / Skip), and there is an **Apply all** button. Out-of-date ones are skipped and reported.

   This replaces the old checkbox list and still meets the "propose two, reject one, apply one" test.
5. **Route "Add to itinerary" through the panel's place mode.** Today the button on the place details still opens a pick-a-day pop-up.

**Done when**
- Every option shows its time and walking impact and the day total.
- Replacing a booked activity shows the warning.
- After proposing two changes, skipping one and applying the other, only the right activity changes.
- Undo restores the previous version.
- An out-of-date suggestion cannot be applied.
- The add, swap and trade flows all pass on desktop and mobile.

### C. App shell and navigation (about 1–1.5 weeks)

**Why:** this is the biggest single cause of "doesn't make sense". It also follows the layout sketch.

**What**

The layout, matching your sketch:

```
┌──┬────────────┬───────────────────────────────────────┬──────────────┐
│R │ context    │ [ Tab ] [ Tab ] [ Tab ]               │ SIDE PANEL   │
│A │ list       │ MAIN CONTENT                          │ details or   │
│I │            │ ── docked composer / suggestion card ─│ swap         │
│L │            │                                       │              │
├──┴────────────┴───────────────────────────────────────┴──────────────┤
│ status: saved on this device · preview mode · sync    undo · help    │
└──────────────────────────────────────────────────────────────────────┘
```

**1. The left rail** has five destinations plus an avatar:
- **Trips** – replaces Home, Plan a trip and My trips.
- **Discover** – replaces Discover, Community and member itineraries.
- **Inbox** – replaces Messages and Notifications.
- **Saved** – collections.
- **Settings.**
- **The avatar** opens You: the taste profile and account.

**2. The sidebar** lists whatever belongs to the current destination:

| Destination | Sidebar shows |
|---|---|
| Trips | Your trips, with **New trip** at the top |
| Inside a trip | The days, plus "Unscheduled" |
| Discover | Categories and filters |
| Inbox | Threads |
| Saved | Collections |

**3. Tabs** (at most three):

| Context | Tabs |
|---|---|
| Inside a trip | Itinerary · Ideas · Bookings |
| Discover | Places · Itineraries · People |
| Trips | Upcoming · Drafts · Past |

**4. The side panel** is one place for everything you select. It holds place details (today's `DetailPanel`) and swap/place choices (`SwapPanel`), with a header naming what is selected. With nothing selected, it shows the trip summary and map.

**5. The status bar** shows save, sync and preview state. This replaces the "FRONTEND PREVIEW" badge and most of the banners above the main area.

**6. Routing** uses hash paths: `#/trips`, `#/trip/:id/itinerary?day=2&place=gage`, `#/discover/places`, and so on. The selected place and day can be restored from the URL (Boop does this, `BM12`).

**7. On mobile (390px):**

| Desktop region | On a phone |
|---|---|
| Rail | A bottom tab bar with five items, each at least 48px |
| Sidebar | A sheet that opens from the page title |
| Side panel | A bottom sheet, half or full height |
| Composer | Docked above the tab bar |

**8. Remove the journey bar,** the duplicate notification and settings links, and the sidebar promo card.

**Done when**
- Every old page can be reached in two taps or clicks or fewer.
- Reloading any URL restores the same view, day and selected place.
- The browser back button works between views.
- Keyboard focus order matches the visual order.
- `check-ui` passes.

### D. Merge the duplicates (about 1 week)

**Why:** having five save models and three taste editors is the main reason the journeys feel unrelated. Boop keeps saved places and saved trips separate (`BM05`, `BM11`), but within one clear model.

**What**

| Today | After |
|---|---|
| Saved places + `ideaIds` + collections + saved itineraries + Pin alternative | **Collections.** You save a place or an itinerary into a collection, and each trip has its own Ideas collection. Removing something from a trip always sends it to that trip's Ideas. Migration (in `migrateWorkspace`) carries everything over without losing data and is safe to run twice. |
| Home + My trips | **Trips**, a single list |
| Taste setup modal + calibrate modal + Taste page + interests inside the brief | One **Taste** editor under You. First-run setup is the same component in a short, skippable mode. The brief reads the profile but can override it for one trip, clearly labelled "this trip only". |
| Comparison tray + Quick comparison | One **Compare**, up to 3 places, in the side panel |
| Two "choose stay" paths with different side effects | One action: it sets the stay, then offers "Add booking" |
| 4 entries to bookings, 3 to Share, 3 offline toggles | The Bookings tab; one Share button in the trip header; offline toggle only in Settings → Preview tools |
| 3 member-profile views | One profile view in the side panel |

**Done when**
- Migrating existing local data loses nothing, and migrating twice changes nothing.
- A place saved anywhere appears in exactly one predictable collection.
- Editing taste in setup and on the Taste page changes the same data.
- There are no more than 10 modal variants.

### E. Chat → brief → trip artifact (about 1.5 weeks)

**Why:**
- Layla's checklist made the AI's understanding visible (`LA03`, `LA05`), but its output still broke confirmed facts (`LA08`).
- Mindtrip shows check-in and check-out in the days, plus distances between stops (`M9`).
- Your notes ask for confirmed vs. inferred fields, constraint checks before a trip is marked ready, and clear submit and retry states.

**What**
1. **Brief checklist** with five items: where, from, who, when, what you're after.
   - Each field is labelled **Confirmed**, **From your profile**, **Assumed** or **Unknown**.
   - Correcting a field updates the brief before anything is generated.
   - Never invent a departure city.
2. **Constraint check before "ready".** Extend `checkTrip` into a single validator covering:
   - no flights or transport when the trip is local;
   - stay price under the nightly target, with nights × travellers × taxes shown as an estimate;
   - the day count matching the dates;
   - pace (stops and hours per day);
   - places you excluded.

   Conflicts show on the trip, each with a fix action, before "Your trip is ready".
3. **Stays across the whole trip.** Keep the two-column stay picker. Show **Check-in** on the first day and **Check-out** on the last. Show the total price basis and cancellation terms, or "unknown". Don't repeat the hotel as a daily recommendation.
4. **Travel between stops** on the day board: an estimated walk or transit time between consecutive stops, labelled as an estimate. This uses the same helper as the impact line in Workstream B.
5. **Submit states:**
   - sending → thinking → progress → ready / failed;
   - the draft survives a failure or reload;
   - retrying produces exactly one result (Layla's stalled submit, `LA04`);
   - generation can be cancelled.
6. **The trip appears inside the chat thread,** with one clear "Open full trip" action. The composer stays reachable while you scroll.

**Done when**
- One prompt produces dates, days, places, stay options and map state.
- Correcting "no flights" removes every flight or origin item from the same version.
- An over-budget stay is flagged with its price basis.
- Clicking a hotel in chat opens exactly that hotel in the panel. The same holds for map markers and activity cards.
- The draft and scroll position survive leaving and coming back.
- A failure keeps the prompt, and retrying creates one trip.

### F. Research, reviews and the taste loop (about 1.5 weeks)

**Why:**
- Reviews and member taste are the product's moat (Sources 17–19).
- Mindtrip separates ratings from other sites from community mentions (`M5`).
- Wanderlog splits Reviews, Photos and Mentions (`W6`).
- Boop shows the person behind each recommendation (`BG05`, `BG16`).
- No competitor was observed explaining personal fit.

**What**
1. **Side panel order:**
   - photos and map;
   - **Why it fits you** (moved up from the Research tab): the top three reasons, each correctable, plus a confidence level;
   - facts, with a source or "unknown";
   - reviews.
2. **Separate the evidence types:**
   - the aggregate rating from other sites;
   - XPMatch member reviews, with the reviewer's taste context;
   - mentions in guides or itineraries.

   Never blend them into one number.
3. **Review filters by quality,** for example "reviewers who also like quiet places".
4. **Post-visit loop.** After a trip day, or from a "Visited" check on the card, ask one quick question: "How was it?" Then let the member choose:
   - **private** – it only teaches their taste;
   - **public** – it becomes a member review.

   Show what changed, for example "The Gage: 61 → 68 for you".
5. **First-review onboarding.** Aim for three real reviews of places the member already knows, mixing good and bad. Never require it before planning.
6. **Provenance.** A recommendation that comes from a member itinerary links back to that itinerary and its author. You can look at the source without losing your chat draft.

**Done when**
- Fit explains its supporting evidence and says "not enough evidence" when evidence is sparse.
- Correcting a reason changes future rankings, and Undo restores them.
- Private feedback never appears publicly.
- Editing or deleting a review updates fit everywhere.
- Every review carries a "sample" label until real data exists.

### G. Onboarding, return and empty states (about 1 week)

**Why:**
- Mindtrip's setup is long but can be skipped and resumed, and its memory can be edited (`MA04`, `MA15`).
- Wanderlog's help is tied to the task in front of you (`WA06`, `WA09`), and its invitations are optional (`WA03`).
- Signing up should be earned by showing value first (Layla `L9`, Boop `BG08`).

**What**
1. **First visit:**
   - Trips opens with an empty state centred on the composer and "Try a sample Chicago trip".
   - The taste quick-start is an optional card, not a pop-up.
2. **Help in context:** short, dismissible hints anchored to the map, a card and the side panel, which can be replayed from Help. This replaces the long workspace guide.
3. **Coming back:** the Trips list shows for each trip:
   - its status;
   - when you last worked on it;
   - its **specific** open decisions (no stay chosen, unscheduled ideas, a budget conflict).

   Resume restores the conversation, draft, day and selected place.
4. **Every empty state offers a next step** (`BM04` showed one that didn't).
5. **Honest saving.** Say "Saved on this device" until there are accounts. When accounts exist, signing in or cancelling keeps the draft and returns you to the same place.
6. **Invitations** are offered after the first useful trip, and can be skipped.

**Done when**
- Skipping taste setup still reaches planning, and setup can be finished later.
- A dismissed hint stays dismissed and can be replayed.
- Reloading returns the same trip and context.
- No empty state is a dead end.
- Nothing says "saved to account" in local mode.

### H. Backend and production (separate track; this plan only outlines it)

None of this is frontend work, and none of it should be claimed until it ships.

| Area | What it needs |
|---|---|
| Accounts | Sign-in, sessions, keeping a guest's draft when they sign up, recovery |
| Generation | Real AI planning behind the existing adapter: structured trip output, the same constraint validator on the server, idempotent retries |
| Place data | Google Places or similar: hours, price basis and photos with sources; unknown stays unknown |
| Persistence | Server storage for trips, collections and taste; sync, conflict handling, export and deletion |
| Collaboration | Invites, viewer and editor permissions, comments, version history |
| Reviews community | Publishing, moderation, rate limits, reporting; a one-city restaurant pilot with real members and no seeded or fake reviews |
| Matching pilot | The consented 50/50 ranking test from Source 18. Primary metric: the share of members who rate their first visit 4–5 out of 5. Planning target: about 392 responses per group. |
| Trip operations | Booking import, offline download, travel-day mode, replanning when things go wrong |

---

## 5. Sequencing

| Week | Ships | Why in this order |
|---|---|---|
| 1 | **A** Foundations + **B** Finish swap | B is small and closes the known gap. A unblocks everything else. |
| 2–3 | **C** Shell and navigation | It changes every screen, so it should happen before polishing any single one |
| 3–4 | **D** Merge duplicates | Needs the new shell's slots: the side panel, tabs and Saved |
| 5–6 | **E** Chat → brief → artifact | The heart of the product, built on clean structure |
| 6–7 | **F** Research, reviews and taste loop | Needs E's artifact and D's single taste model |
| 8 | **G** Onboarding and return | Easiest to get right once everything else is stable |
| Then | **H** Backend track | Can start in parallel with C through G using the adapter interfaces |

Each week ends with:
- a deploy to Railway from `main`;
- a 1440px + 390px browser run of that week's acceptance checks;
- an updated scorecard (§2).

---

## 6. How we will know it worked

- **Automated:** `npm test` runs the journey logic checks, and `check-ui` checks touch targets, spacing, text size, overflow and console errors. Both run on every change.
- **Moderated usability test** after Workstream G, with five or more people using a fresh sample trip and no coaching. Tasks:
  1. Plan a three-day trip from one sentence.
  2. Find out why a place was recommended, and correct one reason.
  3. Swap an activity for something indoor, then undo it.
  4. Save two ideas without dates, then schedule one.
  5. Leave, come back, and pick up where you left off.

  Measure completion rate, errors, time on task and whether people understood what happened. Scores in §2 are updated only from these results.
- **Matching quality:** only the pilot in Workstream H can show that personal ranking beats plain ratings. Until then the product says "ranked by your taste" and never "better matches".

---

## 7. Decisions needed from you

1. **Swap suggestions:** replace the old checkbox list with queued suggestions and **Apply all** (Workstream B4). *Recommended.*
2. **Community and messaging:** ship Discover → People and Inbox now as labelled previews, or hide them until there is a backend? *Recommended: hide messaging, and keep member itineraries as sample inspiration.*
3. **Landing screen:** should the Trips list be the first screen for everyone? *Recommended: yes.*
4. **Look and feel:** tighten the current blue + serif look (*recommended*), or do a full visual rebrand?
5. **Pilot city and category** for the reviews community (Source 17 suggests restaurants in one city).

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Restructuring breaks existing local data | Versioned `migrateWorkspace` with tests for preservation and running twice. Never reset user data. |
| The shell rewrite becomes a big-bang change | Build the shell around the existing page components first, then rework the internals page by page |
| Sample-data fixes hide real-world failures | Every rule in the constraint validator runs on the server too (Workstream H). Label everything "sample" until it is real. |
| Feature creep returns | No new destination or modal without a decision that removes or merges something else |
| The scores stay opinion | Update scores only from the usability test and the pilot |

---

## Appendix: evidence → requirement trace

| Evidence | Requirement | Workstream |
|---|---|---|
| LA03, LA05 | Brief checklist with confirmed/assumed fields | E1 |
| LA08 | Constraint check before ready; never invent an origin | E2 |
| LA04 | Draft retained; single-result retry | E5 |
| M9 | Check-in and check-out in the days; distances between stops | E3, E4 |
| M5, W6 | Separate evidence types in research | F2 |
| W10 | One place ID everywhere | §3 rule, E acceptance check |
| WA02, WA04 | Planning without dates | D (Collections), already built |
| WA03 | Optional invitations after first value | G6 |
| WA06, WA09 | Help tied to the task | G2 |
| MA04, MA15 | Skippable setup; editable memory | D (one taste editor), G1 |
| BG05, BG16 | Member behind each recommendation | F6 |
| BG08, BM05, BM11 | Whole-trip vs. single-place saves | D (Collections) |
| BM04 | Every empty state has a next step | G4 |
| BM12, BG07 | URL restores view; canonical dates and counts | C6, E2 |
| Five-journey plan, journey 3 | Several suggestions, constraints visible, booking conflicts | B2–B4 |
| Your acceptance check on swaps | Timing, transfers and bookings shown before applying; undo | B1, B3 |
| Sources 17–19 | Real review community; consented ranking pilot | F4, F5, H |
