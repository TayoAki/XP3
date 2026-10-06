import { useState } from "react";
import { members, sharedItineraries, memberEvidence } from "../inspiration";
import { getPlace, type State } from "../model";
import type { Action } from "./Planner";
export function MemberEvidence({ placeId }: { placeId: string }) {
  const evidence = memberEvidence(placeId);
  const [profile, setProfile] = useState(false);
  if (!evidence) return null;
  return (
    <section className="member-evidence">
      <span className="eyebrow">SAMPLE MEMBER EXPERIENCE</span>
      <button
        className="text-button"
        onClick={() => setProfile(!profile)}
        aria-expanded={profile}
      >
        {evidence.member.name} · View taste & history
      </button>
      <p>{evidence.tip}</p>
      <small>
        Member rating {evidence.rating}/5 · separate from your personal fit
      </small>
      <p className="muted">Check before going: {evidence.caveat}</p>
      {profile && (
        <div>
          <strong>{evidence.member.style}</strong>
          <p>{evidence.member.bio}</p>
          <p>{evidence.member.caveat}</p>
          <span>Source: {evidence.source.name}</span>
          <ul>
            {evidence.source.days.map((day, i) => (
              <li key={i}>
                Day {i + 1}: {day.map((id) => getPlace(id).name).join(" → ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
export default function Inspiration({
  state,
  onChange,
  action,
  savedOnly = false,
}: {
  state: State;
  onChange: (s: State) => void;
  action: Action;
  savedOnly?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  const trips = sharedItineraries.filter(
    (t) => !savedOnly || state.savedItineraries?.includes(t.id),
  );
  const source = sharedItineraries.find((t) => t.id === selected);
  const member = members.find((m) => m.id === author);
  return (
    <section className="inspiration">
      <header>
        <span className="eyebrow">MEMBER INSPIRATION · SAMPLE CONTENT</span>
        <h2>
          {savedOnly
            ? "Saved itineraries"
            : "Travel through another person’s eyes"}
        </h2>
        <p>
          Explore the advice behind a trip, then make a reviewed personal copy.
        </p>
      </header>
      <div className="itinerary-grid">
        {trips.map((t) => (
          <article className="inspiration-card" key={t.id}>
            <img
              src={getPlace(t.days[0][0]).image}
              alt="Illustrative Chicago photography; not a member upload"
            />
            <div>
              <small>3 days · Chicago · sample itinerary</small>
              <h3>{t.name}</h3>
              <button
                className="text-button"
                onClick={() => setAuthor(t.memberId)}
              >
                By {members.find((m) => m.id === t.memberId)?.name} · View
                profile
              </button>
              <p>{t.summary}</p>
              <button
                className="btn btn-secondary btn-md"
                aria-pressed={!!state.savedItineraries?.includes(t.id)}
                onClick={() =>
                  onChange({
                    ...state,
                    savedItineraries: state.savedItineraries?.includes(t.id)
                      ? state.savedItineraries.filter((id) => id !== t.id)
                      : [...(state.savedItineraries || []), t.id],
                  })
                }
              >
                {state.savedItineraries?.includes(t.id)
                  ? "Unsave itinerary"
                  : "Save itinerary"}
              </button>
              <button
                className="button primary"
                onClick={() => setSelected(t.id)}
              >
                Use this itinerary
              </button>
            </div>
          </article>
        ))}
      </div>
      {!trips.length && (
        <div className="member-evidence">
          <h3>No saved itineraries yet</h3>
          <p>
            Keep inspiration here before deciding what becomes your own trip.
          </p>
          <button className="button primary" onClick={() => action("discover")}>
            Explore member itineraries
          </button>
        </div>
      )}
      {member && (
        <section className="member-evidence">
          <button className="text-button" onClick={() => setAuthor(null)}>
            Close member profile
          </button>
          <h3>{member.name} · fictional member</h3>
          <button
            className="button primary"
            onClick={() => action("message-member", member.id)}
          >
            Message {member.name}
          </button>
          <p>{member.bio}</p>
          <strong>{member.style}</strong>
          <p>{member.caveat}</p>
          <p>
            Shared sample itineraries:{" "}
            {sharedItineraries
              .filter((t) => t.memberId === member.id)
              .map((t) => t.name)
              .join(", ")}
          </p>
        </section>
      )}
      {source && (
        <section className="member-evidence">
          <h3>Review your copy: {source.name}</h3>
          <p>
            Source stays unchanged. No bookings are made. Photos, reviews and
            prices are samples.
          </p>
          <ol>
            {source.days.map((day, i) => (
              <li key={i}>{day.map((id) => getPlace(id).name).join(" → ")}</li>
            ))}
          </ol>
          <p>{source.caveat}</p>
          <button
            className="btn btn-secondary btn-md"
            onClick={() => {
              action("inspiration-ideas", source.id);
              setSelected(null);
            }}
          >
            Keep an undated Ideas copy
          </button>
          <button
            className="button primary"
            onClick={() => {
              action("inspiration-plan", source.id);
              setSelected(null);
            }}
          >
            Review dates & trip brief
          </button>
          <button className="text-button" onClick={() => setSelected(null)}>
            Cancel copy
          </button>
        </section>
      )}
    </section>
  );
}
