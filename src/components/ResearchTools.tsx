import ComparisonTray from "./ComparisonTray";
import RecommendationExplanation, {
  AlternativeDecision,
} from "./RecommendationExplanation";
import { tasteMatch } from "../taste";
import { useState } from "react";
import { places, type Place, type State } from "../model";
export default function ResearchTools({
  place,
  state,
  onChange,
  onOpen,
  onChoose,
  researchScope,
}: {
  place: Place;
  state: State;
  onChange: (s: State) => void;
  onOpen: (id: string) => void;
  onChoose: (id: string) => void;
  researchScope: string;
}) {
  const workspaceKey = researchScope + ":" + place.id;
  const [other, setOther] = useState(
    places.find((p) => p.kind === place.kind && p.id !== place.id)?.id || "",
  );
  const comparison = places.find((p) => p.id === other);
  const activeTrip = state.trips.find((t) => t.id === state.activeId);
  const inheritedNotes = researchScope.startsWith("trip-")
    ? (state.workspaceNotes?.[
        "collection-" + activeTrip?.brief.collectionId + ":" + place.id
      ] ?? state.workspaceNotes?.[(state.activeId || "ideas") + ":" + place.id])
    : undefined;
  return (
    <section className="research-tools">
      <RecommendationExplanation
        place={place}
        state={state}
        onChange={onChange}
      />
      <button
        className="button secondary full"
        aria-pressed={state.lessLike?.includes(place.id) || false}
        onClick={() =>
          onChange({
            ...state,
            lessLike: state.lessLike?.includes(place.id)
              ? state.lessLike.filter((i) => i !== place.id)
              : [...(state.lessLike || []), place.id],
          })
        }
      >
        {state.lessLike?.includes(place.id)
          ? "Hidden from Discover · undo"
          : "Less like this"}
      </button>
      <label className="field-label">
        Your research notes
        <textarea
          value={
            state.workspaceNotes?.[workspaceKey] ??
            inheritedNotes ??
            state.researchNotes?.[place.id] ??
            ""
          }
          onChange={(e) =>
            onChange({
              ...state,
              workspaceNotes: {
                ...state.workspaceNotes,
                [workspaceKey]: e.target.value,
              },
            })
          }
          placeholder="What matters? What needs checking?"
        />
      </label>
      <small>Private notes · saved on this device</small>
      <ComparisonTray
        place={place}
        state={state}
        onChange={onChange}
        onOpen={onOpen}
        onChoose={onChoose}
      />
      <h3>Quick comparison</h3>
      <select
        aria-label="Compare with"
        value={other}
        onChange={(e) => setOther(e.target.value)}
      >
        <option value="">Choose a place</option>
        {places
          .filter((p) => p.kind === place.kind && p.id !== place.id)
          .map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
      </select>
      {comparison && (
        <>
          <AlternativeDecision
            place={place}
            alternative={comparison}
            state={state}
          />
          <table className="compare-table">
            <thead>
              <tr>
                <th>Compare</th>
                <th>{place.name}</th>
                <th>{comparison.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Price</th>
                <td>{place.price}</td>
                <td>{comparison.price}</td>
              </tr>
              <tr>
                <th>Area</th>
                <td>{place.area}</td>
                <td>{comparison.area}</td>
              </tr>
              <tr>
                <th>Rating*</th>
                <td>{place.rating}</td>
                <td>{comparison.rating}</td>
              </tr>
              <tr>
                <th>Time</th>
                <td>{place.duration}</td>
                <td>{comparison.duration}</td>
              </tr>
            </tbody>
          </table>
          <button
            className="button secondary full"
            onClick={() =>
              onChange({
                ...state,
                saved: [...new Set([...state.saved, comparison.id])],
              })
            }
          >
            {state.saved.includes(comparison.id)
              ? "Alternative pinned"
              : "Pin alternative"}
          </button>
          <button
            className="research-link"
            onClick={() => onOpen(comparison.id)}
          >
            Research {comparison.name}
          </button>
          <small>*Sample ratings; prices require verification.</small>
        </>
      )}
    </section>
  );
}
