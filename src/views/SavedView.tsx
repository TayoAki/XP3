import { useState } from "react";
import {
  Archive,
  ArrowRight,
  ArrowUp,
  Bookmark,
  Check,
  CopyPlus,
  FolderInput,
  FolderPlus,
  Lightbulb,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  Route as RouteIcon,
} from "lucide-react";
import { useApp } from "../app/context";
import {
  defaultBrief,
  getPlace,
  places,
  SAVED_ID,
  type Collection,
} from "../model";
import { savedCollection, savedViewCollections } from "../collections";
import { explainPlace, tasteMatch } from "../taste";
import { sharedItineraries, memberById } from "../inspiration";
import { Button, Chip, Menu } from "../ui";
import { ContextSidebar, NavList, PageHeader } from "../shell/Shell";
import { PlaceCard, Photo } from "../components/PlaceCard";
import RouteMap from "../components/RouteMap";
import { parseBrief } from "../briefLogic";

export function SavedView({ onOpenContext }: { onOpenContext: () => void }) {
  const app = useApp();
  const id =
    (app.loc.route.view === "saved" && app.loc.route.collection) || SAVED_ID;
  const collection = savedViewCollections(app.state).find((c) => c.id === id);
  if (!collection || id === SAVED_ID)
    return <SavedDefault onOpenContext={onOpenContext} />;
  return (
    <CollectionDetail collection={collection} onOpenContext={onOpenContext} />
  );
}

/** Creates an empty undated collection and opens it. */
export function newCollection(app: ReturnType<typeof useApp>) {
  const id = crypto.randomUUID();
  app.setState((s) => ({
    ...s,
    collections: [
      ...(s.collections || []),
      { id, name: "New collection", placeIds: [], note: "" },
    ],
  }));
  app.go({ view: "saved", collection: id }, null);
}

