import { useState } from "react";
import {
  ArrowRight,
  Check,
  CircleHelp,
  Sparkles,
  UserRound,
  MapPin,
  CalendarDays,
  Heart,
  Plane,
} from "lucide-react";
import type { Brief, BriefField, FieldStatus } from "../model";
import { statusLabel } from "../briefLogic";
import { Button, Chip } from "../ui";

const interestOptions = [
  "Local food",
  "Architecture",
  "Art & culture",
  "Hidden gems",
  "Nature",
  "Good value",
  "Nightlife",
];

function StatusTag({ status }: { status?: FieldStatus }) {
  const s = status || "assumed";
  return <span className={`field-status is-${s}`}>{statusLabel[s]}</span>;
}

/**
 * The brief the assistant understood, as a checklist. Every field shows
 * whether it was confirmed, came from the profile, was assumed, or is unknown;
 * editing a field confirms it.
 */
export default function BriefForm({
  brief,
  onChange,
  onGenerate,
  busy,
}: {
  brief: Brief;
  onChange: (brief: Brief) => void;
  onGenerate: () => void;
  busy?: boolean;
}) {
  const [originDraft, setOriginDraft] = useState("");
  const status = brief.status || {};
  const set = (field: BriefField, patch: Partial<Brief>) =>
    onChange({
      ...brief,
      ...patch,
      status: { ...status, [field]: "confirmed" },
    });
  const length =
    Math.round((Date.parse(brief.end) - Date.parse(brief.start)) / 86400000) +
    1;
  const datesOk =
    brief.start && brief.end && brief.end >= brief.start && length <= 7;
  const valid = datesOk && brief.travelers >= 1 && brief.budget > 0;
  const confirmedCount = (
    ["where", "from", "who", "when", "what"] as BriefField[]
  ).filter((f) => status[f] === "confirmed" || status[f] === "profile").length;

  return (
    <section className="brief-card" aria-labelledby="brief-title">
      <header className="brief-head">
        <span className="assistant-mark">
          <Sparkles size={18} />
        </span>
        <div>
          <h2 id="brief-title">Here’s what I understood</h2>
          <p>
            {confirmedCount} of 5 details confirmed. Check anything marked
            assumed or unknown, then build the trip.
          </p>
        </div>
      </header>

      <ol className="brief-list">
        <li>
          <MapPin size={18} />
          <div className="brief-field">
            <div className="brief-label">
              <strong>Where to</strong>
              <StatusTag status={status.where} />
            </div>
            <p>
              Chicago{" "}
              <span className="muted-note">
                · the only city in this preview
              </span>
            </p>
          </div>
        </li>
        <li>
          <Plane size={18} />
          <div className="brief-field">
            <div className="brief-label">
              <strong>Where from</strong>
              <StatusTag status={status.from} />
            </div>
            {status.from === "unknown" || /unknown/i.test(brief.origin) ? (
              <div className="origin-entry">
                <p>Not mentioned. I won’t guess or add travel to Chicago.</p>
                <div className="origin-actions">
                  <Button
                    size="sm"
                    onClick={() =>
                      set("from", { origin: "Already there · no flights" })
                    }
                  >
                    I’m already there
                  </Button>
                  <form
                    className="origin-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (originDraft.trim())
                        set("from", {
                          origin: `From ${originDraft.trim()} · travel not included`,
                        });
                    }}
                  >
                    <label className="sr-only" htmlFor="origin-city">
                      Departure city
                    </label>
                    <input
                      id="origin-city"
                      value={originDraft}
                      onChange={(e) => setOriginDraft(e.target.value)}
                      placeholder="Or type a city"
                    />
                    <Button
                      size="sm"
                      type="submit"
                      disabled={!originDraft.trim()}
                    >
                      Set
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <p>
                {brief.origin}{" "}
                <button
                  className="link-button"
                  onClick={() => set("from", { origin: "Unknown" })}
                >
                  Change
                </button>
              </p>
            )}
          </div>
        </li>
        <li>
          <UserRound size={18} />
          <div className="brief-field">
            <div className="brief-label">
              <label htmlFor="brief-travelers">
                <strong>Who’s coming</strong>
              </label>
              <StatusTag status={status.who} />
            </div>
            <div className="brief-inputs">
              <input
                id="brief-travelers"
                type="number"
                min="1"
                max="12"
                value={brief.travelers}
                onChange={(e) =>
                  set("who", { travelers: Number(e.target.value) })
                }
              />
              <span className="muted-note">travelers</span>
            </div>
          </div>
        </li>
        <li>
          <CalendarDays size={18} />
          <div className="brief-field">
            <div className="brief-label">
              <strong>When</strong>
              <StatusTag status={status.when} />
            </div>
            <div className="brief-inputs">
              <label>
                <span className="sr-only">Start date</span>
                <input
                  type="date"
                  value={brief.start}
                  onChange={(e) => set("when", { start: e.target.value })}
                />
              </label>
              <span aria-hidden="true">→</span>
              <label>
                <span className="sr-only">End date</span>
                <input
                  type="date"
                  min={brief.start}
                  value={brief.end}
                  onChange={(e) => set("when", { end: e.target.value })}
                />
              </label>
            </div>
            {datesOk ? (
              <p className="muted-note">{length} days</p>
            ) : (
              <p className="form-error" role="alert">
                Choose one to seven days; the end can’t be before the start.
              </p>
            )}
          </div>
        </li>
        <li>
          <Heart size={18} />
          <div className="brief-field">
            <div className="brief-label">
              <strong>What you’re after</strong>
              <StatusTag status={status.what} />
            </div>
            <div className="chip-row">
              {[...new Set([...interestOptions, ...brief.interests])].map(
                (i) => (
                  <Chip
                    key={i}
                    pressed={brief.interests.includes(i)}
                    onClick={() =>
                      set("what", {
                        interests: brief.interests.includes(i)
                          ? brief.interests.filter((x) => x !== i)
                          : [...brief.interests, i],
                      })
                    }
                  >
                    {brief.interests.includes(i) && <Check size={14} />} {i}
                  </Chip>
                ),
              )}
            </div>
            <p className="muted-note">
              For this trip only. Your taste profile isn’t changed.
            </p>
          </div>
        </li>
      </ol>

      <div className="brief-extras">
        <label>
          <span className="brief-label">
            <strong>Hotel budget / night</strong>
            <StatusTag status={status.budget} />
          </span>
          <input
            type="number"
            min="1"
            value={brief.budget}
            onChange={(e) => set("budget", { budget: Number(e.target.value) })}
          />
        </label>
        <label>
          <span className="brief-label">
            <strong>Pace</strong>
            <StatusTag status={status.pace} />
          </span>
          <select
            value={brief.pace}
            onChange={(e) => set("pace", { pace: e.target.value })}
          >
            {["Relaxed", "Balanced", "Packed with discovery"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>

      <footer className="brief-foot">
        <p className="muted-note">
          <CircleHelp size={14} /> Sample Chicago data. Nothing is booked.
        </p>
        <Button
          variant="primary"
          disabled={!valid || busy}
          onClick={onGenerate}
        >
          Build my trip <ArrowRight size={18} />
        </Button>
      </footer>
    </section>
  );
}
