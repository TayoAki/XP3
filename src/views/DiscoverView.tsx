import { useState } from "react";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Star,
  PenLine,
  Pencil,
  Trash2,
  EyeOff,
  Utensils,
  Landmark,
  BedDouble,
  LayoutGrid,
  Route as RouteIcon,
  UserRound,
} from "lucide-react";
import { useApp } from "../app/context";
import { getPlace, type State } from "../model";
import { explainPlace, rankedTaste } from "../taste";
import { members, sharedItineraries, memberById } from "../inspiration";
import { isItinerarySaved, toggleItinerarySaved } from "../collections";
import type { DiscoverTab } from "../routes";
import { Button, IconButton } from "../ui";
import { ContextSidebar, NavList, PageHeader } from "../shell/Shell";
import { PlaceCard, Photo } from "../components/PlaceCard";

const tabs = [
  ["places", "Places"],
  ["itineraries", "Itineraries"],
  ["people", "People"],
] as const;

const kinds: [NonNullable<State["discoverKind"]>, string, typeof Utensils][] = [
  ["all", "All places", LayoutGrid],
  ["food", "Food & drink", Utensils],
  ["experience", "Things to do", Landmark],
  ["stay", "Stays", BedDouble],
];

export function DiscoverView({ onOpenContext }: { onOpenContext: () => void }) {
  const app = useApp();
  const tab = app.loc.route.view === "discover" ? app.loc.route.tab : "places";
  return (
    <div className="page">
      <PageHeader
        title="Discover"
        subtitle="Sample Chicago places, member itineraries and the people behind them."
        tabs={tabs}
        tab={tab}
        onTab={(t: DiscoverTab) => app.go({ view: "discover", tab: t })}
        onOpenContext={onOpenContext}
      />
      {tab === "places" && <Places />}
      {tab === "itineraries" && <Itineraries />}
      {tab === "people" && <People />}
    </div>
  );
}

