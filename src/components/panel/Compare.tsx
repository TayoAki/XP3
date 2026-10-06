import { Plus, X } from "lucide-react";
import { places, type Place, type State } from "../../model";
import { explainPlace } from "../../taste";
import { Button, IconButton } from "../../ui";

/**
 * The one comparison tool: up to three places of the same kind, side by
 * side on fit, price and time.
 */
export default function Compare({
  place,
  state,
  onChange,
  onOpen,
  onChoose,
}: {
  place: Place;
  state: State;
  onChange: (fn: (s: State) => State) => void;
  onOpen: (id: string) => void;
  onChoose: (id: string) => void;
}) {
  const ids = [
    ...new Set([
      place.id,
      ...(state.compareIds || []).filter(
        (id) => places.find((p) => p.id === id)?.kind === place.kind,
      ),
    ]),
  ].slice(0, 3);
  const options = places.filter(
    (p) => p.kind === place.kind && !ids.includes(p.id),
  );
  const rows = ids.map((id) => {
    const p = places.find((x) => x.id === id)!;
    return { p, e: explainPlace(p, state) };
  });
  const best = Math.max(...rows.map((r) => r.e.score));
  return (
    <div className="compare">
      <div
        className="compare-grid"
        style={{
          gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`,
        }}
      >
        {rows.map(({ p, e }) => (
          <div
            className={`compare-col${p.id === place.id ? " is-current" : ""}`}
            key={p.id}
          >
            <div className="compare-name">
              <button className="link-button" onClick={() => onOpen(p.id)}>
                {p.name}
              </button>
              {p.id !== place.id && (
                <IconButton
                  label={`Stop comparing ${p.name}`}
                  size="sm"
                  onClick={() =>
                    onChange((s) => ({
                      ...s,
                      compareIds: (s.compareIds || []).filter(
                        (x) => x !== p.id,
                      ),
                    }))
                  }
                >
                  <X size={16} />
                </IconButton>
              )}
            </div>
            <dl>
              <dt>Fit</dt>
              <dd>
                {e.score}/100
                {e.score === best && rows.length > 1 ? " · best" : ""}
              </dd>
              <dt>Price</dt>
              <dd>{p.price}</dd>
              <dt>Time</dt>
              <dd>{p.duration}</dd>
              <dt>Area</dt>
              <dd>{p.area}</dd>
            </dl>
            <p className="muted-note">{e.summary}</p>
            {p.id !== place.id && (
              <Button size="sm" full onClick={() => onChoose(p.id)}>
                {p.kind === "stay" ? "Choose this stay" : "Use this instead"}
              </Button>
            )}
          </div>
        ))}
      </div>
      {ids.length < 3 && options.length > 0 && (
        <label className="compare-add">
          <span className="sr-only">Add a place to compare</span>
          <Plus size={16} />
          <select
            value=""
            onChange={(e) => {
              const id = e.target.value;
              if (id)
                onChange((s) => ({
                  ...s,
                  compareIds: [...new Set([...ids, id])],
                }));
            }}
          >
            <option value="">Compare with…</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="muted-note">
        Sample prices and times. Hours and availability aren’t checked.
      </p>
    </div>
  );
}
