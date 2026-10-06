import { useState } from "react";
import { Check, Heart, X } from "lucide-react";
import { useApp } from "../app/context";
import { Button, Chip, IconButton, Segmented } from "../ui";

const options = [
  "Local food",
  "Architecture",
  "Art & culture",
  "Hidden gems",
  "Nature",
  "Good value",
  "Nightlife",
  "Wellness",
];
const paces = [
  ["Relaxed", "Relaxed"],
  ["Balanced", "Balanced"],
  ["Packed with discovery", "Packed"],
] as const;

/**
 * Optional first-run taste setup. It edits the same interests and pace as
 * You → Taste; skipping never blocks planning.
 */
export default function TasteQuickStart() {
  const { state, setState, notify, go } = useApp();
  const [interests, setInterests] = useState(state.interests);
  const [pace, setPace] = useState(state.pace);
  if (state.tasteSetupDone) return null;
  const finish = (save: boolean) => {
    setState((s) => ({
      ...s,
      ...(save ? { interests, pace } : {}),
      tasteSetupDone: true,
    }));
    notify(
      save
        ? "Taste saved. New trips start from it."
        : "Skipped. You can set your taste any time under You.",
      { label: "Open taste", run: () => go({ view: "you", tab: "taste" }) },
    );
  };
  return (
    <section className="quickstart" aria-labelledby="quickstart-title">
      <header>
        <Heart size={18} />
        <h2 id="quickstart-title">Optional: what’s your kind of place?</h2>
        <IconButton
          label="Skip taste setup"
          size="sm"
          onClick={() => finish(false)}
        >
          <X size={16} />
        </IconButton>
      </header>
      <div className="chip-row">
        {options.map((o) => (
          <Chip
            key={o}
            pressed={interests.includes(o)}
            onClick={() =>
              setInterests(
                interests.includes(o)
                  ? interests.filter((i) => i !== o)
                  : [...interests, o],
              )
            }
          >
            {interests.includes(o) && <Check size={14} />} {o}
          </Chip>
        ))}
      </div>
      <div className="quickstart-pace">
        <span>Usual pace</span>
        <Segmented
          label="Usual pace"
          options={paces}
          value={pace as (typeof paces)[number][0]}
          onChange={setPace}
        />
      </div>
      <footer>
        <p className="muted-note">
          Saved on this device. Every trip can override it.
        </p>
        <div className="quickstart-actions">
          <Button size="sm" variant="ghost" onClick={() => finish(false)}>
            Skip
          </Button>
          <Button size="sm" variant="primary" onClick={() => finish(true)}>
            Save my taste
          </Button>
        </div>
      </footer>
    </section>
  );
}
