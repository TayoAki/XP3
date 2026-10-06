// Fictional sample members, itineraries and reviews. Everything here is
// labelled as sample content in the UI; none of it is a real person.
export type Member = {
  id: string;
  name: string;
  initials: string;
  style: string;
  bio: string;
  likes: string[];
  caveat: string;
};

export const members: Member[] = [
  {
    id: "maya",
    name: "Maya Chen",
    initials: "MC",
    style: "Architecture · easy walks · independent cafés",
    bio: "Prefers a few thoughtful stops and time to notice the city.",
    likes: ["Architecture", "Easy pace", "Quiet spaces", "Walkable"],
    caveat:
      "Avoids packed days; her advice may be less useful for nightlife trips.",
  },
  {
    id: "leo",
    name: "Leo Martin",
    initials: "LM",
    style: "Food · museums · neighbourhood exploring",
    bio: "Builds weekends around food and culture.",
    likes: ["Local food", "Food quality", "Art & culture", "Lively"],
    caveat:
      "Enjoys busy neighbourhoods; quiet-space seekers should check the tradeoffs.",
  },
  {
    id: "priya",
    name: "Priya Nair",
    initials: "PN",
    style: "Good value · quiet spaces · long walks",
    bio: "Travels on a budget and plans around walking routes.",
    likes: ["Good value", "Quiet spaces", "Walkable", "Outdoor"],
    caveat: "Skips most paid attractions, so she rarely reviews tours.",
  },
  {
    id: "sam",
    name: "Sam Rivera",
    initials: "SR",
    style: "Late dinners · lively bars · service",
    bio: "Plans days around where to eat and drink at night.",
    likes: ["Lively", "Service", "Food quality", "Local food"],
    caveat: "Rates atmosphere highly; less useful for early, quiet mornings.",
  },
];

export type SharedItinerary = {
  id: string;
  memberId: string;
  name: string;
  summary: string;
  days: string[][];
  stayId: string;
  caveat: string;
};

export const sharedItineraries: SharedItinerary[] = [
  {
    id: "architecture-weekend",
    memberId: "maya",
    name: "Chicago, with room to wander",
    summary: "Architecture, a river walk and art across three relaxed days.",
    days: [
      ["river", "walk"],
      ["art", "gage"],
      ["bean", "cultural"],
    ],
    stayId: "hotel-river",
    caveat: "Cruise departures and museum hours need checking for your dates.",
  },
  {
    id: "food-culture",
    memberId: "leo",
    name: "A food and culture weekend",
    summary: "Neighbourhood meals, museums and classic Chicago stops.",
    days: [
      ["art", "purple"],
      ["bean", "pizza"],
      ["cultural", "gage"],
    ],
    stayId: "hotel-loop",
    caveat: "Restaurant reservations and dietary suitability are unverified.",
  },
];

export type SampleReview = {
  id: string;
  placeId: string;
  memberId: string;
  rating: number;
  visited: string;
  text: string;
  /** Qualities the reviewer explicitly called out. */
  qualities: string[];
};

