import { useState } from "react";
import { ArrowRight, Check, Heart, ShieldCheck } from "lucide-react";
export default function TasteSetup({
  interests,
  pace,
  onSave,
  onSkip,
}: {
  interests: string[];
  pace: string;
  onSave: (interests: string[], pace: string) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState([...interests]);
  const [speed, setSpeed] = useState(pace);
  return (
    <div className="taste-setup">
      <div
        className="setup-progress"
        aria-label={`Taste setup step ${step + 1} of 2`}
      >
        <span className="active" />
        <span className={step === 1 ? "active" : ""} />
        <small>{step + 1} of 2 · optional</small>
      </div>
      <span className="setup-symbol">
        <Heart size={25} />
      </span>
      <h3>
        {step === 0
          ? "What makes a place your kind of place?"
          : "A little room to breathe?"}
      </h3>
      <p>
        {step === 0
          ? "Pick the things you enjoy. You can change them anytime."
          : "Choose a starting pace for future trips. Every trip can have its own pace."}
      </p>
      {step === 0 ? (
        <div className="interest-options">
          {[
            "Local food",
            "Architecture",
            "Art & culture",
            "Hidden gems",
            "Nature",
            "Boutique hotels",
            "Nightlife",
            "Family friendly",
            "Wellness",
            "Good value",
          ].map((i) => (
            <button
              key={i}
              aria-pressed={choices.includes(i)}
              className={choices.includes(i) ? "selected" : ""}
              onClick={() =>
                setChoices((c) =>
                  c.includes(i) ? c.filter((x) => x !== i) : [...c, i],
                )
              }
            >
              {choices.includes(i) && <Check size={13} />} {i}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="pace-options">
            {["Relaxed", "Balanced", "Packed with discovery"].map((p) => (
              <button
                key={p}
                aria-pressed={speed === p}
                className={speed === p ? "selected" : ""}
                onClick={() => setSpeed(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="learned-summary">
            <strong>Your starting taste profile</strong>
            <div className="tags">
              {choices.length ? (
                choices.map((i) => <span key={i}>{i}</span>)
              ) : (
                <span>Open to discovery</span>
              )}
              <span>{speed} pace</span>
            </div>
            <p>
              Remembered for future briefs. Existing itineraries keep their own
              preferences.
            </p>
          </div>
        </>
      )}
      <p className="setup-privacy">
        <ShieldCheck size={15} /> Saved on this device. No account or location
        required.
      </p>
      <div className="dialog-actions">
        <button className="text-button" onClick={onSkip}>
          Skip for now
        </button>
        {step === 1 && (
          <button className="button secondary" onClick={() => setStep(0)}>
            Back
          </button>
        )}
        <button
          className="button primary"
          onClick={() => (step === 0 ? setStep(1) : onSave(choices, speed))}
        >
          {step === 0 ? "Continue" : "Save my taste"}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
