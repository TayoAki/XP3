import { MemberEvidence } from "./Inspiration";
import { useState, useEffect } from "react";
import {
  X,
  Bookmark,
  Check,
  Star,
  Clock,
  MapPin,
  ArrowUpRight,
  Sparkles,
  Plus,
  ThumbsUp,
  Flag,
  ChevronRight,
  Heart,
} from "lucide-react";
import { explainPlace } from "../taste";
import PhotoGallery from "./PhotoGallery";
import ResearchTools from "./ResearchTools";
import type { State, Place, Review } from "../model";
import { Photo } from "./PlaceCard";
import RouteMap from "./RouteMap";
export default function DetailPanel({
  place,
  saved,
  onClose,
  onSave,
  onAdd,
  onReview,
  onReport,
  onHelpful,
  onProfile,
  reviews,
  state,
  onChange,
  onOpen,
  onChoose,
  researchScope,
}: {
  researchScope: string;
  onChoose: (id: string) => void;
  state: State;
  onChange: (s: State) => void;
  onOpen: (id: string) => void;
  place: Place;
  saved: boolean;
  onClose: () => void;
  onSave: () => void;
  onAdd: () => void;
  onReview: () => void;
  onReport: () => void;
  onHelpful: () => void;
  onProfile: () => void;
  reviews: Review[];
}) {
  const [reviewFilter, setReviewFilter] = useState("All reviews");
  const [tab, setTab] = useState(() => {
    try {
      return (
        localStorage.getItem("xpmatch-detail-tab-" + place.id) || "Overview"
      );
    } catch {
      return "Overview";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("xpmatch-detail-tab-" + place.id, tab);
    } catch {}
  }, [tab, place.id]);
  const [question, setQuestion] = useState("");
  const own = reviews.filter((r) => r.placeId === place.id && r.public);
  return (
    <aside
      className="detail-panel"
      aria-label={`Trip details for ${place.name}`}
    >
      <div className="detail-heading">
        <div>
          <span className="eyebrow">YOUR RESEARCH SPACE</span>
          <h2>Trip details</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close trip details"
        >
          <X size={20} />
        </button>
      </div>
      <div className="detail-scroll">
        <div className="detail-photo">
          <PhotoGallery place={place} />

          <button
            className="save-button"
            onClick={onSave}
            aria-label={saved ? "Unsave place" : "Save place"}
          >
            {saved ? <Check size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
        <RouteMap ids={[place.id]} onSelect={() => {}} small />
        <div className="detail-intro">
          <span className="eyebrow">
            {place.kind === "stay"
              ? "WHERE TO STAY"
              : place.kind === "food"
                ? "A TABLE WORTH FINDING"
                : "SOMETHING TO EXPERIENCE"}
          </span>
          <h2>{place.name}</h2>
          <p className="location-line">
            <MapPin size={14} />
            {place.area}, Chicago
          </p>
          <div className="detail-rating">
            <Star size={15} fill="currentColor" />
            <strong>{place.rating}</strong>
            <span>{place.reviews.toLocaleString()} reviews</span>
            <span>·</span>
            <span>{place.price}</span>
          </div>
          <button className="research-link" onClick={() => setTab("Research")}>
            Why this fits · compare & take notes <Sparkles size={15} />
          </button>
          <div className="fit-explainer">
            <Sparkles size={18} />
            <div>
              <strong>{place.fit}/100 demo taste fit</strong>
              <p>{explainPlace(place, state).summary}</p>
              <small>{explainPlace(place, state).tradeoff}</small>
              <small>Demo rules · interests, ratings and pace</small>
            </div>
          </div>
        </div>
        <div className="detail-tabs" role="tablist" aria-label="Place research">
          {["Overview", "Reviews", "Research"].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="detail-body" role="tabpanel">
          {tab === "Overview" ? (
            <>
              <p>{place.description}</p>
              <MemberEvidence placeId={place.id} />
              <div className="tags">
                {place.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div className="facts">
                <div>
                  <Clock size={17} />
                  <span>
                    {place.kind === "stay" ? "Suggested stay" : "Allow about"}
                    <strong>{place.duration}</strong>
                  </span>
                </div>
                <div>
                  <MapPin size={17} />
                  <span>
                    Find it here<strong>{place.address}</strong>
                  </span>
                </div>
              </div>
              <div className="evidence-box">
                <strong>Practical facts</strong>
                <p>Opening hours: unknown · Availability: unverified</p>
                <p>Price: sample estimate · Cancellation terms: not supplied</p>
              </div>
              <h3>Good to know</h3>
              <ul className="clean-list">
                <li>Check opening hours and availability before you go.</li>
                <li>
                  {place.kind === "stay"
                    ? "Compare cancellation terms and total price, including taxes."
                    : "Keep a little breathing room before your next stop."}
                </li>
              </ul>
              <button
                className="research-link"
                onClick={() => setTab("Research")}
              >
                Go a little deeper <ArrowUpRight size={16} />
              </button>
            </>
          ) : tab === "Reviews" ? (
            <>
              <div className="section-line">
                <h3>People with similar taste</h3>
                <span className="mini-label">DEMO</span>
              </div>
              <label className="field-label">
                Review focus
                <select
                  value={reviewFilter}
                  onChange={(e) => setReviewFilter(e.target.value)}
                >
                  {[
                    "All reviews",
                    "Easy pace",
                    "Food quality",
                    "Service",
                    "Value",
                  ].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              {reviewFilter !== "All reviews" &&
                reviewFilter !== "Easy pace" && (
                  <p className="empty-inline">
                    No member reviews with verified {reviewFilter.toLowerCase()}{" "}
                    evidence are available in this preview.
                  </p>
                )}
              {(reviewFilter === "All reviews" ||
                reviewFilter === "Easy pace") && (
                <article className="member-review">
                  <button className="review-author" onClick={onProfile}>
                    <span className="avatar rose">ML</span>
                    <span>
                      <strong>Maya L.</strong>
                      <small>Similar taste · 8 shared ratings</small>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                  <div className="stars">
                    ★★★★★ <small>Visited last month</small>
                  </div>
                  <p>
                    Exactly the kind of place I love finding on a trip. We took
                    our time, enjoyed the details, and never felt rushed. I’d
                    happily come back.
                  </p>
                  <div className="tags">
                    <span>Easy pace</span>
                    <span>Worth the visit</span>
                  </div>
                  <div className="review-actions">
                    <button onClick={onHelpful}>
                      <ThumbsUp size={14} /> Helpful
                    </button>
                    <button onClick={onReport}>
                      <Flag size={14} /> Report
                    </button>
                  </div>
                </article>
              )}
              {reviewFilter === "All reviews" &&
                own.map((r) => (
                  <article className="member-review" key={r.id}>
                    <strong>Your review</strong>
                    <span className="stars"> {"★".repeat(r.rating)}</span>
                    <p>{r.text}</p>
                  </article>
                ))}
              <button className="button secondary full" onClick={onReview}>
                <Plus size={16} /> Write a review
              </button>
              <p className="fine-print">
                Sample reviews and ratings illustrate the journey. Your
                published demo reviews stay in this browser.
              </p>
            </>
          ) : (
            <>
              <ResearchTools
                place={place}
                state={state}
                onChange={onChange}
                onOpen={onOpen}
                onChoose={onChoose}
                researchScope={researchScope}
              />
              <h3>Make a confident choice</h3>
              <p>
                Explore the source, check the details, and decide whether it
                belongs in your trip.
              </p>
              <a
                className="research-link"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " Chicago")}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  <MapPin size={17} /> Find on Google Maps
                </span>
                <ArrowUpRight size={16} />
              </a>
              <a
                className="research-link"
                href={`https://www.google.com/search?q=${encodeURIComponent(place.name + " Chicago official website")}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>Official website & availability</span>
                <ArrowUpRight size={16} />
              </a>
              <h3>Questions worth asking</h3>
              {[
                "Does this fit our pace?",
                "What should we book in advance?",
                "What’s nearby?",
              ].map((q) => (
                <button
                  key={q}
                  className="question-row"
                  onClick={() => setQuestion(q)}
                >
                  {q}
                  <ArrowUpRight size={15} />
                </button>
              ))}
              {question && (
                <div className="research-answer" role="status">
                  <strong>{question}</strong>
                  <p>
                    {question === "Does this fit our pace?"
                      ? `${place.why} Allow ${place.duration} and leave time between stops.`
                      : question === "What should we book in advance?"
                        ? place.kind === "stay"
                          ? "Check the exact dates, full price and cancellation terms before reserving. This preview does not check availability."
                          : "Check the official site for timed tickets or restaurant reservations. Live availability is not checked in this preview."
                        : `Explore nearby options in ${place.area} on the itinerary map, or open Google Maps above for current local information.`}
                  </p>
                </div>
              )}
              <p className="fine-print">
                Prices, images, and match scores are illustrative. Live research
                opens an external site.
              </p>
            </>
          )}
        </div>
      </div>
      <div className="detail-footer">
        <button className="button primary full" onClick={onAdd}>
          {place.kind === "stay" ? <Heart size={17} /> : <Plus size={17} />}{" "}
          {place.kind === "stay" ? "Choose this stay" : "Add to itinerary"}
        </button>
      </div>
    </aside>
  );
}
