import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { type Place } from "../model";
import { IconButton } from "../ui";

/** Photos with their source; says so plainly when none can be shown. */
export default function PhotoGallery({ place }: { place: Place }) {
  const photos = place.photos ?? [
    {
      src: place.image,
      caption: `Illustrative photo for ${place.name}`,
      source: "Sample photo · not verified as this place",
    },
  ];
  const [index, setIndex] = useState(0);
  const [large, setLarge] = useState(false);
  const [failed, setFailed] = useState(false);
  const photo = photos[index % photos.length];
  return (
    <section
      className={`photo-gallery${large ? " enlarged" : ""}`}
      aria-label={`Photos of ${place.name}`}
    >
      {photo && !failed ? (
        <img
          src={photo.src}
          alt={photo.caption}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="gallery-empty">
          <strong>No photo available</strong>
          <p>We don’t show a substitute image as if it were this place.</p>
        </div>
      )}
      <div className="gallery-controls">
        {photos.length > 1 && (
          <IconButton
            label="Previous photo"
            onClick={() =>
              setIndex((index + photos.length - 1) % photos.length)
            }
          >
            <ChevronLeft size={18} />
          </IconButton>
        )}
        <span className="gallery-count">
          {photos.length > 1
            ? `${index + 1} of ${photos.length}`
            : photo?.source}
        </span>
        {photos.length > 1 && (
          <IconButton
            label="Next photo"
            onClick={() => setIndex((index + 1) % photos.length)}
          >
            <ChevronRight size={18} />
          </IconButton>
        )}
        {!failed && (
          <IconButton
            label={large ? "Smaller photo" : "Larger photo"}
            onClick={() => setLarge(!large)}
          >
            {large ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </IconButton>
        )}
      </div>
      {photos.length > 1 && <small>{photo?.source}</small>}
    </section>
  );
}
