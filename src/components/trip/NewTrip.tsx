import { Check, CircleAlert, RotateCcw, Sparkles } from "lucide-react";
import { useApp } from "../../app/context";
import { Button } from "../../ui";
import BriefForm from "../BriefForm";
import StartPlanning from "./StartPlanning";

/** #/trip/new: start → confirm the brief → generate. */
export default function NewTrip() {
  const app = useApp();
  const { brief, busy, generationError } = app;
  if (!brief && !busy)
    return (
      <div className="new-trip">
        <StartPlanning />
      </div>
    );
  return (
    <div className="new-trip">
      <div className="chat-thread">
        {brief && <div className="bubble bubble-user">{brief.prompt}</div>}
        {brief && !busy && (
          <BriefForm
            brief={brief}
            onChange={app.setBrief}
            onGenerate={app.generate}
            busy={busy}
          />
        )}
        {busy && (
          <section className="generating" role="status" aria-live="polite">
            <span className="assistant-mark">
              <Sparkles size={20} />
            </span>
            <div>
              <h2>Building your trip</h2>
              <ol className="generating-steps">
                <li>
                  <Check size={16} /> Brief confirmed
                </li>
                <li>
                  <Check size={16} /> Matching places to your taste
                </li>
                <li>
                  <span className="spinner" aria-hidden="true" /> Arranging
                  days, stays and the route
                </li>
              </ol>
              <div className="progress">
                <span />
              </div>
            </div>
            <Button onClick={app.cancelGeneration}>
              Cancel · keep my brief
            </Button>
          </section>
        )}
        {generationError && !busy && (
          <section className="generation-error" role="alert">
            <CircleAlert size={18} />
            <div>
              <strong>{generationError}</strong>
              <p>Your brief is safe. Retrying makes exactly one trip.</p>
            </div>
            <Button variant="primary" onClick={app.generate}>
              <RotateCcw size={16} /> Retry
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
