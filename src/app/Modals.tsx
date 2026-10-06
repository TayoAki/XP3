import { useState } from "react";
import {
  Check,
  Flag,
  MapPin,
  MessageSquare,
  Star,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";
import { useApp, type Modal } from "./context";
import { getPlace, places, initialState, migrateWorkspace } from "../model";
import { Button, Segmented } from "../ui";
import Dialog from "../components/Dialog";

const titles: Record<Modal, string> = {
  share: "Plan together",
  "edit-brief": "Edit the brief",
  review: "Write a review",
  "edit-review": "Edit your review",
  "delete-review": "Delete this review?",
  report: "Report this review",
  reset: "Reset everything?",
  history: "Changes to this trip",
  today: "Travel mode",
  move: "Move to another day",
};

export default function Modals({
  modal,
  id,
  onClose,
}: {
  modal: Modal;
  id?: string;
  onClose: () => void;
}) {
  return (
    <Dialog title={titles[modal]} onClose={onClose}>
      {modal === "share" && <Share onClose={onClose} />}
      {modal === "edit-brief" && <EditBrief onClose={onClose} />}
      {(modal === "review" || modal === "edit-review") && (
        <Review id={id} editing={modal === "edit-review"} onClose={onClose} />
      )}
      {modal === "delete-review" && <DeleteReview id={id!} onClose={onClose} />}
      {modal === "report" && <Report placeId={id} onClose={onClose} />}
      {modal === "reset" && <Reset onClose={onClose} />}
      {modal === "history" && <History onClose={onClose} />}
      {modal === "today" && <Today onClose={onClose} />}
      {modal === "move" && <Move slot={id!} onClose={onClose} />}
    </Dialog>
  );
}

function Share({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const trip = app.trip;
  const [name, setName] = useState("");
  const [permission, setPermission] = useState<"edit" | "view">("edit");
  const [comment, setComment] = useState("");
  if (!trip) return <p>Open a trip to share it.</p>;
  return (
    <>
      <p className="dialog-lead">
        Add people to this trip and leave notes for each other. In this preview
        nobody is actually invited and no message is sent.
      </p>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          app.changeTrip(`${name.trim()} added to the trip (preview).`, (t) => {
            t.partners.push(`${name.trim()} · can ${permission}`);
          });
          setName("");
        }}
      >
        <label className="field">
          <span>Name or email</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
          />
        </label>
        <Segmented
          label="Permission"
          options={
            [
              ["edit", "Can edit"],
              ["view", "Can view"],
            ] as const
          }
          value={permission}
          onChange={setPermission}
        />
        <Button type="submit" variant="primary" disabled={!name.trim()}>
          <Users size={16} /> Add to trip
        </Button>
      </form>
      {trip.partners.length > 0 && (
        <ul className="chip-row partner-list">
          {trip.partners.map((p, i) => (
            <li key={i} className="tag">
              {p}
            </li>
          ))}
        </ul>
      )}
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!comment.trim()) return;
          app.changeTrip("Note added.", (t) => {
            t.comments.push(comment.trim());
          });
          setComment("");
        }}
      >
        <label className="field">
          <span>Trip notes</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="I’d love a slower Saturday morning…"
          />
        </label>
        <Button type="submit" disabled={!comment.trim()}>
          <MessageSquare size={16} /> Add note
        </Button>
      </form>
      {trip.comments.map((c, i) => (
        <p className="note" key={i}>
          You · {c}
        </p>
      ))}
      <div className="dialog-actions">
        <Button onClick={onClose}>Done</Button>
      </div>
    </>
  );
}