export const sampleReviews: SampleReview[] = [
  {
    id: "r1",
    placeId: "river",
    memberId: "maya",
    rating: 5,
    visited: "Sep 2026",
    text: "The best way to see the buildings without walking all day. Sit on the left going out.",
    qualities: ["Architecture", "Easy pace"],
  },
  {
    id: "r2",
    placeId: "river",
    memberId: "priya",
    rating: 3,
    visited: "Aug 2026",
    text: "Beautiful, but pricey for 90 minutes. The free Riverwalk covers some of the same views.",
    qualities: ["Good value", "Outdoor"],
  },
  {
    id: "r3",
    placeId: "gage",
    memberId: "leo",
    rating: 5,
    visited: "Sep 2026",
    text: "Excellent food and a warm room. Book ahead on weekends.",
    qualities: ["Food quality", "Local food", "Cozy"],
  },
  {
    id: "r4",
    placeId: "gage",
    memberId: "sam",
    rating: 4,
    visited: "Jul 2026",
    text: "Great bar staff and a lively evening crowd. Can get loud after 8.",
    qualities: ["Service", "Lively"],
  },
  {
    id: "r5",
    placeId: "gage",
    memberId: "maya",
    rating: 4,
    visited: "Jun 2026",
    text: "Calm at lunchtime, a good pause between the park and the museum.",
    qualities: ["Quiet spaces", "Easy pace"],
  },
  {
    id: "r6",
    placeId: "art",
    memberId: "leo",
    rating: 5,
    visited: "Sep 2026",
    text: "Pick two wings, not the whole museum. The Thorne rooms are a quiet favourite.",
    qualities: ["Art & culture", "Quiet spaces"],
  },
  {
    id: "r7",
    placeId: "art",
    memberId: "priya",
    rating: 4,
    visited: "May 2026",
    text: "Worth the ticket if you plan a route. Free evenings fill up fast.",
    qualities: ["Good value", "Art & culture"],
  },
  {
    id: "r8",
    placeId: "pizza",
    memberId: "sam",
    rating: 4,
    visited: "Aug 2026",
    text: "Deep dish worth the wait once. Quick, friendly service.",
    qualities: ["Local food", "Service"],
  },
  {
    id: "r9",
    placeId: "pizza",
    memberId: "priya",
    rating: 4,
    visited: "Apr 2026",
    text: "Good value for a filling meal; share one pie between two.",
    qualities: ["Good value", "Local food"],
  },
  {
    id: "r10",
    placeId: "purple",
    memberId: "sam",
    rating: 5,
    visited: "Sep 2026",
    text: "Small plates, buzzing room, great for a late dinner.",
    qualities: ["Lively", "Food quality"],
  },
  {
    id: "r11",
    placeId: "purple",
    memberId: "maya",
    rating: 3,
    visited: "Mar 2026",
    text: "Food was lovely but it’s loud and busy. Not for a slow evening.",
    qualities: ["Food quality"],
  },
  {
    id: "r12",
    placeId: "walk",
    memberId: "priya",
    rating: 5,
    visited: "Aug 2026",
    text: "Free, walkable and easy to combine with the cruise or a café.",
    qualities: ["Walkable", "Good value", "Outdoor"],
  },
  {
    id: "r13",
    placeId: "bean",
    memberId: "maya",
    rating: 4,
    visited: "Sep 2026",
    text: "Go early before the crowds. Lovely for a slow morning.",
    qualities: ["Easy pace", "Outdoor"],
  },
  {
    id: "r14",
    placeId: "cultural",
    memberId: "priya",
    rating: 5,
    visited: "Jul 2026",
    text: "Free and quiet, with the Tiffany dome. A good rainy-day stop.",
    qualities: ["Quiet spaces", "Indoor", "Good value"],
  },
  {
    id: "r15",
    placeId: "hotel-loop",
    memberId: "leo",
    rating: 4,
    visited: "Sep 2026",
    text: "Central and walkable to most stops; rooms on the small side.",
    qualities: ["Walkable", "Good value"],
  },
  {
    id: "r16",
    placeId: "hotel-river",
    memberId: "maya",
    rating: 5,
    visited: "Aug 2026",
    text: "Quiet rooms and a short walk to the river. A calm base.",
    qualities: ["Quiet spaces", "Walkable"],
  },
];

export const memberById = (id: string) => members.find((m) => m.id === id);
export const reviewsFor = (placeId: string) =>
  sampleReviews.filter((r) => r.placeId === placeId);

/** Mentions of a place inside member itineraries (provenance). */
export const mentionsOf = (placeId: string) =>
  sharedItineraries.filter(
    (t) => t.days.flat().includes(placeId) || t.stayId === placeId,
  );

/** Legacy helper: one sample member experience for a place. */
export const memberEvidence = (id: string) => {
  const source = mentionsOf(id)[0];
  return source
    ? {
        source,
        member: memberById(source.memberId)!,
        rating: id === "walk" ? 5 : 4,
        tip:
          id === "river"
            ? "Leave time before departure and keep the rest of the afternoon flexible."
            : id === "art"
              ? "Choose a few galleries instead of trying to see everything."
              : "Combine nearby stops and leave room for an unplanned break.",
        caveat: source.caveat,
      }
    : null;
};
