import { useState, useEffect } from "react";
import {
  Search,
  Star,
  Check,
  ArrowRight,
  Trash2,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { places, type State } from "../model";
import { dimensions, learnedTaste, rankedTaste, tasteMatch } from "../taste";
import { Photo } from "./PlaceCard";
export default function TasteStudio({
  state,
  onChange,
  onOpen,
  onReview,
  compact = false,
}: {
  state: State;
  onChange: (s: State) => void;
  onOpen?: (id: string) => void;
  onReview?: (id: string) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [removed, setRemoved] = useState<{
    id: string;
    signal: NonNullable<State["tasteSignals"]>[string];
  } | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { rating: number; liked: string[]; disliked: string[] }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("xpmatch-taste-drafts") || "{}");
    } catch {
      return {};
    }
  });
  const [impact, setImpact] = useState<
    | {
        name: string;
        before: number;
        after: number;
        oldRank: number;
        newRank: number;
        reason: string;
      }[]
    | null
  >(null);
  const [expanded, setExpanded] = useState(false);
  const original = selected ? state.tasteSignals?.[selected] : undefined;
  const dirty =
    !!selected &&
    (rating !== (original?.rating || 0) ||
      JSON.stringify([...liked].sort()) !==
        JSON.stringify([...(original?.liked || [])].sort()) ||
      JSON.stringify([...disliked].sort()) !==
        JSON.stringify([...(original?.disliked || [])].sort()));
  useEffect(() => {
    if (!selected) return;
    setDrafts((d) => {
      const next = { ...d };
      if (dirty) next[selected] = { rating, liked, disliked };
      else delete next[selected];
      return next;
    });
  }, [selected, rating, liked, disliked, dirty]);
  useEffect(() => {
    try {
      localStorage.setItem("xpmatch-taste-drafts", JSON.stringify(drafts));
    } catch {}
  }, [drafts]);
  const signals = Object.entries(state.tasteSignals || {}).filter(
    ([, s]) => s.rating > 0,
  );
  const weights = learnedTaste(state);
  const favorites = Object.keys(weights).filter((t) => weights[t] > 0);
  const avoid = Object.keys(weights).filter((t) => weights[t] < 0);
  const matches = rankedTaste(state);
  const place = places.find((p) => p.id === selected);
  const pick = (id: string) => {
    const s = drafts[id] || state.tasteSignals?.[id];
    setSelected(id);
    setRating(s?.rating || 0);
    setLiked(s?.liked || []);
    setDisliked(s?.disliked || []);
    setSaved(false);
  };
  const saveFeedback = () => {
    if (!place || !rating) return;
    const next = {
      ...state,
      tasteSignals: {
        ...state.tasteSignals,
        [place.id]: { rating, reasons: liked, liked, disliked },
      },
    };
    const before = rankedTaste(state);
    const after = rankedTaste(next);
    setImpact(
      after
        .map((p, i) => {
          const old = before.find((x) => x.id === p.id)!;
          const fit = tasteMatch(p, next);
          return {
            name: p.name,
            before: old.fit,
            after: p.fit,
            oldRank: before.findIndex((x) => x.id === p.id) + 1,
            newRank: i + 1,
            reason:
              p.id === place.id
                ? "Your updated overall rating and matching attributes"
                : fit.cautions.length
                  ? `Avoid signal: ${fit.cautions.join(", ")}`
                  : `Liked signal: ${fit.reasons.join(", ")}`,
          };
        })
        .filter((p) => p.before !== p.after || p.oldRank !== p.newRank)
        .sort(
          (a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before),
        )
        .slice(0, 4),
    );
    onChange(next);
    setDrafts((d) => {
      const next = { ...d };
      delete next[place.id];
      return next;
    });
    setSaved(true);
  };
  const relevant = place
    ? [
        ...new Set([
          ...place.tags,
          ...(place.kind === "food"
            ? ["Food quality", "Service", "Value", "Quiet spaces"]
            : []),
          "Easy pace",
        ]),
      ].filter((t) => dimensions.includes(t))
    : [];
  const visibleDimensions = expanded
    ? dimensions
    : [...new Set([...relevant, ...liked, ...disliked])];
  const toggle = (tag: string, positive: boolean) => {
    setSaved(false);
    if (positive) {
      setLiked(
        liked.includes(tag) ? liked.filter((t) => t !== tag) : [...liked, tag],
      );
      setDisliked(disliked.filter((t) => t !== tag));
    } else {
      setDisliked(
        disliked.includes(tag)
          ? disliked.filter((t) => t !== tag)
          : [...disliked, tag],
      );
      setLiked(liked.filter((t) => t !== tag));
    }
  };
  return (
    <div className={`taste-studio ${compact ? "compact" : ""}`}>
      <section className="taste-hero">
        <span className="eyebrow">YOUR TASTE, IN YOUR WORDS</span>
        <h2>More than a star rating.</h2>
        <p>
          Tell us what you loved and what you’d skip. See your priorities shape
          the recommendations below.
        </p>
        <div className="taste-progress">
          <span>{signals.length} familiar places rated</span>
          <span>
            {signals.length < 3
              ? "Getting started · try three places"
              : signals.length < 6
                ? "Taking shape · add a different kind of place"
                : "A richer starting point"}
          </span>
        </div>
        <small>Private on this device · no public review is posted</small>
      </section>
      <div className="taste-studio-grid">
        <div>
          <section className="settings-card">
            <div className="section-line">
              <h3>Start with a place you know</h3>
              <span className="mini-label">CHICAGO DEMO</span>
            </div>
            <div className="taste-search">
              <Search size={17} />
              <input
                aria-label="Search familiar places"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search places you’ve visited…"
              />
            </div>
            <div className="filter-row">
              {[
                ["all", "All"],
                ["food", "Restaurants"],
                ["experience", "Things to do"],
                ["stay", "Hotels"],
              ].map(([id, label]) => (
                <button
                  className={kind === id ? "active" : ""}
                  key={id}
                  onClick={() => setKind(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="familiar-list">
              {places
                .filter(
                  (p) =>
                    (kind === "all" || p.kind === kind) &&
                    p.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((p) => (
                  <button
                    className={selected === p.id ? "chosen" : ""}
                    key={p.id}
                    onClick={() => pick(p.id)}
                  >
                    <Photo place={p} />
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {drafts[p.id] ? "Draft kept · " : ""}
                        {p.area} ·{" "}
                        {state.tasteSignals?.[p.id]?.rating
                          ? `${state.tasteSignals[p.id].rating}/5 · edit rating`
                          : "I’ve been here"}
                      </small>
                    </span>
                    <ArrowRight size={15} />
                  </button>
                ))}
            </div>
            {!places.some(
              (p) =>
                (kind === "all" || p.kind === kind) &&
                p.name.toLowerCase().includes(query.toLowerCase()),
            ) && (
              <p className="empty-inline">
                No sample places found. Try another name or category. More
                cities will connect with place search.
              </p>
            )}
            {place && (
              <div className="taste-editor">
                <h3>How was {place.name}?</h3>
                {dirty && (
                  <p className="draft-notice" role="status">
                    Unsubmitted edits kept on this device. You can switch places
                    and return; matches change only after Save.
                  </p>
                )}
                {state.tasteSignals?.[place.id] &&
                  !state.tasteSignals[place.id].liked &&
                  state.tasteSignals[place.id].reasons.length > 0 && (
                    <p className="fine-print">
                      Earlier feedback mentioned{" "}
                      {state.tasteSignals[place.id].reasons.join(", ")}. Confirm
                      which details you liked or disliked below.
                    </p>
                  )}
                <div className="rating-picks">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      aria-label={`Rate ${n} stars`}
                      aria-pressed={rating === n}
                      key={n}
                      onClick={() => {
                        setRating(n);
                        setSaved(false);
                      }}
                    >
                      <Star fill={rating >= n ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <p>
                  {
                    [
                      "Choose your overall rating",
                      "Would skip next time",
                      "Not my favorite",
                      "Mixed experience",
                      "Would go again",
                      "A personal favorite",
                    ][rating]
                  }
                </p>
                <h4>What worked for you?</h4>
                <div className="interest-options">
                  {visibleDimensions.map((t) => (
                    <button
                      key={t}
                      aria-label={`Liked ${t}`}
                      aria-pressed={liked.includes(t)}
                      className={liked.includes(t) ? "selected" : ""}
                      onClick={() => toggle(t, true)}
                    >
                      {liked.includes(t) && <Check size={12} />} {t}
                    </button>
                  ))}
                </div>
                <h4>What would you rather avoid?</h4>
                <div className="interest-options">
                  {visibleDimensions.map((t) => (
                    <button
                      key={t}
                      aria-label={`Disliked ${t}`}
                      aria-pressed={disliked.includes(t)}
                      className={disliked.includes(t) ? "selected" : ""}
                      onClick={() => toggle(t, false)}
                    >
                      {disliked.includes(t) && <Check size={12} />} {t}
                    </button>
                  ))}
                </div>
                <button
                  className="text-button dimension-toggle"
                  aria-expanded={expanded}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Show relevant qualities" : "Show all qualities"}
                </button>
                <p className="fine-print">
                  Choose what you actually experienced. Leave uncertain details
                  blank. Likes and dislikes stay separate even when your overall
                  rating is mixed.
                </p>
                <div className="taste-save-bar">
                  <span>
                    {dirty ? "Unsaved feedback" : "Feedback up to date"}
                  </span>
                  <button
                    className="button primary"
                    disabled={!rating || !dirty}
                    onClick={saveFeedback}
                  >
                    Save private feedback <Check size={15} />
                  </button>
                  <button
                    className="button secondary"
                    disabled={!dirty}
                    onClick={() => {
                      const s = state.tasteSignals?.[place.id];
                      setRating(s?.rating || 0);
                      setLiked(s?.liked || []);
                      setDisliked(s?.disliked || []);
                      setSaved(false);
                    }}
                  >
                    Revert unsaved edits
                  </button>
                </div>
                {onReview && (
                  <button
                    className="research-link"
                    onClick={() => onReview(place.id)}
                  >
                    Write a separate public review <ArrowRight size={14} />
                  </button>
                )}
                {saved && (
                  <p className="taste-saved" role="status">
                    Saved. Your taste summary and demo order have updated.
                  </p>
                )}
              </div>
            )}
          </section>
          <section className="settings-card">
            <h3>Your saved experiences</h3>
            {!signals.length && (
              <p className="empty-inline">
                Your first rating will appear here. You can edit or remove it
                anytime.
              </p>
            )}
            {signals.map(([id, s]) => (
              <div className="signal-row" key={id}>
                <button onClick={() => pick(id)}>
                  <strong>{places.find((p) => p.id === id)?.name || id}</strong>
                  <small>
                    {s.rating}/5 · {s.liked?.length || 0} likes ·{" "}
                    {s.disliked?.length || 0} dislikes
                  </small>
                </button>
                <button
                  aria-label={`Remove taste rating for ${places.find((p) => p.id === id)?.name || id}`}
                  onClick={() => {
                    const next = { ...state.tasteSignals };
                    delete next[id];
                    setRemoved({ id, signal: s });
                    onChange({ ...state, tasteSignals: next });
                    if (selected === id) setSelected(null);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {removed && (
              <button
                className="text-button"
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
                Undo removed rating
              </button>
            )}
          </section>
        </div>
        <aside>
          <section className="taste-summary">
            <Heart size={24} />
            <h3>What you’re teaching us</h3>
            <span className="eyebrow">
              PATTERNS FROM YOUR SAVED EXPERIENCES
            </span>
            <p className="fine-print">
              These are tentative patterns from explicit likes and dislikes—not
              assumptions based on stars alone.
            </p>
            <span className="eyebrow">MORE OF</span>
            <div className="tags">
              {favorites.length ? (
                favorites.map((t) => (
                  <span key={t}>
                    {t} ·{" "}
                    {signals.filter(([, s]) => s.liked?.includes(t)).length}{" "}
                    experiences
                  </span>
                ))
              ) : (
                <p>No clear likes yet. Add detail to a rating.</p>
              )}
            </div>
            <span className="eyebrow">LESS OF</span>
            <div className="tags">
              {avoid.length ? (
                avoid.map((t) => (
                  <span key={t}>
                    {t} ·{" "}
                    {signals.filter(([, s]) => s.disliked?.includes(t)).length}{" "}
                    experiences
                  </span>
                ))
              ) : (
                <p>No clear dislikes yet.</p>
              )}
            </div>
            <p>
              Conflicting feedback balances out. A single rating is a clue, not
              a permanent label.
            </p>
            <span className="eyebrow">PREFERENCES YOU CHOOSE</span>
            <p className="fine-print">
              Direct choices are separate from patterns in your ratings. You can
              correct either at any time.
            </p>
            <label className="field-label">
              Your starting travel pace
              <select
                value={state.pace}
                onChange={(e) => onChange({ ...state, pace: e.target.value })}
              >
                {["Relaxed", "Balanced", "Packed with discovery"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <h4>Interests you choose directly</h4>
            <div className="interest-options">
              {[
                ...new Set([
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
                  "Luxury",
                  ...state.interests,
                ]),
              ].map((t) => (
                <button
                  aria-pressed={state.interests.includes(t)}
                  className={state.interests.includes(t) ? "selected" : ""}
                  key={t}
                  onClick={() =>
                    onChange({
                      ...state,
                      interests: state.interests.includes(t)
                        ? state.interests.filter((i) => i !== t)
                        : [...state.interests, t],
                    })
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="fine-print">
              <ShieldCheck size={13} /> Future-trip preferences. Existing trips
              keep their own brief.
            </p>
          </section>
          <section className="settings-card">
            <div className="section-line">
              <h3>Watch your matches change</h3>
              <span className="mini-label">DEMO RULES</span>
            </div>
            <p className="fine-print">
              Transparent local scoring uses selected interests, pace, ratings
              and matching place tags. Only attributes present in the sample
              place tags affect ordering; service and food-quality evidence
              still needs real reviews. Scores are not measured probabilities.
            </p>
            {impact !== null && (
              <section
                className="taste-impact"
                aria-label="Impact of your latest feedback"
              >
                <h4>What changed after your save</h4>
                {impact.length ? (
                  impact.map((p) => (
                    <div key={p.name}>
                      <strong>{p.name}</strong>
                      <p>
                        {p.before} → {p.after} demo fit · position {p.oldRank} →{" "}
                        {p.newRank}
                      </p>
                      <small>{p.reason}</small>
                    </div>
                  ))
                ) : (
                  <p>
                    No score changes for these sample places. Your feedback is
                    saved; some qualities need review data before they can
                    affect matching.
                  </p>
                )}
              </section>
            )}
            <details className="taste-rules">
              <summary>How these demo scores work</summary>
              <p>
                Start at 50. Each matching interest or liked attribute adds 7;
                each disliked attribute subtracts 12. Easy-pace places add 5 for
                a relaxed traveler. Your own rating adjusts that place by 6
                points per star above or below 3. Scores stay between 15 and 95;
                they are comparison aids, not certainty.
              </p>
            </details>
            {matches.slice(0, 4).map((p) => {
              const fit = tasteMatch(p, state);
              return (
                <article className="taste-match" key={p.id}>
                  <button disabled={!onOpen} onClick={() => onOpen?.(p.id)}>
                    <strong>{p.name}</strong>
                    <span>{fit.score}/100 demo fit</span>
                  </button>
                  <p>
                    {fit.reasons.length
                      ? `Matches: ${fit.reasons.join(", ")}`
                      : "An option to explore; limited taste evidence."}
                  </p>
                  {fit.cautions.length > 0 && (
                    <p>Tradeoffs: {fit.cautions.join(", ")}</p>
                  )}
                </article>
              );
            })}
          </section>
        </aside>
      </div>
    </div>
  );
}
