import { useState } from "react";
import { Sparkles, X, ChevronDown, Undo2, EyeOff, Ban } from "lucide-react";
import type { Place, State, Trip } from "../../model";
import { explainPlace } from "../../taste";
import { reviewsFor } from "../../inspiration";
import { Button } from "../../ui";

export type Confidence = "high" | "some" | "low";

/** How much evidence stands behind a fit score. */
export function confidenceOf(place: Place, state: State): Confidence {
  const e = explainPlace(place, state);
  const personal = e.factors.filter(
    (f) => f.points > 0 && !/boundary/i.test(f.label),
  ).length;
  const reviews = reviewsFor(place.id).length;
  if (personal >= 2 && reviews >= 2) return "high";
  if (personal >= 1) return "some";
  return "low";
}

const confidenceText: Record<Confidence, string> = {
  high: "Good evidence",
  some: "Some evidence",
  low: "Not enough evidence yet",
};

/**
 * The top reasons a place fits, each correctable in place, plus the full
 * score breakdown on demand.
 */
export default function WhyItFits({
  place,
  state,
  trip,
  onChange,
  onNotify,
}: {
  place: Place;
  state: State;
  trip?: Trip;
  onChange: (fn: (s: State) => State) => void;
  onNotify: (text: string, undo?: () => void) => void;
}) {
  const e = explainPlace(place, state);
  const confidence = confidenceOf(place, state);
  const [open, setOpen] = useState(false);
  const reasons = e.factors
    .filter((f) => f.points > 0 && !/boundary|rating/i.test(f.label))
    .slice(0, 3);
  const cautions = e.factors.filter((f) => f.points < 0);
  const excluded = trip?.excludedPlaces?.includes(place.id);
  const hidden = state.lessLike?.includes(place.id);

  const correct = (label: string) => {
    const snapshot = {
      interests: state.interests,
      pace: state.pace,
      tasteSignals: state.tasteSignals,
    };
    onChange((s) => {
      if (label === "Relaxed pace") return { ...s, pace: "Balanced" };
      const tag = label.replace(/^Avoid /, "");
      return {
        ...s,
        interests: s.interests.filter((t) => t !== tag),
        tasteSignals: Object.fromEntries(
          Object.entries(s.tasteSignals || {}).map(([id, sig]) => [
            id,
            {
              ...sig,
              liked: sig.liked?.filter((t) => t !== tag),
              disliked: sig.disliked?.filter((t) => t !== tag),
              reasons: sig.reasons.filter((t) => t !== tag),
            },
          ]),
        ),
      };
    });
    onNotify(`“${label}” no longer counts toward your matches.`, () =>
      onChange((s) => ({ ...s, ...snapshot })),
    );
  };

  return (
    <section className="why-fits" aria-labelledby="why-title">
      <header>
        <h3 id="why-title">
          <Sparkles size={16} /> Why it fits you
        </h3>
        <span className="fit-score">
          {e.score}
          <small>/100</small>
        </span>
      </header>
      <p className={`confidence is-${confidence}`}>
        {confidenceText[confidence]}
      </p>
      {reasons.length ? (
        <ul className="reason-list">
          {reasons.map((f) => (
            <li key={f.label}>
              <span>
                <strong>{f.label}</strong>
                <small>
                  {f.source}
                  {f.support.length > 0 &&
                    ` · from ${f.support.slice(0, 2).join(", ")}`}
                </small>
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => correct(f.label)}
                aria-label={`${f.label} isn’t me`}
              >
                <X size={14} /> Not me
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-note">
          Nothing in your taste profile points to this place yet. It’s here to
          explore, not because it matches.
        </p>
      )}
      {cautions.length > 0 && (
        <p className="caution">
          Might not suit you:{" "}
          {cautions
            .map((c) => c.label.replace(/^Avoid /, "").toLowerCase())
            .join(", ")}
          .
        </p>
      )}
      <button
        className="disclosure"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        How this score is built{" "}
        <ChevronDown size={16} className={open ? "flip" : undefined} />
      </button>
      {open && (
        <div className="score-trace">
          <div>
            <span>Starting point</span>
            <span>50</span>
          </div>
          {e.factors.map((f) => (
            <div key={f.label}>
              <span>{f.label}</span>
              <span>
                {f.points > 0 ? "+" : ""}
                {f.points}
              </span>
            </div>
          ))}
          <p className="muted-note">
            Sample rules: +7 per matching interest, −12 per thing you avoid, +5
            for an easy pace when you travel relaxed, ±6 per star of your own
            rating. A comparison aid, not a prediction.
          </p>
          {e.uncertainty.map((u) => (
            <p className="muted-note" key={u}>
              {u}
            </p>
          ))}
        </div>
      )}
      <div className="why-actions">
        {trip && (
          <Button
            size="sm"
            aria-pressed={!!excluded}
            onClick={() => {
              onChange((s) => ({
                ...s,
                trips: s.trips.map((t) =>
                  t.id === trip.id
                    ? {
                        ...t,
                        excludedPlaces: excluded
                          ? t.excludedPlaces?.filter((id) => id !== place.id)
                          : [...(t.excludedPlaces || []), place.id],
                      }
                    : t,
                ),
              }));
              onNotify(
                excluded
                  ? "Back in consideration for this trip."
                  : "Marked as not right for this trip. Your taste profile is unchanged.",
              );
            }}
          >
            {excluded ? <Undo2 size={14} /> : <Ban size={14} />}
            {excluded ? "Undo “not for this trip”" : "Not for this trip"}
          </Button>
        )}
        <Button
          size="sm"
          aria-pressed={!!hidden}
          onClick={() => {
            onChange((s) => ({
              ...s,
              lessLike: hidden
                ? s.lessLike?.filter((i) => i !== place.id)
                : [...(s.lessLike || []), place.id],
            }));
            onNotify(
              hidden
                ? "Showing it in Discover again."
                : "Hidden from Discover. It can come back from Discover’s sidebar.",
            );
          }}
        >
          {hidden ? <Undo2 size={14} /> : <EyeOff size={14} />}
          {hidden ? "Show in Discover" : "Less like this"}
        </Button>
      </div>
    </section>
  );
}
