import { useState } from "react";
import { Star, Check, Lock, Globe, ArrowRight } from "lucide-react";
import { useApp } from "../../app/context";
import { getPlace, places, type State } from "../../model";
import { dimensions, tasteMatch } from "../../taste";
import { Button, Chip, Panel, Segmented } from "../../ui";

type Change = { name: string; before: number; after: number };

/**
 * After a visit: a quick rating that either stays private (teaches your
 * taste) or becomes a public review, then shows what changed for you.
 */
export default function VisitPanel({
  placeId,
  onClose,
}: {
  placeId: string;
  onClose: () => void;
}) {
  const app = useApp();
  const place = getPlace(placeId);
  const prior = app.state.tasteSignals?.[placeId];
  const [rating, setRating] = useState(prior?.rating || 0);
  const [liked, setLiked] = useState<string[]>(prior?.liked || []);
  const [disliked, setDisliked] = useState<string[]>(prior?.disliked || []);
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [text, setText] = useState("");
  const [result, setResult] = useState<Change[] | null>(null);
  const relevant = [
    ...new Set([
      ...place.tags.filter((t) => dimensions.includes(t)),
      "Easy pace",
      "Good value",
      "Quiet spaces",
      ...(place.kind === "food" ? ["Food quality", "Service"] : []),
    ]),
  ];
  const toggle = (tag: string, good: boolean) => {
    if (good) {
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
  const canSave =
    rating > 0 && (visibility === "private" || text.trim().length >= 10);

  const save = () => {
    const before = app.state;
    const next: State = {
      ...before,
      tasteSignals: {
        ...before.tasteSignals,
        [placeId]: { rating, liked, disliked, reasons: liked },
      },
      reviews:
        visibility === "public"
          ? [
              {
                id: crypto.randomUUID(),
                placeId,
                rating,
                text: text.trim(),
                public: true,
                helpful: false,
                reported: false,
              },
              ...before.reviews,
            ]
          : before.reviews,
      trips: before.trips.map((t) =>
        t.id === app.trip?.id
          ? { ...t, visited: [...new Set([...(t.visited || []), placeId])] }
          : t,
      ),
    };
    const changes = places
      .map((p) => ({
        name: p.name,
        before: tasteMatch(p, before).score,
        after: tasteMatch(p, next).score,
        id: p.id,
      }))
      .filter((c) => c.before !== c.after)
      .sort((a, b) =>
        a.id === placeId
          ? -1
          : b.id === placeId
            ? 1
            : Math.abs(b.after - b.before) - Math.abs(a.after - a.before),
      )
      .slice(0, 4);
    app.setState(next);
    setResult(changes);
  };

  if (result)
    return (
      <Panel title="Thanks, saved" subtitle={place.name} onClose={onClose}>
        <p>
          {visibility === "public"
            ? "Your review is published on Discover → People, and your taste profile learned from it."
            : "Kept private. It only teaches your taste profile."}
        </p>
        <h3 className="section-title">What changed for you</h3>
        {result.length ? (
          <ul className="change-list">
            {result.map((c) => (
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
            No scores moved. Picking what you liked or disliked gives your
            profile more to learn from.
          </p>
        )}
        <div className="button-row">
          <Button onClick={() => app.go({ view: "you", tab: "taste" }, null)}>
            See your taste profile
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </Panel>
    );

  return (
    <Panel
      title={`How was ${place.name}?`}
      subtitle="Your answer marks it visited and teaches your taste"
      onClose={onClose}
      footer={
        <Button variant="primary" disabled={!canSave} onClick={save}>
          <Check size={18} /> Save
        </Button>
      }
    >
      <div className="star-picker" role="group" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            aria-pressed={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
          >
            <Star size={26} fill={rating >= n ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <p className="muted-note">
        {
          [
            "Tap a star",
            "Would skip next time",
            "Not my favourite",
            "Mixed",
            "Would go again",
            "A favourite",
          ][rating]
        }
      </p>
      <h3 className="section-title">What worked? (optional)</h3>
      <div className="chip-row">
        {relevant.map((t) => (
          <Chip
            key={t}
            pressed={liked.includes(t)}
            onClick={() => toggle(t, true)}
          >
            {liked.includes(t) && <Check size={14} />} {t}
          </Chip>
        ))}
      </div>
      <h3 className="section-title">What didn’t? (optional)</h3>
      <div className="chip-row">
        {relevant.map((t) => (
          <Chip
            key={t}
            pressed={disliked.includes(t)}
            onClick={() => toggle(t, false)}
            aria-label={`Didn’t like ${t}`}
          >
            {disliked.includes(t) && <Check size={14} />} {t}
          </Chip>
        ))}
      </div>
      <h3 className="section-title">Who sees this?</h3>
      <Segmented
        label="Who sees this"
        options={
          [
            ["private", "Just me"],
            ["public", "Public review"],
          ] as const
        }
        value={visibility}
        onChange={setVisibility}
      />
      <p className="muted-note">
        {visibility === "private" ? (
          <>
            <Lock size={14} /> Private: only teaches your taste. Never shown to
            anyone.
          </>
        ) : (
          <>
            <Globe size={14} /> Public: shown with your reviews. Your private
            taste details stay hidden.
          </>
        )}
      </p>
      {visibility === "public" && (
        <label className="field">
          <span>Your review</span>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What was it like? Who would love it?"
          />
          {text.trim().length > 0 && text.trim().length < 10 && (
            <small className="form-error">
              A few more words, please (10+ characters).
            </small>
          )}
        </label>
      )}
    </Panel>
  );
}
