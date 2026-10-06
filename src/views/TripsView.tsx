import {
  ArrowRight,
  Archive,
  CalendarDays,
  Check,
  CircleAlert,
  Copy,
  FileText,
  Lightbulb,
  MoreHorizontal,
  Plus,
  Undo2,
  BedDouble,
  Compass,
} from "lucide-react";
import { useApp } from "../app/context";
import { cityImage, dateLabel, type State, type Trip } from "../model";
import type { TripsTab } from "../routes";
import { tripIdeas } from "../collections";
import { validateTrip } from "../tripLogic";
import { Button, Menu } from "../ui";
import { ContextSidebar, NavList, PageHeader } from "../shell/Shell";
import StartPlanning from "../components/trip/StartPlanning";

const tabs = [
  ["upcoming", "Upcoming"],
  ["drafts", "Drafts"],
  ["past", "Past"],
] as const;

const isPast = (t: Trip) => t.status === "complete" || t.status === "archived";

/** The specific decisions still open on a trip, most important first. */
export function openDecisions(trip: Trip, state: State): string[] {
  const out: string[] = [];
  const issues = validateTrip(trip, state);
  if (issues.length)
    out.push(
      issues.length === 1
        ? issues[0].message
        : `${issues.length} things to resolve before you travel`,
    );
  if (!trip.stayId) out.push("Choose where to stay");
  const ideas = tripIdeas(state, trip.id).placeIds.length;
  if (ideas)
    out.push(
      `${ideas} unscheduled ${ideas === 1 ? "idea" : "ideas"} to place or drop`,
    );
  if (!trip.bookings.length && trip.stayId)
    out.push("Add reservations as you book");
  return out;
}

