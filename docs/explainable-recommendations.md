# Explainable recommendation implementation

A shared explainPlace model drives current recommendation summaries, detailed reasons and alternatives. Each score shows the 50-point base, matching attributes, pace, own rating, penalties and any boundary adjustment. Chosen inputs and saved experience patterns are distinct; named supporting experiences are visible. Unverified sample attributes and absent member-review similarity are labeled explicitly.

Uncertainty includes sparse signals, conflicting likes/dislikes and locally disputed place attributes. Active-trip checks distinguish personal fit from budget, pace, hours and travel-time suitability. Comparisons explain a tie or higher demo fit and price/time tradeoffs, without claiming verified availability.

Corrections remove a personal reason across future recommendations with undo, record disputed sample attributes locally, or mark a place unsuitable for the active trip without changing global taste or silently removing itinerary items. Concern flags can be cleared.

Verified browser: summary and factor trace (50+7+5+6=68), named cruise supporting experience, comparison with park (68 vs 57), correction to 61 then undo to 68, dispute under uncertainty and clearing; mobile 390×844 and no console warnings/errors. Pure checks cover factor sums, score boundaries, sparse evidence and conflicting feedback. TypeScript/Vite build passes.

Still simulated: fixture photos, aggregate ratings, place attributes and deterministic scoring. No verified review similarity or production recommendation accuracy. Frontend design quality remains subject to user testing.
