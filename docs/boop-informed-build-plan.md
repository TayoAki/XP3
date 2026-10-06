# Boop-informed frontend build plan

October 5, 2026. User authorized writing this plan and building from it. Evidence: Boop guest BG05/BG08/BG15/BG16/BG18/BG22 and member BM05/BM08/BM09/BM11/BM12.

## Scope and sequence
1. Add clearly labeled fictional member profiles, authored experience evidence and sample shared itineraries. Keep private taste feedback separate from public member ratings; no invented compatibility percentages.
2. Surface member advice and caveats on discovery cards and place details. Connect research to the author and original itinerary without losing the current plan.
3. Add an inspiration shelf in Discover/Community and a Saved itineraries tab beside saved places. Bookmarks persist locally and do not become owned trips automatically.
4. Provide Use this itinerary: review its stops and assumptions, choose an undated Ideas copy or an editable dated brief. Only explicit generation creates an owned trip; cancel preserves the original. Preserve source attribution in created trip metadata and chat.
5. Provide useful empty saved-itinerary state and return paths. Existing guest exploration remains available; frontend local saves do not pretend to require secure sign-in.
6. Verify build and browser: source profile, detail provenance, save/reload, undated copy, cancel and dated handoff; responsive wrapping and accessible controls.

## Boundaries
Frontend fixture experience only. Illustrative photos are not member uploads or verified venue photography. No social feed, follower rankings, real public sharing, uploads or backend matching added. Boop copy/remix was not verified; our reviewed-copy flow is a proposed target behavior. Existing named place collections, blue branding, embedded chat and fixed composer remain.

## Acceptance
Saved inspiration remains distinct from owned trips. Copying leaves source unchanged. Advice/rating and personal fit are visibly separate. Source inspection does not discard chat drafts. All fixture evidence carries sample labels. Reload preserves bookmarks. Empty states guide discovery. Generated copy retains source provenance; hours/prices/seasonality remain unverified.

## Implementation and validation

Implemented: typed fictional members and two shared itineraries; profile/style/history expansion; sample advice and caveats on noncompact place cards and Overview details; Discover/Community inspiration shelves; Saved Places/Itineraries toggle; persisted itinerary bookmarks; source review, cancel, undated copy and dated-brief handoff; source metadata and chat attribution on generated copies. Blue styling and responsive single-column inspiration cards retained.

Verified October 5: production TypeScript/Vite build passed. Browser verified profile expansion; bookmark checked state after reload; Saved itinerary tab; reviewed undated copy with six stops and source day groups; dated editable brief then generated personal copy with source name and chat attribution. Screenshot: `boop/evidence/xpmatch-inspiration.jpg`. Existing local data preserved; walkthrough added one source bookmark, an undated Ideas collection and a dated personal copy.

Limits: real member uploads/gallery evidence, measured member compatibility, secure publishing and server persistence are not implemented. The existing guest/local-save behavior remains. Copying preserves stops; shorter trips combine remaining source days, longer trips leave extra days open. Source fixtures do not automatically adapt activities to budgets/preferences or establish availability. Review constraints before generating. The saved-content toggle resets to Places on reload, while bookmarks persist.
