import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  Sparkles,
  MessageCircle,
  ArrowLeftRight,
  Coffee,
  Plus,
  Footprints,
  TriangleAlert,
  Lightbulb,
  SkipForward,
  CheckCheck,
} from "lucide-react";
import {
  dateLabel,
  getPlace,
  places,
  type Place,
  type State,
  type Trip,
} from "../../model";
import { tasteMatch } from "../../taste";
import { validateProposal, type EditProposal } from "../../proposals";
import {
  dayMinutes,
  formatMinutes,
  minutesOf,
  paceLimits,
  travelBetween,
} from "../../tripLogic";
import { useApp, type PanelMode } from "../../app/context";
import { Button, Panel, Segmented } from "../../ui";

export const slotName = (index: number) =>
  index === 0 ? "Morning" : index === 1 ? "Afternoon" : "Evening";

type Sort = "match" | "kind" | "nearby";
const sorts = [
  ["match", "Best match"],
  ["kind", "Same kind"],
  ["nearby", "Nearby"],
] as const;

const distance = (a: Place, b: Place) => Math.hypot(a.x - b.x, a.y - b.y);

function tripSlots(trip: Trip) {
  const slots: Record<string, string> = {};
  trip.days.forEach((d, n) =>
    d.places.forEach((id, j) => {
      slots[id] ??= `Day ${n + 1} · ${slotName(j)}`;
    }),
  );
  return slots;
}

/** What a change would do to the day: time, walking, total vs pace. */
function impactOf(
  trip: Trip,
  dayId: string,
  nextPlaces: string[],
  focus: number,
  current?: Place,
) {
  const place = getPlace(nextPlaces[focus]);
  const prev = focus > 0 ? getPlace(nextPlaces[focus - 1]) : undefined;
  const next =
    focus < nextPlaces.length - 1 ? getPlace(nextPlaces[focus + 1]) : undefined;
  const total = dayMinutes(nextPlaces).total;
  const limit = paceLimits[trip.brief.pace] || paceLimits.Balanced;
  const a = minutesOf(place.duration),
    c = current ? minutesOf(current.duration) : null;
  return {
    duration:
      current && a !== null && c !== null && a !== c
        ? a < c
          ? `${c - a} min shorter`
          : `${a - c} min longer`
        : null,
    walks: [
      prev && `${travelBetween(prev, place).minutes} min from ${prev.name}`,
      next && `${travelBetween(place, next).minutes} min to ${next.name}`,
    ].filter(Boolean) as string[],
    total: formatMinutes(total),
    over: total > limit.minutes || nextPlaces.length > limit.stops,
    dayIndex: trip.days.findIndex((d) => d.id === dayId),
  };
}

function Impact({
  impact,
  pace,
}: {
  impact: ReturnType<typeof impactOf>;
  pace: string;
}) {
  return (
    <ul className="impact" aria-label="Effect on the day">
      {impact.duration && (
        <li>
          <Clock size={14} /> {impact.duration}
        </li>
      )}
      {impact.walks.length > 0 && (
        <li>
          <Footprints size={14} /> {impact.walks.join(" · ")}{" "}
          <span className="source">estimate</span>
        </li>
      )}
      <li className={impact.over ? "is-over" : undefined}>
        Day {impact.dayIndex + 1} total ≈ {impact.total} ·{" "}
        {impact.over
          ? `more than a ${pace.toLowerCase()} day`
          : `fits a ${pace.toLowerCase()} day`}
      </li>
    </ul>
  );
}

function reasons(alt: Place, current: Place, state: State) {
  const out: string[] = [];
  const taste = tasteMatch(alt, state).reasons;
  if (taste.length) out.push(`You like ${taste[0].toLowerCase()}`);
  const shared = alt.tags.find((t) => current.tags.includes(t));
  if (shared && !taste.includes(shared))
    out.push(`Also ${shared.toLowerCase()}`);
  if (alt.area === current.area) out.push(`Same area · ${alt.area}`);
  return out.slice(0, 2);
}

function Constraints({ trip }: { trip: Trip }) {
  const app = useApp();
  const b = trip.brief;
  return (
    <p className="constraints">
      {dateLabel(b.start)}–{dateLabel(b.end)} · {b.travelers} travelers ·{" "}
      {b.pace} · ${b.budget}/night ·{" "}
      {/no flights|already/i.test(b.origin) ? "no flights" : b.origin}{" "}
      <button
        className="link-button"
        onClick={() => app.openModal("edit-brief")}
      >
        Edit brief
      </button>
    </p>
  );
}

