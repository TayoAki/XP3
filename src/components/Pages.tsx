import Inspiration from "./Inspiration";
import TasteStudio from "./TasteStudio";
import { rankedTaste } from "../taste";
import { useState } from "react";
import {
  ArrowRight,
  Plus,
  Search,
  Bookmark,
  Sparkles,
  Check,
  Star,
  MapPin,
  CalendarDays,
  ArrowUpRight,
  Bell,
  Settings,
  ShieldCheck,
  Download,
  Trash2,
  Flag,
  Heart,
  ThumbsUp,
  Pencil,
  LockKeyhole,
  Compass,
} from "lucide-react";
import {
  places,
  cityImage,
  dateLabel,
  getPlace,
  type State,
  type Page,
} from "../model";
import { PlaceCard } from "./PlaceCard";
import type { Action } from "./Planner";
export default function Pages({
  page,
  state,
  onChange,
  onOpen,
  onSave,
  action,
}: {
  page: Page;
  state: State;
  onChange: (next: State) => void;
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
  action: Action;
}) {
  const [savedView, setSavedView] = useState("Places");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All places");
  const filters = ["All places", "Food & drink", "Experiences", "Stays"];
  const matching = (
    page === "discover"
      ? rankedTaste(state)
      : rankedTaste({ ...state, lessLike: [] })
  ).filter(
    (p) =>
      (page !== "discover" || !state.lessLike?.includes(p.id)) &&
      (filter === "All places" ||
        (filter === "Food & drink"
          ? p.kind === "food"
          : filter === "Stays"
            ? p.kind === "stay"
            : p.kind === "experience")) &&
      `${p.name} ${p.area} ${p.tags.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const titles: Record<Page, [string, string]> = {
    connected: ["Account trips", ""],
    messages: ["Messages", ""],
    home: ["Home", ""],
    ideas: ["Ideas", ""],
    plan: ["", ""],
    trips: ["Your next chapter.", "Every trip, all in one place."],
    discover: [
      "Find your kind of place.",
      "A few good discoveries, chosen around the things you love.",
    ],
    saved: ["Good finds, kept close.", "The places you want to come back to."],
    taste: [
      "A little more you.",
      "Teach us your taste. Get better matches, one discovery at a time.",
    ],
    community: [
      "Good taste travels.",
      "Real experiences, thoughtful reviews, and people who get your kind of travel.",
    ],
    settings: [
      "Make yourself at home.",
      "Your account, preferences, and privacy.",
    ],
    notifications: [
      "Stay in the loop.",
      "The little updates that keep your plans moving.",
    ],
    moderation: [
      "Keep the community helpful.",
      "Preview the reported-review moderation journey.",
    ],
  };
  return (
    <section className="secondary-page">
      <header className="page-header">
        <span className="eyebrow">
          {page === "taste" ? "YOUR TASTE PROFILE" : page.toUpperCase()}
        </span>
        <h1>{titles[page][0]}</h1>
        <p>{titles[page][1]}</p>
      </header>
      {page === "trips" && (
        <>
          <div className="section-line">
            <h3>
              {state.trips.length} {state.trips.length === 1 ? "trip" : "trips"}
            </h3>
            <button className="button primary" onClick={() => action("new")}>
              <Plus size={16} /> New trip
            </button>
          </div>
          {!state.trips.length ? (
            <div className="empty-state">
              <Compass size={32} />
              <h2>There’s a whole trip ahead of you.</h2>
              <p>Start with a sentence. We’ll help with the rest.</p>
              <button className="button primary" onClick={() => action("new")}>
                Plan your first trip <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="trip-grid">
              {state.trips.map((t) => (
                <article className="trip-list-card" key={t.id}>
                  <button
                    className="trip-cover"
                    onClick={() => action("resume", t.id)}
                  >
                    <img src={cityImage} alt="Chicago skyline" />
                    <span className="status-chip">{t.status}</span>
                  </button>
                  <div>
                    <span className="eyebrow">CHICAGO, USA</span>
                    <h3>{t.name}</h3>
                    <p>
                      <CalendarDays size={14} />
                      {dateLabel(t.brief.start)}–{dateLabel(t.brief.end)} ·{" "}
                      {t.brief.travelers} travelers
                    </p>
                    <div className="section-line">
                      <button
                        className="text-button"
                        onClick={() => action("resume", t.id)}
                      >
                        Continue planning <ArrowRight size={15} />
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => action("lifecycle", t.id)}
                        aria-label={`Manage ${t.name}`}
                      >
                        <Settings size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {page === "saved" && (
        <div className="filter-row" aria-label="Saved content">
          {["Places", "Itineraries"].map((v) => (
            <button
              className="button"
              aria-pressed={savedView === v}
              key={v}
              onClick={() => setSavedView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      {(page === "discover" ||
        page === "community" ||
        (page === "saved" && savedView === "Itineraries")) && (
        <Inspiration
          state={state}
          onChange={onChange}
          action={action}
          savedOnly={page === "saved"}
        />
      )}
      {(page === "discover" ||
        (page === "saved" && savedView === "Places")) && (
        <>
          <div className="search-bar">
            <Search size={18} />
            <label className="sr-only" htmlFor="place-search">
              Search places
            </label>
            <input
              id="place-search"
              placeholder="A place, a neighborhood, a mood…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-row">
            {filters.map((f) => (
              <button
                className={filter === f ? "active" : ""}
                key={f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          {page === "saved" && (
            <div className="saved-list-label">
              <Bookmark size={16} /> Your Chicago collection{" "}
              <span>{state.saved.length} places</span>
              <button
                className="text-button"
                onClick={() => action("saved-list")}
              >
                Organize collection <ArrowRight size={14} />
              </button>
            </div>
          )}
          <div className="discovery-grid">
            {matching
              .filter((p) => page !== "saved" || state.saved.includes(p.id))
              .map((p) => (
                <PlaceCard
                  key={p.id}
                  place={p}
                  saved={state.saved.includes(p.id)}
                  onSave={() => onSave(p.id)}
                  onOpen={() => onOpen(p.id)}
                />
              ))}
          </div>
          {!matching.filter(
            (p) => page !== "saved" || state.saved.includes(p.id),
          ).length && (
            <div className="empty-state">
              <Bookmark size={30} />
              <h2>
                {search
                  ? "No places found."
                  : "Your next favorite is out there."}
              </h2>
              <p>
                {search
                  ? "Try another name or clear your filters."
                  : "Save a place from chat, the map, or Discover."}
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  setSearch("");
                  setFilter("All places");
                  action("discover");
                }}
              >
                Explore places
              </button>
            </div>
          )}
        </>
      )}
      {page === "taste" && (
        <TasteStudio
          state={state}
          onChange={onChange}
          onOpen={onOpen}
          onReview={(id) => action("review", id)}
        />
      )}
      {page === "community" && (
        <>
          <div className="community-banner">
            <div>
              <span className="eyebrow">PEOPLE, NOT JUST STARS</span>
              <h2>
                Find people who
                <br />
                love what you love.
              </h2>
              <p>
                Give a great find a little context. Help someone else find
                theirs.
              </p>
            </div>
            <button className="button primary" onClick={() => action("review")}>
              <Plus size={16} /> Write a review
            </button>
          </div>
          <div className="community-grid">
            <article className="community-card">
              <button
                className="review-author"
                onClick={() => action("profile")}
              >
                <span className="avatar rose">ML</span>
                <span>
                  <strong>Maya L.</strong>
                  <small>Chicago · similar taste</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
              <button
                className="community-place"
                onClick={() => onOpen("gage")}
              >
                <img
                  src={getPlace("gage").image}
                  alt="Illustrative restaurant interior"
                />
                <span>
                  <h3>The Gage</h3>
                  <p>
                    <Star size={13} /> 5.0 · A relaxed lunch worth making time
                    for
                  </p>
                </span>
              </button>
              <p>
                Good food, a warm dining room, and a perfect spot to pause
                between the park and the museum. Our favorite unplanned hour of
                the weekend.
              </p>
              <div className="tags">
                <span>Local food</span>
                <span>Cozy</span>
                <span>Easy pace</span>
              </div>
              <div className="review-actions">
                <button onClick={() => action("helpful")}>
                  <ThumbsUp size={15} /> Helpful
                </button>
                <button onClick={() => action("report")}>
                  <Flag size={14} /> Report
                </button>
              </div>
              <span className="fine-print">Illustrative community review</span>
            </article>
            {state.reviews
              .filter((r) => r.public)
              .map((r) => (
                <article className="community-card" key={r.id}>
                  <span className="eyebrow">YOUR DEMO REVIEW</span>
                  <button
                    className="text-button"
                    onClick={() => onOpen(r.placeId)}
                  >
                    {getPlace(r.placeId).name}
                    <ArrowUpRight size={15} />
                  </button>
                  <div className="stars">{"★".repeat(r.rating)}</div>
                  <p>{r.text}</p>
                  <div className="review-actions">
                    <button onClick={() => action("edit-review", r.id)}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => action("delete-review", r.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </>
      )}
      {page === "settings" && (
        <section className="settings-card">
          <label className="field-label">
            Start screen
            <select
              value={state.startScreen || "plan"}
              onChange={(e) =>
                onChange({
                  ...state,
                  startScreen: e.target.value as State["startScreen"],
                })
              }
            >
              <option value="plan">Start planning</option>
              <option value="home">Home dashboard</option>
              <option value="resume">Last workspace</option>
            </select>
          </label>
          <h3>Preview tools</h3>
          <p>Test failure and recovery states without contacting a service.</p>
          <button
            className="button secondary"
            onClick={() => action("connection")}
          >
            Open preview testing tools
          </button>
        </section>
      )}
      {page === "settings" && (
        <div className="settings-grid">
          <section className="settings-card">
            <h3>Your account</h3>
            <div className="setting-row">
              <span>
                <strong>
                  {state.demoMember ? "Demo member" : "Exploring as a guest"}
                </strong>
                <small>Save and personalize your experience.</small>
              </span>
              <button
                className="button secondary"
                onClick={() => action("account")}
              >
                {state.demoMember ? "Manage" : "Sign in"}
              </button>
            </div>
            <h3>Notifications</h3>
            <div className="setting-row">
              <span>
                <strong>Trip updates</strong>
                <small>Changes, reminders, and useful next steps.</small>
              </span>
              <button
                className="button secondary"
                onClick={() => action("notification-settings")}
              >
                <Bell size={16} /> Manage
              </button>
            </div>
            <h3>Preview connection</h3>
            <div className="setting-row">
              <span>
                <strong>Offline journey</strong>
                <small>Explore the offline/reconnect UI with local data.</small>
              </span>
              <button
                className="switch"
                role="switch"
                aria-checked={state.offline}
                aria-label="Simulate offline mode"
                onClick={() => onChange({ ...state, offline: !state.offline })}
              >
                <span />
              </button>
            </div>
          </section>
          <section className="settings-card">
            <h3>
              <ShieldCheck size={18} /> Your data stays yours.
            </h3>
            <p>
              Your preferences and demo trips are stored in this browser. You
              decide what to share.
            </p>
            <button
              className="settings-action"
              onClick={() => action("data-export")}
            >
              <Download size={17} />
              <span>Export prototype data</span>
              <ArrowUpRight size={16} />
            </button>
            <button
              className="settings-action"
              onClick={() => action("privacy")}
            >
              <LockKeyhole size={17} />
              <span>Privacy controls</span>
              <ArrowRight size={16} />
            </button>
            <button className="settings-action" onClick={() => action("reset")}>
              <Trash2 size={17} />
              <span>Reset local demo data</span>
              <ArrowRight size={16} />
            </button>
            <button
              className="settings-action"
              onClick={() => action("moderation")}
            >
              <Flag size={17} />
              <span>Moderation preview</span>
              <ArrowRight size={16} />
            </button>
            <button
              className="settings-action"
              onClick={() => action("recovery")}
            >
              <Heart size={17} />
              <span>Lost-access recovery preview</span>
              <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
      {page === "notifications" && (
        <section className="settings-card">
          <div className="section-line">
            <h3>Your updates</h3>
            <button
              className="text-button"
              onClick={() => onChange({ ...state, notifications: [] })}
            >
              Mark all read <Check size={15} />
            </button>
          </div>
          {state.notifications.length ? (
            state.notifications.map((n, i) => (
              <div className="notification-row" key={`${n}-${i}`}>
                <span className="assistant-icon">
                  <Bell size={17} />
                </span>
                <div>
                  <strong>{n}</strong>
                  <small>Just now · demo update</small>
                </div>
                <button
                  className="icon-button"
                  onClick={() =>
                    onChange({
                      ...state,
                      notifications: state.notifications.filter(
                        (_, j) => i !== j,
                      ),
                    })
                  }
                  aria-label="Mark update read"
                >
                  <Check size={17} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Check size={28} />
              <h2>You’re all caught up.</h2>
              <p>New trip updates will appear here.</p>
            </div>
          )}
        </section>
      )}
      {page === "moderation" && (
        <section className="settings-card">
          <span className="mini-label">SIMULATED MODERATOR VIEW</span>
          <h3>Reported reviews</h3>
          <p>
            This is a frontend moderation preview, not an authorized admin
            account.
          </p>
          {state.reviews
            .filter((r) => r.reported)
            .map((r) => (
              <div className="report-row" key={r.id}>
                <h4>{getPlace(r.placeId).name}</h4>
                <p>{r.text}</p>
                <div className="dialog-actions">
                  <button
                    className="button secondary"
                    onClick={() => action("dismiss-report", r.id)}
                  >
                    Keep review
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => action("remove-report", r.id)}
                  >
                    Remove from demo
                  </button>
                </div>
              </div>
            ))}
          <div className="report-row">
            <span className="eyebrow">SAMPLE REPORT · REVIEW RELEVANCE</span>
            <h4>The Gage</h4>
            <p>
              A sample report is available to walk through the moderation flow.
            </p>
            <button
              className="button secondary"
              onClick={() => action("moderate-sample")}
            >
              Review report <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
