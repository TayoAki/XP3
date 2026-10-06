import TasteStudio from "./TasteStudio";
import { Star, Bookmark, Compass } from "lucide-react";
import { type State } from "../model";
export function JourneyBar({ onAction }: { onAction: (name: string) => void }) {
  return (
    <nav className="journey-bar" aria-label="Planning tools">
      <button onClick={() => onAction("return-hub")}>
        <Compass size={14} /> Your next step
      </button>
      <button onClick={() => onAction("calibrate")}>
        <Star size={14} /> Refine your taste
      </button>
      <button onClick={() => onAction("ideas")}>
        <Bookmark size={14} /> Ideas first
      </button>
    </nav>
  );
}
export function Calibration({
  state,
  onChange,
}: {
  state: State;
  onChange: (s: State) => void;
}) {
  return <TasteStudio compact state={state} onChange={onChange} />;
}
