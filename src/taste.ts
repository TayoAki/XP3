import { places, type State, type Place } from "./model.ts";
export const dimensions = [
  "Easy pace",
  "Local food",
  "Art & culture",
  "Architecture",
  "Outdoor",
  "Indoor",
  "Good value",
  "Lively",
  "Cozy",
  "Walkable",
  "Food quality",
  "Service",
  "Quiet spaces",
];
export function learnedTaste(state: State) {
  const weights: Record<string, number> = {};
  for (const s of Object.values(state.tasteSignals || {})) {
    for (const tag of s.liked || []) weights[tag] = (weights[tag] || 0) + 2;
    for (const tag of s.disliked || []) weights[tag] = (weights[tag] || 0) - 2;
  }
  return weights;
}
export function tasteMatch(place: Place, state: State) {
  const weights = learnedTaste(state);
  const reasons = place.tags.filter(
    (t) => state.interests.includes(t) || weights[t] > 0,
  );
  const cautions = place.tags.filter((t) => weights[t] < 0);
  const pace = state.pace === "Relaxed" && place.tags.includes("Easy pace");
  const own = state.tasteSignals?.[place.id];
  const adjustment =
    reasons.length * 7 -
    cautions.length * 12 +
    (pace ? 5 : 0) +
    (own?.rating ? (own.rating - 3) * 6 : 0);
  return {
    score: Math.max(15, Math.min(95, 50 + adjustment)),
    reasons: [...reasons, ...(pace ? ["Relaxed pace"] : [])],
    cautions,
  };
}
export function rankedTaste(state: State) {
  return places
    .filter((p) => !state.lessLike?.includes(p.id))
    .map((p) => ({
      ...p,
      fit: tasteMatch(p, state).score,
      why:
        explainPlace(p, state).summary + " " + explainPlace(p, state).tradeoff,
    }))
    .sort((a, b) => b.fit - a.fit || a.name.localeCompare(b.name));
}
export function explainPlace(place: Place, state: State) {
  const match = tasteMatch(place, state),
    weights = learnedTaste(state);
  const factors = place.tags
    .filter((t) => state.interests.includes(t) || weights[t] > 0)
    .map((tag) => ({
      label: tag,
      points: 7,
      source: state.interests.includes(tag)
        ? weights[tag] > 0
          ? "Chosen preference + saved experience pattern"
          : "Chosen preference"
        : "Saved experience pattern",
      support: Object.entries(state.tasteSignals || {})
        .filter(([, s]) => s.liked?.includes(tag))
        .map(([id]) => places.find((p) => p.id === id)?.name || id),
    }));
  for (const tag of match.cautions)
    factors.push({
      label: `Avoid ${tag}`,
      points: -12,
      source: "Saved experience pattern",
      support: Object.entries(state.tasteSignals || {})
        .filter(([, s]) => s.disliked?.includes(tag))
        .map(([id]) => places.find((p) => p.id === id)?.name || id),
    });
  if (match.reasons.includes("Relaxed pace"))
    factors.push({
      label: "Relaxed pace",
      points: 5,
      source: "Chosen travel pace",
      support: [],
    });
  const own = state.tasteSignals?.[place.id];
  if (own?.rating)
    factors.push({
      label: `Your ${own.rating}/5 rating`,
      points: (own.rating - 3) * 6,
      source: "Your saved rating",
      support: [place.name],
    });
  const raw = 50 + factors.reduce((sum, f) => sum + f.points, 0);
  if (raw !== match.score)
    factors.push({
      label: "Demo score boundary",
      points: match.score - raw,
      source: "Score limited to 15–95",
      support: [],
    });
  const trip = state.trips.find((t) => t.id === state.activeId);
  const suitability: string[] = [];
  if (trip) {
    if (trip.excludedPlaces?.includes(place.id))
      suitability.push(
        "You marked this place as unsuitable for this trip. Your existing itinerary is unchanged; review before adding.",
      );
    if (place.kind === "stay") {
      const price = Number(place.price.match(/\d+/)?.[0]);
      suitability.push(
        price > trip.brief.budget
          ? `Exceeds your $${trip.brief.budget}/night target by $${price - trip.brief.budget}.`
          : `Sample nightly price fits your $${trip.brief.budget} target; taxes and availability are unverified.`,
      );
    } else
      suitability.push(
        `Allow ${place.duration}; route travel time and opening hours are unverified.`,
      );
    suitability.push(
      `Trip pace: ${trip.brief.pace}. Personal fit does not confirm a suitable time slot.`,
    );
  } else suitability.push("Choose a trip to check its budget and pace.");
  const uncertainty = [
    "Place attributes and aggregate ratings are fixtures, with no verified freshness.",
    "No verified similar-taste member-review evidence is connected.",
  ];
  if (state.disputedAttributes?.includes(place.id))
    uncertainty.unshift(
      "You flagged this place’s sample attributes as disputed. Verify them before relying on this fit score.",
    );
  if (!factors.length)
    uncertainty.unshift(
      "No matching personal signals yet. This is an exploration option.",
    );
  for (const tag of place.tags) {
    const likes = Object.values(state.tasteSignals || {}).filter((s) =>
        s.liked?.includes(tag),
      ).length,
      dislikes = Object.values(state.tasteSignals || {}).filter((s) =>
        s.disliked?.includes(tag),
      ).length;
    if (likes && dislikes)
      uncertainty.unshift(
        `Mixed feedback for ${tag}: ${likes} liked experiences and ${dislikes} disliked experiences.`,
      );
  }
  const summary = match.reasons.length
    ? `Fits ${match.reasons.slice(0, 2).join(" and ").toLowerCase()}.`
    : "An option to explore; not enough personal evidence yet.";
  const tradeoff = match.cautions.length
    ? `May conflict with your preference to avoid ${match.cautions.join(", ").toLowerCase()}.`
    : place.tags.includes("Outdoor")
      ? "Outdoor experience: weather may affect your visit."
      : "Check hours, total cost and availability before choosing.";
  return { ...match, factors, summary, tradeoff, suitability, uncertainty };
}
