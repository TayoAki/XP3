import { useState } from "react";
import { places, type Place, type State } from "../model";
import { explainPlace } from "../taste";
export default function ComparisonTray({
  place,
  state,
  onChange,
  onOpen,
  onChoose,
}: {
  place: Place;
  state: State;
  onChange: (s: State) => void;
  onOpen: (id: string) => void;
  onChoose: (id: string) => void;
}) {
  const [priority, setPriority] = useState("personal fit");
  const ids = [
    ...new Set([
      place.id,
      ...(state.compareIds || []).filter(
        (id) => places.find((p) => p.id === id)?.kind === place.kind,
      ),
    ]),
  ].slice(0, 3);
  return (
    <section className="comparison-tray">
      <h3>Make the tradeoff clear</h3>
      <label className="field-label">
        For this decision, prioritize
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {["personal fit", "price", "time", "indoor options"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <p className="fine-print">
        This lens helps you compare; it does not change your taste profile.
      </p>
      <div className="comparison-options">
        {ids.map((id) => {
          const p = places.find((p) => p.id === id)!;
          const e = explainPlace(p, state);
          return (
            <article key={id}>
              <strong>{p.name}</strong>
              <p>
                {priority === "personal fit"
                  ? `${e.score}/100 demo fit`
                  : priority === "price"
                    ? p.price
                    : priority === "time"
                      ? p.duration
                      : p.tags.includes("Indoor")
                        ? "Sample tag: indoor"
                        : p.tags.includes("Outdoor")
                          ? "Sample tag: outdoor"
                          : "Indoor/outdoor unknown"}
              </p>
              <p>{e.summary}</p>
              <small>{e.tradeoff}</small>
              <button className="text-button" onClick={() => onOpen(id)}>
                Research this option
              </button>
              <button
                className="button secondary full"
                onClick={() => onChoose(id)}
              >
                {p.kind === "stay"
                  ? "Choose this stay"
                  : "Choose for itinerary"}
              </button>
              {id !== place.id && (
                <button
                  className="text-button"
                  onClick={() =>
                    onChange({
                      ...state,
                      compareIds: (state.compareIds || []).filter(
                        (x) => x !== id,
                      ),
                    })
                  }
                >
                  Remove comparison
                </button>
              )}
            </article>
          );
        })}
      </div>
      <select
        aria-label="Add comparison option"
        value=""
        disabled={ids.length >= 3}
        onChange={(e) => {
          if (e.target.value)
            onChange({
              ...state,
              compareIds: [...new Set([...ids, e.target.value])],
            });
        }}
      >
        <option value="">
          {ids.length >= 3 ? "Three options selected" : "Add an alternative…"}
        </option>
        {places
          .filter((p) => p.kind === place.kind && !ids.includes(p.id))
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </select>
      <p className="fine-print">
        Same-kind options, up to three. Hours, exact prices and availability are
        unverified. Choosing opens a confirmation; it never books.
      </p>
    </section>
  );
}
