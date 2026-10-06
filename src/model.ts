import type { Conversation } from "./components/Inbox";
import type { EditProposal } from "./proposals";
export type Collection = {
  id: string;
  name: string;
  placeIds: string[];
  note: string;
  archived?: boolean;
  dayGroups?: Day[];
  sourceTripId?: string;
};
export type Page =
  | "connected"
  | "messages"
  | "home"
  | "ideas"
  | "plan"
  | "trips"
  | "discover"
  | "saved"
  | "taste"
  | "community"
  | "settings"
  | "notifications"
  | "moderation";
export type Place = {
  photos?: { src: string; caption: string; source: string }[];
  id: string;
  name: string;
  kind: "stay" | "food" | "experience";
  area: string;
  image: string;
  rating: number;
  reviews: number;
  fit: number;
  price: string;
  duration: string;
  description: string;
  why: string;
  tags: string[];
  x: number;
  y: number;
  address: string;
};
export type Brief = {
  sourceItineraryId?: string;
  collectionId?: string;
  ideaIds?: string[];
  destination: string;
  start: string;
  end: string;
  travelers: number;
  budget: number;
  pace: string;
  interests: string[];
  origin: string;
  prompt: string;
};
export type Day = { id: string; title: string; places: string[] };
export type Message = { role: "user" | "assistant"; text: string };
export type Trip = {
  sourceItineraryId?: string;
  conversion?: { collectionId: string; placeIds: string[] };
  revision?: number;
  excludedPlaces?: string[];
  stayId?: string;
  id: string;
  name: string;
  brief: Brief;
  days: Day[];
  messages: Message[];
  status: "planning" | "traveling" | "complete" | "archived";
  bookings: { name: string; reference: string; note: string }[];
  partners: string[];
  comments: string[];
};
export type Review = {
  id: string;
  placeId: string;
  text: string;
  rating: number;
  public: boolean;
  helpful: boolean;
  reported: boolean;
};
export type State = {
  conversations?: Conversation[];
  activeConversation?: string;
  blockedMembers?: string[];
  messageReports?: string[];
  messagePrivacy?: "requests" | "nobody";
  savedItineraries?: string[];
  trips: Trip[];
  activeId: string | null;
  saved: string[];
  interests: string[];
  pace: string;
  reviews: Review[];
  notifications: string[];
  offline: boolean;
  demoMember: boolean;
  tasteSetupDone?: boolean;
  tripGuideDismissed?: boolean;
  tasteSignals?: Record<
    string,
    { rating: number; reasons: string[]; liked?: string[]; disliked?: string[] }
  >;
  researchNotes?: Record<string, string>;
  lessLike?: string[];
  ideaIds?: string[];
  disputedAttributes?: string[];
  compareIds?: string[];
  workspaceNotes?: Record<string, string>;
  pendingProposals?: EditProposal[];
  proposalSelection?: number[];
  collections?: Collection[];
  activeCollectionId?: string;
  recentPlaces?: string[];
  researchOrigins?: Record<string, string>;
  startScreen?: "plan" | "home" | "resume";
  lastPage?: Page;
  chatDrafts?: Record<string, string>;
  viewContext?: Record<string, { day: string; scroll: number; place?: string }>;
};
export const photo = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
export const cityImage = photo("photo-1494522358652-f30e61a60313");
export const places: Place[] = [
  {
    id: "river",
    name: "Chicago Architecture River Cruise",
    kind: "experience",
    area: "River North",
    image: photo("photo-1477959858617-67f85cf4f1df"),
    rating: 4.8,
    reviews: 2840,
    fit: 96,
    price: "$57 / person",
    duration: "90 min",
    description:
      "See the city from its best angle. A gentle river journey through a century of architecture, with stories behind the skyline.",
    why: "You enjoy architecture and a slower pace. This gives you both, with very little walking.",
    tags: ["Architecture", "Easy pace", "Outdoor"],
    x: 48,
    y: 28,
    address: "112 E Wacker Dr, Chicago",
  },
  {
    id: "bean",
    name: "Millennium Park",
    kind: "experience",
    area: "The Loop",
    image: photo("photo-1494522358652-f30e61a60313"),
    rating: 4.8,
    reviews: 93600,
    fit: 89,
    price: "Free",
    duration: "45 min",
    description:
      "An easy wander through public art, gardens, and skyline views. Leave room to pause at Cloud Gate rather than rushing to the next stop.",
    why: "Public art and a flexible outdoor stop balance your food-focused afternoon.",
    tags: ["Art & culture", "Outdoor", "Free"],
    x: 66,
    y: 57,
    address: "201 E Randolph St, Chicago",
  },
  {
    id: "art",
    name: "The Art Institute of Chicago",
    kind: "experience",
    area: "The Loop",
    image: photo("photo-1561214115-f2f134cc4912"),
    rating: 4.8,
    reviews: 34100,
    fit: 94,
    price: "$32 / person",
    duration: "2 hours",
    description:
      "A thoughtful afternoon with world-class art. Choose a few galleries, then take a break instead of trying to see everything.",
    why: "A strong match for culture and design, and a comfortable indoor alternative if it rains.",
    tags: ["Art & culture", "Indoor", "Design"],
    x: 65,
    y: 73,
    address: "111 S Michigan Ave, Chicago",
  },
  {
    id: "gage",
    name: "The Gage",
    kind: "food",
    area: "The Loop",
    image: photo("photo-1517248135467-4c7edcad34c4"),
    rating: 4.5,
    reviews: 4841,
    fit: 93,
    price: "$$ · $35–55",
    duration: "75 min",
    description:
      "A warm, lively dining room across from Millennium Park. Seasonal dishes and a relaxed lunch make it an easy stop between your city discoveries.",
    why: "Members who share your interest in local food and welcoming spaces tend to enjoy this kind of dining experience.",
    tags: ["Local food", "Cozy", "Seasonal"],
    x: 58,
    y: 63,
    address: "24 S Michigan Ave, Chicago",
  },
  {
    id: "pizza",
    name: "Lou Malnati’s Pizzeria",
    kind: "food",
    area: "River North",
    image: photo("photo-1513104890138-7c749659a591"),
    rating: 4.4,
    reviews: 12128,
    fit: 87,
    price: "$$ · $20–35",
    duration: "60 min",
    description:
      "A Chicago classic for an unhurried deep-dish dinner. Order something to share and give the pizza plenty of time to bake.",
    why: "A good fit for your interest in signature local dishes and casual evenings.",
    tags: ["Local food", "Casual", "Classic"],
    x: 29,
    y: 30,
    address: "439 N Wells St, Chicago",
  },
  {
    id: "walk",
    name: "Chicago Riverwalk",
    kind: "experience",
    area: "River North",
    image: photo("photo-1477959858617-67f85cf4f1df"),
    rating: 4.7,
    reviews: 12500,
    fit: 91,
    price: "Free",
    duration: "45 min",
    description:
      "Take the scenic way along the water. Coffee, public seating, and bridges make this a flexible stop with plenty of opportunities to slow down.",
    why: "A short, scenic walk connects your architecture interests with a relaxed itinerary.",
    tags: ["Architecture", "Outdoor", "Easy pace"],
    x: 45,
    y: 40,
    address: "Chicago Riverwalk, Chicago",
  },
  {
    id: "purple",
    name: "The Purple Pig",
    kind: "food",
    area: "Magnificent Mile",
    image: photo("photo-1414235077428-338989a2e8c0"),
    rating: 4.6,
    reviews: 9200,
    fit: 95,
    price: "$$$ · $45–65",
    duration: "90 min",
    description:
      "Share small plates inspired by Mediterranean flavors. A lively, memorable dinner for travelers who enjoy making food part of the adventure.",
    why: "An especially good fit for adventurous food tastes and shared plates.",
    tags: ["Local food", "Small plates", "Lively"],
    x: 68,
    y: 24,
    address: "444 N Michigan Ave, Chicago",
  },
  {
    id: "cultural",
    name: "Chicago Cultural Center",
    kind: "experience",
    area: "The Loop",
    image: photo("photo-1577083552431-6e5fd01aa342"),
    rating: 4.7,
    reviews: 5900,
    fit: 92,
    price: "Free",
    duration: "60 min",
    description:
      "Step inside for intricate design, changing exhibitions, and a calm pause in the middle of the city.",
    why: "Free, indoors, and centered on art and architecture—an easy match for your travel style.",
    tags: ["Architecture", "Indoor", "Free"],
    x: 54,
    y: 51,
    address: "78 E Washington St, Chicago",
  },
  {
    id: "hotel-loop",
    name: "Central Loop Hotel",
    kind: "stay",
    area: "The Loop",
    image: photo("photo-1566073771259-6a8506099945"),
    rating: 4.0,
    reviews: 1721,
    fit: 92,
    price: "$189 / night",
    duration: "2 nights",
    description:
      "A practical downtown base within easy reach of the city’s architecture, museums, and restaurants. Keep your days walkable and your evenings simple.",
    why: "A central base keeps transfers short and fits your illustrative $200 nightly hotel budget.",
    tags: ["Central location", "Walkable", "Good value"],
    x: 42,
    y: 68,
    address: "111 W Adams St, Chicago",
  },
  {
    id: "hotel-river",
    name: "River Hotel",
    kind: "stay",
    area: "River North",
    image: photo("photo-1611892440504-42a792e24d32"),
    rating: 4.2,
    reviews: 2300,
    fit: 90,
    price: "$198 / night",
    duration: "2 nights",
    description:
      "A riverfront base close to your cruise and evening dining. A convenient option if you would rather spend more time near the water.",
    why: "River access and nearby restaurants match your relaxed pace without exceeding the demo nightly target.",
    tags: ["River views", "Walkable", "Central location"],
    x: 50,
    y: 32,
    address: "75 E Wacker Dr, Chicago",
  },
];
export const getPlace = (id: string) => places.find((p) => p.id === id)!;
export const defaultBrief: Brief = {
  destination: "Chicago",
  start: "2026-10-16",
  end: "2026-10-18",
  travelers: 2,
  budget: 200,
  pace: "Relaxed",
  interests: ["Local food", "Architecture", "Art & culture"],
  origin: "Already there · no flights",
  prompt: "",
};
export const samplePrompt =
  "Three days in Chicago for two adults. We love local food and architecture, prefer a relaxed pace, and want a hotel under $200 a night. No flights needed.";
