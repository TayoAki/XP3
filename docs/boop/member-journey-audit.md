# Boop authenticated web journey audit

October 5, 2026. Continuation of the guest audit using journey-to-ui and live browser interaction. User signed in directly; credentials and account-completion steps were not observed. Personal identity omitted from this record and cropped out of saved evidence.

## Verified steps

| ID | Action | Result | Label |
| --- | --- | --- | --- |
| BM01 | Inspect menu after user login | Own-profile link and logout appeared, establishing authenticated access. | Observed |
| BM02 | Open own profile | Memories, Trips and Bucket List tabs; empty content; profile editing and sharing controls. No onboarding tour appeared during this inspection. | Observed |
| BM03 | Open Edit Profile and cancel | Avatar upload/removal, nickname, name, bio and external-link fields; closed without changing personal data. | Observed / Control observed |
| BM04 | Open Trips | Loading resolved to empty-trip message. No creation action exposed in this sampled state. | Observed |
| BM05 | Open Bucket List | Separate Places and Trips subtabs; empty places linked back to discovery. | Observed |
| BM06 | Follow discovery entry; search Chicago | Experience results loaded. | Observed |
| BM07 | Save The Godfrey Hotel Chicago | Bookmark changed to checked without guest gate. | Observed |
| BM08 | Open hotel detail | Gallery, creator identity, social actions and member comment entry appeared; empty comments state replaced guest sign-in message. No comment submitted. | Observed / Control observed |
| BM09 | Explore full itinerary | Same tab opened the source Food & More Downtown trip. | Observed |
| BM10 | Save source trip | Temporarily disabled while saving, then checked Saved state. | Observed |
| BM11 | Return via menu to own profile → Bucket List | Hotel under Places; source itinerary under saved Trips. Own Trips count remained zero. | Observed |
| BM12 | Reload saved-trip tab | Saved card returned and Trips subtab restored through URL; switching to Places showed hotel still saved. | Observed |
| BM13 | Unsave both test bookmarks | Unchecked unsaved states appeared. No trip or member content was deleted. | Observed |
| BM14 | Open app-home logo | Returned to public-style Discover; no chat/planning entry exposed in sampled state. | Observed |

Public source pages: [Discover](https://app.boopwithme.com/discover), [Chicago experiences](https://app.boopwithme.com/discover?q=Chicago&flavor=EXPERIENCES), [source trip](https://app.boopwithme.com/trips/tI3xtDK1KzI8WbM52KFU). Own-profile URL omitted for privacy.

## Findings and implications

- Bucket List distinguishes inspiration from owned trips (BM05/BM11). A successful save is not evidence of copying/remixing. XPMatch should keep those concepts separate and provide an explicit next action to turn inspiration into a plan.
- Detail → source itinerary is a useful continuity pattern (BM08/BM09). Our recommendation research should retain provenance and allow users to inspect the wider trip context.
- Signed-in empty states offered uneven guidance: saved places linked to discovery, while the sampled empty Trips state had no creation action (BM04/BM05). Our empty states should each guide users toward a useful next step.
- Save feedback and URL-based tab restoration were observable (BM10/BM12). These patterns support understandable persistence without implying unseen server architecture.
- Profile setup was identity/content oriented; no travel-taste calibration appeared in this session (BM02/BM03). First-account onboarding happened before our audit, so its presence or absence is unverified.

## Limits and unresolved coverage

This completes a bounded authenticated **web** pass of discover → research → save → bucket list → return, plus profile setup inspection. It does not complete the entire product study.

AI chat, first-time preference/onboarding steps, camera-roll permissions/import, trip copy/remix/editing, own-trip creation, collaboration, publishing, checkout and account recovery remain unverified. No corresponding web entry was exposed in the sampled menu/profile/trip pages; this is not proof those capabilities are absent. Guest FAQ describes AI chat and camera-roll creation in the iPhone app. Native app access is the next dependency for that coverage.

A direct navigation attempt timed out in browser control and left the profile unchanged; using its visible discovery link worked. This is an automation/session observation, not a diagnosed product outage.

Evidence: `evidence/member-saved-trip.jpg` shows saved-trip tab/card after reload, cropped to remove member identity. Default narrow browser viewport; not a controlled desktop/mobile comparison.

Side effects: two test bookmarks saved and then unsaved. No profile edits, public comments, likes, follows, invitations, bookings, uploads or external messages. XPMatch source unchanged.
