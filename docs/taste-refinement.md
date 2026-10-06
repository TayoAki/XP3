# Taste refinement

Replaced the broad taste page and small rating form with a shared TasteStudio. The full page and compact calibration entry share persistent private feedback. Search/category filters identify familiar sample places; overall stars and explicitly independent liked/disliked dimensions capture mixed experiences. Mutually exclusive dimensions, explicit save, revert, edit, remove and undo give users control. Earlier undifferentiated reasons prompt confirmation rather than inventing sentiment. Public review creation is a separate action.

A growing summary displays learned likes/dislikes, chosen interests and pace. Transparent local rules produce a consistent demo score for taste suggestions, Discover, saved cards, itinerary cards and place details. Rating changes affect ordering; unsupported review attributes remain captured but do not imply measured evidence. Existing trips retain their brief and itinerary, while displayed taste scores can change.

Verified: save/readback, opposite-signal exclusion, revert, remove/undo, reload persistence, familiar-place search, 390×844 mobile layout; browser console without warnings/errors. Pure assertions verified positive and negative attribute transfer, excluded recommendations and score reset after signal removal. TypeScript/Vite build passed.

Limits: Chicago fixtures, illustrative images and reviews, deterministic local scoring, no trained model or live review similarity. No production matching accuracy or 10/10 quality claim is established by these checks.

## Final refinement pass
- Per-place unsubmitted drafts survive switching places, navigating away and reloading; scoring changes only after explicit Save.
- Save shows exact before/after fit scores and rank positions for affected recommendations, with a no-change explanation when evidence is missing.
- Rating-derived patterns show supporting experience counts separately from directly chosen interests and pace.
- Relevant qualities appear first; all qualities remain available. Mobile full-page editing keeps Save/Revert in a fixed bottom bar with content clearance.

Browser acceptance: changed cruise to four stars, switched to park and returned, reloaded, and verified retained four-star draft; saved and verified 74→68 fit (rank 1→1); expanded/collapsed qualities; tested 390×844 editor. No console errors or warnings. Frontend quality assessment remains subjective; real matching accuracy still requires review data and user testing.