function EditBrief({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const trip = app.trip;
  const [start, setStart] = useState(trip?.brief.start || "");
  const [end, setEnd] = useState(trip?.brief.end || "");
  const [travelers, setTravelers] = useState(trip?.brief.travelers || 2);
  const [budget, setBudget] = useState(trip?.brief.budget || 200);
  const [pace, setPace] = useState(trip?.brief.pace || "Relaxed");
  const [origin, setOrigin] = useState(
    trip && !/unknown/i.test(trip.brief.origin) ? trip.brief.origin : "",
  );
  if (!trip) return <p>Open a trip to edit its brief.</p>;
  const length =
    Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const valid =
    start && end && end >= start && length <= 7 && travelers >= 1 && budget > 0;
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const count = Math.max(1, Math.min(7, length));
        app.changeTrip("Brief updated. The days follow the new dates.", (t) => {
          t.brief = {
            ...t.brief,
            start,
            end,
            travelers,
            budget,
            pace,
            origin: origin.trim() || "Unknown",
            status: {
              ...t.brief.status,
              when: "confirmed",
              who: "confirmed",
              budget: "confirmed",
              pace: "confirmed",
              from: origin.trim() ? "confirmed" : "unknown",
            },
          };
          while (t.days.length < count)
            t.days.push({
              id: `day-${crypto.randomUUID().slice(0, 8)}`,
              title: "Room to discover",
              places: [],
            });
          if (t.days.length > count) t.days = t.days.slice(0, count);
        });
        if (trip.days.length > count) {
          const extra = trip.days.slice(count).flatMap((d) => d.places);
          app.setState((s) => ({
            ...s,
            collections: s.collections?.map((c) =>
              c.tripId === trip.id
                ? { ...c, placeIds: [...new Set([...c.placeIds, ...extra])] }
                : c,
            ),
          }));
        }
        onClose();
      }}
    >
      <div className="field-grid">
        <label className="field">
          <span>Start</span>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="field">
          <span>End</span>
          <input
            type="date"
            min={start}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Travelers</span>
          <input
            type="number"
            min={1}
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span>Hotel budget / night ($)</span>
          <input
            type="number"
            min={1}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span>Pace</span>
          <select value={pace} onChange={(e) => setPace(e.target.value)}>
            {["Relaxed", "Balanced", "Packed with discovery"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Starting from</span>
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. Already there · no flights"
          />
        </label>
      </div>
      {!valid && (
        <p className="form-error" role="alert">
          Choose one to seven days, at least one traveler, and a budget above
          zero.
        </p>
      )}
      <p className="muted-note">
        Removing days moves their stops to this trip’s ideas. You can undo this.
      </p>
      <div className="dialog-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!valid}>
          <Check size={16} /> Save brief
        </Button>
      </div>
    </form>
  );
}

function Review({
  id,
  editing,
  onClose,
}: {
  id?: string;
  editing: boolean;
  onClose: () => void;
}) {
  const app = useApp();
  const existing = editing
    ? app.state.reviews.find((r) => r.id === id)
    : undefined;
  const [placeId, setPlaceId] = useState(
    existing?.placeId || id || places[0].id,
  );
  const [rating, setRating] = useState(existing?.rating || 0);
  const [text, setText] = useState(existing?.text || "");
  const [visibility, setVisibility] = useState<"public" | "private">(
    existing && !existing.public ? "private" : "public",
  );
  const valid = rating > 0 && text.trim().length >= 10;
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const review = {
          id: existing?.id || crypto.randomUUID(),
          placeId,
          rating,
          text: text.trim(),
          public: visibility === "public",
          helpful: false,
          reported: false,
        };
        app.setState((s) => ({
          ...s,
          reviews: existing
            ? s.reviews.map((r) => (r.id === review.id ? review : r))
            : [review, ...s.reviews],
          tasteSignals: {
            ...s.tasteSignals,
            [placeId]: {
              ...(s.tasteSignals?.[placeId] || { reasons: [] }),
              rating,
            },
          },
        }));
        app.notify(
          review.public
            ? "Review published (this preview only)."
            : "Saved privately. It teaches your taste.",
        );
        onClose();
      }}
    >
      <label className="field">
        <span>Place</span>
        <select
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          disabled={!!existing}
        >
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="star-picker" role="group" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            aria-pressed={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
          >
            <Star size={24} fill={rating >= n ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <label className="field">
        <span>What was it like?</span>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="The atmosphere, the pace, who would love it…"
        />
      </label>
      <Segmented
        label="Who can see it"
        options={
          [
            ["public", "Public review"],
            ["private", "Just me"],
          ] as const
        }
        value={visibility}
        onChange={setVisibility}
      />
      <p className="muted-note">
        {visibility === "public"
          ? "Shown on Discover → People in this preview."
          : "Private: only teaches your taste profile."}
      </p>
      <div className="dialog-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!valid}>
          {editing ? "Save changes" : "Save review"}
        </Button>
      </div>
    </form>
  );
}

function DeleteReview({ id, onClose }: { id: string; onClose: () => void }) {
  const app = useApp();
  const review = app.state.reviews.find((r) => r.id === id);
  return (
    <>
      <p className="dialog-lead">
        This removes your review of{" "}
        {review ? getPlace(review.placeId).name : "this place"} and updates your
        matches.
      </p>
      <div className="dialog-actions">
        <Button onClick={onClose}>Keep it</Button>
        <Button
          variant="danger"
          onClick={() => {
            app.setState((s) => ({
              ...s,
              reviews: s.reviews.filter((r) => r.id !== id),
            }));
            app.notify(
              "Review deleted.",
              review
                ? {
                    label: "Undo",
                    run: () =>
                      app.setState((s) => ({
                        ...s,
                        reviews: [review, ...s.reviews],
                      })),
                  }
                : undefined,
            );
            onClose();
          }}
        >
          <Trash2 size={16} /> Delete
        </Button>
      </div>
    </>
  );
}