function BookingWarning({ trip, place }: { trip: Trip; place: Place }) {
  const booking = trip.bookings.find((b) =>
    (b.name + " " + b.note)
      .toLowerCase()
      .includes(place.name.toLowerCase().replace(/^the /, "")),
  );
  if (!booking) return null;
  return (
    <p className="booking-warning" role="note">
      <TriangleAlert size={16} />
      You have a reservation for {place.name} ({booking.reference}). Swapping
      won’t cancel it.
    </p>
  );
}

export default function SwapPanel({
  mode,
  onClose,
}: {
  mode: PanelMode;
  onClose: () => void;
}) {
  const app = useApp();
  const trip = app.trip;
  if (!trip) return null;
  if (mode.kind === "swap")
    return (
      <SlotChoices
        trip={trip}
        dayId={mode.dayId}
        index={mode.index}
        onClose={onClose}
      />
    );
  if (mode.kind === "placing")
    return (
      <PlaceChoices trip={trip} placeId={mode.placeId} onClose={onClose} />
    );
  if (mode.kind === "add")
    return <AddChoices trip={trip} dayId={mode.dayId} onClose={onClose} />;
  return null;
}

function SlotChoices({
  trip,
  dayId,
  index,
  onClose,
}: {
  trip: Trip;
  dayId: string;
  index: number;
  onClose: () => void;
}) {
  const app = useApp();
  const { state } = app;
  const day = trip.days.find((d) => d.id === dayId);
  const current = day
    ? places.find((p) => p.id === day.places[index])
    : undefined;
  const [sort, setSort] = useState<Sort>("match");
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const slots = useMemo(() => tripSlots(trip), [trip]);
  const queue = app.proposals.filter((p) => p.tripId === trip.id);
  const suggestion = queue.find((p) => p.dayId === dayId && p.index === index);
  const position = suggestion ? queue.indexOf(suggestion) : -1;

  const options = useMemo(() => {
    if (!current) return [];
    return places
      .filter(
        (p) =>
          p.kind !== "stay" &&
          p.id !== current.id &&
          p.id !== suggestion?.after &&
          !trip.excludedPlaces?.includes(p.id) &&
          !state.lessLike?.includes(p.id),
      )
      .map((p) => ({
        place: p,
        fit: tasteMatch(p, state).score,
        slot: slots[p.id] as string | undefined,
      }))
      .sort((a, b) => {
        if (sort === "kind") {
          const k =
            Number(b.place.kind === current.kind) -
            Number(a.place.kind === current.kind);
          if (k) return k;
        }
        if (sort === "nearby")
          return distance(a.place, current) - distance(b.place, current);
        return b.fit - a.fit || a.place.name.localeCompare(b.place.name);
      });
  }, [current, trip, state, sort, suggestion, slots]);

  if (!day || !current)
    return (
      <Panel title="That stop has moved" onClose={onClose}>
        <p className="muted-note">
          The itinerary changed. Choose Swap on a stop to see options.
        </p>
      </Panel>
    );

  const fresh = options.filter((o) => !o.slot);
  const inTrip = options.filter((o) => o.slot);
  const visibleFresh = showAll ? fresh : fresh.slice(0, 4);
  const visibleTrade = showAll ? inTrip : inTrip.slice(0, fresh.length ? 2 : 4);
  const hidden = options.length - visibleFresh.length - visibleTrade.length;
  const replaced = (pid: string) =>
    day.places.map((x, i) => (i === index ? pid : x));

  const option = (place: Place, slot?: string) => {
    const expanded = open === place.id;
    return (
      <li key={place.id} className="swap-option">
        <div className="swap-option-main">
          <span className="swap-thumb">
            <img
              src={place.image}
              alt=""
              loading="lazy"
              onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            />
          </span>
          <div className="swap-info">
            <h4>{place.name}</h4>
            <p className="swap-meta">
              <span>
                <Sparkles size={13} /> {tasteMatch(place, state).score}/100 fit
              </span>
              <span>{place.duration}</span>
              <span>{place.price}</span>
            </p>
            {slot && <p className="swap-where">Now on {slot}</p>}
          </div>
        </div>
        {reasons(place, current, state).length > 0 && (
          <p className="swap-reasons">
            {reasons(place, current, state).join(" · ")}
          </p>
        )}
        <Impact
          impact={impactOf(trip, dayId, replaced(place.id), index, current)}
          pace={trip.brief.pace}
        />
        {expanded && <p className="swap-detail">{place.description}</p>}
        <div className="swap-actions">
          <Button
            size="sm"
            variant="ghost"
            aria-expanded={expanded}
            onClick={() => setOpen(expanded ? null : place.id)}
          >
            {expanded ? "Less" : "Details"}{" "}
            <ChevronDown size={16} className={expanded ? "flip" : undefined} />
          </Button>
          <Button
            size="sm"
            variant={slot ? "secondary" : "primary"}
            onClick={() => app.applySwap(dayId, index, place.id)}
          >
            {slot ? <ArrowLeftRight size={16} /> : <Check size={16} />}
            {slot ? "Trade slots" : "Swap in"}
          </Button>
        </div>
      </li>
    );
  };

  const suggested = suggestion?.after ? getPlace(suggestion.after) : undefined;
  const fresh_ = suggestion && validateProposal(trip, suggestion);

  return (
    <Panel
      title={`Swap ${current.name}`}
      subtitle={`Day ${trip.days.indexOf(day) + 1} · ${slotName(index)}`}
      onClose={onClose}
      label={`Swap ${current.name}`}
    >
      <Constraints trip={trip} />
      <BookingWarning trip={trip} place={current} />

      {suggestion && (
        <section className="suggestion" aria-labelledby="suggestion-title">
          <header>
            <h3 id="suggestion-title">
              <Lightbulb size={16} /> Suggested from your message
            </h3>
            {queue.length > 1 && (
              <span className="muted-note">
                {position + 1} of {queue.length}
              </span>
            )}
          </header>
          {!fresh_ ? (
            <p className="muted-note">
              The itinerary changed after this suggestion, so it no longer
              applies.
            </p>
          ) : suggested ? (
            <>
              <p>
                <strong>{suggested.name}</strong> instead of {current.name}
                {slots[suggested.id]
                  ? ` (trades with ${slots[suggested.id]})`
                  : ""}
                .
              </p>
              <Impact
                impact={impactOf(
                  trip,
                  dayId,
                  replaced(suggested.id),
                  index,
                  current,
                )}
                pace={trip.brief.pace}
              />
            </>
          ) : (
            <>
              <p>
                Leave the {slotName(index).toLowerCase()} free. {current.name}{" "}
                goes to this trip’s ideas.
              </p>
              <p className="muted-note">
                Day {trip.days.indexOf(day) + 1} total ≈{" "}
                {formatMinutes(
                  dayMinutes(day.places.filter((_, i) => i !== index)).total,
                )}
              </p>
            </>
          )}
          <div className="suggestion-actions">
            <Button size="sm" onClick={() => app.dismissProposal(suggestion)}>
              <SkipForward size={16} /> Skip
            </Button>
            {fresh_ && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => app.applySwap(dayId, index, suggestion.after)}
              >
                <Check size={16} /> Apply
              </Button>
            )}
          </div>
          {queue.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              full
              onClick={() => applyAll(app, trip, queue)}
            >
              <CheckCheck size={16} /> Apply all {queue.length} suggestions
            </Button>
          )}
        </section>
      )}

      <Segmented
        label="Sort alternatives"
        options={sorts}
        value={sort}
        onChange={setSort}
      />
      {visibleFresh.length > 0 && (
        <section className="swap-group" aria-labelledby="swap-new">
          <h3 id="swap-new">New to your trip</h3>
          <ul className="swap-list">
            {visibleFresh.map((o) => option(o.place))}
          </ul>
        </section>
      )}
      {visibleTrade.length > 0 && (
        <section className="swap-group" aria-labelledby="swap-trade">
          <h3 id="swap-trade">Already in your trip</h3>
          <p className="muted-note">
            Trading moves {current.name} into that place’s slot.
          </p>
          <ul className="swap-list">
            {visibleTrade.map((o) => option(o.place, o.slot))}
          </ul>
        </section>
      )}
      {!options.length && (
        <p className="muted-note">
          Nothing else in this preview fits this slot.
        </p>
      )}
      {(hidden > 0 || showAll) && (
        <Button full onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer" : `Show ${hidden} more`}
        </Button>
      )}
      <div className="swap-more">
        <Button
          variant="ghost"
          full
          onClick={() => app.applySwap(dayId, index, null)}
        >
          <Coffee size={16} /> Leave this slot free instead
        </Button>
        <Button
          variant="ghost"
          full
          onClick={() => {
            app.setScope(`${dayId}:${index}`);
            app.setMode(null);
            app.notify("Describe what you’d like instead in the chat.");
          }}
        >
          <MessageCircle size={16} /> Describe what you want instead
        </Button>
      </div>
    </Panel>
  );
}