export function lastWorked(t: Trip) {
  if (!t.updatedAt) return "Not changed since it was created";
  const mins = Math.round((Date.now() - t.updatedAt) / 60000);
  if (mins < 1) return "Worked on just now";
  if (mins < 60) return `Worked on ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Worked on ${hours} h ago`;
  return `Worked on ${new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function TripsView({ onOpenContext }: { onOpenContext: () => void }) {
  const app = useApp();
  const { state, loc } = app;
  const tab = loc.route.view === "trips" ? loc.route.tab : "upcoming";
  const upcoming = state.trips.filter((t) => !isPast(t));
  const past = state.trips.filter(isPast);
  const hasDraft = !!app.brief;
  const firstVisit = !state.trips.length && !hasDraft;

  if (firstVisit)
    return (
      <div className="page">
        <PageHeader title="Trips" />
        <StartPlanning />
      </div>
    );

  const list = tab === "past" ? past : tab === "upcoming" ? upcoming : [];
  return (
    <div className="page">
      <PageHeader
        title="Trips"
        tabs={tabs}
        tab={tab}
        onTab={(t: TripsTab) => app.go({ view: "trips", tab: t })}
        onOpenContext={onOpenContext}
        actions={
          <Button variant="primary" onClick={app.newTrip}>
            <Plus size={18} /> New trip
          </Button>
        }
      />
      {tab === "drafts" &&
        (hasDraft ? (
          <article className="trip-card draft-card">
            <FileText size={22} />
            <div className="trip-card-body">
              <h2>Unfinished brief</h2>
              <p className="muted-note">“{app.brief!.prompt}”</p>
              <p>Confirm the details and build the trip.</p>
            </div>
            <Button
              variant="primary"
              onClick={() =>
                app.go({ view: "trip", id: "new", tab: "itinerary" }, null)
              }
            >
              Continue <ArrowRight size={16} />
            </Button>
          </article>
        ) : (
          <div className="empty">
            <FileText size={28} />
            <h2>No drafts</h2>
            <p>A brief you start but don’t build waits here.</p>
            <Button variant="primary" onClick={app.newTrip}>
              Start a trip
            </Button>
          </div>
        ))}
      {tab !== "drafts" && list.length === 0 && (
        <div className="empty">
          {tab === "past" ? <Archive size={28} /> : <Compass size={28} />}
          <h2>{tab === "past" ? "No past trips yet" : "No upcoming trips"}</h2>
          <p>
            {tab === "past"
              ? "Completed and archived trips appear here, ready to reuse."
              : "Start one with a sentence, or open the sample."}
          </p>
          <div className="empty-actions">
            <Button variant="primary" onClick={app.newTrip}>
              Plan a trip
            </Button>
            <Button onClick={app.startSample}>Try the sample</Button>
          </div>
        </div>
      )}
      <div className="trip-cards">
        {list.map((t) => (
          <TripCard key={t.id} trip={t} />
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const app = useApp();
  const decisions = openDecisions(trip, app.state);
  const setStatus = (status: Trip["status"]) =>
    app.setState((s) => ({
      ...s,
      trips: s.trips.map((t) =>
        t.id === trip.id ? { ...t, status, updatedAt: Date.now() } : t,
      ),
    }));
  const open = () => app.openTrip(trip.id);
  return (
    <article className="trip-card">
      <button
        className="trip-cover"
        onClick={open}
        aria-label={`Open ${trip.name}`}
      >
        <img
          src={cityImage}
          alt=""
          loading="lazy"
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
      </button>
      <div className="trip-card-body">
        <div className="trip-card-top">
          <span className={`trip-status is-${trip.status}`}>
            {trip.status === "complete"
              ? "Completed"
              : trip.status === "archived"
                ? "Archived"
                : trip.status === "traveling"
                  ? "Traveling"
                  : "Planning"}
          </span>
          <Menu
            label={`Options for ${trip.name}`}
            trigger={<MoreHorizontal size={18} />}
            items={[
              ...(isPast(trip)
                ? [
                    {
                      label: "Restore to planning",
                      icon: <Undo2 size={16} />,
                      onSelect: () => setStatus("planning"),
                    },
                  ]
                : [
                    {
                      label: "Mark as completed",
                      icon: <Check size={16} />,
                      onSelect: () => setStatus("complete"),
                    },
                    {
                      label: "Archive",
                      icon: <Archive size={16} />,
                      onSelect: () => setStatus("archived"),
                    },
                  ]),
              {
                label: "Reuse as a new trip",
                icon: <Copy size={16} />,
                onSelect: () => {
                  const copy = {
                    ...structuredClone(trip),
                    id: crypto.randomUUID(),
                    status: "planning" as const,
                    name: trip.name + " · again",
                    updatedAt: Date.now(),
                    visited: [],
                  };
                  app.setState((s) => ({ ...s, trips: [copy, ...s.trips] }));
                  app.notify("Copied into a new trip.");
                },
              },
            ]}
          />
        </div>
        <h2>
          <button className="trip-name" onClick={open}>
            {trip.name}
          </button>
        </h2>
        <p className="trip-meta">
          <CalendarDays size={14} /> {dateLabel(trip.brief.start)}–
          {dateLabel(trip.brief.end)} · Chicago · {trip.brief.travelers}{" "}
          travelers
        </p>
        <p className="muted-note">{lastWorked(trip)}</p>
        {!isPast(trip) && (
          <ul className="decision-list" aria-label="Open decisions">
            {decisions.length ? (
              decisions.slice(0, 3).map((d) => (
                <li key={d}>
                  {/stay/i.test(d) ? (
                    <BedDouble size={14} />
                  ) : /idea/i.test(d) ? (
                    <Lightbulb size={14} />
                  ) : (
                    <CircleAlert size={14} />
                  )}
                  {d}
                </li>
              ))
            ) : (
              <li className="is-done">
                <Check size={14} /> Ready to travel
              </li>
            )}
          </ul>
        )}
        <Button variant={isPast(trip) ? "secondary" : "primary"} onClick={open}>
          {isPast(trip) ? "Open" : "Resume"} <ArrowRight size={16} />
        </Button>
      </div>
    </article>
  );
}

export function TripsSidebar() {
  const app = useApp();
  const { state } = app;
  const current = state.trips.filter((t) => !isPast(t));
  return (
    <ContextSidebar
      title="Your trips"
      action={
        <Button variant="secondary" onClick={app.newTrip}>
          New trip <Plus size={18} />
        </Button>
      }
    >
      {current.length || app.brief ? (
        <NavList
          label="Trips"
          items={[
            ...(app.brief
              ? [
                  {
                    id: "draft",
                    label: "Unfinished brief",
                    meta: "Draft",
                    icon: <FileText size={18} />,
                    onSelect: () =>
                      app.go(
                        { view: "trip", id: "new", tab: "itinerary" },
                        null,
                      ),
                  },
                ]
              : []),
            ...current.map((t) => ({
              id: t.id,
              label: t.name,
              meta: `${dateLabel(t.brief.start)}–${dateLabel(t.brief.end)}`,
              onSelect: () => app.openTrip(t.id),
            })),
          ]}
        />
      ) : (
        <p className="muted-note sidebar-note">Trips you plan appear here.</p>
      )}
    </ContextSidebar>
  );
}
