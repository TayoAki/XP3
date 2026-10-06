import { useEffect, useState } from "react";
import {
  Search,
  Star,
  Check,
  Trash2,
  ArrowRight,
  ShieldCheck,
  PenLine,
} from "lucide-react";
import { places, type State } from "../model";
import { dimensions, learnedTaste, rankedTaste, tasteMatch } from "../taste";
import { Button, Chip, IconButton, Section, Segmented } from "../ui";
import { Photo } from "./PlaceCard";

const interestOptions = [
  "Local food",
  "Architecture",
  "Art & culture",
  "Hidden gems",
  "Nature",
  "Good value",
  "Nightlife",
  "Boutique hotels",
  "Family friendly",
  "Wellness",
  "Small plates",
];
const paces = [
  ["Relaxed", "Relaxed"],
  ["Balanced", "Balanced"],
  ["Packed with discovery", "Packed"],
] as const;
const kinds = [
  ["all", "All"],
  ["food", "Food"],
  ["experience", "Things to do"],
  ["stay", "Stays"],
] as const;

type Draft = { rating: number; liked: string[]; disliked: string[] };
type Impact = { name: string; before: number; after: number };

/**
 * The one taste editor: what you choose directly (interests, pace) and what
 * you teach it by rating places you know. Everything stays on this device.
 */
