import { ArrowRight, Coffee, Navigation, ShieldCheck } from "lucide-react";
import { useApp } from "../../app/context";
import { samplePrompt } from "../../model";
import { Button } from "../../ui";
import Composer from "./Composer";
import TasteQuickStart from "../TasteQuickStart";

const starters: [typeof Coffee, string, string][] = [
  [Coffee, "A food-filled city weekend", samplePrompt],
  [
    Navigation,
    "Somewhere to slow down",
    "A relaxed three-day Chicago trip for two adults with art and architecture and a $200 nightly hotel budget. No flights.",
  ],
];

/** The empty state for planning: one sentence to start, or a sample trip. */
export default function StartPlanning({
  heading = true,
}: {
  heading?: boolean;
}) {
  const app = useApp();
  const start = (text: string) => {
    app.submit(text);
  };
  return (
    <div className="start-planning">
      {heading && (
        <div className="start-head">
          <h2>Where to next?</h2>
          <p>
            Describe the trip in a sentence. You’ll see what I understood before
            anything is built.
          </p>
        </div>
      )}
      <div className="start-composer">
        <Composer
          draftKey="new"
          busy={app.busy}
          placeholder="e.g. Three relaxed days in Chicago for two, local food and architecture, under $200 a night"
          onSend={start}
        />
      </div>
      <div className="start-options">
        {starters.map(([Icon, label, text]) => (
          <Button key={label} onClick={() => start(text)}>
            <Icon size={16} /> {label}
          </Button>
        ))}
        <Button variant="ghost" onClick={app.startSample}>
          Try a sample Chicago trip <ArrowRight size={16} />
        </Button>
      </div>
      <TasteQuickStart />
      <p className="start-note">
        <ShieldCheck size={14} /> No account needed. Plans are saved on this
        device.
      </p>
    </div>
  );
}
