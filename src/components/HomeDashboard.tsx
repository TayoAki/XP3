import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { cityImage, places, type State } from "../model";
export default function HomeDashboard({
  state,
  action,
  onOpen,
  onRename,
  hasDraft,
}: {
  state: State;
  action: (n: string, id?: string) => void;
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => void;
  hasDraft: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  return (
    <section className="workspace-page">
      <span className="eyebrow">YOUR WORLD, READY WHEN YOU ARE</span>
      <h1>Pick up a possibility.</h1>
      <p>Your plans, ideas and decisions in one place. Saved on this device.</p>
      {hasDraft && (
        <section className="settings-card">
          <h3>Your unfinished trip brief is kept.</h3>
          <button
            className="button primary"
            onClick={() => action("continue-draft")}
          >
            Continue draft
          </button>
        </section>
      )}
      <div className="workspace-toolbar">
        <div className="taste-search">
          <Search size={16} />
          <input
            aria-label="Search your trips"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a trip…"
          />
        </div>
        <button className="button primary" onClick={() => action("new")}>
          Plan something new
        </button>
        <button className="button secondary" onClick={() => action("ideas")}>
          Collect ideas without dates
        </button>
      </div>
      <div className="filter-row">
        {["active", "traveling", "archived"].map((f) => (
          <button
            className={filter === f ? "active" : ""}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="dashboard-grid">
        {state.trips
          .filter(
            (t) =>
              (filter === "archived"
                ? t.status === "archived"
                : filter === "traveling"
                  ? t.status === "traveling"
                  : t.status !== "archived") &&
              t.name.toLowerCase().includes(search.toLowerCase()),
          )
          .map((t) => (
            <article className="dashboard-trip" key={t.id}>
              <img src={cityImage} alt="Illustrative Chicago skyline" />
              <div>
                <span className="eyebrow">{t.status} · device local</span>
                <h3>{t.name}</h3>
                <input
                  aria-label={`Rename ${t.name}`}
                  value={t.name}
                  onChange={(e) => onRename(t.id, e.target.value)}
                />
                <p>
                  {t.brief.start} — {t.brief.end} · {t.days.length} days
                </p>
                <p className="pending-decision">
                  {t.days.some((d) => !d.places.length)
                    ? "Complete unfinished days"
                    : !t.stayId
                      ? "Next decision: choose your stay"
                      : "Stay selected · check booking details"}
                </p>
                <button
                  className="button primary"
                  onClick={() => action("resume", t.id)}
                >
                  Resume conversation <ArrowRight size={15} />
                </button>
                <button
                  className="text-button"
                  onClick={() => action("lifecycle", t.id)}
                >
                  Manage trip
                </button>
              </div>
            </article>
          ))}
      </div>
      {!state.trips.length && (
        <div className="settings-card">
          <h3>Your first trip starts with an idea.</h3>
          <button className="button secondary" onClick={() => action("ideas")}>
            Explore ideas
          </button>
        </div>
      )}
      <section className="settings-card">
        <h3>Ideas still taking shape</h3>
        {state.collections
          ?.filter((c) => !c.archived)
          .map((c) => (
            <button
              className="research-link"
              key={c.id}
              onClick={() => action("ideas")}
            >
              {c.name} · {c.placeIds.length} unscheduled places · dates
              undecided
            </button>
          ))}
      </section>
      <section className="settings-card">
        <h3>Recent research</h3>
        {(state.recentPlaces || []).slice(0, 5).map((id) => (
          <button className="research-link" key={id} onClick={() => onOpen(id)}>
            {places.find((p) => p.id === id)?.name}
          </button>
        ))}
        {!state.recentPlaces?.length && (
          <p>Places you explore will appear here.</p>
        )}
      </section>
    </section>
  );
}