function Report({
  placeId,
  onClose,
}: {
  placeId?: string;
  onClose: () => void;
}) {
  const app = useApp();
  const [reason, setReason] = useState("Not about this place");
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        app.setState((s) => ({
          ...s,
          reviews: [
            ...s.reviews,
            {
              id: crypto.randomUUID(),
              placeId: placeId || "gage",
              text: `Reported: ${reason}`,
              rating: 0,
              public: false,
              helpful: false,
              reported: true,
            },
          ],
        }));
        app.notify("Reported. See it in Settings → Moderation preview.");
        onClose();
      }}
    >
      <label className="field">
        <span>What’s wrong?</span>
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {[
            "Not about this place",
            "Spam or advertising",
            "Abusive",
            "Possible conflict of interest",
          ].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <p className="muted-note">
        This preview doesn’t contact anyone; it creates a sample moderation
        item.
      </p>
      <div className="dialog-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          <Flag size={16} /> Report
        </Button>
      </div>
    </form>
  );
}

function Reset({ onClose }: { onClose: () => void }) {
  const app = useApp();
  return (
    <>
      <p className="dialog-lead">
        This clears every trip, collection, review and taste setting stored by
        this preview on this device. Download a copy first if you might want it
        back.
      </p>
      <div className="dialog-actions">
        <Button onClick={app.exportData}>Download a copy</Button>
        <Button
          variant="danger"
          onClick={() => {
            app.setState(migrateWorkspace(structuredClone(initialState)));
            app.setBrief(null);
            try {
              Object.keys(localStorage)
                .filter((k) => k.startsWith("xpmatch-"))
                .forEach((k) => localStorage.removeItem(k));
            } catch {}
            onClose();
            app.go({ view: "trips", tab: "upcoming" }, null);
            app.notify("Everything was reset.");
          }}
        >
          <Trash2 size={16} /> Reset
        </Button>
      </div>
    </>
  );
}

function History({ onClose }: { onClose: () => void }) {
  const app = useApp();
  return (
    <>
      {app.history.length ? (
        <ol className="history-list">
          {[...app.history].reverse().map((h, i) => (
            <li key={i}>
              <strong>{h.label}</strong>
              <small>{h.time}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="dialog-lead">
          No changes yet in this session. This is the trip as it was built.
        </p>
      )}
      <div className="dialog-actions">
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="primary"
          disabled={!app.canUndo}
          onClick={() => {
            app.undo();
            onClose();
          }}
        >
          <Undo2 size={16} /> Undo the latest change
        </Button>
      </div>
    </>
  );
}

function Today({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const trip = app.trip;
  const [dayIndex, setDayIndex] = useState(0);
  if (!trip) return null;
  const day = trip.days[dayIndex];
  return (
    <>
      <p className="dialog-lead">
        One day at a time. Check stops off as you go, then tell us how they
        were.
      </p>
      <label className="field">
        <span>Day</span>
        <select
          value={dayIndex}
          onChange={(e) => setDayIndex(Number(e.target.value))}
        >
          {trip.days.map((d, i) => (
            <option key={d.id} value={i}>
              Day {i + 1} · {d.title}
            </option>
          ))}
        </select>
      </label>
      <ul className="today-list">
        {day.places.map((id) => {
          const visited = trip.visited?.includes(id);
          return (
            <li key={id}>
              <MapPin size={18} />
              <span>{getPlace(id).name}</span>
              <Button
                size="sm"
                variant={visited ? "secondary" : "primary"}
                onClick={() => {
                  onClose();
                  app.setMode({ kind: "visit", placeId: id });
                }}
              >
                {visited ? <Check size={16} /> : null}
                {visited ? "Visited · rate" : "I’ve been"}
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Move({ slot, onClose }: { slot: string; onClose: () => void }) {
  const app = useApp();
  const trip = app.trip;
  const [from, index] = slot.split(":");
  const [target, setTarget] = useState(
    trip?.days.find((d) => d.id !== from)?.id || "",
  );
  if (!trip) return null;
  const place = getPlace(
    trip.days.find((d) => d.id === from)!.places[Number(index)],
  );
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        app.changeTrip(`${place.name} moved.`, (t) => {
          const [item] = t.days
            .find((d) => d.id === from)!
            .places.splice(Number(index), 1);
          t.days.find((d) => d.id === target)!.places.push(item);
        });
        onClose();
      }}
    >
      <p className="dialog-lead">
        Move {place.name} to the end of another day.
      </p>
      <label className="field">
        <span>Day</span>
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          {trip.days
            .filter((d) => d.id !== from)
            .map((d) => (
              <option key={d.id} value={d.id}>
                Day {trip.days.indexOf(d) + 1} · {d.title}
              </option>
            ))}
        </select>
      </label>
      <div className="dialog-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!target}>
          Move
        </Button>
      </div>
    </form>
  );
}