function SavedDefault({ onOpenContext }: { onOpenContext: () => void }) {
  const app = useApp();
  const saved = savedCollection(app.state);
  const itineraries = sharedItineraries.filter((t) =>
    saved.itineraryIds?.includes(t.id),
  );
  return (
    <div className="page">
      <PageHeader
        title="Saved"
        subtitle="Places and itineraries you’ve kept. Saving never adds anything to a trip."
        onOpenContext={onOpenContext}
        actions={
          <Button onClick={() => newCollection(app)}>
            <FolderPlus size={18} /> New collection
          </Button>
        }
      />
      <h2 className="section-title">Places · {saved.placeIds.length}</h2>
      {saved.placeIds.length ? (
        <div className="place-grid">
          {saved.placeIds.map((pid) => {
            const p = getPlace(pid);
            return (
              <PlaceCard
                key={pid}
                place={p}
                fit={tasteMatch(p, app.state).score}
                why={explainPlace(p, app.state).summary}
                saved
                onSave={() => app.toggleSave(pid)}
                onOpen={() => app.openPanel({ kind: "place", id: pid })}
              />
            );
          })}
        </div>
      ) : (
        <div className="empty compact">
          <Bookmark size={24} />
          <h3>Nothing saved yet</h3>
          <p>Use the bookmark on any place to keep it here.</p>
          <Button
            variant="primary"
            onClick={() => app.go({ view: "discover", tab: "places" }, null)}
          >
            Browse places
          </Button>
        </div>
      )}
      <h2 className="section-title">Itineraries · {itineraries.length}</h2>
      {itineraries.length ? (
        <ul className="saved-itineraries">
          {itineraries.map((t) => (
            <li key={t.id}>
              <RouteIcon size={18} />
              <button
                onClick={() => app.openPanel({ kind: "itinerary", id: t.id })}
              >
                <strong>{t.name}</strong>
                <small>by {memberById(t.memberId)?.name} · sample</small>
              </button>
              <Button
                size="sm"
                onClick={() => app.openPanel({ kind: "itinerary", id: t.id })}
              >
                View
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty compact">
          <RouteIcon size={24} />
          <h3>No saved itineraries</h3>
          <p>
            Keep member itineraries here before deciding what becomes your own
            trip.
          </p>
          <Button
            onClick={() =>
              app.go({ view: "discover", tab: "itineraries" }, null)
            }
          >
            See member itineraries
          </Button>
        </div>
      )}
    </div>
  );
}

function CollectionDetail({
  collection: c,
  onOpenContext,
}: {
  collection: Collection;
  onOpenContext: () => void;
}) {
  const app = useApp();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(c.name);
  const [picked, setPicked] = useState<string[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const [start, setStart] = useState(defaultBrief.start);
  const [end, setEnd] = useState(defaultBrief.end);
  const [adding, setAdding] = useState(false);
  const others = savedViewCollections(app.state).filter(
    (x) => x.id !== c.id && !x.archived,
  );
  const update = (patch: Partial<Collection>) =>
    app.setState((s) => ({
      ...s,
      collections: s.collections?.map((x) =>
        x.id === c.id ? { ...x, ...patch } : x,
      ),
    }));
  const length =
    Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const valid = start && end && end >= start && length <= 7;

  const moveTo = (pid: string, dest: Collection, copy: boolean) => {
    app.setState((s) => ({
      ...s,
      collections: s.collections?.map((x) =>
        x.id === dest.id
          ? { ...x, placeIds: [...new Set([...x.placeIds, pid])] }
          : x.id === c.id && !copy
            ? { ...x, placeIds: x.placeIds.filter((p) => p !== pid) }
            : x,
      ),
    }));
    app.notify(
      `${getPlace(pid).name} ${copy ? "copied" : "moved"} to ${dest.name}.`,
    );
  };

  return (
    <div className="page">
      <PageHeader
        title={
          renaming ? (
            <form
              className="rename-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) update({ name: name.trim() });
                setRenaming(false);
              }}
            >
              <label className="sr-only" htmlFor="collection-name">
                Collection name
              </label>
              <input
                id="collection-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <Button size="sm" type="submit" variant="primary">
                Save
              </Button>
            </form>
          ) : (
            c.name
          )
        }
        subtitle={`${c.placeIds.length} places · no dates yet${c.archived ? " · archived" : ""}`}
        onOpenContext={onOpenContext}
        actions={
          <Menu
            label="Collection options"
            trigger={<MoreHorizontal size={20} />}
            items={[
              {
                label: "Rename",
                icon: <Pencil size={16} />,
                onSelect: () => setRenaming(true),
              },
              c.archived
                ? {
                    label: "Restore",
                    icon: <Undo2 size={16} />,
                    onSelect: () => update({ archived: false }),
                  }
                : {
                    label: "Archive",
                    icon: <Archive size={16} />,
                    onSelect: () => {
                      update({ archived: true });
                      app.notify("Collection archived.", {
                        label: "Undo",
                        run: () => update({ archived: false }),
                      });
                    },
                  },
            ]}
          />
        }
      />
      {c.placeIds.length > 0 && (
        <RouteMap
          ids={c.placeIds}
          onSelect={(id) => app.openPanel({ kind: "place", id })}
        />
      )}
      <label className="notes-field">
        <span>Notes and things to check</span>
        <textarea
          value={c.note}
          onChange={(e) => update({ note: e.target.value })}
          placeholder="Questions, places to book, things to check…"
          rows={3}
        />
      </label>
      {c.dayGroups && (
        <section className="day-groups">
          <h2 className="section-title">Original day order</h2>
          {c.dayGroups.map((d, i) => (
            <p key={d.id}>
              <strong>Day {i + 1}:</strong>{" "}
              {d.places
                .filter((id) => c.placeIds.includes(id))
                .map((id) => getPlace(id).name)
                .join(" → ") || "—"}
            </p>
          ))}
        </section>
      )}
      <div className="section-row">
        <h2 className="section-title">Places</h2>
        <Button
          size="sm"
          onClick={() => setAdding(!adding)}
          aria-expanded={adding}
        >
          <Plus size={16} /> Add places
        </Button>
      </div>
      {adding && (
        <ul className="add-list">
          {places
            .filter((p) => !c.placeIds.includes(p.id))
            .map((p) => (
              <li key={p.id}>
                <button
                  className="link-button"
                  onClick={() => app.openPanel({ kind: "place", id: p.id })}
                >
                  {p.name}
                </button>
                <span className="muted-note">{p.area}</span>
                <Button
                  size="sm"
                  onClick={() => update({ placeIds: [...c.placeIds, p.id] })}
                >
                  <Plus size={16} /> Add
                </Button>
              </li>
            ))}
        </ul>
      )}
      {c.placeIds.length ? (
        <ul className="idea-list">
          {c.placeIds.map((pid, i) => {
            const p = getPlace(pid);
            const on = picked.includes(pid);
            return (
              <li key={pid} className="idea-row">
                <button
                  className="idea-main"
                  onClick={() => app.openPanel({ kind: "place", id: pid })}
                >
                  <span className="idea-thumb">
                    <Photo place={p} />
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.area} · {p.duration} · {p.price}
                    </small>
                  </span>
                </button>
                <div className="idea-actions">
                  <Chip
                    pressed={on}
                    onClick={() =>
                      setPicked(
                        on ? picked.filter((x) => x !== pid) : [...picked, pid],
                      )
                    }
                    aria-label={`${on ? "Unselect" : "Select"} ${p.name} for scheduling`}
                  >
                    {on && <Check size={14} />} {on ? "Selected" : "Select"}
                  </Chip>
                  <Menu
                    label={`More for ${p.name}`}
                    trigger={<MoreHorizontal size={18} />}
                    items={[
                      {
                        label: "Move up",
                        icon: <ArrowUp size={16} />,
                        disabled: i === 0,
                        onSelect: () => {
                          const ids = [...c.placeIds];
                          [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
                          update({ placeIds: ids });
                        },
                      },
                      ...others.map((o) => ({
                        label: `Move to ${o.name}`,
                        icon: <FolderInput size={16} />,
                        onSelect: () => moveTo(pid, o, false),
                      })),
                      ...others.map((o) => ({
                        label: `Copy to ${o.name}`,
                        icon: <CopyPlus size={16} />,
                        onSelect: () => moveTo(pid, o, true),
                      })),
                      {
                        label: "Remove from collection",
                        icon: <Trash2 size={16} />,
                        danger: true,
                        onSelect: () => {
                          update({
                            placeIds: c.placeIds.filter((x) => x !== pid),
                          });
                          setPicked(picked.filter((x) => x !== pid));
                          app.notify(`${p.name} removed.`, {
                            label: "Undo",
                            run: () => update({ placeIds: c.placeIds }),
                          });
                        },
                      },
                    ]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty compact">
          <Lightbulb size={24} />
          <h3>An empty collection</h3>
          <p>Add places here, or browse Discover. No dates needed.</p>
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add places
          </Button>
        </div>
      )}
      {!c.archived && c.placeIds.length > 0 && (
        <section className="schedule" aria-labelledby="schedule-title">
          <h2 id="schedule-title" className="section-title">
            Turn ideas into a trip
          </h2>
          {!scheduling ? (
            <div className="schedule-row">
              <p className="muted-note">
                {picked.length
                  ? `${picked.length} selected. Choose dates to schedule them once; the rest stay here.`
                  : "Select the places you want to schedule."}
              </p>
              <Button
                variant="primary"
                disabled={!picked.length}
                onClick={() => setScheduling(true)}
              >
                Choose dates <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            <div className="schedule-form">
              <div className="brief-inputs">
                <label>
                  Start
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </label>
                <label>
                  End
                  <input
                    type="date"
                    min={start}
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </label>
              </div>
              {valid ? (
                <ul className="schedule-preview">
                  {picked.map((pid, i) => (
                    <li key={pid}>
                      {getPlace(pid).kind === "stay"
                        ? "Your base"
                        : `Day ${(i % length) + 1}`}{" "}
                      · {getPlace(pid).name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="form-error" role="alert">
                  Choose one to seven days.
                </p>
              )}
              <div className="card-actions">
                <Button onClick={() => setScheduling(false)}>
                  Keep collecting
                </Button>
                <Button
                  variant="primary"
                  disabled={!valid}
                  onClick={() => {
                    const brief = parseBrief(`Plan ${c.name} in Chicago`, {
                      interests: app.state.interests,
                      pace: app.state.pace,
                    });
                    app.setBrief({
                      ...brief,
                      start,
                      end,
                      ideaIds: picked,
                      collectionId: c.id,
                      status: {
                        ...brief.status,
                        when: "confirmed",
                        where: "confirmed",
                      },
                    });
                    app.go({ view: "trip", id: "new", tab: "itinerary" }, null);
                  }}
                >
                  Review the trip brief
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export function SavedSidebar() {
  const app = useApp();
  const current =
    (app.loc.route.view === "saved" && app.loc.route.collection) || SAVED_ID;
  const all = savedViewCollections(app.state);
  const active = all.filter((c) => !c.archived);
  const archived = all.filter((c) => c.archived);
  const item = (c: Collection) => ({
    id: c.id,
    label: c.id === SAVED_ID ? "Saved places & itineraries" : c.name,
    meta:
      c.id === SAVED_ID
        ? `${c.placeIds.length} places · ${c.itineraryIds?.length || 0} itineraries`
        : `${c.placeIds.length} places · undated`,
    icon: c.id === SAVED_ID ? <Bookmark size={18} /> : <Lightbulb size={18} />,
    active: current === c.id,
    onSelect: () =>
      app.go(
        c.id === SAVED_ID
          ? { view: "saved" }
          : { view: "saved", collection: c.id },
        null,
      ),
  });
  return (
    <ContextSidebar
      title="Collections"
      action={
        <Button onClick={() => newCollection(app)}>
          New collection <FolderPlus size={18} />
        </Button>
      }
    >
      <NavList label="Collections" items={active.map(item)} />
      {archived.length > 0 && (
        <>
          <h3>Archived</h3>
          <NavList label="Archived collections" items={archived.map(item)} />
        </>
      )}
    </ContextSidebar>
  );
}
