# Boop guest journey audit

Date: October 5, 2026. Research only; no XPMatch changes.
Method: live browser interaction using journey-to-ui. Browser fallback used rather than a scraper: state transitions, dialogs and guest access were the priority. This is a bounded core guest-flow audit, not an inventory of every marketing article or authenticated feature.
Scenario: discover Chicago recommendations, inspect a creator trip, research its places, try saving, inspect account entry and cancel. No account was created, credentials entered, messages sent, bookings made or newsletters submitted.

## Verified journey

| ID | Action | Actual outcome | Evidence label | Source |
| --- | --- | --- | --- | --- |
| BG01 | Open landing page | Destination search, regional/length filters, creator trips, curator links, newsletter and FAQ entry points rendered. | Observed | [Home](https://www.boopwithme.com/) |
| BG02 | Choose Europe | Trip feed changed; selected chip and Europe-specific more-results link appeared. | Observed | Home |
| BG03 | Search Chicago from home | New tab opened with Chicago query and Trips selected, populated results. | Observed | [Chicago trips](https://app.boopwithme.com/discover?q=Chicago&flavor=TRIPS) |
| BG04 | Open featured Turkey trip | Public creator trip loaded without login. | Observed | [Trip](https://app.boopwithme.com/trips/cujv7csbqr) |
| BG05 | Open a place memory | Detail dialog showed images, creator commentary, social controls and sign-in requirement for comments; close returned to trip. | Observed | Trip |
| BG06 | Press gallery Next | Control accepted click, but accessibility state did not establish a changed image; gallery transition not verified. | Control observed | Trip |
| BG07 | Select Itinerary, then Day 2 | Loading state resolved to day-specific schedule; tab/day encoded in URL. | Observed | [Day 2](https://app.boopwithme.com/trips/cujv7csbqr?tab=itinerary&day=2) |
| BG08 | Save whole trip | Account dialog opened. No guest save completed. | Observed | Trip |
| BG09 | Inspect email signup → back → login → email | Signup requires email/password/repeated password; login offers email/password and reset. Phone, Apple, Google and Facebook controls also visible. No provider handoff tested. | Observed / Control observed | Trip account dialog |
| BG10 | Forgot password with email empty | Inline guidance requested an email. No reset sent. | Observed | Trip account dialog |
| BG11 | Close account dialog | Selected Day 2 itinerary remained. | Observed | Trip |
| BG12 | Open hotel detail | Creator memory and an Expedia-linked price card appeared. Destination booking redirect not followed; dates, availability and price accuracy unverified. | Observed / Control observed | Trip |
| BG13 | Open guest menu → Discover | Public navigation offered Discover, Besties, About, feedback, login and app download; Discover loaded. | Observed | [Discover](https://app.boopwithme.com/discover) |
| BG14 | Search Chicago in Discover | Experience results loaded with place/media cards and creator attribution. Experience-type filter exposed Stay/Play/Eat/Chill/Other; filter outcome not tested. | Observed / Control observed | [Chicago experiences](https://app.boopwithme.com/discover?q=Chicago&flavor=EXPERIENCES) |
| BG15 | Switch to Trips | Query retained; trip cards showed photos, creators, durations and practical notes. | Observed | Chicago trips |
| BG16 | Open Alyssa Blake profile | Public bio, travel content, counts, Memories/Trips tabs, follow and share controls rendered. Trips-tab and share outcomes not tested. | Observed / Control observed | [Profile](https://app.boopwithme.com/u/itsalyssablake) |
| BG17 | Follow creator | Same account gate opened; no follow completed. | Observed | Profile |
| BG18 | Open Besties directory | Curator cards exposed taste/topic tags, profile entry and follow actions. | Observed | [Besties](https://app.boopwithme.com/besties) |
| BG19 | Search nonsensical fixture query in Besties | Search exposed Experiences/People/Trips. Experiences returned seemingly unrelated content; People resolved to an explicit no-results message. | Observed | [Search](https://app.boopwithme.com/besties?q=zzjourneyauditnomatch&flavor=PEOPLE) |
| BG20 | Open AI FAQ | Official description places AI chat and camera-roll trip creation in iPhone app. Neither capability exercised. | Documented | Home FAQ |
| BG21 | Inspect trip at 390 × 844 | Vertical itinerary cards, horizontal day selector and mobile save gate observed. Screenshot shows initial header clipping in this run; no systematic overflow diagnosis performed. | Observed | Day 2; evidence images |
| BG22 | Save individual place on mobile | Account gate opened; no save completed. | Observed | Day 2 |

## Main journey shape

Inspiration → destination/type search → creator trip or memory → place detail → save/follow gate → account entry. Guests receive substantial content before signup. Booking cards attach to individual places; AI chat is described for the iPhone app, not verified as a guest web journey.

## Friction in this run

- BG07: sampled trip header June 20–28 conflicts with a tenth itinerary day June 29. Preserve canonical dates/counts in our app. This one sample does not establish a platform-wide issue.
- BG19: nonsense experience query returned content without an obvious relevance explanation; do not infer its search algorithm. People had a clearer empty state.
- BG06: image navigation outcome could not be established from the accessibility state.
- BG21: mobile cover/header looked partly clipped in the initial capture; itinerary cards were readable after scrolling. Needs broader responsive testing before a general conclusion.

## Implications for XPMatch — proposed, not implemented

| Finding | Evidence | Proposed improvement |
| --- | --- | --- |
| Attribution builds research context | BG05, BG15, BG16 | Show the member behind each recommendation and link to their travel history. |
| Media and practical advice work together | BG05, BG12, BG15 | Connect real member photos to useful tips, caveats and the exact place identity. |
| Inspiration can precede signup | BG04, BG08, BG11 | Keep guest exploration useful; return users to the same item/day after cancelling authentication. |
| Whole-trip and single-place saves serve different intentions | BG08, BG22 | Offer both actions with distinct outcomes and retain the intended action through login. |
| Creator tags suggest a discovery lens | BG18 | Add optional member/style browsing alongside personal fit, without claiming measured compatibility. |
| Consistency remains essential | BG07, BG19 | Validate dates/counts and make weak/no-match results explicit. |

## Evidence

- `evidence/trip-desktop.jpg`: default-browser trip view, not a controlled desktop-size benchmark.
- `evidence/trip-mobile.jpg`: initial cover at phone viewport.
- `evidence/itinerary-mobile.jpg`: Day 2 itinerary at phone viewport.
- `evidence/save-gate-mobile.jpg`: individual-place account gate.

## Remaining coverage

Authenticated onboarding, preferences, bucket list, copy/remix, AI chat, collaboration, publishing, booking checkout, persistence after successful login, account settings and offline/error recovery remain blocked/unverified. Public creator application, journal/articles, legal pages, feedback submission and newsletter delivery were not explored beyond visible entry controls. No backend architecture, photo caching, recommendation algorithm, revenue or performance claims are inferred.
