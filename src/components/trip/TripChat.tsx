import { useEffect, useRef } from "react";
import {
  Sparkles,
  Coffee,
  CloudRain,
  Maximize2,
  Minimize2,
  Users,
  X,
  Lightbulb,
} from "lucide-react";
import { getPlace, type Trip } from "../../model";
import { useApp } from "../../app/context";
import { Button, IconButton } from "../../ui";
import TripArtifact from "./TripArtifact";
import Composer from "./Composer";
import { slotName } from "../panel/SwapPanel";

export default function TripChat({ trip }: { trip: Trip }) {
  const app = useApp();
  const { loc, state } = app;
  const full = loc.route.view === "trip" && !!loc.route.full;
  const scroller = useRef<HTMLDivElement>(null);
  const count = useRef(trip.messages.length);
  const scrollKey = "xpmatch-scroll-" + trip.id;

  // Keep the reading position across visits; jump to new messages.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (trip.messages.length > count.current) el.scrollTop = el.scrollHeight;
    else
      try {
        el.scrollTop = Number(sessionStorage.getItem(scrollKey)) || 0;
      } catch {}
    count.current = trip.messages.length;
  }, [trip.messages.length]);

  const pending = app.proposals.filter((p) => p.tripId === trip.id);
  const scope = app.scope;
  const scopeDay = scope
    ? trip.days.find((d) => d.id === scope.split(":")[0])
    : undefined;
  const scopeIndex = scope ? Number(scope.split(":")[1]) : 0;
  const scopeLabel =
    scopeDay && scopeDay.places[scopeIndex]
      ? `${getPlace(scopeDay.places[scopeIndex]).name} · Day ${trip.days.indexOf(scopeDay) + 1} ${slotName(scopeIndex).toLowerCase()}`
      : undefined;
  const showInvite =
    !trip.partners.length && !state.inviteDismissed?.includes(trip.id) && !full;
  const setFull = (on: boolean) =>
    loc.route.view === "trip" &&
    app.go({ ...loc.route, full: on || undefined });

  return (
    <div className="trip-chat">
      {pending.length > 0 && (
        <div className="suggestion-bar" role="status">
          <Lightbulb size={16} />
          <span>
            {pending.length === 1
              ? "1 suggested change"
              : `${pending.length} suggested changes`}{" "}
            from the assistant
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              app.setMode({
                kind: "swap",
                dayId: pending[0].dayId,
                index: pending[0].index,
              })
            }
          >
            Review
          </Button>
        </div>
      )}
      <div
        className="chat-scroll"
        ref={scroller}
        onScroll={(e) => {
          try {
            sessionStorage.setItem(
              scrollKey,
              String(e.currentTarget.scrollTop),
            );
          } catch {}
        }}
      >
        <div className="chat-thread">
          <div className="thread-tools">
            <Button size="sm" variant="ghost" onClick={() => setFull(!full)}>
              {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {full ? "Back to the conversation" : "Open full trip"}
            </Button>
          </div>
          {!full && trip.messages[0] && (
            <div className="bubble bubble-user">{trip.messages[0].text}</div>
          )}
          {!full && trip.messages[1] && (
            <div className="bubble bubble-assistant">
              <Sparkles size={16} />
              <p>{trip.messages[1].text}</p>
            </div>
          )}
          <TripArtifact trip={trip} />
          {showInvite && (
            <aside className="invite-card" aria-label="Plan with someone">
              <Users size={18} />
              <div>
                <strong>Planning with someone?</strong>
                <p>
                  Invite them to see the plan and leave notes. You can do this
                  any time from Share.
                </p>
              </div>
              <Button size="sm" onClick={() => app.openModal("share")}>
                Invite
              </Button>
              <IconButton
                label="Not now"
                size="sm"
                onClick={() =>
                  app.setState((s) => ({
                    ...s,
                    inviteDismissed: [...(s.inviteDismissed || []), trip.id],
                  }))
                }
              >
                <X size={16} />
              </IconButton>
            </aside>
          )}
          {!full && (
            <div className="follow-ups" aria-label="Quick changes">
              <Button
                size="sm"
                onClick={() =>
                  app.submit(
                    "Give us a slower afternoon with fewer stops on day 1.",
                  )
                }
              >
                <Coffee size={16} /> Slow day 1 down
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  app.submit(
                    "Rain on day 1: swap the outdoor stop for something indoor.",
                  )
                }
              >
                <CloudRain size={16} /> Plan for rain
              </Button>
            </div>
          )}
          {!full &&
            trip.messages.slice(2).map((m, i) =>
              m.role === "user" ? (
                <div className="bubble bubble-user" key={i}>
                  {m.text}
                </div>
              ) : (
                <div className="bubble bubble-assistant" key={i}>
                  <Sparkles size={16} />
                  <p>{m.text}</p>
                </div>
              ),
            )}
        </div>
      </div>
      <Composer
        draftKey={trip.id}
        busy={app.busy}
        placeholder="Ask for a change, e.g. “something indoor for day 2 afternoon”"
        onSend={app.submit}
        onAttach={() => app.go({ view: "trip", id: trip.id, tab: "bookings" })}
        scopeLabel={scopeLabel}
        onClearScope={() => app.setScope(null)}
      />
    </div>
  );
}
