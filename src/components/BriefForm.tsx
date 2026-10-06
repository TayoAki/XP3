import { Sparkles, Check, ArrowRight } from "lucide-react";
import type { Brief } from "../model";
export default function BriefForm({
  brief,
  onChange,
  onGenerate,
}: {
  brief: Brief;
  onChange: (brief: Brief) => void;
  onGenerate: () => void;
}) {
  const set = (key: keyof Brief, value: unknown) =>
    onChange({ ...brief, [key]: value });
  const valid =
    brief.start &&
    brief.end &&
    brief.end >= brief.start &&
    brief.travelers >= 1 &&
    brief.budget > 0 &&
    (Date.parse(brief.end)-Date.parse(brief.start))/86400000 <= 6;
  return (
    <div className="brief-card">
      <div className="brief-title">
        <span className="assistant-icon">
          <Sparkles size={18} />
        </span>
        <div>
          <h2>A good trip starts with your kind of things.</h2>
          <p>I’ve put your brief together. Make it yours before we build.</p>
        </div>
      </div>
      <span className="mini-label">EDITABLE TRIP BRIEF · THIS TRIP ONLY</span>
      <div className="brief-assumptions"><strong>A starting point, not a guess you’re stuck with.</strong><p>Dates, party size and budget use demo defaults unless supplied. Interests and pace start from your taste profile. Review every field before building.</p></div>
      <div className="brief-grid">
        <label>
          Destination
          <select
            value={brief.destination}
            onChange={(e) => set("destination", e.target.value)}
          >
            <option>Chicago</option>
          </select>
        </label>
        <label>
          Travelers
          <input
            type="number"
            min="1"
            max="12"
            value={brief.travelers}
            onChange={(e) => set("travelers", Number(e.target.value))}
          />
        </label>
        <label>
          Start date
          <input
            type="date"
            value={brief.start}
            onChange={(e) => set("start", e.target.value)}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            min={brief.start}
            value={brief.end}
            onChange={(e) => set("end", e.target.value)}
          />
        </label>
        <label>
          Hotel budget / night
          <input
            type="number"
            min="1"
            value={brief.budget}
            onChange={(e) => set("budget", Number(e.target.value))}
          />
        </label>
        <label>
          Your pace
          <select
            value={brief.pace}
            onChange={(e) => set("pace", e.target.value)}
          >
            {["Relaxed", "Balanced", "Packed with discovery"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="brief-interests">
        <span className="field-label">What you’re after</span>
        <div className="interest-options">
          {[...new Set(["Local food","Architecture","Art & culture","Hidden gems","Nature","Good value",...brief.interests])].map(i=><button key={i} aria-pressed={brief.interests.includes(i)} className={brief.interests.includes(i)?"selected":""} onClick={()=>set("interests",brief.interests.includes(i)?brief.interests.filter(x=>x!==i):[...brief.interests,i])}>{brief.interests.includes(i)&&<Check size={12}/>} {i}</button>)}
        </div>
      </div>
      <div className="brief-origin">
        <Check size={15} />
        {brief.origin}
        <span>No flights will be added</span>
      </div>
      <p className="fine-print">
        Chicago is the interactive demo destination. Dates and preferences are
        editable; recommendations use sample data. Maximum preview length: 7
        days.
      </p>
      {!valid && (
        <p role="alert" className="form-error">
          Choose one to seven days, at least one traveler, and a positive budget.
        </p>
      )}
      <button className="button primary" disabled={!valid} onClick={onGenerate}>
        Build my itinerary <ArrowRight size={17} />
      </button>
    </div>
  );
}
