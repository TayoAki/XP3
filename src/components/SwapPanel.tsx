import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  X,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  MapPin,
  Sparkles,
  MessageCircle,
  ArrowLeftRight,
  Coffee,
  Plus,
} from "lucide-react";
import { places, type Place, type State, type Trip } from "../model";
import { tasteMatch } from "../taste";
import { validateProposal, type EditProposal } from "../proposals";

// "slot": pick a replacement for one activity, with any assistant suggestion
// on top. "place": pick where an already-chosen place should go.
export type SwapTarget =
  | { kind: "slot"; dayId: string; index: number }
  | { kind: "place"; placeId: string };
type Header = (title: string, detail: string) => ReactNode;
type OnSwap = (dayId: string, index: number, placeId: string | null) => void;

type Sort = "match" | "kind" | "nearby";
const sorts: [Sort, string][] = [
  ["match", "Best match"],
  ["kind", "Same kind"],
  ["nearby", "Nearby"],
];
export const slotName = (index: number) =>
  index === 0 ? "Morning" : index === 1 ? "Afternoon" : "Evening";

// Minutes from fixture durations like "90 min" or "2 hours".
function minutes(duration: string) {
  const n = parseFloat(duration);
  if (Number.isNaN(n)) return null;
  return /hour|hr/i.test(duration) ? n * 60 : n;
}
const distance = (a: Place, b: Place) => Math.hypot(a.x - b.x, a.y - b.y);

function durationChange(alt: Place, current: Place) {
  const a = minutes(alt.duration),
    c = minutes(current.duration);
  if (a === null || c === null || a === c) return null;
  return a < c ? `${c - a} min shorter` : `${a - c} min longer`;
}

function reasons(alt: Place, current: Place, state: State) {
  const out: string[] = [];
  const taste = tasteMatch(alt, state).reasons;
  if (taste.length) out.push(`You like ${taste[0].toLowerCase()}`);
  const shared = alt.tags.find((t) => current.tags.includes(t));
  if (shared && !taste.includes(shared))
    out.push(`Also ${shared.toLowerCase()}`);
  if (alt.area === current.area) out.push(`Same area · ${alt.area}`);
  else if (distance(alt, current) < 18) out.push("A short walk away");
  const change = durationChange(alt, current);
  if (change) out.push(change);
  return out.slice(0, 3);
}

// Where each place already sits in the trip, e.g. "Day 3 · Evening".
function tripSlots(trip: Trip) {
  const slots: Record<string, string> = {};
  trip.days.forEach((d, n) =>
    d.places.forEach((id, j) => {
      slots[id] ??= `Day ${n + 1} · ${slotName(j)}`;
    }),
  );
  return slots;
}

function Thumb({ place }: { place: Place }) {
  return (
    <div className="swap-thumb">
      <img
        src={place.image}
        alt=""
        loading="lazy"
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      />
    </div>
  );
}

