import { useState } from "react";
import { type Place } from "../model";
export default function PhotoGallery({ place }: { place: Place }) {
  const photos = place.photos ?? [
    {
      src: place.image,
      caption: "Illustrative travel photography",
      source: "Unsplash fixture · not verified photography of this place",
    },
  ];
  const [index, setIndex] = useState(0);
  const [large, setLarge] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <section
      className={`photo-gallery ${large ? "enlarged" : ""}`}
      aria-label={`Photos for ${place.name}`}
    >
      {photos.length && !failed ? (
        <img
          src={photos[index % photos.length].src}
          alt={photos[index % photos.length].caption}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="gallery-empty">
          <strong>No verified photos available</strong>
          <p>
            Research can continue. No substitute image is presented as this
            place.
          </p>
        </div>
      )}
      <div className="gallery-controls">
        <button
          disabled={photos.length < 2}
          aria-label="Previous photo"
          onClick={() => {
            setIndex((index + photos.length - 1) % photos.length);
            setFailed(false);
          }}
        >
          ‹
        </button>
        <span>
          {photos.length ? `${index + 1} / ${photos.length}` : "0 photos"}
        </span>
        <button
          disabled={photos.length < 2}
          aria-label="Next photo"
          onClick={() => {
            setIndex((index + 1) % photos.length);
            setFailed(false);
          }}
        >
          ›
        </button>
        <button onClick={() => setLarge(!large)}>
          {large ? "Compact photo" : "Enlarge photo"}
        </button>
      </div>
      <small>
        {photos[index % Math.max(1, photos.length)]?.source ||
          "Photo source unavailable"}
      </small>
    </section>
  );
}
