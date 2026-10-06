# Member messaging frontend plan

October 5, 2026. Finish the proposed messaging journey in the local frontend: member-profile entry, inbox, request acceptance/decline, contextual place/shared-itinerary attachments, persistent drafts/messages/read status, privacy choice, block/unblock, report, and offline retry. All messages and delivery states are local simulations; no external transmission. Existing trip comments remain distinct.

Acceptance: profile opens correct conversation; outgoing request cannot send follow-ups until accepted; incoming preview request can be accepted or declined; attachments open correct research context; empty text cannot send; offline messages retry after reconnect; reload retains draft and history; blocking prevents send; privacy settings are local and transparent. Actual delivery, secure participant access, realtime, rate limiting and moderation are backend work.

Implemented: Messages route/navigation, sample profile message action, outgoing/incoming requests, accept/decline, local conversation history and persisted drafts, place/itinerary research attachments, block/unblock and local reports, request privacy selector, offline failure/retry. Incoming fixture creation cannot overwrite an existing conversation. Unread status demonstrated on incoming request.

Verified: TypeScript/Vite build passed. Browser checked outgoing request, follow-up gate, acceptance, reload preserving draft/history, block disabling send, incoming request/acceptance. Existing preview data preserved; two local fixture conversations added. No actual message or report sent. Attachment/retry controls implemented but not independently exercised in this pass. Snapshot in `boop/evidence/xpmatch-messaging.jpg`.

Remaining production needs: authentication, server-side participant permissions, real request policy enforcement, delivery/realtime, notifications, retention and abuse handling. Current simulated privacy setting controls incoming fixture requests; does not enforce a server policy. Frontend readiness is assessed separately from production readiness.
