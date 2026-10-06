import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  Sparkles,
  MessageCircle,
  ArrowLeftRight,
} from "lucide-react";
import { places, type Place, type State, type Trip } from "../model";
import { tasteMatch } from "../taste";

type Sort = "match" | "kind" | "nearby";
const sorts: [Sort, string][] = [
  ["match", "Best match"],
  ["kind", "Same kind"],
  ["nearby", "Nearby"],
];
const slotName = (index: number) =>
  index === 0 ? "Morning" : index === 1 ? "Afternoon" : "Evening";

// Minutes from fixture durations like "90 min" or "2 hours".
function minutes(duration: string) {
  const n = parseFloat(duration);
  if (Number.isNaN(n)) return null;
  return /hour|hr/i.test(duration) ? n * 60 : n;
}
const distance = (a: Place, b: Place) => Math.hypot(a.x - b.x, a.y - b.y);

function reasons(alt: Place, current: Place, state: State) {
  const out: string[] = [];
  const taste = tasteMatch(alt, state).reasons;
  if (taste.length) out.push(`You like ${taste[0].toLowerCase()}`);
  const shared = alt.tags.find((t) => current.tags.includes(t));
  if (shared && !taste.includes(shared))
    out.push(`Also ${shared.toLowerCase()}`);
  if (alt.area === current.area) out.push(`Same area · ${alt.area}`);
  else if (distance(alt, current) < 18) out.push("A short walk away");
  const a = minutes(alt.duration),
    c = minutes(current.duration);
  if (a !== null && c !== null && a !== c)
    out.push(a < c ? `${c - a} min shorter` : `${a - c} min longer`);
  return out.slice(0, 3);
}

export default function SwapPanel({
  trip,
  dayId,
  index,
  state,
  onSwap,
  onAsk,
  onClose,
}: {
  trip: Trip;
  dayId: string;
  index: number;
  state: State;
  onSwap: (placeId: string) => void;
  onAsk: () => void;
  onClose: () => void;
}) {
  const day = trip.days.find((d) => d.id === dayId);
  const current = places.find((p) => p.id === day?.places[index]);
  const [sort, setSort] = useState<Sort>("match");
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dayId, index]);

  const options = useMemo(() => {
    if (!current) return [];
    // Where each place already sits in the trip, e.g. "Day 3 · Evening".
    const slots: Record<string, string> = {};
    trip.days.forEach((d, n) =>
      d.places.forEach((id, j) => {
        slots[id] ??= `Day ${n + 1} · ${slotName(j)}`;
      }),
    );
    return places
      .filter(
        (p) =>
          p.kind !== "stay" &&
          p.id !== current.id &&
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
  }, [current, trip, state, sort]);

  if (!day || !current) return null;
  const fresh = options.filter((o) => !o.slot);
  const inTrip = options.filter((o) => o.slot);
  const visibleFresh = showAll ? fresh : fresh.slice(0, 4);
  const visibleTrade = showAll ? inTrip : inTrip.slice(0, fresh.length ? 2 : 4);
  const hidden =
    fresh.length + inTrip.length - visibleFresh.length - visibleTrade.length;

  function renderList(list: typeof options) {
    return (
      <ul className="swap-list">
        {list.map(({ place, fit, slot }) => {
          const expanded = open === place.id;
          return (
            <li key={place.id} className="swap-option">
              <div className="swap-option-main">
                <div className="swap-thumb">
                  <img
                    src={place.image}
                    alt=""
                    loading="lazy"
                    onError={(e) =>
                      (e.currentTarget.style.visibility = "hidden")
                    }
                  />
                </div>
                <div className="swap-info">
                  <h4>{place.name}</h4>
                  <p className="swap-meta">
                    <span>
                      <Sparkles size={13} /> {fit}/100 fit
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
                {reasons(place, current!, state).map((r) => (
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
                  <ChevronDown
                    size={16}
                    className={expanded ? "flip" : undefined}
                  />
                </button>
                <button
                  className={`button ${slot ? "secondary" : "primary"}`}
                  onClick={() => onSwap(place.id)}
                >
                  {slot ? <ArrowLeftRight size={16} /> : <Check size={16} />}
                  {slot ? "Trade slots" : "Swap in"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <aside className="detail-panel swap-panel" aria-labelledby="swap-title">
      <div className="detail-heading">
        <div>
          <h2 id="swap-title" ref={heading} tabIndex={-1}>
            Swap {current.name}
          </h2>
          <p className="swap-slot">
            {day.title} · {slotName(index)}. Your route updates with it.
          </p>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close swap"
        >
          <X size={20} />
        </button>
      </div>
      <div className="detail-scroll swap-body">
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
            {renderList(visibleFresh)}
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
            {renderList(visibleTrade)}
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
        <button className="swap-ask" onClick={onAsk}>
          <MessageCircle size={16} />
          Not quite right? Describe what you want instead
        </button>
      </div>
    </aside>
  );
}
