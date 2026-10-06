import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  ArrowUp,
  ArrowRight,
  Plus,
  Map,
  BedDouble,
  CalendarDays,
  Users,
  ChevronDown,
  History,
  Share2,
  Check,
  ArrowUpRight,
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CloudRain,
  Coffee,
  Navigation,
  SlidersHorizontal,
  ShieldCheck,
  Compass,
} from "lucide-react";
import {
  cityImage,
  getPlace,
  places,
  samplePrompt,
  dateLabel,
  checkTrip,
  type State,
  type Trip,
  type Brief,
} from "../model";
import { PlaceCard } from "./PlaceCard";
import BriefForm from "./BriefForm";
import RouteMap from "./RouteMap";
import { JourneyBar } from "./JourneyHub";
import { tasteMatch, explainPlace } from "../taste";
import WorkspaceGuide from "./WorkspaceGuide";
export type Action = (name: string, id?: string) => void;
export default function Planner({
  trip,
  tasteState,
  scope,
  hasProposal,
  onDraft,
  brief,
  busy,
  saved,
  onSubmit,
  onBrief,
  onGenerate,
  onOpen,
  onSave,
  action,
  savedLocally,
  guideDismissed,
  tasteSetupDone,
  onDismissGuide,
}: {
  savedLocally: boolean;
  guideDismissed: boolean;
  tasteSetupDone: boolean;
  onDismissGuide: () => void;
  onDraft: (text: string) => void;
  scope: string | null;
  hasProposal: boolean;
  tasteState: State;
  trip: Trip | undefined;
  brief: Brief | null;
  busy: boolean;
  saved: string[];
  onSubmit: (text: string) => boolean | void;
  onBrief: (brief: Brief) => void;
  onGenerate: () => void;
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
  action: Action;
}) {
  const draftKey = "xpmatch-chat-" + (trip?.id || "new");
  const [input, setInput] = useState(() => {
    try {
      return (
        tasteState.chatDrafts?.[trip?.id || "new"] ??
        localStorage.getItem(draftKey) ??
        ""
      );
    } catch {
      return "";
    }
  });
  useEffect(() => {
    onDraft(input);
    try {
      localStorage.setItem(draftKey, input);
    } catch {}
  }, [input, draftKey]);
  const viewKey = "xpmatch-view-" + (trip?.id || "new");
  const [day, setDay] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(viewKey) || "{}").day || "all";
    } catch {
      return "all";
    }
  });
  useEffect(() => {
    try {
      const prior = JSON.parse(localStorage.getItem(viewKey) || "{}");
      localStorage.setItem(viewKey, JSON.stringify({ ...prior, day }));
    } catch {}
  }, [day, viewKey]);
  const [menu, setMenu] = useState<string | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const previousMessages = useRef(trip?.messages.length || 0);
  useEffect(() => {
    if (scroll.current) {
      if ((trip?.messages.length || 0) > previousMessages.current)
        scroll.current.scrollTop = scroll.current.scrollHeight;
      else {
        try {
          scroll.current.scrollTop =
            JSON.parse(localStorage.getItem(viewKey) || "{}").scroll || 0;
        } catch {}
      }
    }
    previousMessages.current = trip?.messages.length || 0;
  }, [trip?.messages.length]);
  useEffect(() => {
    if (trip && !trip.days.some((d) => d.id === day) && day !== "all")
      setDay("all");
  }, [trip, day]);
  function send() {
    if (!input.trim() || busy) return;
    if (onSubmit(input.trim()) !== false) setInput("");
  }
  const issues = trip ? checkTrip(trip) : [];
  const allIds = trip?.days.flatMap((d) => d.places) || [];
  return (
    <section className="planner">
      <JourneyBar onAction={action} />
      {scope && (
        <div className="scope-banner">
          Editing {trip?.days.find((d) => d.id === scope.split(":")[0])?.title}{" "}
          ·{" "}
          {trip?.days.find((d) => d.id === scope.split(":")[0])?.places[
            Number(scope.split(":")[1])
          ] &&
            getPlace(
              trip.days.find((d) => d.id === scope.split(":")[0])!.places[
                Number(scope.split(":")[1])
              ],
            ).name}
          <button onClick={() => action("clear-scope")}>Clear scope</button>
        </div>
      )}
      {hasProposal && (
        <button
          className="proposal-reminder"
          onClick={() => action("review-proposal")}
        >
          Review pending changes
        </button>
      )}
      <header className="workspace-header">
        <div>
          <span className="eyebrow">YOUR TRAVEL ASSISTANT</span>
          <h1>
            {trip ? "Your Chicago escape" : "A trip that feels like you."}
          </h1>
          <span className="save-state">
            <Check size={11} />
            {savedLocally
              ? "Saved on this device"
              : "Session only · storage unavailable"}
          </span>
        </div>
        {trip ? (
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label="Show trip guide"
              onClick={() => action("replay-guide")}
            >
              <Compass size={18} />
            </button>
            <button
              className="icon-button"
              onClick={() => action("history")}
              aria-label="Trip change history"
            >
              <History size={19} />
            </button>
            <button
              className="button secondary compact-button"
              onClick={() => action("share")}
            >
              <Share2 size={15} /> Share
            </button>
            <button
              className="icon-button"
              onClick={() => action("trip-options")}
              aria-label="Trip options"
            >
              <MoreHorizontal size={21} />
            </button>
          </div>
        ) : (
          <span className="preview-label">
            <span /> FRONTEND PREVIEW
          </span>
        )}
      </header>
      <div
        className="conversation-scroll"
        ref={scroll}
        onScroll={() => {
          try {
            localStorage.setItem(
              viewKey,
              JSON.stringify({ day, scroll: scroll.current?.scrollTop || 0 }),
            );
          } catch {}
        }}
      >
        {!trip && !brief && !busy ? (
          <div className="welcome">
            <div className="welcome-top">
              <span className="welcome-kicker">
                <Sparkles size={15} /> GOOD TRIPS START WITH YOU
              </span>
              <h2>
                Less planning.
                <br />
                More <em>your kind</em> of travel.
              </h2>
              <p>
                Tell us what you’re imagining. We’ll bring the places,
                <br className="desktop-only" /> the route, and the little
                details together.
              </p>
            </div>
            <div className="starter-pills">
              <button onClick={() => onSubmit(samplePrompt)}>
                <Coffee size={16} /> A food-filled city weekend{" "}
                <ArrowUpRight size={14} />
              </button>
              <button
                onClick={() =>
                  onSubmit(
                    "A relaxed three-day Chicago trip for two adults with art, architecture and a $200 nightly hotel budget. No flights.",
                  )
                }
              >
                <Navigation size={16} /> Somewhere to slow down{" "}
                <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="inspiration-head">
              <h3>A little inspiration</h3>
              <button
                className="text-button"
                onClick={() => action("discover")}
              >
                Explore places <ArrowRight size={14} />
              </button>
            </div>
            <div className="inspiration-grid">
              <button
                className="destination-card"
                onClick={() => action("sample")}
              >
                <img src={cityImage} alt="Chicago city skyline" />
                <div>
                  <span>THE CITY, YOUR WAY</span>
                  <h3>
                    Chicago, with room
                    <br />
                    to wander.
                  </h3>
                  <p>3 days · food, architecture & local favorites</p>
                  <span className="white-link">
                    Explore sample trip <ArrowRight size={15} />
                  </span>
                </div>
              </button>
              <div className="taste-promo">
                <span className="taste-symbol">
                  <Sparkles size={26} />
                </span>
                <span className="eyebrow">MORE PERSONAL, EVERY TRIP</span>
                <h3>
                  Great taste.
                  <br />
                  Better matches.
                </h3>
                <p>
                  The places you love help us find the ones you haven’t met yet.
                </p>
                <button
                  className="text-button"
                  onClick={() => action("taste-setup")}
                >
                  {tasteSetupDone ? "Review your taste" : "Set up your taste"}{" "}
                  <ArrowRight size={15} />
                </button>
                <div className="taste-dots">
                  <span>Local food</span>
                  <span>Hidden gems</span>
                  <span>Slow mornings</span>
                </div>
              </div>
            </div>
            <div className="welcome-assurance">
              <ShieldCheck size={15} /> Explore as a guest. Make it yours when
              you’re ready.
            </div>
          </div>
        ) : (
          <>
            {brief && !trip && (
              <div className="user-bubble">{brief.prompt}</div>
            )}
            {brief && (
              <BriefForm
                brief={brief}
                onChange={onBrief}
                onGenerate={onGenerate}
              />
            )}
            {busy && (
              <div className="generation-card" role="status">
                <span className="assistant-icon">
                  <Sparkles size={24} />
                </span>
                <h2>Connecting the little details.</h2>
                <button
                  className="button secondary"
                  onClick={() => action("cancel-generation")}
                >
                  Cancel · keep my brief
                </button>
                <p>Bringing your taste, your days, and your route together.</p>
                <div className="progress-track">
                  <span />
                </div>
                <div className="generation-steps">
                  <span>
                    <Check size={15} /> Your travel brief
                  </span>
                  <span>
                    <Check size={15} /> Places that fit
                  </span>
                  <span>
                    <span className="loading-dot" /> A little room to wander
                  </span>
                </div>
              </div>
            )}
            {trip && !brief && !busy && (
              <>
                <div className="chat-opening">
                  <span className="assistant-icon">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <strong>Your weekend, thoughtfully put together.</strong>
                    <p>{trip.messages[1]?.text}</p>
                    <button
                      className="brief-summary"
                      onClick={() => action("edit-brief")}
                    >
                      <CalendarDays size={14} />
                      {dateLabel(trip.brief.start)}–{dateLabel(trip.brief.end)}
                      <span>·</span>
                      <Users size={14} />
                      {trip.brief.travelers}
                      <span>·</span>
                      {trip.brief.pace}
                      <SlidersHorizontal size={14} />
                    </button>
                  </div>
                </div>
                {!guideDismissed && (
                  <WorkspaceGuide
                    onOpen={() => onOpen("gage")}
                    onCompare={() => action("stays")}
                    onDismiss={onDismissGuide}
                  />
                )}
                <article className="trip-artifact">
                  <div className="artifact-title">
                    <div>
                      <span className="eyebrow">
                        YOUR ITINERARY · VERSION{" "}
                        {trip.messages.filter((m) => m.role === "user").length}
                      </span>
                      <h2>{trip.name}</h2>
                    </div>
                    <span className="status-chip">
                      <Check size={13} />{" "}
                      {issues.length ? "Needs your review" : "Ready to explore"}
                    </span>
                  </div>
                  <div className="trip-checks" role="status">
                    {issues.length ? (
                      <>
                        <strong>Let’s resolve this before you travel.</strong>
                        {issues.map((issue) => (
                          <p key={issue}>{issue}</p>
                        ))}
                      </>
                    ) : (
                      <p>
                        <Check size={14} /> {trip.days.length} days match your
                        dates · {trip.brief.travelers} travelers · no flights
                        generated
                      </p>
                    )}
                    <small>
                      Sample itinerary check · prices and real-world
                      availability still need verification
                    </small>
                  </div>
                  <div className="artifact-route">
                    <div className="section-line">
                      <h3>
                        <Map size={17} /> The big picture
                      </h3>
                      <span className="small-muted">
                        {trip.days.length} days · {new Set(allIds).size} places
                      </span>
                    </div>
                    <RouteMap
                      ids={[...allIds, trip.stayId || "hotel-loop"]}
                      onSelect={onOpen}
                    />
                  </div>
                  <div className="artifact-stays">
                    <div className="section-line">
                      <div>
                        <h3>
                          <BedDouble size={18} /> Where to stay
                        </h3>
                        <p>Good bases for your whole trip.</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => action("stays")}
                      >
                        Compare <ArrowRight size={14} />
                      </button>
                    </div>
                    <div className="stays-grid">
                      {places
                        .filter((p) => p.kind === "stay")
                        .map((p) => (
                          <PlaceCard
                            key={p.id}
                            place={{
                              ...p,
                              fit: tasteMatch(p, tasteState).score,
                              why:
                                Number(p.price.match(/\d+/)?.[0]) >
                                trip.brief.budget
                                  ? `This stay exceeds your $${trip.brief.budget} nightly target. Compare its location and total cost before choosing.`
                                  : explainPlace(p, tasteState).summary +
                                    " " +
                                    explainPlace(p, tasteState).tradeoff,
                            }}
                            nights={Math.max(0, trip.days.length - 1)}
                            saved={saved.includes(p.id)}
                            onSave={() => onSave(p.id)}
                            onOpen={() => onOpen(p.id)}
                          />
                        ))}
                    </div>
                    {trip.brief.budget < 198 && (
                      <p className="budget-notice">
                        {trip.brief.budget < 189
                          ? "Both demo stays exceed"
                          : "River Hotel exceeds"}{" "}
                        your ${trip.brief.budget} nightly target. Review
                        alternatives before choosing.
                      </p>
                    )}
                    <p className="fine-print">
                      Demo estimates for your dates, before taxes. Illustrative
                      photography.
                    </p>
                  </div>
                  <div className="artifact-days">
                    <div className="section-line">
                      <h3>
                        <CalendarDays size={17} /> Days made for you
                      </h3>
                      <button
                        className="text-button"
                        onClick={() => action("today")}
                      >
                        Travel mode <ArrowRight size={14} />
                      </button>
                    </div>
                    <div className="day-filters">
                      <button
                        className={day === "all" ? "active" : ""}
                        onClick={() => setDay("all")}
                      >
                        All days
                      </button>
                      {trip.days.map((d, i) => (
                        <button
                          key={d.id}
                          className={day === d.id ? "active" : ""}
                          onClick={() => setDay(d.id)}
                        >
                          Day {i + 1}
                        </button>
                      ))}
                    </div>
                    <div className="day-board">
                      {trip.days
                        .filter((d) => day === "all" || d.id === day)
                        .map((d) => {
                          const i = trip.days.indexOf(d);
                          const date = new Date(trip.brief.start + "T12:00:00");
                          date.setDate(date.getDate() + i);
                          return (
                            <section className="day-column" key={d.id}>
                              <div className="day-heading">
                                <span>
                                  DAY {i + 1}{" "}
                                  <small>
                                    {date.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </small>
                                </span>
                                <h4>{d.title}</h4>
                                <p>
                                  {d.places.length} stops · take it at your pace
                                </p>
                              </div>
                              {d.places.map((id, j) => {
                                const original = getPlace(id);
                                const p = {
                                  ...original,
                                  fit: tasteMatch(original, tasteState).score,
                                };
                                return (
                                  <article
                                    className="activity"
                                    key={`${id}-${j}`}
                                    draggable
                                    onDragStart={(e) =>
                                      e.dataTransfer.setData(
                                        "text/plain",
                                        JSON.stringify({
                                          dayId: d.id,
                                          index: j,
                                        }),
                                      )
                                    }
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      action(
                                        "drop",
                                        JSON.stringify({
                                          source:
                                            e.dataTransfer.getData(
                                              "text/plain",
                                            ),
                                          dayId: d.id,
                                          index: j,
                                        }),
                                      );
                                    }}
                                  >
                                    <div className="activity-top">
                                      <span>
                                        {j === 0
                                          ? "Morning"
                                          : j === 1
                                            ? "Afternoon"
                                            : "Evening"}
                                      </span>
                                      <button
                                        className="icon-button"
                                        onClick={() =>
                                          setMenu(
                                            menu === `${d.id}:${j}`
                                              ? null
                                              : `${d.id}:${j}`,
                                          )
                                        }
                                        aria-label={`Edit ${p.name}`}
                                      >
                                        <MoreHorizontal size={16} />
                                      </button>
                                    </div>
                                    <button
                                      className="activity-content"
                                      onClick={() => onOpen(id)}
                                    >
                                      <div className="activity-thumb">
                                        <img
                                          src={p.image}
                                          alt="Illustrative travel photo"
                                          loading="lazy"
                                          onError={(e) =>
                                            (e.currentTarget.style.visibility =
                                              "hidden")
                                          }
                                        />
                                      </div>
                                      <div>
                                        <h5>{p.name}</h5>
                                        <span className="activity-fit">
                                          <Sparkles size={11} />
                                          {p.fit}/100 demo fit
                                        </span>
                                        <p>
                                          <Clock size={11} />
                                          {p.duration} <span>· {p.price}</span>
                                        </p>
                                      </div>
                                    </button>
                                    {menu === `${d.id}:${j}` && (
                                      <div className="activity-menu">
                                        <button
                                          onClick={() => {
                                            action("ask-place", `${d.id}:${j}`);
                                            setMenu(null);
                                          }}
                                        >
                                          Ask AI about this activity
                                        </button>
                                        <button
                                          onClick={() => {
                                            action("earlier", `${d.id}:${j}`);
                                            setMenu(null);
                                          }}
                                        >
                                          <ChevronLeft size={14} /> Move earlier
                                        </button>
                                        <button
                                          onClick={() => {
                                            action("later", `${d.id}:${j}`);
                                            setMenu(null);
                                          }}
                                        >
                                          <ChevronRight size={14} /> Move later
                                        </button>
                                        <button
                                          onClick={() => {
                                            action("move", `${d.id}:${j}`);
                                            setMenu(null);
                                          }}
                                        >
                                          Move to another day
                                        </button>
                                        <button
                                          onClick={() => {
                                            action("swap", `${d.id}:${j}`);
                                            setMenu(null);
                                          }}
                                        >
                                          Find an alternative
                                        </button>
                                        <button
                                          onClick={() => {
                                            onSave(id);
                                            setMenu(null);
                                          }}
                                        >
                                          <Bookmark size={14} /> Save for later
                                        </button>
                                      </div>
                                    )}
                                  </article>
                                );
                              })}
                              <button
                                className="add-stop"
                                onClick={() => action("add-day", d.id)}
                              >
                                <Plus size={15} /> Add a place
                              </button>
                            </section>
                          );
                        })}
                    </div>
                  </div>
                  <div className="artifact-bottom">
                    <span>
                      <ShieldCheck size={15} /> Your plans. Always editable.
                    </span>
                    <button
                      className="text-button"
                      onClick={() => action("export")}
                    >
                      Export itinerary <ArrowUpRight size={14} />
                    </button>
                  </div>
                </article>
                <div className="follow-up">
                  <span>Make it even more you</span>
                  <div>
                    <button
                      onClick={() =>
                        onSubmit("Give us a slower afternoon with fewer stops.")
                      }
                    >
                      <Coffee size={14} /> Slow it down
                    </button>
                    <button
                      onClick={() =>
                        onSubmit("Replan for rain with indoor activities.")
                      }
                    >
                      <CloudRain size={14} /> Plan for rain
                    </button>
                    <button onClick={() => action("bookings")}>
                      <Plus size={14} /> Add a booking
                    </button>
                  </div>
                </div>
                {trip.messages.slice(2).map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === "user" ? "user-bubble" : "assistant-message"
                    }
                  >
                    {m.role === "assistant" && <Sparkles size={16} />}
                    <p>{m.text}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
      <div className="composer-wrap">
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label className="sr-only" htmlFor="chat-input">
            Message your travel assistant
          </label>
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              trip
                ? "Ask for a change, a new idea, or a little more detail…"
                : "A weekend in Chicago? Tell us what your kind of trip looks like…"
            }
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="composer-bottom">
            <button
              type="button"
              className="icon-button"
              onClick={() => action("bookings")}
              aria-label="Add travel details"
            >
              <Plus size={20} />
            </button>
            <span>
              <Sparkles size={12} /> Your taste. Your pace.
            </span>
            <button
              className="send-button"
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send message"
            >
              <ArrowUp size={19} />
            </button>
          </div>
        </form>
        <p className="composer-caption">
          Interactive frontend demo · no live AI or bookings · saved on this
          device
        </p>
      </div>
    </section>
  );
}
