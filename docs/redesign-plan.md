# XPMatch redesign plan

Status: **proposal, awaiting confirmation**. No UI code has changed yet.

Inputs:
- A full review of `src/` and `docs/`.
- Rendered screenshots at 1440px and 390px.
- A competitor scan.
- The layout sketch (left rail, sidebar, tabs, main content, right side bar, bottom bar).
- The [impeccable](https://github.com/pbakaus/impeccable) design method. This plan follows its `shape` step (decide before building) and uses its `critique`, `layout` and `craft-floor` checks.

---

## 1. Diagnosis: why the app feels incoherent

Most screens are fine on their own. The problem is that they don't add up to one product.

| Problem | Evidence |
|---|---|
| **Too many ways to get around** | Three layers of navigation are stacked on top of each other: a sidebar with 9 items plus Notifications, Settings and account; a "journey bar" (Your next step / Refine your taste / Ideas first); and a page header. Home and Plan a trip render the same screen. 13 page states. |
| **Five different ways to "keep something"** | Saved places, `ideaIds`, Ideas collections, saved itineraries, and "Pin alternative" (which quietly adds to Saved places). Items removed from a trip end up in different places depending on the flow. |
| **Duplicate surfaces** | Two trip lists (Home, My trips). Three taste editors (setup modal, calibrate modal, Taste page). Two comparison tools in one tab (Comparison tray, Quick comparison). Three ways to swap an activity. Four ways into bookings. Three ways into Share. Three offline toggles. |
| **No consistent rule for modal vs. page** | About 35 modal variants. Proposals, brief edits and stays open in modals. Itinerary copies and Ideas scheduling are inline. "Use this itinerary" opens its review *below the whole grid*, away from the card you clicked. |
| **Controls packed too tightly** | Map pins are 27px, the save button 30px, the send button 33px, `.icon-button` 36px, and `.button` 42px. Day filters, journey-bar buttons and review actions are about 30px tall. The Inbox row has Accept/Decline/Block/Report with 8px between them. An idea row has 5 controls with a 10px gap. 8px text is used 29 times and 7px text 8 times. |
| **No design system** | About 259 distinct colour values (six near-identical light blues, plus leftover Tailwind colours), font sizes from 7 to 62px, no spacing scale, about 15 corner radii, and 10 breakpoints. `var(--border)` is used but never defined. `.filter-row` and `.inspiration-grid` are each defined twice, and the second definition breaks the welcome grid. |
| **The differentiator is buried** | "Why this fits you" is the one thing no competitor does well. Here it sits in four collapsed `<details>` blocks, three levels down in Research. |
| **Dead code** | The `ideas`, `return-hub` and `replan` modals, `JourneyHub.Ideas`/`ReturnHub`, `Inbox.onSource`, and the `.live-*` / `.connected-workspace` CSS. |

## 2. Score against the competition

Rubric: 1–10 per area. 10 = best in class, 7–8 = strong with friction, 5–6 = works but generic or has gaps, 3–4 = weak or bolted on.

Competitor scores come from published reviews and product pages, not hands-on testing. XPMatch's scores come from the code and screenshots.

| App | Navigation | Onboarding / time to value | Planning workspace | Personalization / explainability | Collaboration | Polish / touch targets | Mobile | **Avg** |
|---|---|---|---|---|---|---|---|---|
| Airbnb | 9 | 8 | 2 | 6 | 6 | 10 | 9 | **7.1** |
| Mindtrip | 7 | 5 | 8 | 6 | 8 | 8 | 7 | **7.0** |
| Wanderlog | 7 | 7 | 9 | 4 | 9 | 6 | 6 | **6.9** |
| Stippl | 7 | 7 | 7 | 4 | 7 | 8 | 6 | **6.6** |
| Layla | 6 | 7 | 6 | 6 | 3 | 7 | 7 | **6.0** |
| Google AI Mode Canvas | 6 | 9 | 7 | 5 | 2 | 7 | 4 | **5.7** |
| **XPMatch today** | **3** | **6** | **6** | **7** | **3** | **4** | **4** | **4.7** |
| **XPMatch after this plan (target)** | 8 | 8 | 7 | 9 | 4* | 8 | 7 | **7.3** |

\*Collaboration stays low until there is a backend. That is a product gap, not a design one.

**Where XPMatch already wins:**
- No login wall (Mindtrip has one).
- A sample trip appears instantly.
- Taste profiles you can see and correct. No competitor offers this.

**Where it loses:** almost entirely on structure and craft, and those are fixable without new features.

**Sources:** Wanderlog (tripstone.app, itechguides), Mindtrip (monkeyeatingmango.com, aitravel.tools), Layla (aitravel.tools, Trustpilot), TripIt (going.com), Google Canvas (engine.com, TechCrunch), Airbnb (Skift, airbnb.com/release), Stippl (stippl.io, App Store).

## 3. The new structure, mapped to the sketch

```
┌──┬────────────┬───────────────────────────────────────────┬──────────────┐
│  │ ‹context›  │ [ Tab ]  [ Tab ]  [ Tab ]                 │  INSPECTOR   │
│R │ list       │                                           │  why it fits │
│A │            │  MAIN CONTENT                             │  map / photo │
│I │            │                                           │  alternatives│
│L │            │  ─ assistant / proposal card (docked) ─   │              │
├──┴────────────┴───────────────────────────────────────────┴──────────────┤
│ status: saved on device · preview mode · sync           undo · help       │
└───────────────────────────────────────────────────────────────────────────┘
```

### Left rail: 5 destinations plus your profile

The rail replaces the 9-item sidebar, the journey bar and the separate Notifications and Settings links.

| Icon | Destination | What it absorbs |
|---|---|---|
| Home | **Trips** | Home, Plan a trip, My trips |
| Search | **Discover** | Discover, Community, member itineraries |
| Bell | **Inbox** | Messages, Notifications |
| Bookmark | **Saved** | Saved places, Ideas, saved itineraries (one model, see §4) |
| Gear | **Settings** | Settings, preview and recovery tools |
| Avatar (bottom) | **You** | Taste profile, account |

### Sidebar: the list for wherever you are

| Destination | What the sidebar lists |
|---|---|
| Trips | Your trips. The top pill (the "›" button in the sketch) is **New trip**. |
| Inside a trip | Days of the trip, plus "Unscheduled". |
| Discover | Categories (Places, Itineraries, People) and taste filters. |
| Inbox | Threads. |
| Saved | Collections. |

### Tabs: at most 3, always the same idea

| Context | Tabs |
|---|---|
| Inside a trip | **Itinerary** · **Ideas** (that trip's undated places) · **Bookings** (the one way into reservations) |
| Discover | **Places** · **Itineraries** · **People** |
| Trips list | **Upcoming** · **Drafts** · **Past** |

### Main content

The current tab's content. The assistant composer docks at the bottom of the main column; it is the card at the bottom of the sketch. Proposed changes appear there as one card ("3 changes to Day 2 · Review") instead of a modal.

### Right side bar: one inspector for everything you select

- **"Why it fits you" comes first**: the three-bullet box in the sketch, each reason correctable in place.
- Below it: the map or photo, then **Alternatives / Compare**. This replaces the Comparison tray, Quick comparison, Pin alternative and the three swap flows.
- With nothing selected, it shows the trip summary and map.
- Its header names what is selected, not "Trip details".

### Bottom bar: a quiet status bar

- **Left:** "Saved on this device", preview mode, sync/offline state. This takes over the "Frontend preview" badge and most of the banners above the main area.
- **Right:** undo, help, keyboard shortcuts.

### Mobile (390px)

| Desktop region | On a phone |
|---|---|
| Rail | Bottom tab bar with 5 items, each at least 48px |
| Sidebar | A sheet that opens from the page title |
| Tabs | Stay as a segmented control under the title |
| Inspector | Bottom sheet (half or full height) |
| Status bar | Moves into Settings, plus a toast when the state changes |
| Composer | Docked above the tab bar |

## 4. Merging duplicate features

| Today | After |
|---|---|
| Saved places + `ideaIds` + Ideas collections + saved itineraries + Pin alternative | **Collections.** You save a place or an itinerary into a collection. Each trip has its own "Ideas" collection. Removing something from a trip always sends it to that trip's Ideas. |
| Home + My trips | **Trips** (one list) |
| Taste setup modal + calibrate modal + Taste page + interests inside the brief | **You → Taste**: one editor. First-time setup is the same component in a 3-question mode, and it can be skipped. The brief reads from the profile and does not edit it. |
| Find an alternative / Ask AI swap / tray "Choose for itinerary" | **Replace…**: opens Alternatives in the inspector |
| Comparison tray + Quick comparison table | **Compare** in the inspector, up to 3 items |
| Two "choose stay" paths with different side effects | One action: it sets the stay and offers "Add booking" as an optional follow-up |
| 4 ways into bookings, 3 into Share, 3 offline toggles | Bookings tab; one Share button in the trip header; offline toggle only in Settings → Preview tools |
| ~35 modal variants | Modals only for destructive confirmations, Share, and creating a trip. Everything else opens in the inspector, a tab, or a sheet. |
| 3 member-profile presentations | One profile view (inspector on desktop, sheet on mobile) |

### What each journey becomes

| Journey | Flow after the redesign |
|---|---|
| **First visit** | Trips, with an empty state that offers the composer and "Try a sample Chicago trip". Taste quick-start appears as an optional card, not a modal. |
| **Plan** | Brief → generating card → trip workspace (Itinerary tab) → select an activity → inspector → Replace or Compare → confirm |
| **Inspiration** | Discover → Itineraries → card → inspector preview → **Make it my trip** (creates a draft trip) or **Save to collection** |
| **Research** | Select any place in any view → inspector → why it fits, reviews, notes, compare |
| **Return** | Trips list → resume. Restoring your place from the URL (hash path such as `#/trip/:id/itinerary?day=2`) is kept from the Boop audit. |
| **Messages** | Inbox → thread. Accept and Decline are visible; Block and Report go in an overflow menu. |

## 5. Design system rules (impeccable `layout` + `craft-floor`)

**Spacing**
- A 4px-based scale: `4 8 12 16 24 32 48 64`.
- Spacing groups things that belong together; borders and boxes come second.

**Gaps between controls (the "not too close together" rule)**
- At least **8px** between any two neighbouring controls.
- At least **12px** inside rows of actions.
- At least **24px** between a primary action and a destructive one.

**Touch targets**
- At least **44×44px** on touch screens, and at least 40px for dense desktop icon buttons.
- The hit area can be larger than the visible mark. Map pins keep a small dot but get a 44px hit area.

**Actions per region**
- At most **one primary action** per region.
- At most **three visible actions** per row; anything more goes into a "…" menu.

**Type**
- One scale: `12 / 14 / 16 / 20 / 28 / 40`. Nothing below 12px.
- The DM Serif Display face is used only for page titles.
- Remove all the small uppercase labels above headings ("YOUR TRAVEL ASSISTANT", "DISCOVER", "MEMBER INSPIRATION · SAMPLE CONTENT"…). impeccable bans these outright, and they add clutter to every screen today.

**Colour**
- About 12 named colours (ink, muted, line, surface, surface-raised, brand, brand-strong, brand-soft, success, warning, danger, focus).
- Every colour comes from a named variable; the 259 literal values go.
- The blue brand stays.

**Corner radii:** three values (`6 / 10 / 16`) plus fully round.

**Breakpoints:** three (`≤640` phone, `≤1024` tablet, `≥1440` wide). On tablet the inspector slides over the content and the sidebar collapses into the rail.

**Components**
- One `Button` with `primary | secondary | ghost | danger` variants and `sm/md` sizes. Even `sm` has a 40px hit area.
- One `Chip`, one `IconButton`, one `Segmented` control.
- The bare `className="button"` uses in Inbox and Inspiration go away.

**States:** each surface ships hover, focus, disabled, loading, empty and error states.

**Browser defaults to theme:** text selection, scrollbars, focus rings.

## 6. Build phases

Each phase ships on its own and leaves the app working.

| Phase | Work |
|---|---|
| **0. Foundations** (no visual change in structure) | Delete dead code. Add the token file (spacing, type, colour, radius). Build the `Button` / `IconButton` / `Chip` / `Segmented` components. Fix touch targets and the 7–8px text. Merge the duplicate CSS rules. |
| **1. Shell** | Rail + sidebar + tabs + main + inspector + status bar. Hash routing with paths (`#/trips`, `#/trip/:id/itinerary`, `#/discover/places`…). Mobile tab bar and sheets. |
| **2. Merging** | One trip list, the Collections save model (with a migration from the current local state), one taste editor. |
| **3. Trip workspace** | Itinerary / Ideas / Bookings tabs. Inspector with "why it fits" first, Replace and Compare. Proposals as a docked card. |
| **4. Discover, Inbox, You** | Rebuilt on the same shell and components. |
| **5. Verify** | Extend `scripts/check-journeys.mjs` with Playwright checks at 390px and 1440px: no interactive element under 44px on mobile, no pair of neighbouring controls closer than 8px, no text under 12px, no horizontal scroll, every journey in §4 completes. Then one impeccable `critique` + `audit` pass, and a fix batch. |

## 7. Open decisions (need the owner)

1. **Community and messaging in v1.** They are simulated, with no backend. Should Discover → People and Inbox ship now, or wait until there is a server?
2. **Look and feel.** Keep the current calm blue + serif look and tighten it (recommended, and it matches the docs' "must preserve" list), or treat this as a full visual rebrand?
3. **Start screen.** Should Trips (the list) be the landing page for everyone, including first-time visitors? Recommended, with an empty state built around the composer.
