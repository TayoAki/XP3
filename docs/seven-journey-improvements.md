# Seven journey improvements — October 5, 2026

Scope: frontend-only preview. Preserve blue branding, embedded chat, fixed composer, map-first artifacts, two-column stays and contextual visual research. Reuse observed Mindtrip preference readback, Wanderlog date-free ideas/contextual guidance and Layla editable brief/recovery. This does not infer competitors’ matching algorithms.

| Journey | Implementation | Verification |
|---|---|---|
| Taste calibration | Private place ratings and experience dimensions; persistent signals; entry in planning and Taste profile | Rated cruise 5 with Easy pace; persisted across reload; explanation readback verified |
| Explainable recommendations | Research explanation, confidence/sample evidence, tradeoffs and reversible less-like feedback | Positive taste signal displayed; feedback persisted and undo worked; Discover excludes flagged places |
| Undated planning | Persistent unscheduled shortlist with research and explicit choose-dates handoff | Selected park/riverwalk; edited dated brief; generated places retained; selected IDs are inserted once and removed from unscheduled list for new generations |
| Research workspace | Per-place private notes, same-kind comparison table, pin alternatives, external source links | Notes retained across reload; comparison rendered; alternative saved; desktop/mobile panel checked |
| Chat-to-plan control | Concrete revision preview, confirmed constraint summary, cancel/apply/undo | Cancel kept plan; apply reduced Gage cards from 2 to 1; undo restored 2; no flights generated |
| Return experience | Latest unarchived trip, conversation count, stay decision, unscheduled ideas and resume | Latest trip displayed; resume returned to correct conversation |
| Recovery | Kept brief on failure, retry, incomplete-result status and completion, offline/reconnect, simulated expiry and sync | Failure retained budget; retry succeeded; expired access preserved draft; partial results flagged then completed; offline reconnect retained trip |

Production build and TypeScript checks pass. Pure assertions verify complete/partial/budget checks. Browser console showed no warnings/errors during tested flows. Mobile checked at 390×844; viewport reset afterward.

Limitations: fixtures for Chicago, illustrative photos/ratings/match scores, local device storage, no live AI/auth/server sync or review-derived ranking. Recovery injection controls are explicit frontend demonstrations, not production incident handlers. General free-text revisions demonstrate one sample alternative; backend intent interpretation remains pending.
