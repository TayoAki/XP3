import { MemberEvidence } from "./Inspiration";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  MapPin,
  Star,
  BedDouble,
} from "lucide-react";
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
      alt={`${place.name} — illustrative travel photography`}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = "none";
        e.currentTarget.parentElement?.classList.add("image-fallback");
      }}
    />
  );
}
export function PlaceCard({
  place,
  saved,
  onSave,
  onOpen,
  compact = false,
  nights = 2,
}: {
  place: Place;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  compact?: boolean;
  nights?: number;
}) {
  return (
    <article className={`place-card ${compact ? "compact" : ""}`}>
      <div className="card-image">
        <button
          className="image-open"
          onClick={onOpen}
          aria-label={`Explore ${place.name}`}
        >
          <Photo place={place} />
        </button>
        <span className="fit-badge">
          <span /> {place.fit}/100 demo fit
        </span>
        <button
          className={`save-button ${saved ? "saved" : ""}`}
          onClick={onSave}
          aria-label={`${saved ? "Unsave" : "Save"} ${place.name}`}
        >
          {saved ? <Check size={16} /> : <Bookmark size={16} />}
        </button>
      </div>
      <div className="card-content">
        <div className="eyebrow">
          {place.kind === "stay" ? (
            <BedDouble size={13} />
          ) : (
            <MapPin size={13} />
          )}{" "}
          {place.area}
        </div>
        <button className="card-title" onClick={onOpen}>
          {place.name}
          <ArrowUpRight size={16} />
        </button>
        <div className="card-meta">
          <span>
            <Star size={13} fill="currentColor" /> {place.rating.toFixed(1)}{" "}
            <small>({place.reviews.toLocaleString()})</small>
          </span>
          <span>{place.price}</span>
        </div>
        {!compact && <p>{place.why}</p>}
        {!compact && <MemberEvidence placeId={place.id} />}
        {place.kind === "stay" && (
          <div className="hotel-foot">
            <span>{nights} nights · estimated total</span>
            <strong>
              $
              {(
                nights * (place.id === "hotel-loop" ? 189 : 198)
              ).toLocaleString()}
            </strong>
          </div>
        )}
      </div>
    </article>
  );
}
