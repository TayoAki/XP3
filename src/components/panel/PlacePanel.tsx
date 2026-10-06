import { useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  ExternalLink,
  MapPin,
  Plus,
  Star,
  ThumbsUp,
  Flag,
  PenLine,
  Route as RouteIcon,
  BedDouble,
  Check,
} from "lucide-react";
import { getPlace, type Place } from "../../model";
import { useApp } from "../../app/context";
import { memberById, mentionsOf, reviewsFor } from "../../inspiration";
import { Button, Chip, Panel, Section } from "../../ui";
import PhotoGallery from "../PhotoGallery";
import RouteMap from "../RouteMap";
import WhyItFits from "./WhyItFits";
import Compare from "./Compare";

const kindLabel = {
  stay: "Place to stay",
  food: "Food & drink",
  experience: "Thing to do",
} as const;

/** Research for one place: media → why it fits → facts → evidence → compare & notes. */
export default function PlacePanel({
  place,
  onClose,
}: {
  place: Place;
  onClose: () => void;
}) {
  const app = useApp();
  const { state } = app;
  const trip = app.trip || state.trips.find((t) => t.id === state.activeId);
  const saved = app.isSaved(place.id);
  const inTrip = trip?.days.some((d) => d.places.includes(place.id));
  const isBase = trip?.stayId === place.id;

  const footer = (
    <>
      <Button aria-pressed={saved} onClick={() => app.toggleSave(place.id)}>
        {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        {saved ? "Saved" : "Save"}
      </Button>
      {trip &&
        (place.kind === "stay" ? (
          <Button
            variant="primary"
            disabled={isBase}
            onClick={() => app.chooseStay(place.id)}
          >
            {isBase ? <Check size={18} /> : <BedDouble size={18} />}
            {isBase ? "Your base" : "Choose this stay"}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => app.setMode({ kind: "placing", placeId: place.id })}
          >
            <Plus size={18} /> {inTrip ? "Move in trip" : "Add to trip"}
          </Button>
        ))}
    </>
  );

  return (
    <Panel
      title={place.name}
      subtitle={`${kindLabel[place.kind]} · ${place.area}, Chicago`}
      onClose={onClose}
      footer={footer}
      label={`About ${place.name}`}
    >
      <div className="place-media">
        <PhotoGallery place={place} />
        <RouteMap ids={[place.id]} onSelect={() => {}} small />
      </div>
      <p className="place-keyline">
        <span>
          <Clock size={14} /> {place.duration}
        </span>
        <span>{place.price}</span>
      </p>

      <WhyItFits
        place={place}
        state={state}
        trip={trip}
        onChange={(fn) => app.setState(fn)}
        onNotify={(text, undo) =>
          app.notify(text, undo ? { label: "Undo", run: undo } : undefined)
        }
      />

      <Section title="Facts" className="panel-section">
        <p>{place.description}</p>
        <dl className="fact-table">
          <dt>Address</dt>
          <dd>
            {place.address} <span className="source">sample data</span>
          </dd>
          <dt>Time to allow</dt>
          <dd>
            {place.duration} <span className="source">sample estimate</span>
          </dd>
          <dt>Price</dt>
          <dd>
            {place.price} <span className="source">sample estimate</span>
          </dd>
          <dt>Opening hours</dt>
          <dd className="unknown">Unknown</dd>
          <dt>Availability</dt>
          <dd className="unknown">Not checked</dd>
          {place.kind === "stay" && (
            <>
              <dt>Cancellation</dt>
              <dd className="unknown">Unknown</dd>
            </>
          )}
        </dl>
        <div className="link-row">
          <a
            className="btn btn-secondary btn-sm"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " Chicago")}`}
            target="_blank"
            rel="noreferrer"
          >
            <MapPin size={16} /> Google Maps <ExternalLink size={14} />
          </a>
          <a
            className="btn btn-secondary btn-sm"
            href={`https://www.google.com/search?q=${encodeURIComponent(place.name + " Chicago official site")}`}
            target="_blank"
            rel="noreferrer"
          >
            Official site <ExternalLink size={14} />
          </a>
        </div>
      </Section>

      <Evidence place={place} />

      <Section title="Compare" className="panel-section">
        <Compare
          place={place}
          state={state}
          onChange={(fn) => app.setState(fn)}
          onOpen={(id) => app.openPanel({ kind: "place", id })}
          onChoose={(id) =>
            getPlace(id).kind === "stay"
              ? app.chooseStay(id)
              : trip
                ? app.setMode({ kind: "placing", placeId: id })
                : app.openPanel({ kind: "place", id })
          }
        />
      </Section>

      <Section title="Your notes" className="panel-section">
        <label className="sr-only" htmlFor={`notes-${place.id}`}>
          Notes about {place.name}
        </label>
        <textarea
          id={`notes-${place.id}`}
          className="notes"
          rows={3}
          value={state.researchNotes?.[place.id] || ""}
          onChange={(e) =>
            app.setState((s) => ({
              ...s,
              researchNotes: { ...s.researchNotes, [place.id]: e.target.value },
            }))
          }
          placeholder="What matters? What needs checking?"
        />
        <p className="muted-note">Private · saved on this device</p>
      </Section>
    </Panel>
  );
}

