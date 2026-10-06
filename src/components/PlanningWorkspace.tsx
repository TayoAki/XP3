import { useState } from "react";
import {
  Plus,
  ArrowRight,
  Bookmark,
  Check,
  Archive,
  ChevronUp,
} from "lucide-react";
import {
  places,
  defaultBrief,
  type State,
  type Brief,
  type Collection,
} from "../model";
import RouteMap from "./RouteMap";
export default function PlanningWorkspace({
  state,
  onChange,
  onOpen,
  onPlan,
}: {
  state: State;
  onChange: (s: State) => void;
  onOpen: (id: string) => void;
  onPlan: (b: Brief) => void;
}) {
  const collections = state.collections || [];
  const [active, setActive] = useState(
    state.activeCollectionId || collections.find((c) => !c.archived)?.id || "",
  );
  const [name, setName] = useState("");
  const [archived, setArchived] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const c = collections.find((c) => c.id === active);
  const update = (patch: Partial<Collection>) =>
    onChange({
      ...state,
      collections: collections.map((x) =>
        x.id === active ? { ...x, ...patch } : x,
      ),
    });
  const valid =
    start &&
    end &&
    end >= start &&
    (Date.parse(end) - Date.parse(start)) / 86400000 <= 6;
  return (
    <section className="workspace-page">
      <span className="eyebrow">IDEAS BEFORE DATES</span>
      <h1>Let the trip take shape.</h1>
      <p>Collect, research and organize. Choose dates when you’re ready.</p>
      <div className="workspace-toolbar">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const id = crypto.randomUUID();
            onChange({
              ...state,
              activeCollectionId: id,
              collections: [
                ...collections,
                {
                  id,
                  name: name.trim(),
                  placeIds: [],
                  note: "",
                  archived: false,
                },
              ],
            });
            setActive(id);
            setName("");
          }}
        >
          <input
            aria-label="New collection name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Food ideas, a future weekend…"
          />
          <button className="button secondary">
            <Plus size={15} />
            Create collection
          </button>
        </form>
        <button
          className="text-button"
          onClick={() => {
            setArchived(!archived);
            const nextId =
              collections.find((c) => !!c.archived === !archived)?.id || "";
            setActive(nextId);
            onChange({ ...state, activeCollectionId: nextId });
            setPicked([]);
            setPreview(false);
          }}
        >
          {archived ? "Show active" : "View archived"}
        </button>
      </div>
      <div className="collection-tabs">
        {collections
          .filter((c) => !!c.archived === archived)
          .map((c) => (
            <button
              key={c.id}
              className={active === c.id ? "active" : ""}
              onClick={() => {
                setActive(c.id);
                onChange({ ...state, activeCollectionId: c.id });
                setPicked([]);
                setPreview(false);
              }}
            >
              {c.name} · {c.placeIds.length}
            </button>
          ))}
      </div>
      {c ? (
        <>
          <RouteMap ids={c.placeIds} onSelect={onOpen} />
          <div className="workspace-columns">
            <div className="settings-card">
              <label className="field-label">
                Collection name
                <input
                  value={c.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </label>
              <label className="field-label">
                Research notes & checklist
                <textarea
                  value={c.note}
                  onChange={(e) => update({ note: e.target.value })}
                  placeholder="Questions to research, places to book, things to check…"
                />
              </label>
              <div className="section-line">
                <h3>Unscheduled ideas</h3>
                <button
                  className="text-button"
                  onClick={() => update({ archived: !c.archived })}
                >
                  <Archive size={14} />
                  {c.archived ? "Restore" : "Archive collection"}
                </button>
              </div>
              {c.dayGroups && (
                <section className="undated-days">
                  <h3>Undated days · original activity order</h3>
                  {c.dayGroups.map((d, i) => (
                    <div key={d.id}>
                      <strong>
                        Day {i + 1} · {d.title}
                      </strong>
                      {d.places
                        .filter((id) => c.placeIds.includes(id))
                        .map((id, j) => (
                          <button
                            className="research-link"
                            key={j}
                            onClick={() => onOpen(id)}
                          >
                            {places.find((p) => p.id === id)?.name}
                          </button>
                        ))}
                    </div>
                  ))}
                </section>
              )}
              {c.placeIds.length ? (
                c.placeIds.map((id, i) => {
                  const p = places.find((p) => p.id === id);
                  if (!p) return null;
                  return (
                    <article className="workspace-idea" key={id}>
                      <button
                        aria-label={`Select ${p.name} for scheduling`}
                        aria-pressed={picked.includes(id)}
                        onClick={() =>
                          setPicked(
                            picked.includes(id)
                              ? picked.filter((x) => x !== id)
                              : [...picked, id],
                          )
                        }
                      >
                        {picked.includes(id) ? (
                          <Check size={18} />
                        ) : (
                          <Bookmark size={18} />
                        )}
                      </button>
                      <button onClick={() => onOpen(id)}>
                        <strong>{p.name}</strong>
                        <small>
                          {p.area} · {p.duration} · {p.price}
                        </small>
                      </button>
                      <button
                        aria-label={`Move ${p.name} earlier in collection`}
                        disabled={!i}
                        onClick={() => {
                          const ids = [...c.placeIds];
                          [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
                          update({ placeIds: ids });
                        }}
                      >
                        <ChevronUp size={15} />
                      </button>
                      <select
                        aria-label={`Move ${p.name} to collection`}
                        value=""
                        onChange={(e) => {
                          const dest = e.target.value;
                          if (!dest) return;
                          onChange({
                            ...state,
                            workspaceNotes: {
                              ...state.workspaceNotes,
                              [`collection-${dest}:${id}`]:
                                state.workspaceNotes?.[
                                  `collection-${dest}:${id}`
                                ] ??
                                state.workspaceNotes?.[
                                  `collection-${active}:${id}`
                                ] ??
                                state.researchNotes?.[id] ??
                                "",
                            },
                            collections: collections.map((x) =>
                              x.id === active
                                ? {
                                    ...x,
                                    placeIds: x.placeIds.filter(
                                      (p) => p !== id,
                                    ),
                                  }
                                : x.id === dest
                                  ? {
                                      ...x,
                                      placeIds: [
                                        ...new Set([...x.placeIds, id]),
                                      ],
                                    }
                                  : x,
                            ),
                          });
                          setPicked(picked.filter((x) => x !== id));
                        }}
                      >
                        <option value="">Move to…</option>
                        {collections
                          .filter((x) => x.id !== active && !x.archived)
                          .map((x) => (
                            <option value={x.id} key={x.id}>
                              {x.name}
                            </option>
                          ))}
                      </select>
                      <select
                        aria-label={`Copy ${p.name} to collection`}
                        value=""
                        onChange={(e) => {
                          const dest = e.target.value;
                          if (dest)
                            onChange({
                              ...state,
                              workspaceNotes: {
                                ...state.workspaceNotes,
                                [`collection-${dest}:${id}`]:
                                  state.workspaceNotes?.[
                                    `collection-${dest}:${id}`
                                  ] ??
                                  state.workspaceNotes?.[
                                    `collection-${active}:${id}`
                                  ] ??
                                  state.researchNotes?.[id] ??
                                  "",
                              },
                              collections: collections.map((x) =>
                                x.id === dest
                                  ? {
                                      ...x,
                                      placeIds: [
                                        ...new Set([...x.placeIds, id]),
                                      ],
                                    }
                                  : x,
                              ),
                            });
                        }}
                      >
                        <option value="">Copy to…</option>
                        {collections
                          .filter((x) => x.id !== active && !x.archived)
                          .map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                            </option>
                          ))}
                      </select>
                    </article>
                  );
                })
              ) : (
                <p className="empty-inline">
                  Start with one place from the list beside you. It will appear
                  here and on the map.
                </p>
              )}
              <button
                className="button primary"
                disabled={!picked.length || c.archived}
                onClick={() => setPreview(true)}
              >
                Schedule {picked.length || ""} selected ideas{" "}
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="settings-card">
              <h3>Find your next idea</h3>
              {places.map((p) => (
                <div className="idea-add-row" key={p.id}>
                  <button onClick={() => onOpen(p.id)}>{p.name}</button>
                  <button
                    aria-label={`Add ${p.name} to collection`}
                    disabled={c.placeIds.includes(p.id) || c.archived}
                    onClick={() => update({ placeIds: [...c.placeIds, p.id] })}
                  >
                    {c.placeIds.includes(p.id) ? (
                      <Check size={15} />
                    ) : (
                      <Plus size={15} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
          {preview && (
            <section className="settings-card conversion-preview">
              <h3>Review your move into a dated trip</h3>
              <p>
                {picked.length} selected ideas will be scheduled once. Other
                ideas and your collection notes stay here.
              </p>
              <div className="brief-grid">
                <label>
                  Start date
                  <input
                    type="date"
                    value={start}
                    onInput={(e) => setStart(e.currentTarget.value)}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </label>
                <label>
                  End date
                  <input
                    type="date"
                    value={end}
                    min={start}
                    onInput={(e) => setEnd(e.currentTarget.value)}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </label>
              </div>
              {valid &&
                picked.map((id, i) => (
                  <p key={id}>
                    {places.find((p) => p.id === id)?.kind === "stay"
                      ? "Proposed stay"
                      : `Day ${(i % (Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1)) + 1}`}{" "}
                    · {places.find((p) => p.id === id)?.name}
                  </p>
                ))}
              <div className="dialog-actions">
                <button
                  className="button secondary"
                  onClick={() => setPreview(false)}
                >
                  Keep collecting
                </button>
                <button
                  className="button primary"
                  disabled={!valid}
                  onClick={() =>
                    onPlan({
                      ...defaultBrief,
                      start,
                      end,
                      interests: state.interests,
                      pace: state.pace,
                      prompt: `Plan ${c.name}`,
                      ideaIds: picked,
                      collectionId: c.id,
                    })
                  }
                >
                  Review trip brief
                </button>
              </div>
              <p className="fine-print">
                One to seven days. Scheduling is illustrative; collection
                conversion can be undone from the new trip.
              </p>
            </section>
          )}
        </>
      ) : (
        <div className="settings-card">
          <h3>Your ideas have room to grow.</h3>
          <p>Create a collection above. No dates or account required.</p>
        </div>
      )}
    </section>
  );
}
