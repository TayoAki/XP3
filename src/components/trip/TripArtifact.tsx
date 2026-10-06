import {
  ArrowLeftRight,
  BedDouble,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  Footprints,
  LogIn,
  LogOut,
  Map as MapIcon,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Sparkles,
  TrainFront,
  ArrowUp,
  ArrowDown,
  CalendarRange,
  Lightbulb,
  CircleCheck,
} from "lucide-react";
import { getPlace, places, type Trip } from "../../model";
import { tasteMatch } from "../../taste";
import { useApp } from "../../app/context";
import {
  dayMinutes,
  formatMinutes,
  stayEstimate,
  travelBetween,
  validateTrip,
  type Issue,
} from "../../tripLogic";
import { Button, Chip, Menu } from "../../ui";
import RouteMap from "../RouteMap";
import { Photo } from "../PlaceCard";
import { slotName } from "../panel/SwapPanel";
import { keepAsIdeas } from "../../collections";
import Hint from "../Hint";

const dateOf = (trip: Trip, i: number) => {
  const d = new Date(trip.brief.start + "T12:00:00");
  d.setDate(d.getDate() + i);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export default function TripArtifact({ trip }: { trip: Trip }) {
  const app = useApp();
  const { state, loc } = app;
  const day = loc.route.view === "trip" ? loc.route.day : undefined;
  const issues = validateTrip(trip, state);
  const allIds = trip.days.flatMap((d) => d.places);
  const stays = places.filter((p) => p.kind === "stay");
  const version = trip.revision ? trip.revision + 1 : 1;

  function runFix(issue: Issue) {
    const fix = issue.fix;
    if (!fix) return;
    if (fix.kind === "choose-stay")
      app.openPanel({
        kind: "place",
        id: stays.find((s) => s.id !== trip.stayId)?.id || stays[0].id,
      });
    else if (fix.kind === "edit-brief" || fix.kind === "confirm-origin")
      app.openModal("edit-brief");
    else if (fix.kind === "swap")
      app.setMode({ kind: "swap", dayId: fix.dayId, index: fix.index });
    else if (fix.kind === "complete-days")
      app.changeTrip("Empty days filled with sample stops.", (t) => {
        t.days.forEach((d, i) => {
          if (!d.places.length)
            d.places = [
              ["bean", "gage"],
              ["river", "purple"],
              ["art", "cultural"],
            ][i % 3];
        });
      });
  }

  const setDay = (d?: string) =>
    loc.route.view === "trip" && app.go({ ...loc.route, day: d });

  return (
    <article className="artifact" aria-label={`${trip.name} itinerary`}>
      <header className="artifact-head">
        <div>
          <p className="artifact-version">Itinerary · version {version}</p>
          <h2>{trip.name}</h2>
        </div>
        <span className={`status-pill ${issues.length ? "is-warn" : "is-ok"}`}>
          {issues.length ? (
            <CircleAlert size={14} />
          ) : (
            <CircleCheck size={14} />
          )}
          {issues.length ? `Needs review · ${issues.length}` : "Ready"}
        </span>
      </header>

      {issues.length > 0 ? (
        <ul
          className="issue-list"
          aria-label="Things to resolve before you travel"
        >
          {issues.map((issue) => (
            <li key={issue.id}>
              <CircleAlert size={16} />
              <span>{issue.message}</span>
              {issue.fix && (
                <Button size="sm" onClick={() => runFix(issue)}>
                  {issue.fix.label}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ready-line">
          <Check size={16} /> {trip.days.length} days match your dates ·{" "}
          {trip.brief.travelers} travelers · {trip.brief.pace.toLowerCase()}{" "}
          pace · within budget · no flights added
        </p>
      )}

      <Hint id="trip-research">
        Tap any stop, map pin or hotel to research it beside your plan. Nothing
        changes until you choose.
      </Hint>
      <section className="artifact-block" aria-labelledby="map-title">
        <div className="block-head">
          <h3 id="map-title">
            <MapIcon size={18} /> The big picture
          </h3>
          <span className="muted-note">
            {trip.days.length} days · {new Set(allIds).size} places
          </span>
        </div>
        <RouteMap
          ids={[...allIds, ...(trip.stayId ? [trip.stayId] : [])]}
          onSelect={(id) => app.openPanel({ kind: "place", id })}
        />
      </section>

      <section className="artifact-block" aria-labelledby="stay-title">
        <div className="block-head">
          <div>
            <h3 id="stay-title">
              <BedDouble size={18} /> Where to stay
            </h3>
            <p className="muted-note">
              One base for the whole trip. Estimates, not offers.
            </p>
          </div>
        </div>
        <div className="stay-grid">
          {stays.map((p) => {
            const est = stayEstimate(p, trip);
            const over = est.nightly > trip.brief.budget;
            const chosen = trip.stayId === p.id;
            return (
              <article
                className={`stay-card${chosen ? " is-chosen" : ""}`}
                key={p.id}
              >
                <button
                  className="stay-photo"
                  onClick={() => app.openPanel({ kind: "place", id: p.id })}
                  aria-label={`Research ${p.name}`}
                >
                  <Photo place={p} />
                  {chosen && (
                    <span className="stay-badge">
                      <Check size={14} /> Your base
                    </span>
                  )}
                </button>
                <div className="stay-body">
                  <button
                    className="stay-name"
                    onClick={() => app.openPanel({ kind: "place", id: p.id })}
                  >
                    {p.name}
                  </button>
                  <p className="muted-note">
                    {p.area} · {tasteMatch(p, state).score}/100 fit
                  </p>
                  <dl className="stay-cost">
                    <div>
                      <dt>
                        ${est.nightly} × {est.nights} nights
                        {est.rooms > 1 ? ` × ${est.rooms} rooms` : ""}
                      </dt>
                      <dd>${est.subtotal.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Taxes (estimated)</dt>
                      <dd>${est.taxes.toLocaleString()}</dd>
                    </div>
                    <div className="stay-total">
                      <dt>Estimated total</dt>
                      <dd>${est.total.toLocaleString()}</dd>
                    </div>
                  </dl>
                  <p className={over ? "stay-over" : "muted-note"}>
                    {over
                      ? `Over your $${trip.brief.budget}/night target`
                      : "Within your nightly target"}{" "}
                    · cancellation terms unknown
                  </p>
                  <Button
                    variant={chosen ? "secondary" : "primary"}
                    full
                    disabled={chosen}
                    onClick={() => app.chooseStay(p.id)}
                  >
                    {chosen ? "Chosen" : "Choose this stay"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="artifact-block" aria-labelledby="days-title">
        <div className="block-head">
          <h3 id="days-title">
            <CalendarDays size={18} /> Day by day
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => app.openModal("today")}
          >
            Travel mode
          </Button>
        </div>
        <div
          className="segmented day-picker"
          role="group"
          aria-label="Show days"
        >
          <button aria-pressed={!day} onClick={() => setDay(undefined)}>
            All days
          </button>
          {trip.days.map((d, i) => (
            <button
              key={d.id}
              aria-pressed={day === d.id}
              onClick={() => setDay(d.id)}
            >
              Day {i + 1}
            </button>
          ))}
        </div>
        <div className="day-board">
          {trip.days
            .filter((d) => !day || d.id === day)
            .map((d) => {
              const i = trip.days.indexOf(d);
              const time = dayMinutes(d.places);
              const stay = trip.stayId ? getPlace(trip.stayId) : undefined;
              return (
                <section
                  className="day-col"
                  key={d.id}
                  aria-labelledby={`day-${d.id}`}
                >
                  <header className="day-head">
                    <p>
                      Day {i + 1} · {dateOf(trip, i)}
                    </p>
                    <h4 id={`day-${d.id}`}>{d.title}</h4>
                    <p className="muted-note">
                      {d.places.length} stops · about{" "}
                      {formatMinutes(time.total)} incl.{" "}
                      {formatMinutes(time.travel)} getting around
                    </p>
                  </header>
                  {i === 0 && (
                    <StayRow
                      kind="in"
                      name={stay?.name}
                      onOpen={() =>
                        stay
                          ? app.openPanel({ kind: "place", id: stay.id })
                          : app.openPanel({ kind: "place", id: stays[0].id })
                      }
                    />
                  )}
                  {i === 0 && (
                    <Hint id="trip-swap">
                      Swap shows alternatives and what each does to your day.
                      Every change can be undone.
                    </Hint>
                  )}
                  <ol className="stop-list">
                    {d.places.map((id, j) => (
                      <li key={`${id}-${j}`}>
                        {j > 0 && <TravelLeg from={d.places[j - 1]} to={id} />}
                        <ActivityCard
                          trip={trip}
                          dayId={d.id}
                          index={j}
                          id={id}
                        />
                      </li>
                    ))}
                  </ol>
                  {!d.places.length && (
                    <p className="day-empty">
                      Nothing planned yet. Add a place, or leave the day open.
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    full
                    className="add-stop"
                    onClick={() => app.setMode({ kind: "add", dayId: d.id })}
                  >
                    <Plus size={16} /> Add a place
                  </Button>
                  {i === trip.days.length - 1 && (
                    <StayRow
                      kind="out"
                      name={stay?.name}
                      onOpen={() =>
                        stay
                          ? app.openPanel({ kind: "place", id: stay.id })
                          : app.openPanel({ kind: "place", id: stays[0].id })
                      }
                    />
                  )}
                </section>
              );
            })}
        </div>
      </section>
      <p className="artifact-foot">
        Sample itinerary · hours, prices and travel times are estimates to check
        before you go.
      </p>
    </article>
  );
}

function StayRow({
  kind,
  name,
  onOpen,
}: {
  kind: "in" | "out";
  name?: string;
  onOpen: () => void;
}) {
  return (
    <button className="stay-row" onClick={onOpen}>
      {kind === "in" ? <LogIn size={16} /> : <LogOut size={16} />}
      <span>
        <strong>{kind === "in" ? "Check in" : "Check out"}</strong>
        <small>{name || "No stay chosen yet"}</small>
      </span>
    </button>
  );
}

function TravelLeg({ from, to }: { from: string; to: string }) {
  const leg = travelBetween(getPlace(from), getPlace(to));
  return (
    <p className="travel-leg">
      {leg.mode === "walk" ? (
        <Footprints size={14} />
      ) : (
        <TrainFront size={14} />
      )}
      {leg.text} · estimate
    </p>
  );
}

function ActivityCard({
  trip,
  dayId,
  index,
  id,
}: {
  trip: Trip;
  dayId: string;
  index: number;
  id: string;
}) {
  const app = useApp();
  const place = getPlace(id);
  const key = `${dayId}:${index}`;
  const swapping =
    app.mode?.kind === "swap" && `${app.mode.dayId}:${app.mode.index}` === key;
  const flashed = app.swapped?.split(",").includes(key);
  const suggested = app.proposals.some(
    (p) => p.tripId === trip.id && `${p.dayId}:${p.index}` === key,
  );
  const visited = trip.visited?.includes(id);
  const day = trip.days.find((d) => d.id === dayId)!;
  return (
    <article
      className={`stop${swapping ? " is-swapping" : ""}${flashed ? " is-swapped" : ""}`}
      draggable
      onDragStart={(e) =>
        e.dataTransfer.setData("text/plain", JSON.stringify({ dayId, index }))
      }
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const source = JSON.parse(e.dataTransfer.getData("text/plain"));
          app.changeTrip("Stop moved.", (t) => {
            const from = t.days.find((d) => d.id === source.dayId)!;
            const to = t.days.find((d) => d.id === dayId)!;
            const [item] = from.places.splice(source.index, 1);
            if (item) to.places.splice(index, 0, item);
          });
        } catch {
          app.notify("Couldn’t move that stop. Use its menu instead.");
        }
      }}
    >
      <div className="stop-top">
        <span className="stop-slot">
          {slotName(index)}
          {suggested && (
            <span className="suggested-badge">Suggested change</span>
          )}
          {visited && (
            <span className="visited-badge">
              <Check size={12} /> Visited
            </span>
          )}
        </span>
        <div className="stop-tools">
          <Chip
            pressed={swapping}
            onClick={() =>
              app.setMode(swapping ? null : { kind: "swap", dayId, index })
            }
            aria-label={`Swap ${place.name}`}
          >
            <ArrowLeftRight size={14} /> Swap
          </Chip>
          <Menu
            label={`More for ${place.name}`}
            trigger={<MoreHorizontal size={18} />}
            items={[
              {
                label: "Ask the assistant about this",
                icon: <MessageCircle size={16} />,
                onSelect: () => {
                  app.setScope(key);
                  app.notify(
                    "The chat is now about this stop. Describe the change.",
                  );
                },
              },
              {
                label: "Move earlier",
                icon: <ArrowUp size={16} />,
                disabled: index === 0,
                onSelect: () =>
                  app.changeTrip("Stop moved earlier.", (t) => {
                    const p = t.days.find((d) => d.id === dayId)!.places;
                    [p[index - 1], p[index]] = [p[index], p[index - 1]];
                  }),
              },
              {
                label: "Move later",
                icon: <ArrowDown size={16} />,
                disabled: index === day.places.length - 1,
                onSelect: () =>
                  app.changeTrip("Stop moved later.", (t) => {
                    const p = t.days.find((d) => d.id === dayId)!.places;
                    [p[index + 1], p[index]] = [p[index], p[index + 1]];
                  }),
              },
              {
                label: "Move to another day…",
                icon: <CalendarRange size={16} />,
                onSelect: () => app.openModal("move", key),
              },
              {
                label: "Move to this trip’s ideas",
                icon: <Lightbulb size={16} />,
                onSelect: () => {
                  app.changeTrip(
                    `${place.name} moved to this trip’s ideas.`,
                    (t) => {
                      t.days
                        .find((d) => d.id === dayId)!
                        .places.splice(index, 1);
                    },
                  );
                  app.setState((s) => keepAsIdeas(s, trip.id, [id]));
                },
              },
              {
                label: visited ? "Rate this visit" : "Mark as visited",
                icon: <Check size={16} />,
                onSelect: () => app.setMode({ kind: "visit", placeId: id }),
              },
            ]}
          />
        </div>
      </div>
      <button
        className="stop-main"
        onClick={() => app.openPanel({ kind: "place", id })}
      >
        <span className="stop-thumb">
          <Photo place={place} />
        </span>
        <span className="stop-text">
          <strong>{place.name}</strong>
          <span className="stop-meta">
            <Sparkles size={13} /> {tasteMatch(place, app.state).score}/100 fit
            <Clock size={13} /> {place.duration}
          </span>
          <span className="stop-meta">{place.price}</span>
        </span>
      </button>
    </article>
  );
}