export default function TasteStudio({
  state,
  onChange,
  onOpen,
  onReview,
}: {
  state: State;
  onChange: (s: State) => void;
  onOpen?: (id: string) => void;
  onReview?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<(typeof kinds)[number][0]>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    rating: 0,
    liked: [],
    disliked: [],
  });
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    try {
      return JSON.parse(localStorage.getItem("xpmatch-taste-drafts") || "{}");
    } catch {
      return {};
    }
  });
  const [impact, setImpact] = useState<Impact[] | null>(null);
  const [removed, setRemoved] = useState<{
    id: string;
    signal: NonNullable<State["tasteSignals"]>[string];
  } | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem("xpmatch-taste-drafts", JSON.stringify(drafts));
    } catch {}
  }, [drafts]);

  const signals = Object.entries(state.tasteSignals || {}).filter(
    ([, s]) => s.rating > 0,
  );
  const weights = learnedTaste(state);
  const more = Object.keys(weights).filter((t) => weights[t] > 0);
  const less = Object.keys(weights).filter((t) => weights[t] < 0);
  const place = places.find((p) => p.id === selected);
  const saved = selected ? state.tasteSignals?.[selected] : undefined;
  const dirty =
    !!selected &&
    (draft.rating !== (saved?.rating || 0) ||
      [...draft.liked].sort().join() !==
        [...(saved?.liked || [])].sort().join() ||
      [...draft.disliked].sort().join() !==
        [...(saved?.disliked || [])].sort().join());

  const pick = (id: string) => {
    const s = drafts[id] || state.tasteSignals?.[id];
    setSelected(id);
    setDraft({
      rating: s?.rating || 0,
      liked: s?.liked || [],
      disliked: s?.disliked || [],
    });
    setImpact(null);
  };
  const edit = (next: Draft) => {
    setDraft(next);
    if (selected) setDrafts((d) => ({ ...d, [selected]: next }));
  };
  const toggle = (tag: string, good: boolean) =>
    edit(
      good
        ? {
            ...draft,
            liked: draft.liked.includes(tag)
              ? draft.liked.filter((t) => t !== tag)
              : [...draft.liked, tag],
            disliked: draft.disliked.filter((t) => t !== tag),
          }
        : {
            ...draft,
            disliked: draft.disliked.includes(tag)
              ? draft.disliked.filter((t) => t !== tag)
              : [...draft.disliked, tag],
            liked: draft.liked.filter((t) => t !== tag),
          },
    );
  const save = () => {
    if (!place || !draft.rating) return;
    const next: State = {
      ...state,
      tasteSignals: {
        ...state.tasteSignals,
        [place.id]: { ...draft, reasons: draft.liked },
      },
    };
    setImpact(
      places
        .map((p) => ({
          name: p.name,
          before: tasteMatch(p, state).score,
          after: tasteMatch(p, next).score,
          id: p.id,
        }))
        .filter((c) => c.before !== c.after)
        .sort((a, b) =>
          a.id === place.id
            ? -1
            : b.id === place.id
              ? 1
              : Math.abs(b.after - b.before) - Math.abs(a.after - a.before),
        )
        .slice(0, 4),
    );
    onChange(next);
    setDrafts((d) => {
      const rest = { ...d };
      delete rest[place.id];
      return rest;
    });
  };
  const relevant = place
    ? [
        ...new Set([
          ...place.tags,
          ...(place.kind === "food"
            ? ["Food quality", "Service", "Value"]
            : []),
          "Easy pace",
          "Quiet spaces",
          "Good value",
        ]),
      ].filter((t) => dimensions.includes(t))
    : [];
  const list = places.filter(
    (p) =>
      (kind === "all" || p.kind === kind) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const top = rankedTaste(state).slice(0, 4);

  return (
    <div className="taste">
      <div className="taste-main">
        <Section title="What you choose">
          <p className="muted-note">
            Every new trip starts from these. A trip can override them for
            itself.
          </p>
          <div className="chip-row">
            {[...new Set([...interestOptions, ...state.interests])].map((t) => (
              <Chip
                key={t}
                pressed={state.interests.includes(t)}
                onClick={() =>
                  onChange({
                    ...state,
                    interests: state.interests.includes(t)
                      ? state.interests.filter((i) => i !== t)
                      : [...state.interests, t],
                  })
                }
              >
                {state.interests.includes(t) && <Check size={14} />} {t}
              </Chip>
            ))}
          </div>
          <div className="taste-pace">
            <span>Usual pace</span>
            <Segmented
              label="Usual pace"
              options={paces}
              value={state.pace as (typeof paces)[number][0]}
              onChange={(pace) => onChange({ ...state, pace })}
            />
          </div>
        </Section>

        <Section title="Rate places you know">
          <p className="muted-note">
            {signals.length < 3
              ? `${signals.length} of 3 rated. A few honest ratings, good and bad, teach more than a long questionnaire.`
              : `${signals.length} rated. Add a different kind of place to round it out.`}
          </p>
          <div className="taste-progress" aria-hidden="true">
            <span
              style={{ width: `${Math.min(100, (signals.length / 3) * 100)}%` }}
            />
          </div>
          <div className="search-field">
            <Search size={18} />
            <label className="sr-only" htmlFor="taste-search">
              Find a place you’ve been
            </label>
            <input
              id="taste-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a place you’ve been…"
            />
          </div>
          <Segmented
            label="Kind of place"
            options={kinds}
            value={kind}
            onChange={setKind}
          />
          <ul className="familiar-list">
            {list.map((p) => {
              const rated = state.tasteSignals?.[p.id]?.rating;
              return (
                <li key={p.id}>
                  <button
                    aria-pressed={selected === p.id}
                    onClick={() => pick(p.id)}
                  >
                    <span className="idea-thumb">
                      <Photo place={p} />
                    </span>
                    <span className="familiar-text">
                      <strong>{p.name}</strong>
                      <small>
                        {drafts[p.id] ? "Draft kept · " : ""}
                        {rated ? `You rated it ${rated}/5` : p.area}
                      </small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
          {!list.length && (
            <p className="muted-note">
              No sample places match. Try another name.
            </p>
          )}
        </Section>

        {place && (
          <section
            className="taste-editor"
            aria-labelledby="taste-editor-title"
          >
            <h3 id="taste-editor-title">How was {place.name}?</h3>
            <div className="star-picker" role="group" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-pressed={draft.rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => edit({ ...draft, rating: n })}
                >
                  <Star
                    size={24}
                    fill={draft.rating >= n ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            <h4>What worked?</h4>
            <div className="chip-row">
              {relevant.map((t) => (
                <Chip
                  key={t}
                  pressed={draft.liked.includes(t)}
                  onClick={() => toggle(t, true)}
                >
                  {draft.liked.includes(t) && <Check size={14} />} {t}
                </Chip>
              ))}
            </div>
            <h4>What would you rather avoid?</h4>
            <div className="chip-row">
              {relevant.map((t) => (
                <Chip
                  key={t}
                  pressed={draft.disliked.includes(t)}
                  onClick={() => toggle(t, false)}
                  aria-label={`Avoid ${t}`}
                >
                  {draft.disliked.includes(t) && <Check size={14} />} {t}
                </Chip>
              ))}
            </div>
            <p className="muted-note">
              {dirty
                ? "Unsaved. Your draft is kept if you switch places."
                : "Up to date."}{" "}
              Pick only what you actually experienced.
            </p>
            <div className="button-row">
              <Button
                variant="primary"
                disabled={!draft.rating || !dirty}
                onClick={save}
              >
                Save privately
              </Button>
              {onReview && (
                <Button variant="ghost" onClick={() => onReview(place.id)}>
                  <PenLine size={16} /> Write a public review instead
                </Button>
              )}
            </div>
            {impact && (
              <div className="taste-impact" role="status">
                <h4>What changed for you</h4>
                {impact.length ? (
                  <ul className="change-list">
                    {impact.map((c) => (
                      <li key={c.name}>
                        <span>{c.name}</span>
                        <strong>
                          {c.before} <ArrowRight size={14} /> {c.after}
                        </strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted-note">
                    No scores moved. Pick a quality you liked or disliked to
                    teach it more.
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <aside className="taste-side">
        <Section title="What it has learned">
          <p className="muted-note">
            From your ratings, not your stars alone. One rating is a clue, not a
            label.
          </p>
          <h4>More of</h4>
          <p>
            {more.length
              ? more.join(", ")
              : "Nothing yet. Rate a place and pick what worked."}
          </p>
          <h4>Less of</h4>
          <p>{less.length ? less.join(", ") : "Nothing yet."}</p>
        </Section>
        <Section title="Your ratings">
          {signals.length ? (
            <ul className="signal-list">
              {signals.map(([id, s]) => (
                <li key={id}>
                  <button className="link-button" onClick={() => pick(id)}>
                    {places.find((p) => p.id === id)?.name || id}
                  </button>
                  <span className="muted-note">{s.rating}/5</span>
                  <IconButton
                    label={`Remove your rating of ${places.find((p) => p.id === id)?.name || id}`}
                    onClick={() => {
                      const next = { ...state.tasteSignals };
                      delete next[id];
                      setRemoved({ id, signal: s });
                      onChange({ ...state, tasteSignals: next });
                      if (selected === id) setSelected(null);
                    }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-note">
              Your ratings appear here. You can change or remove them any time.
            </p>
          )}
          {removed && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onChange({
                  ...state,
                  tasteSignals: {
                    ...state.tasteSignals,
                    [removed.id]: removed.signal,
                  },
                });
                setRemoved(null);
              }}
            >
              Undo removal
            </Button>
          )}
        </Section>
        <Section title="Top matches right now">
          <ul className="signal-list">
            {top.map((p) => (
              <li key={p.id}>
                <button className="link-button" onClick={() => onOpen?.(p.id)}>
                  {p.name}
                </button>
                <span className="muted-note">{p.fit}/100</span>
              </li>
            ))}
          </ul>
          <p className="muted-note">
            <ShieldCheck size={14} /> Sample scoring rules. A comparison aid,
            not a prediction.
          </p>
        </Section>
      </aside>
    </div>
  );
}