export default function SwapPanel({
  trip,
  target,
  state,
  suggestion,
  onSwap,
  onAdd,
  onDismissSuggestion,
  onAsk,
  onBack,
  onClose,
}: {
  trip: Trip;
  target: SwapTarget;
  state: State;
  suggestion?: EditProposal;
  // A null placeId leaves the slot free.
  onSwap: OnSwap;
  onAdd: (dayId: string, placeId: string) => void;
  onDismissSuggestion: () => void;
  onAsk: () => void;
  onBack?: () => void;
  onClose: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target]);

  const header: Header = (title, detail) => (
    <div className="detail-heading">
      {onBack && (
        <button
          className="icon-button"
          onClick={onBack}
          aria-label="Back to place details"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div className="swap-heading-text">
        <h2 id="swap-title" ref={heading} tabIndex={-1}>
          {title}
        </h2>
        <p className="swap-slot">{detail}</p>
      </div>
      <button className="icon-button" onClick={onClose} aria-label="Close">
        <X size={20} />
      </button>
    </div>
  );

  return (
    <aside className="detail-panel swap-panel" aria-labelledby="swap-title">
      {target.kind === "slot" ? (
        <SlotChoices
          trip={trip}
          dayId={target.dayId}
          index={target.index}
          state={state}
          suggestion={suggestion}
          header={header}
          onSwap={onSwap}
          onDismissSuggestion={onDismissSuggestion}
          onAsk={onAsk}
        />
      ) : (
        <PlaceChoices
          trip={trip}
          placeId={target.placeId}
          header={header}
          onSwap={onSwap}
          onAdd={onAdd}
        />
      )}
    </aside>
  );
}

function SlotChoices({
  trip,
  dayId,
  index,
  state,
  suggestion,
  header,
  onSwap,
  onDismissSuggestion,
  onAsk,
}: {
  trip: Trip;
  dayId: string;
  index: number;
  state: State;
  suggestion?: EditProposal;
  header: Header;
  onSwap: OnSwap;
  onDismissSuggestion: () => void;
  onAsk: () => void;
}) {
  const day = trip.days.find((d) => d.id === dayId);
  const current = places.find((p) => p.id === day?.places[index]);
  const [sort, setSort] = useState<Sort>("match");
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const slots = useMemo(() => tripSlots(trip), [trip]);

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

  if (!day || !current) return null;
  const fresh = options.filter((o) => !o.slot);
  const inTrip = options.filter((o) => o.slot);
  const visibleFresh = showAll ? fresh : fresh.slice(0, 4);
  const visibleTrade = showAll ? inTrip : inTrip.slice(0, fresh.length ? 2 : 4);
  const hidden =
    fresh.length + inTrip.length - visibleFresh.length - visibleTrade.length;

  const option = (place: Place, slot?: string) => {
    const expanded = open === place.id;
    return (
      <li key={place.id} className="swap-option">
        <div className="swap-option-main">
          <Thumb place={place} />
          <div className="swap-info">
            <h4>{place.name}</h4>
            <p className="swap-meta">
              <span>
                <Sparkles size={13} /> {tasteMatch(place, state).score}/100 fit
              </span>
              <span>
                <Clock size={13} /> {place.duration}
              </span>
              <span>{place.price}</span>
            </p>
            {slot && <p className="swap-where">Now on {slot}</p>}
          </div>
        </div>
        <ul className="swap-reasons">
          {reasons(place, current, state).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {expanded && (
          <div className="swap-detail" id={`swap-${place.id}`}>
            <p>{place.description}</p>
            <p className="swap-area">
              <MapPin size={13} /> {place.area}
            </p>
          </div>
        )}
        <div className="swap-actions">
          <button
            className="button ghost"
            aria-expanded={expanded}
            aria-controls={`swap-${place.id}`}
            onClick={() => setOpen(expanded ? null : place.id)}
          >
            {expanded ? "Less" : "Details"}
            <ChevronDown size={16} className={expanded ? "flip" : undefined} />
          </button>
          <button
            className={`button ${slot ? "secondary" : "primary"}`}
            onClick={() => onSwap(dayId, index, place.id)}
          >
            {slot ? <ArrowLeftRight size={16} /> : <Check size={16} />}
            {slot ? "Trade slots" : "Swap in"}
          </button>
        </div>
      </li>
    );
  };

  const suggested = suggestion?.after
    ? places.find((p) => p.id === suggestion.after)
    : undefined;

  return (
    <>
      {header(
        `Swap ${current.name}`,
        `${day.title} · ${slotName(index)}. Your route updates with it.`,
      )}
      <div className="detail-scroll swap-body">
        {suggestion && (
          <section className="swap-suggestion" aria-labelledby="swap-ai">
            <h3 id="swap-ai" className="swap-group-title">
              <Sparkles size={15} /> Suggested from your message
            </h3>
            {!validateProposal(trip, suggestion) ? (
              <div className="swap-option">
                <p className="swap-free-text">
                  Your itinerary changed after this suggestion, so it no longer
                  applies. Pick an option below instead.
                </p>
                <div className="swap-actions">
                  <button
                    className="button secondary"
                    onClick={onDismissSuggestion}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : suggested ? (
              <ul className="swap-list">
                {option(suggested, slots[suggested.id])}
              </ul>
            ) : (
              <div className="swap-option">
                <p className="swap-free-text">
                  Leave the {slotName(index).toLowerCase()} free for a slower
                  day. {current.name} stays in your ideas.
                </p>
                <div className="swap-actions">
                  <button
                    className="button ghost"
                    onClick={onDismissSuggestion}
                  >
                    Dismiss
                  </button>
                  <button
                    className="button primary"
                    onClick={() => onSwap(dayId, index, null)}
                  >
                    <Check size={16} /> Free it up
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
        <div className="segmented" role="group" aria-label="Sort alternatives">
          {sorts.map(([key, label]) => (
            <button
              key={key}
              aria-pressed={sort === key}
              onClick={() => setSort(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {options.length === 0 && (
          <p className="swap-empty">
            Nothing else in this preview fits this slot. Ask the assistant for
            something new instead.
          </p>
        )}
        {visibleFresh.length > 0 && (
          <section className="swap-group" aria-labelledby="swap-new">
            <h3 id="swap-new" className="swap-group-title">
              New to your trip
            </h3>
            <ul className="swap-list">
              {visibleFresh.map((o) => option(o.place))}
            </ul>
          </section>
        )}
        {visibleTrade.length > 0 && (
          <section className="swap-group" aria-labelledby="swap-trade">
            <h3 id="swap-trade" className="swap-group-title">
              Already in your trip
            </h3>
            <p className="swap-group-note">
              Trading moves {current.name} into that place&rsquo;s slot.
            </p>
            <ul className="swap-list">
              {visibleTrade.map((o) => option(o.place, o.slot))}
            </ul>
          </section>
        )}
        {(hidden > 0 || showAll) && (
          <button
            className="button secondary full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show fewer" : `Show ${hidden} more`}
          </button>
        )}
        <div className="swap-more">
          {!(suggestion && !suggestion.after) && (
            <button
              className="swap-ask"
              onClick={() => onSwap(dayId, index, null)}
            >
              <Coffee size={16} />
              Leave this slot free instead
            </button>
          )}
          <button className="swap-ask" onClick={onAsk}>
            <MessageCircle size={16} />
            Not quite right? Describe what you want instead
          </button>
        </div>
      </div>
    </>
  );
}

function PlaceChoices({
  trip,
  placeId,
  header,
  onSwap,
  onAdd,
}: {
  trip: Trip;
  placeId: string;
  header: Header;
  onSwap: OnSwap;
  onAdd: (dayId: string, placeId: string) => void;
}) {
  const place = places.find((p) => p.id === placeId);
  if (!place) return null;
  const where = tripSlots(trip)[place.id];
  return (
    <>
      {header(
        `Where should ${place.name} go?`,
        where
          ? `It’s already on ${where}. Pick a slot to trade places.`
          : `Pick the activity it replaces in ${trip.name}.`,
      )}
      <div className="detail-scroll swap-body">
        {trip.days.map((d, n) => (
          <section
            key={d.id}
            className="swap-group"
            aria-labelledby={`swap-day-${d.id}`}
          >
            <h3 id={`swap-day-${d.id}`} className="swap-group-title">
              Day {n + 1} · {d.title}
            </h3>
            <ul className="swap-list">
              {d.places.map((id, j) => {
                const current = places.find((p) => p.id === id);
                if (!current) return null;
                const here = id === place.id;
                const change = durationChange(place, current);
                return (
                  <li key={`${id}-${j}`} className="swap-option">
                    <div className="swap-option-main">
                      <Thumb place={current} />
                      <div className="swap-info">
                        <p className="swap-slot-label">{slotName(j)}</p>
                        <h4>{current.name}</h4>
                        <p className="swap-meta">
                          <span>
                            <Clock size={13} /> {current.duration}
                          </span>
                          {change && !here && (
                            <span>
                              {place.name} is {change}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="swap-actions">
                      {here ? (
                        <span className="swap-here">Here now</span>
                      ) : (
                        <button
                          className="button secondary"
                          aria-label={`${where ? "Trade" : "Swap"} ${current.name} for ${place.name}`}
                          onClick={() => onSwap(d.id, j, place.id)}
                        >
                          <ArrowLeftRight size={16} />
                          {where ? "Trade slots" : "Swap here"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {!where && (
              <button
                className="swap-ask"
                onClick={() => onAdd(d.id, place.id)}
              >
                <Plus size={16} /> Add to the end of Day {n + 1}
              </button>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
