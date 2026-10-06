# Five journey improvement plan

October 5, 2026. Frontend scope; backend connections later. Goal: a coherent ideas → research → plan → return → recovery journey. Preserve blue branding, embedded chat, fixed composer, map-first artifacts, two-column stays and contextual Trip details. “10/10” is the quality target, not a claim established by implementation alone.

## Evidence
Research: competitor-research/USER_JOURNEY_MAPS.md and AUTHENTICATED_JOURNEY_AUDIT.md in XPMatchV4.
- Wanderlog W2/W4 and WA02/WA04: optional dates and undated workspace with lists, map, notes, reservations and saved feedback.
- Wanderlog W6/W10: separate photos/reviews/mentions, sourced clickable places and price-benchmark vs availability distinction. A single-run wrong-place detail incident motivates canonical identity checks.
- Mindtrip M5: rich place sheet with facts, sources and community mentions. MA15: editable persistent preferences.
- Layla LA03/LA05/LA07: brief checklist, confirmation and map-first generated artifact. LA08: no-flight/origin and budget contradiction in one observed run, not a universal defect claim.
- Mindtrip MA14, Wanderlog WA01/WA07, Layla LA01/LA09: member landing and same-browser resume/persistence.
- Layla LA04: retained draft during stalled submission. Competitor offline, synchronization conflicts, cross-device migration and permission recovery were not verified; target designs below are recommendations.

## Shared foundation
Introduce a durable planning workspace with optional dates and one canonical place ID across chat, collections, itinerary, map, comparison and detail. Separate collection membership from activity instances (revisits allowed; accidental duplicates prevented). Keep workspace research and notes scoped to a trip/collection, while personal ratings remain global. Preserve existing device-local trips, notes, ratings and unscheduled ideas through a versioned migration; no reset.

Use explicit state for proposed/applied changes, revision IDs, draft messages, current workspace/day, selected place, comparison selection and scroll position. Service interfaces accept fixtures now and real data later. Price, opening hours, images and availability carry source/status metadata; missing data stays unknown.

## 1. Planning without dates
Replace modal-only Ideas with a full Ideas workspace available from navigation and chat. Map above named collections and an unscheduled tray; research opens beside it. Add/rename/reorder/archive-and-restore collections; add notes/checklists; move/copy places with clear membership feedback. Empty state teaches the first place addition without requiring a date.

Add dates later through a reviewable conversion: select which ideas to schedule, preview day allocation, retain leftovers and preserve collection identity, notes and conversation. Manual add-to-day remains possible without AI. Removing dates converts dated activities into undated planning days while keeping order and a reversible conversion snapshot. Never invent dates or claim a navigable optimized route.

Acceptance: create two collections without dates; research and move a place; reload; add dates; schedule selected ideas once; retain leftovers; undo conversion; recover original memberships and notes. At 390px the composer and core actions remain usable.

## 2. Research and comparisons
Keep visual-first detail panel, add photo gallery with source captions and honest missing-photo state. Facts include hours/status, duration, address, total-price basis and cancellation terms when supplied; unknown fixture facts explicitly remain unknown. Separate source aggregate rating, XPMatch reviews and web mentions. Filter member reviews by relevant dimensions and show their evidence status.

A comparison tray holds 2–3 same-kind options with shared criteria: taste evidence, trip fit, price basis, time, location and verification gaps. Let users prioritize cost/pace/indoor options without overwriting their global profile. Pin alternatives, retain per-workspace notes and directly choose a stay/add or swap an activity via preview. Choosing a stay is distinct from booking.

Acceptance: compare three options; inspect a missing fact; save notes; choose alternative; inspect map/day impact; cancel preserves original; apply changes the canonical item; undo restores it. Compare cards and map pins always open the same place.

## 3. Chat-to-plan control
Anchor requests to a selected activity/day/stay through contextual Ask AI actions and visible scope chips. Show an editable brief checklist distinguishing confirmed fields, defaults and unknowns. Ask only material clarification, e.g. which afternoon when several are possible.

Produce structured change proposals with stable activity targets and base revision: before/after activities, proposed day/time, removed items retained as ideas, cost/time effects, booking conflicts, and unchanged constraints. Support several proposals with individual selection and Apply selected; no edit takes effect before apply. Budget, exclusions, origin and dates are checked against the resulting artifact. Recheck stale proposals before applying. Initial fixture parser covers explicit target/swap/pace/weather requests; unsupported prompts retain text and offer clarification rather than generic mutation.

Acceptance: target Day 2; propose two edits; reject one and apply one; only correct activity changes; undo; make intervening edit then apply old proposal and receive re-review; local/no-flight trip retains no flights. Repeated submission never duplicates changes.

## 4. Return and resume
Replace modal return hub with Home dashboard showing distinct trip names/covers, destination/date-or-undated status, save state, last activity and specific unfinished decisions. Sections: Continue planning, Ideas, Recent research, Ready to travel, Archived. User-controlled guest default starts planning; returning users can choose Home or last workspace.

Resume same conversation, draft, day, detail panel and collection context. Highlight actual pending decisions such as unselected stay, unscheduled ideas or conflicting budget; never imply a booking or external sync. Archive/restore, search and filters support an expanding trip list. Guest/account handoff represented through adapter states, without asserting secure auth or cross-device behavior in the demo.

Acceptance: create dated and undated workspaces, leave a message draft and research panel open, reload and resume the correct workspace/context; archived trips disappear from active list and can restore; pending decision disappears after resolving it.

## 5. Recovery states
Move simulation controls into clearly labeled Preview settings. Normal screens show task-specific loading/error/retry without exposing testing switches. Preserve inputs and completed sections on failure; retry only failed work, with duplicate guards and cancellation.

Model local/saving/saved-to-account/offline/pending/conflict/access-expired separately. Account-saved wording only appears with confirmed adapter result. Offline supports cached research and local edits, identifying unavailable photos/live facts. Reconnection offers review of conflicting changes and explicit keep-local/keep-remote choices instead of silent overwrite. Expiry returns to the same task/draft after simulated restore; never apply old pending changes without revalidation. Storage failure offers downloadable recovery data and session-only status.

Acceptance: inject mid-generation failure, partial results, offline edits, expired access, storage failure and revision conflict; verify retry without duplicates, retained draft and no silent data loss. Current preview simulates these service states; real reliability remains a backend acceptance task.

## Delivery sequence
1. Shared workspace/state migration and recovery contracts.
2. Date-free workspace and dashboard, establishing create/return continuity.
3. Rich research, comparison tray and choose-alternative flow.
4. Targeted chat proposals and artifact constraint validation.
5. Recovery polish, responsive/keyboard checks and end-to-end regression.

Verify each slice in desktop and mobile before moving on. Run build/type checks and focused invariant tests for migration, conversion, proposals and conflict resolution. Record verified vs simulated status and update checkpoint. User usability sessions should test finding/saving ideas, choosing an alternative, correcting an AI edit and recovering work without coaching; use completion, errors and comprehension to justify later quality ratings.