/** Apply every still-valid suggestion in one change; report any that were skipped. */
function applyAll(
  app: ReturnType<typeof useApp>,
  trip: Trip,
  queue: EditProposal[],
) {
  const valid = queue.filter((p) => validateProposal(trip, p));
  const stale = queue.length - valid.length;
  // Later stops first, so freeing a slot doesn’t shift the others.
  const ordered = [...valid].sort((a, b) =>
    a.dayId === b.dayId ? b.index - a.index : a.dayId.localeCompare(b.dayId),
  );
  app.applySwap(ordered[0].dayId, ordered[0].index, ordered[0].after, {
    batch: ordered
      .slice(1)
      .map((p) => ({
        dayId: p.dayId,
        index: p.index,
        after: p.after,
        before: p.before,
      })),
    label: `Applied ${valid.length} suggested ${valid.length === 1 ? "change" : "changes"}${stale ? `; skipped ${stale} that no longer applied` : ""}.`,
  });
}

function PlaceChoices({
  trip,
  placeId,
  onClose,
}: {
  trip: Trip;
  placeId: string;
  onClose: () => void;
}) {
  const app = useApp();
  const place = getPlace(placeId);
  const where = tripSlots(trip)[placeId];
  return (
    <Panel
      title={`Where should ${place.name} go?`}
      subtitle={
        where
          ? `Now on ${where}. Pick a slot to trade.`
          : `Pick the stop it replaces, or add it to a day.`
      }
      onClose={onClose}
      leading={undefined}
    >
      <Constraints trip={trip} />
      {trip.days.map((d, n) => {
        const added = [...d.places, placeId];
        return (
          <section
            key={d.id}
            className="swap-group"
            aria-labelledby={`place-day-${d.id}`}
          >
            <h3 id={`place-day-${d.id}`}>
              Day {n + 1} · {d.title}
            </h3>
            <ul className="swap-list">
              {d.places.map((id, j) => {
                const current = getPlace(id);
                const here = id === placeId;
                return (
                  <li key={`${id}-${j}`} className="swap-option">
                    <div className="swap-option-main">
                      <div className="swap-info">
                        <p className="muted-note">{slotName(j)}</p>
                        <h4>{current.name}</h4>
                      </div>
                    </div>
                    {!here && (
                      <>
                        <BookingWarning trip={trip} place={current} />
                        <Impact
                          impact={impactOf(
                            trip,
                            d.id,
                            d.places.map((x, i) => (i === j ? placeId : x)),
                            j,
                            current,
                          )}
                          pace={trip.brief.pace}
                        />
                      </>
                    )}
                    <div className="swap-actions">
                      {here ? (
                        <span className="here-now">Here now</span>
                      ) : (
                        <Button
                          size="sm"
                          aria-label={`${where ? "Trade" : "Swap"} ${current.name} for ${place.name}`}
                          onClick={() => app.applySwap(d.id, j, placeId)}
                        >
                          <ArrowLeftRight size={16} />{" "}
                          {where ? "Trade slots" : "Swap here"}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {!where && (
              <div className="add-to-day">
                <Impact
                  impact={impactOf(trip, d.id, added, added.length - 1)}
                  pace={trip.brief.pace}
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => app.addToDay(d.id, placeId)}
                >
                  <Plus size={16} /> Add to end of Day {n + 1}
                </Button>
              </div>
            )}
          </section>
        );
      })}
    </Panel>
  );
}

function AddChoices({
  trip,
  dayId,
  onClose,
}: {
  trip: Trip;
  dayId: string;
  onClose: () => void;
}) {
  const app = useApp();
  const day = trip.days.find((d) => d.id === dayId);
  if (!day) return null;
  const n = trip.days.indexOf(day);
  const options = places
    .filter(
      (p) =>
        p.kind !== "stay" &&
        !day.places.includes(p.id) &&
        !app.state.lessLike?.includes(p.id),
    )
    .map((p) => ({ p, fit: tasteMatch(p, app.state).score }))
    .sort((a, b) => b.fit - a.fit);
  return (
    <Panel title={`Add to Day ${n + 1}`} subtitle={day.title} onClose={onClose}>
      <Constraints trip={trip} />
      <ul className="swap-list">
        {options.map(({ p, fit }) => {
          const added = [...day.places, p.id];
          const elsewhere = tripSlots(trip)[p.id];
          return (
            <li key={p.id} className="swap-option">
              <div className="swap-option-main">
                <span className="swap-thumb">
                  <img
                    src={p.image}
                    alt=""
                    loading="lazy"
                    onError={(e) =>
                      (e.currentTarget.style.visibility = "hidden")
                    }
                  />
                </span>
                <div className="swap-info">
                  <h4>{p.name}</h4>
                  <p className="swap-meta">
                    <span>
                      <Sparkles size={13} /> {fit}/100 fit
                    </span>
                    <span>{p.duration}</span>
                  </p>
                  {elsewhere && (
                    <p className="swap-where">Also on {elsewhere}</p>
                  )}
                </div>
              </div>
              <Impact
                impact={impactOf(trip, dayId, added, added.length - 1)}
                pace={trip.brief.pace}
              />
              <div className="swap-actions">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => app.openPanel({ kind: "place", id: p.id })}
                >
                  Details
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => app.addToDay(dayId, p.id)}
                >
                  <Plus size={16} /> Add
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
