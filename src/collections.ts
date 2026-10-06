// One save model: everything kept for later lives in a collection.
import { SAVED_ID, tripIdeasId, type Collection, type State } from "./model.ts";

export const savedCollection = (state: State): Collection =>
  state.collections?.find((c) => c.id === SAVED_ID) || {
    id: SAVED_ID,
    name: "Saved",
    placeIds: [],
    itineraryIds: [],
    note: "",
  };

export const isSaved = (state: State, placeId: string) =>
  savedCollection(state).placeIds.includes(placeId);

export const isItinerarySaved = (state: State, itineraryId: string) =>
  !!savedCollection(state).itineraryIds?.includes(itineraryId);

function updateCollection(
  state: State,
  id: string,
  fn: (c: Collection) => Collection,
  create?: () => Collection,
): State {
  const all = state.collections || [];
  const exists = all.some((c) => c.id === id);
  return {
    ...state,
    collections: exists
      ? all.map((c) => (c.id === id ? fn(c) : c))
      : create
        ? [...all, fn(create())]
        : all,
  };
}

const toggle = (list: string[] = [], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export const toggleSaved = (state: State, placeId: string): State =>
  updateCollection(
    state,
    SAVED_ID,
    (c) => ({ ...c, placeIds: toggle(c.placeIds, placeId) }),
    () => savedCollection(state),
  );

export const toggleItinerarySaved = (
  state: State,
  itineraryId: string,
): State =>
  updateCollection(
    state,
    SAVED_ID,
    (c) => ({ ...c, itineraryIds: toggle(c.itineraryIds, itineraryId) }),
    () => savedCollection(state),
  );

/** A trip's own Ideas collection (undated places for that trip). */
export function tripIdeas(state: State, tripId: string): Collection {
  const trip = state.trips.find((t) => t.id === tripId);
  return (
    state.collections?.find((c) => c.tripId === tripId) || {
      id: tripIdeasId(tripId),
      name: `${trip?.name || "Trip"} · ideas`,
      placeIds: [],
      note: "",
      tripId,
    }
  );
}

/** Adds places to a trip's Ideas collection, creating it if needed. */
export const keepAsIdeas = (
  state: State,
  tripId: string,
  placeIds: string[],
): State => {
  const ideas = tripIdeas(state, tripId);
  return updateCollection(
    state,
    ideas.id,
    (c) => ({ ...c, placeIds: [...new Set([...c.placeIds, ...placeIds])] }),
    () => ideas,
  );
};

export const removeFromCollection = (
  state: State,
  collectionId: string,
  placeId: string,
): State =>
  updateCollection(state, collectionId, (c) => ({
    ...c,
    placeIds: c.placeIds.filter((id) => id !== placeId),
  }));

export const addToCollection = (
  state: State,
  collectionId: string,
  placeId: string,
): State =>
  updateCollection(state, collectionId, (c) => ({
    ...c,
    placeIds: [...new Set([...c.placeIds, placeId])],
  }));

/** Collections shown under Saved: the default one plus undated idea lists. */
export const savedViewCollections = (state: State) =>
  (state.collections || []).filter((c) => !c.tripId);

/** The single collection a newly saved place lands in. */
export const SAVE_TARGET_NAME = "Saved";
