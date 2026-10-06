# Five journey implementation and verification

Implemented October 5, 2026 in the isolated frontend preview. Scope follows [the approved plan](five-journey-improvement-plan.md). These are working frontend journeys; this is not a production-readiness or 10/10 usability claim.

| Journey | Implemented | Verified |
| --- | --- | --- |
| Planning without dates | Multiple named collections, notes, copy/move/reorder, archive/restore, optional dates, allocation preview, editable brief, leftovers retained, reversible conversion. Removing dates retains original day order and archives a dated backup. | Collection notes survived reload; selected cruise scheduled once; unselected art retained; conversion undo returned cruise and notes; undated workspace preserved day order. |
| Research and comparisons | Contextual detail panel, photo source captions and gallery support, explicit unknown hours/availability, review focus, scoped notes, three-option comparison and reviewed choice. | Three-option tray enforced capacity; research notes persisted; choosing an activity opened a specific target proposal; cancellation preserved itinerary. |
| Chat-to-plan control | Day/activity targeting, multiple edits, independent selection, confirmed constraints, stale/duplicate checks, apply/cancel/undo, persisted proposal selection, retained ambiguous requests. | Selected Day 2 edit changed its correct slot while unselected Day 1 remained intact; undo restored it; changed itinerary blocked stale proposal; unchecked selection survived reload; cancel generation prevented late trip creation. |
| Return and resume | Full Home dashboard, named trip cards, status/search, recent research, unfinished decisions and briefs, lifecycle actions, start-screen choice, restored draft/day/selected detail context. | Draft and selected day survived reload; archived trip restored and resumed; cancelled generation remained an unfinished brief. |
| Recovery states | Settings-only preview tools, contextual retry, retained draft, partial results, storage failure download, simulated offline/access/conflict states. | Failed generation retained brief and retry succeeded; storage failure exposed recovery download; conflict review kept local; browser console was clear in checked flows. |

## Evidence basis

The plan cites observed Wanderlog W2/W4, WA02/WA04 and W6/W10 for undated organization and place research; Mindtrip M5 and MA15 for detail depth and editable memory; Layla LA03/05/07 and LA08 for brief review and constraint consistency; member landing observations MA14, WA01/07, LA01/09 for resume. Layla LA04 retained a stalled draft. Competitor offline, server sync and conflict handling were not verified.

## Validation

TypeScript/Vite production build passed. `scripts/check-journeys.mjs` passed migration preservation/idempotence, multi-edit index order, selected-only application, stale/duplicate rejection and confirmed brief/booking preservation. Browser walkthroughs covered the rows above and a 390 × 844 Ideas layout. Screenshots were inspected through the browser tool; no saved screenshot artifact is claimed.

## Practical limits

- Chicago fixture places and sample reviews remain. Current fixture photography is a single illustrative image per place; the gallery supports multiple sourced images when an adapter supplies them. Opening hours, cancellation terms and live availability are explicitly unknown.
- Chat uses a bounded local interpreter and an editable proposal builder. It is not connected to live AI generation or CopilotKit.
- State persists locally. Account expiry, connection checks and conflicts are simulations; the conflict example compares names only. These do not establish server sync, secure authentication or multiuser reliability.
- Comparison lenses and taste scoring are local heuristics. Real review evidence and matching quality require backend integration and measurement.
- Conversion undo archives the generated trip and returns selected ideas. Removing dates preserves a dated backup. Neither removes user history.
- Existing local data was preserved. Walkthroughs added disposable UX collections/trips and an unfinished brief; no external messages, bookings, reviews, deployment or account changes were made.
