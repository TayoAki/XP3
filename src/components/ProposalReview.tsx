import { useState, useEffect } from "react";
import { places, type Trip } from "../model";
import { proposalFor, validateProposal, type EditProposal } from "../proposals";
export default function ProposalReview({
  trip,
  initial,
  onApply,
  onCancel,
  defaultAfter,
  initialSelection,
  onUpdate,
}: {
  trip: Trip;
  initial: EditProposal[];
  onApply: (p: EditProposal[]) => void;
  onCancel: () => void;
  defaultAfter?: string;
  initialSelection?: number[];
  onUpdate?: (edits: EditProposal[], selection: number[]) => void;
}) {
  const [edits, setEdits] = useState(initial);
  const [selected, setSelected] = useState(
    (initialSelection || initial.map((_, i) => i)).filter((i) => !!initial[i]),
  );
  useEffect(() => {
    onUpdate?.(edits, selected);
  }, [edits, selected]);
  const [day, setDay] = useState(trip.days[0]?.id || "");
  const [slot, setSlot] = useState(0);
  const [after, setAfter] = useState(defaultAfter || "cultural");
  const stale = edits.some((p) => !validateProposal(trip, p));
  return (
    <>
      <p className="dialog-description">
        Only selected changes will apply. Your dates, party, origin, stay and
        hotel budget remain unchanged.
      </p>
      <div className="evidence-box">
        <strong>Confirmed brief</strong>
        <p>
          {trip.brief.start}–{trip.brief.end} · {trip.brief.travelers} travelers
          · {trip.brief.pace} · ${trip.brief.budget}/night · no flights
        </p>
      </div>
      {stale && (
        <p className="form-error" role="alert">
          This proposal is stale. The itinerary changed. Clear it and select the
          current activity again.
        </p>
      )}
      {edits.map((p, i) => (
        <div className="proposal-item" key={`${p.dayId}:${p.index}`}>
          <label>
            <input
              type="checkbox"
              checked={selected.includes(i)}
              onChange={() =>
                setSelected(
                  selected.includes(i)
                    ? selected.filter((x) => x !== i)
                    : [...selected, i],
                )
              }
            />
            {trip.days.findIndex((d) => d.id === p.dayId) + 1}. day · {p.label}
          </label>
          <small>
            Removed activity stays in your ideas. Travel times and opening hours
            require verification.
          </small>
        </div>
      ))}
      <details className="proposal-builder" open={!edits.length}>
        <summary>Add or refine a specific change</summary>
        <label>
          Day
          <select
            value={day}
            onChange={(e) => {
              setDay(e.target.value);
              setSlot(0);
            }}
          >
            {trip.days.map((d, i) => (
              <option key={d.id} value={d.id}>
                Day {i + 1} · {d.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Activity
          <select
            value={slot}
            onChange={(e) => setSlot(Number(e.target.value))}
          >
            {trip.days
              .find((d) => d.id === day)
              ?.places.map((id, i) => (
                <option value={i} key={i}>
                  {places.find((p) => p.id === id)?.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Replace with
          <select value={after} onChange={(e) => setAfter(e.target.value)}>
            <option value="free">Free time</option>
            {places
              .filter((p) => p.kind !== "stay")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <button
          className="button secondary"
          disabled={!trip.days.find((d) => d.id === day)?.places.length}
          onClick={() => {
            const p = proposalFor(
              trip,
              day,
              slot,
              after === "free" ? null : after,
            );
            if (!p) return;
            const next = edits.filter(
              (e) => !(e.dayId === day && e.index === slot),
            );
            next.push(p);
            setEdits(next);
            setSelected(next.map((_, i) => i));
          }}
        >
          Add proposed change
        </button>
      </details>
      <p className="fine-print">
        {trip.bookings.length
          ? "Reservations exist: check whether any selected activity is booked before applying."
          : "No bookings recorded in this trip."}{" "}
        Changes affect only the named activity instances.
      </p>
      <div className="dialog-actions">
        <button className="button secondary" onClick={onCancel}>
          Keep current plan
        </button>
        <button
          className="button secondary"
          onClick={() => {
            setEdits([]);
            setSelected([]);
          }}
        >
          Clear proposals
        </button>
        <button
          className="button primary"
          disabled={stale || !selected.length}
          onClick={() => onApply(edits.filter((_, i) => selected.includes(i)))}
        >
          Apply selected changes
        </button>
      </div>
    </>
  );
}
