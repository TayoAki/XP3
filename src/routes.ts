// Hash routes. Every view, tab, day and selected place is in the URL so a
// reload or a shared link restores the same screen.
//   #/trips?tab=upcoming
//   #/trip/<id>/itinerary?day=day-2&place=gage
//   #/trip/new
//   #/discover/places | itineraries | people
//   #/saved/<collectionId>
//   #/inbox
//   #/you/taste | account
//   #/settings/<section>
export type TripsTab = "upcoming" | "drafts" | "past";
export type TripTab = "itinerary" | "ideas" | "bookings";
export type DiscoverTab = "places" | "itineraries" | "people";
export type YouTab = "taste" | "account";
export type SettingsSection = "general" | "preview" | "privacy" | "moderation";

export type Route =
  | { view: "trips"; tab: TripsTab }
  | { view: "trip"; id: string; tab: TripTab; day?: string; full?: boolean }
  | { view: "discover"; tab: DiscoverTab }
  | { view: "saved"; collection?: string }
  | { view: "inbox" }
  | { view: "you"; tab: YouTab }
  | { view: "settings"; section: SettingsSection };

/** What the side panel shows; mirrored into the query string. */
export type PanelRef =
  | { kind: "place"; id: string }
  | { kind: "member"; id: string }
  | { kind: "itinerary"; id: string };

export type Location = { route: Route; panel?: PanelRef };

const oneOf = <T extends string>(
  value: string | undefined,
  all: T[],
  fallback: T,
) => (all.includes(value as T) ? (value as T) : fallback);

// Single-word hashes from the earlier layout keep working.
const legacy: Record<string, Route> = {
  home: { view: "trips", tab: "upcoming" },
  ideas: { view: "saved" },
  saved: { view: "saved" },
  discover: { view: "discover", tab: "places" },
  community: { view: "discover", tab: "people" },
  taste: { view: "you", tab: "taste" },
  messages: { view: "inbox" },
  notifications: { view: "inbox" },
  settings: { view: "settings", section: "general" },
  connected: { view: "settings", section: "general" },
  moderation: { view: "settings", section: "moderation" },
};

export function parseHash(
  hash: string,
  activeTripId?: string | null,
): Location {
  const raw = hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  let route: Route;
  if (parts.length === 1 && parts[0] === "plan")
    route = activeTripId
      ? { view: "trip", id: activeTripId, tab: "itinerary" }
      : { view: "trip", id: "new", tab: "itinerary" };
  else if (parts.length === 1 && parts[0] !== "trips" && legacy[parts[0]])
    route = legacy[parts[0]];
  else
    switch (parts[0]) {
      case "trip":
        if (parts[1]) {
          const trip: Route = {
            view: "trip",
            id: parts[1],
            tab: oneOf(
              parts[2],
              ["itinerary", "ideas", "bookings"],
              "itinerary",
            ),
          };
          if (params.get("day")) trip.day = params.get("day")!;
          if (params.get("view") === "full") trip.full = true;
          route = trip;
        } else route = { view: "trips", tab: "upcoming" };
        break;
      case "discover":
        route = {
          view: "discover",
          tab: oneOf(parts[1], ["places", "itineraries", "people"], "places"),
        };
        break;
      case "saved":
        route = parts[1]
          ? { view: "saved", collection: parts[1] }
          : { view: "saved" };
        break;
      case "inbox":
        route = { view: "inbox" };
        break;
      case "you":
        route = {
          view: "you",
          tab: oneOf(parts[1], ["taste", "account"], "taste"),
        };
        break;
      case "settings":
        route = {
          view: "settings",
          section: oneOf(
            parts[1],
            ["general", "preview", "privacy", "moderation"],
            "general",
          ),
        };
        break;
      default:
        route = {
          view: "trips",
          tab: oneOf(
            params.get("tab") || undefined,
            ["upcoming", "drafts", "past"],
            "upcoming",
          ),
        };
    }
  const place = params.get("place");
  const member = params.get("member");
  const itinerary = params.get("itinerary");
  const panel: PanelRef | undefined = place
    ? { kind: "place", id: place }
    : member
      ? { kind: "member", id: member }
      : itinerary
        ? { kind: "itinerary", id: itinerary }
        : undefined;
  return { route, panel };
}

export function toHash({ route, panel }: Location): string {
  const params = new URLSearchParams();
  let path: string;
  switch (route.view) {
    case "trips":
      path = "trips";
      if (route.tab !== "upcoming") params.set("tab", route.tab);
      break;
    case "trip":
      path = `trip/${encodeURIComponent(route.id)}/${route.tab}`;
      if (route.day) params.set("day", route.day);
      if (route.full) params.set("view", "full");
      break;
    case "discover":
      path = `discover/${route.tab}`;
      break;
    case "saved":
      path = route.collection
        ? `saved/${encodeURIComponent(route.collection)}`
        : "saved";
      break;
    case "inbox":
      path = "inbox";
      break;
    case "you":
      path = `you/${route.tab}`;
      break;
    case "settings":
      path = `settings/${route.section}`;
      break;
  }
  if (panel) params.set(panel.kind, panel.id);
  const query = params.toString();
  return `#/${path}${query ? "?" + query : ""}`;
}

/** The rail destination a route belongs to. */
export function railOf(route: Route) {
  return route.view === "trip" ? "trips" : route.view;
}
