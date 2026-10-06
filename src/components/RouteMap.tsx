import { MapPin, Navigation, Maximize2 } from "lucide-react";
import { getPlace } from "../model";
export default function RouteMap({
  ids,
  onSelect,
  small = false,
}: {
  ids: string[];
  onSelect: (id: string) => void;
  small?: boolean;
}) {
  const points = [...new Set(ids)].map(getPlace).filter(Boolean);
  return (
    <div className={`route-map ${small ? "small-map" : ""}`}>
      <svg viewBox="0 0 700 270" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern
            id="blocks"
            width="57"
            height="42"
            patternUnits="userSpaceOnUse"
          >
            <rect width="57" height="42" fill="#eef0e9" />
            <rect x="5" y="5" width="47" height="32" rx="3" fill="#e3e6df" />
            <path d="M0 0H57M0 0V42" stroke="#fff" strokeWidth="5" />
          </pattern>
        </defs>
        <rect width="700" height="270" fill="url(#blocks)" />
        <path d="M556 0L580 270H700V0" fill="#d2e6ed" />
        <path
          d="M0 88 C180 90 285 130 385 92 S480 35 570 67"
          stroke="#c1dce8"
          strokeWidth="23"
          fill="none"
        />
        <path d="M625 0L592 270" stroke="#b8ced6" strokeWidth="2" />
        <rect x="451" y="144" width="77" height="97" rx="11" fill="#cee0c6" />
        <path
          d="M300 0V270M120 0V270M0 179H580"
          stroke="#fff"
          strokeWidth="6"
        />
        <polyline
          points={points
            .filter((p) => p.kind !== "stay")
            .map((p) => `${p.x * 7},${p.y * 2.7}`)
            .join(" ")}
          fill="none"
          stroke="#2157d5"
          strokeWidth="3"
          strokeDasharray="6 5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="map-label loop">THE LOOP</span>
      <span className="map-label north">RIVER NORTH</span>
      <span className="map-label lake">Lake Michigan</span>
      <span className="map-label park">
        Millennium
        <br />
        Park
      </span>
      {points.map((p, i) => (
        <button
          key={p.id}
          className={`map-pin ${p.kind === "stay" ? "hotel-pin" : ""}`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          onClick={() => onSelect(p.id)}
          aria-label={`Explore ${p.name} on route`}
        >
          {p.kind === "stay" ? <MapPin size={16} /> : i + 1}
        </button>
      ))}
      {!small && (
        <>
          <div className="map-pill">
            <Navigation size={14} /> Walkable days, fewer detours
          </div>
          <button
            className="map-expand"
            onClick={() => onSelect(points[0]?.id || "river")}
            aria-label="Explore route stops"
          >
            <Maximize2 size={17} />
          </button>
        </>
      )}
      <span className="map-disclosure">
        Illustrative route · not for navigation
      </span>
    </div>
  );
}
