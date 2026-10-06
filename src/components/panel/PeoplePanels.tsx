import {
  Bookmark,
  BookmarkCheck,
  CalendarPlus,
  Lightbulb,
  Star,
  BedDouble,
} from "lucide-react";
import { useApp } from "../../app/context";
import { getPlace } from "../../model";
import {
  memberById,
  sampleReviews,
  sharedItineraries,
} from "../../inspiration";
import { isItinerarySaved, toggleItinerarySaved } from "../../collections";
import { parseBrief } from "../../briefLogic";
import { Button, Panel, Section } from "../../ui";

/** One profile view for a member, wherever they’re linked from. */
export function MemberPanel({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const app = useApp();
  const member = memberById(id);
  if (!member)
    return (
      <Panel title="Member not found" onClose={onClose}>
        <p className="muted-note">This sample member isn’t available.</p>
      </Panel>
    );
  const mine = new Set([
    ...app.state.interests,
    ...Object.values(app.state.tasteSignals || {}).flatMap(
      (s) => s.liked || [],
    ),
  ]);
  const shared = member.likes.filter((l) => mine.has(l));
  const reviews = sampleReviews.filter((r) => r.memberId === id);
  const trips = sharedItineraries.filter((t) => t.memberId === id);
  return (
    <Panel
      title={member.name}
      subtitle="Fictional sample member"
      onClose={onClose}
    >
      <div className="member-head">
        <span className="avatar-mark large">{member.initials}</span>
        <div>
          <p>{member.bio}</p>
          <p className="muted-note">{member.style}</p>
        </div>
      </div>
      <Section title="Taste in common" className="panel-section">
        {shared.length ? (
          <p>
            You both like <strong>{shared.join(", ").toLowerCase()}</strong>.
          </p>
        ) : (
          <p className="muted-note">
            Nothing in common with your taste profile yet.
          </p>
        )}
        <p className="muted-note">Worth knowing: {member.caveat}</p>
      </Section>
      {trips.length > 0 && (
        <Section title="Itineraries" className="panel-section">
          <ul className="mention-list">
            {trips.map((t) => (
              <li key={t.id}>
                <button
                  className="link-button"
                  onClick={() => app.openPanel({ kind: "itinerary", id: t.id })}
                >
                  {t.name}
                </button>
                <span className="muted-note">{t.days.length} days</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title={`Reviews · ${reviews.length}`} className="panel-section">
        <ul className="review-list">
          {reviews.map((r) => (
            <li className="review" key={r.id}>
              <button
                className="link-button"
                onClick={() => app.openPanel({ kind: "place", id: r.placeId })}
              >
                {getPlace(r.placeId).name}
              </button>
              <p className="review-rating">
                <span className="stars" aria-label={`${r.rating} out of 5`}>
                  {Array.from({ length: r.rating }, (_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </span>
                {r.visited}
              </p>
              <p>{r.text}</p>
            </li>
          ))}
        </ul>
      </Section>
    </Panel>
  );
}

/** A member itinerary: preview it, save it, or make your own copy. */
export function ItineraryPanel({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const app = useApp();
  const source = sharedItineraries.find((t) => t.id === id);
  if (!source)
    return (
      <Panel title="Itinerary not found" onClose={onClose}>
        <p className="muted-note">This sample itinerary isn’t available.</p>
      </Panel>
    );
  const author = memberById(source.memberId)!;
  const saved = isItinerarySaved(app.state, id);
  const makeTrip = () => {
    const brief = parseBrief(
      `Adapt ${source.name} for me in Chicago. ${source.caveat}`,
      {
        interests: app.state.interests,
        pace: app.state.pace,
      },
    );
    app.setBrief({
      ...brief,
      sourceItineraryId: source.id,
      status: { ...brief.status, where: "confirmed" },
    });
    app.go({ view: "trip", id: "new", tab: "itinerary" }, null);
  };
  const copyIdeas = () => {
    const collectionId = crypto.randomUUID();
    app.setState((s) => ({
      ...s,
      collections: [
        ...(s.collections || []),
        {
          id: collectionId,
          name: `${source.name} · ideas`,
          placeIds: [...new Set(source.days.flat())],
          note: `Copied from ${author.name}’s sample itinerary. ${source.caveat}`,
          dayGroups: source.days.map((places, i) => ({
            id: `source-day-${i}`,
            title: `Day ${i + 1}`,
            places: [...places],
          })),
        },
      ],
    }));
    app.go({ view: "saved", collection: collectionId }, null);
    app.notify("Copied as undated ideas. The original itinerary is unchanged.");
  };
  return (
    <Panel
      title={source.name}
      subtitle={`${source.days.length} days · sample itinerary`}
      onClose={onClose}
      footer={
        <>
          <Button
            aria-pressed={saved}
            onClick={() => {
              app.setState((s) => toggleItinerarySaved(s, id));
              app.notify(saved ? "Removed from Saved." : "Saved under Saved.");
            }}
          >
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            {saved ? "Saved" : "Save"}
          </Button>
          <Button variant="primary" onClick={makeTrip}>
            <CalendarPlus size={18} /> Make it my trip
          </Button>
        </>
      }
    >
      <button
        className="review-author"
        onClick={() => app.openPanel({ kind: "member", id: author.id })}
      >
        <span className="avatar-mark small">{author.initials}</span>
        <span>
          <strong>{author.name}</strong>
          <small>{author.style}</small>
        </span>
      </button>
      <p>{source.summary}</p>
      <Section title="Days" className="panel-section">
        <ol className="itinerary-days">
          {source.days.map((day, i) => (
            <li key={i}>
              <strong>Day {i + 1}</strong>
              <span>
                {day.map((pid, j) => (
                  <span key={pid}>
                    {j > 0 && " → "}
                    <button
                      className="link-button"
                      onClick={() => app.openPanel({ kind: "place", id: pid })}
                    >
                      {getPlace(pid).name}
                    </button>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ol>
        <p className="muted-note">
          <BedDouble size={14} /> Base: {getPlace(source.stayId).name}
        </p>
      </Section>
      <Section title="Check before you copy" className="panel-section">
        <p>{source.caveat}</p>
        <p className="muted-note">
          “Make it my trip” starts a brief you confirm first. Copying never
          changes the original.
        </p>
        <Button onClick={copyIdeas}>
          <Lightbulb size={16} /> Copy as undated ideas instead
        </Button>
      </Section>
    </Panel>
  );
}