/** Ratings from elsewhere, member reviews and itinerary mentions, kept apart. */
function Evidence({ place }: { place: Place }) {
  const app = useApp();
  const reviews = reviewsFor(place.id);
  const own = app.state.reviews.filter(
    (r) => r.placeId === place.id && r.public,
  );
  const qualities = [...new Set(reviews.flatMap((r) => r.qualities))];
  const [quality, setQuality] = useState<string | null>(null);
  const [helpful, setHelpful] = useState<string[]>([]);
  const mine = new Set([
    ...app.state.interests,
    ...Object.values(app.state.tasteSignals || {}).flatMap(
      (s) => s.liked || [],
    ),
  ]);
  const shown = reviews.filter((r) => {
    if (!quality) return true;
    const author = memberById(r.memberId);
    return r.qualities.includes(quality) || author?.likes.includes(quality);
  });
  const mentions = mentionsOf(place.id);
  return (
    <>
      <Section title="Ratings elsewhere" className="panel-section">
        <p className="aggregate">
          <Star size={16} fill="currentColor" /> <strong>{place.rating}</strong>{" "}
          from {place.reviews.toLocaleString()} ratings
          <span className="source">sample aggregate · not live</span>
        </p>
      </Section>

      <Section
        title={`Member reviews · ${reviews.length + own.length}`}
        className="panel-section"
        action={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => app.openModal("review", place.id)}
          >
            <PenLine size={16} /> Write one
          </Button>
        }
      >
        {qualities.length > 1 && (
          <div
            className="chip-row"
            role="group"
            aria-label="Show reviews from people who care about"
          >
            <Chip pressed={!quality} onClick={() => setQuality(null)}>
              All
            </Chip>
            {qualities.map((q) => (
              <Chip
                key={q}
                pressed={quality === q}
                onClick={() => setQuality(quality === q ? null : q)}
              >
                {q}
              </Chip>
            ))}
          </div>
        )}
        {quality && (
          <p className="muted-note">
            Reviews that mention {quality.toLowerCase()}, or by members who care
            about it.
          </p>
        )}
        {shown.length === 0 && own.length === 0 && (
          <p className="muted-note">
            {reviews.length
              ? "No reviews match that filter."
              : "No member reviews yet. Be the first."}
          </p>
        )}
        <ul className="review-list">
          {shown.map((r) => {
            const author = memberById(r.memberId)!;
            const overlap = author.likes.filter((l) => mine.has(l));
            return (
              <li className="review" key={r.id}>
                <button
                  className="review-author"
                  onClick={() =>
                    app.openPanel({ kind: "member", id: author.id })
                  }
                >
                  <span className="avatar-mark small">{author.initials}</span>
                  <span>
                    <strong>{author.name}</strong>
                    <small>
                      {overlap.length
                        ? `Also likes ${overlap.slice(0, 2).join(" & ").toLowerCase()}`
                        : `Likes ${author.likes.slice(0, 2).join(" & ").toLowerCase()}`}
                    </small>
                  </span>
                </button>
                <p className="review-rating">
                  <span className="stars" aria-label={`${r.rating} out of 5`}>
                    {Array.from({ length: r.rating }, (_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </span>
                  Visited {r.visited}
                </p>
                <p>{r.text}</p>
                <p className="review-tags">{r.qualities.join(" · ")}</p>
                <div className="review-actions">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-pressed={helpful.includes(r.id)}
                    onClick={() =>
                      setHelpful(
                        helpful.includes(r.id)
                          ? helpful.filter((x) => x !== r.id)
                          : [...helpful, r.id],
                      )
                    }
                  >
                    <ThumbsUp size={14} />{" "}
                    {helpful.includes(r.id) ? "Helpful · thanks" : "Helpful"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => app.openModal("report", place.id)}
                  >
                    <Flag size={14} /> Report
                  </Button>
                </div>
              </li>
            );
          })}
          {own.map((r) => (
            <li className="review is-own" key={r.id}>
              <strong>Your review</strong>
              <p className="review-rating">
                <span className="stars" aria-label={`${r.rating} out of 5`}>
                  {Array.from({ length: r.rating }, (_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </span>
              </p>
              <p>{r.text}</p>
            </li>
          ))}
        </ul>
        <p className="muted-note">Sample reviews by fictional members.</p>
      </Section>

      {mentions.length > 0 && (
        <Section title="In member itineraries" className="panel-section">
          <ul className="mention-list">
            {mentions.map((t) => (
              <li key={t.id}>
                <RouteIcon size={16} />
                <button
                  className="link-button"
                  onClick={() => app.openPanel({ kind: "itinerary", id: t.id })}
                >
                  {t.name}
                </button>
                <span className="muted-note">
                  by {memberById(t.memberId)?.name}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