export function makeTrip(brief = defaultBrief): Trip {
  const count = Math.max(
    1,
    Math.min(
      7,
      Math.round((Date.parse(brief.end) - Date.parse(brief.start)) / 86400000) +
        1,
    ),
  );
  const templates = [
    { title: "A taste of the city", places: ["bean", "gage", "walk"] },
    {
      title: "Architecture, at your pace",
      places: ["river", "purple", "pizza"],
    },
    { title: "Art & a little wandering", places: ["art", "cultural", "gage"] },
  ];
  return {
    id: crypto.randomUUID(),
    name: "A little Chicago, a lot of you",
    brief,
    days: Array.from({ length: count }, (_, i) => ({
      ...templates[i % 3],
      places: [...templates[i % 3].places],
      id: `day-${i + 1}`,
    })),
    messages: [
      { role: "user", text: brief.prompt || samplePrompt },
      {
        role: "assistant",
        text: "Here’s a relaxed city escape built around good food, great architecture, and time to wander. Start with the route, compare your stays, then explore each day.",
      },
    ],
    status: "planning",
    bookings: [],
    partners: [],
    comments: [],
  };
}
export const initialState: State = {
  trips: [],
  activeId: null,
  saved: [],
  interests: ["Local food", "Architecture", "Art & culture"],
  pace: "Relaxed",
  reviews: [],
  notifications: [
    "Your Chicago weekend is ready to explore.",
    "Welcome to XPMatch. Start with the things you love.",
  ],
  offline: false,
  demoMember: false,
};
export const dateLabel = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
export function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Demo trip checks use canonical data, not assistant prose. No live availability is inferred. */
export function checkTrip(trip: Trip): string[] {
  const issues: string[] = [];
  const length =
    Math.round(
      (Date.parse(trip.brief.end) - Date.parse(trip.brief.start)) / 86400000,
    ) + 1;
  if (trip.days.some((d) => !d.places.length))
    issues.push(
      "Some days are incomplete. Finish the remaining stops before traveling.",
    );
  if (length !== trip.days.length)
    issues.push("Your dates and day count need a review.");
  const chosen = trip.stayId ? getPlace(trip.stayId) : undefined;
  if (chosen && Number(chosen.price.match(/\d+/)?.[0]) > trip.brief.budget)
    issues.push(
      `${chosen.name} exceeds your $${trip.brief.budget} nightly target. Choose a different stay or adjust your budget.`,
    );
  if (
    !chosen &&
    !places.some(
      (p) =>
        p.kind === "stay" &&
        Number(p.price.match(/\d+/)?.[0]) <= trip.brief.budget,
    )
  )
    issues.push(
      `Neither sample stay fits your $${trip.brief.budget} nightly target. Review your stay budget before choosing.`,
    );
  return issues;
}

export function migrateWorkspace(state: State): State {
  return {
    ...state,
    collections: state.collections || [
      {
        id: "legacy-ideas",
        name: "My Chicago ideas",
        placeIds: [...(state.ideaIds || [])],
        note: "",
        archived: false,
      },
    ],
  };
}