function Places() {
  const app = useApp();
  const { state } = app;
  const [query, setQuery] = useState("");
  const kind = state.discoverKind || "all";
  const hidden = state.lessLike || [];
  const list = rankedTaste(state).filter(
    (p) =>
      (kind === "all" || p.kind === kind) &&
      `${p.name} ${p.area} ${p.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="search-field">
        <Search size={18} />
        <label className="sr-only" htmlFor="discover-search">
          Search places
        </label>
        <input
          id="discover-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="A place, a neighbourhood, a mood…"
        />
      </div>
      <p className="muted-note list-note">
        Ranked by your taste profile.{" "}
        {kind !== "all" &&
          `Showing ${kinds.find((k) => k[0] === kind)?.[1].toLowerCase()}. `}
        {hidden.length > 0 &&
          `${hidden.length} hidden because you asked for less like them.`}
      </p>
      {list.length ? (
        <div className="place-grid">
          {list.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              fit={p.fit}
              why={explainPlace(p, state).summary}
              saved={app.isSaved(p.id)}
              onSave={() => app.toggleSave(p.id)}
              onOpen={() => app.openPanel({ kind: "place", id: p.id })}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Search size={28} />
          <h2>No places match</h2>
          <p>Try another word, or show every kind of place.</p>
          <Button
            variant="primary"
            onClick={() => {
              setQuery("");
              app.setState((s) => ({ ...s, discoverKind: "all" }));
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </>
  );
}

function Itineraries() {
  const app = useApp();
  return (
    <>
      <p className="muted-note list-note">
        Sample itineraries from fictional members. Make a copy to adapt one; the
        original never changes.
      </p>
      <div className="itinerary-cards">
        {sharedItineraries.map((t) => {
          const author = memberById(t.memberId)!;
          const saved = isItinerarySaved(app.state, t.id);
          return (
            <article className="itinerary-card" key={t.id}>
              <button
                className="itinerary-photo"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => app.openPanel({ kind: "itinerary", id: t.id })}
              >
                <Photo place={getPlace(t.days[0][0])} />
              </button>
              <div className="itinerary-body">
                <p className="muted-note">
                  {t.days.length} days · {t.days.flat().length} stops · sample
                </p>
                <h2>
                  <button
                    onClick={() =>
                      app.openPanel({ kind: "itinerary", id: t.id })
                    }
                  >
                    {t.name}
                  </button>
                </h2>
                <button
                  className="byline"
                  onClick={() =>
                    app.openPanel({ kind: "member", id: author.id })
                  }
                >
                  <span className="avatar-mark small">{author.initials}</span>{" "}
                  {author.name}
                </button>
                <p>{t.summary}</p>
                <div className="card-actions">
                  <Button
                    size="sm"
                    aria-pressed={saved}
                    onClick={() => {
                      app.setState((s) => toggleItinerarySaved(s, t.id));
                      app.notify(
                        saved
                          ? "Removed from Saved."
                          : "Saved. Find it under Saved.",
                      );
                    }}
                  >
                    {saved ? (
                      <BookmarkCheck size={16} />
                    ) : (
                      <Bookmark size={16} />
                    )}
                    {saved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      app.openPanel({ kind: "itinerary", id: t.id })
                    }
                  >
                    View <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function People() {
  const app = useApp();
  const own = app.state.reviews.filter((r) => r.public);
  return (
    <>
      <p className="muted-note list-note">
        Fictional sample members. Their reviews show who is recommending what,
        so you can judge whether their taste is like yours.
      </p>
      <div className="member-cards">
        {members.map((m) => (
          <article className="member-card" key={m.id}>
            <span className="avatar-mark large">{m.initials}</span>
            <div>
              <h2>{m.name}</h2>
              <p className="muted-note">{m.style}</p>
              <p>{m.bio}</p>
            </div>
            <Button
              size="sm"
              onClick={() => app.openPanel({ kind: "member", id: m.id })}
            >
              View profile
            </Button>
          </article>
        ))}
      </div>
      <section className="own-reviews" aria-labelledby="own-reviews-title">
        <div className="section-row">
          <h2 id="own-reviews-title" className="section-title">
            Your public reviews
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => app.openModal("review")}
          >
            <PenLine size={16} /> Write a review
          </Button>
        </div>
        {own.length ? (
          <ul className="review-list">
            {own.map((r) => (
              <li key={r.id} className="review">
                <div className="review-head">
                  <button
                    className="link-button"
                    onClick={() =>
                      app.openPanel({ kind: "place", id: r.placeId })
                    }
                  >
                    {getPlace(r.placeId).name}
                  </button>
                  <span className="stars" aria-label={`${r.rating} out of 5`}>
                    {Array.from({ length: r.rating }, (_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </span>
                </div>
                <p>{r.text}</p>
                <div className="review-actions">
                  <IconButton
                    label="Edit review"
                    onClick={() => app.openModal("edit-review", r.id)}
                  >
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton
                    label="Delete review"
                    onClick={() => app.openModal("delete-review", r.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-note">
            Reviews you publish appear here. Private visit ratings stay in your
            taste profile.
          </p>
        )}
      </section>
    </>
  );
}

export function DiscoverSidebar() {
  const app = useApp();
  const tab = app.loc.route.view === "discover" ? app.loc.route.tab : "places";
  const kind = app.state.discoverKind || "all";
  return (
    <ContextSidebar
      title={
        tab === "places"
          ? "Browse"
          : tab === "itineraries"
            ? "Itineraries"
            : "Members"
      }
    >
      {tab === "places" && (
        <>
          <NavList
            label="Kinds of place"
            items={kinds.map(([id, label, Icon]) => ({
              id,
              label,
              icon: <Icon size={18} />,
              active: kind === id,
              onSelect: () => app.setState((s) => ({ ...s, discoverKind: id })),
            }))}
          />
          {(app.state.lessLike || []).length > 0 && (
            <>
              <h3>Hidden</h3>
              <NavList
                label="Hidden places"
                items={[
                  {
                    id: "unhide",
                    label: "Show hidden places again",
                    meta: `${app.state.lessLike!.length} hidden`,
                    icon: <EyeOff size={18} />,
                    onSelect: () => {
                      const before = app.state.lessLike;
                      app.setState((s) => ({ ...s, lessLike: [] }));
                      app.notify("Hidden places are back.", {
                        label: "Undo",
                        run: () =>
                          app.setState((s) => ({ ...s, lessLike: before })),
                      });
                    },
                  },
                ]}
              />
            </>
          )}
        </>
      )}
      {tab === "itineraries" && (
        <NavList
          label="Itineraries"
          items={sharedItineraries.map((t) => ({
            id: t.id,
            label: t.name,
            meta: `by ${memberById(t.memberId)?.name}`,
            icon: <RouteIcon size={18} />,
            active:
              app.loc.panel?.kind === "itinerary" && app.loc.panel.id === t.id,
            onSelect: () => app.openPanel({ kind: "itinerary", id: t.id }),
          }))}
        />
      )}
      {tab === "people" && (
        <NavList
          label="Members"
          items={members.map((m) => ({
            id: m.id,
            label: m.name,
            meta: m.style,
            icon: <UserRound size={18} />,
            active:
              app.loc.panel?.kind === "member" && app.loc.panel.id === m.id,
            onSelect: () => app.openPanel({ kind: "member", id: m.id }),
          }))}
        />
      )}
    </ContextSidebar>
  );
}
