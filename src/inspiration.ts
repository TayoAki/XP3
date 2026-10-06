export const members = [
  {
    id: "maya",
    name: "Maya Chen",
    style: "Architecture · easy walks · independent cafés",
    bio: "A fictional member who prefers a few thoughtful stops and time to notice the city.",
    likes: ["Architecture", "Easy pace"],
    caveat:
      "Avoids packed days; her advice may be less useful for nightlife trips.",
  },
  {
    id: "leo",
    name: "Leo Martin",
    style: "Food · museums · neighborhood exploring",
    bio: "A fictional member who builds weekends around food and culture.",
    likes: ["Food", "Museums"],
    caveat:
      "Enjoys busy neighborhoods; quiet-space seekers should check the tradeoffs.",
  },
];
export const sharedItineraries = [
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
    summary: "Neighborhood meals, museums and classic Chicago stops.",
    days: [
      ["art", "purple"],
      ["bean", "pizza"],
      ["cultural", "gage"],
    ],
    stayId: "hotel-loop",
    caveat: "Restaurant reservations and dietary suitability are unverified.",
  },
];
export const memberEvidence = (id: string) => {
  const source = sharedItineraries.find(
    (t) => t.days.flat().includes(id) || t.stayId === id,
  )!;
  return source
    ? {
        source,
        member: members.find((m) => m.id === source.memberId)!,
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
