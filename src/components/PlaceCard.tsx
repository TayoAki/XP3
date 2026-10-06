import { Bookmark, BookmarkCheck, MapPin, Star, Sparkles } from "lucide-react";
import type { Place } from "../model";

export function Photo({
  place,
  className = "",
}: {
  place: Place;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={place.image}
      alt=""
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden";
        e.currentTarget.parentElement?.classList.add("image-fallback");
      }}
    />
  );
}

/** A place in a grid: photo, fit, name and one line of why. Opens the side panel. */
export function PlaceCard({
  place,
  fit,
  why,
  saved,
  onSave,
  onOpen,
}: {
  place: Place;
  fit: number;
  why?: string;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="place-card">
      <div className="place-card-media">
        <button
          className="place-card-photo"
          onClick={onOpen}
          tabIndex={-1}
          aria-hidden="true"
        >
          <Photo place={place} />
        </button>
        <span className="fit-pill">
          <Sparkles size={13} /> {fit}/100 fit
        </span>
        <button
          className="save-toggle"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={`${saved ? "Remove" : "Save"} ${place.name}`}
        >
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>
      <div className="place-card-body">
        <button className="place-card-name" onClick={onOpen}>
          {place.name}
        </button>
        <p className="place-card-meta">
          <MapPin size={13} /> {place.area}
          <span aria-hidden="true">·</span>
          <Star size={13} /> {place.rating.toFixed(1)}
          <span aria-hidden="true">·</span>
          {place.price}
        </p>
        {why && <p className="place-card-why">{why}</p>}
      </div>
    </article>
  );
}
