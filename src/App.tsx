import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  download,
  dateLabel,
  getPlace,
  initialState,
  makeTrip,
  migrateWorkspace,
  samplePrompt,
  type Brief,
  type State,
  type Trip,
} from "./model";
import {
  parseHash,
  railOf,
  toHash,
  type Location,
  type PanelRef,
  type Route,
} from "./routes";
import {
  AppContext,
  type AppApi,
  type Modal,
  type PanelMode,
  type ToastAction,
} from "./app/context";
import {
  isSaved as isSavedIn,
  keepAsIdeas,
  removeFromCollection,
  toggleSaved,
  tripIdeas,
} from "./collections";
import { applySwapTo, rebaseProposals, validateTrip } from "./tripLogic";
import { parseBrief } from "./briefLogic";
import { interpret } from "./assistant";
import { sharedItineraries } from "./inspiration";
import type { EditProposal } from "./proposals";
import { Rail, StatusBar, TabBar, type RailId } from "./shell/Shell";
import { Sheet } from "./ui";
import { TripsSidebar, TripsView } from "./views/TripsView";
import { TripSidebar, TripView } from "./views/TripView";
import { DiscoverSidebar, DiscoverView } from "./views/DiscoverView";
import { SavedSidebar, SavedView } from "./views/SavedView";
import { InboxView } from "./views/InboxView";
import { YouView } from "./views/YouView";
import { SettingsSidebar, SettingsView } from "./views/SettingsView";
import PlacePanel from "./components/panel/PlacePanel";
import SwapPanel from "./components/panel/SwapPanel";
import VisitPanel from "./components/panel/VisitPanel";
import TripSummaryPanel from "./components/panel/TripSummaryPanel";
import { ItineraryPanel, MemberPanel } from "./components/panel/PeoplePanels";
import Modals from "./app/Modals";

const STORAGE = "xpmatch-journey-preview-v1";

function load(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (
      raw &&
      Array.isArray(raw.trips) &&
      raw.trips.every((t: Trip) => t.brief && Array.isArray(t.days))
    )
      return migrateWorkspace({ ...initialState, ...raw });
  } catch {}
  return migrateWorkspace(structuredClone(initialState));
}

function loadBrief(): Brief | null {
  try {
    const draft = JSON.parse(
      localStorage.getItem(STORAGE + "-draft") || "null",
    );
    return draft &&
      typeof draft.prompt === "string" &&
      Array.isArray(draft.interests)
      ? draft
      : null;
  } catch {
    return null;
  }
}

function initialLocation(state: State): Location {
  if (location.hash.replace("#", ""))
    return parseHash(location.hash, state.activeId);
  if (state.startScreen === "resume" && state.lastHash)
    return parseHash(state.lastHash, state.activeId);
  return { route: { view: "trips", tab: "upcoming" } };
}

const now = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

type HistoryEntry = { tripId: string; trip: Trip; label: string; time: string };
export type SwapOptions = {
  batch?: {
    dayId: string;
    index: number;
    after: string | null;
    before: string;
  }[];
  label?: string;
};

export default function App() {
  const [state, setState] = useState<State>(load);
  const [loc, setLoc] = useState<Location>(() => initialLocation(state));
  const [mode, setModeState] = useState<PanelMode | null>(null);
  const [brief, setBrief] = useState<Brief | null>(loadBrief);
  const [busy, setBusy] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [toast, setToast] = useState<{
    text: string;
    action?: ToastAction;
    id: number;
  } | null>(null);
  const [modal, setModal] = useState<{ name: Modal; id?: string } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [scope, setScope] = useState<string | null>(null);
  const [proposals, setProposals] = useState<EditProposal[]>(
    () => state.pendingProposals || [],
  );
  const [swapped, setSwapped] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [expired, setExpired] = useState(false);
  const [storageFailure, setStorageFailure] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const failNext = useRef(false);
  const partialNext = useRef(false);
  const epoch = useRef(0);

  const route = loc.route;
  const trip =
    route.view === "trip"
      ? state.trips.find((t) => t.id === route.id)
      : undefined;

  // Persistence
  useEffect(() => {
    try {
      if (storageFailure) throw new Error("Simulated storage failure");
      localStorage.setItem(STORAGE, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state, storageFailure]);
  useEffect(() => {
    try {
      if (brief)
        localStorage.setItem(STORAGE + "-draft", JSON.stringify(brief));
      else localStorage.removeItem(STORAGE + "-draft");
    } catch {}
  }, [brief]);
  useEffect(
    () => setState((s) => ({ ...s, pendingProposals: proposals })),
    [proposals],
  );

  // URL ⇄ location. Every navigation pushes a history entry so Back works.
  useEffect(() => {
    const onHash = () => setLoc(parseHash(location.hash, state.activeId));
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
    };
  }, [state.activeId]);
  const synced = useRef(false);
  useEffect(() => {
    const hash = toHash(loc);
    if (!synced.current) {
      // First sync: if the URL changed before the app mounted, follow it.
      synced.current = true;
      const current = location.hash.replace("#", "");
      if (
        current &&
        current !== hash.replace("#", "") &&
        toHash(parseHash(location.hash)) !== hash
      ) {
        setLoc(parseHash(location.hash, state.activeId));
        return;
      }
      window.history.replaceState(null, "", hash);
    } else if (location.hash !== hash) window.history.pushState(null, "", hash);
    setContextOpen(false);
    setState((s) => {
      const next: State = { ...s, lastHash: hash };
      const r = loc.route;
      if (r.view === "trip" && s.trips.some((t) => t.id === r.id)) {
        next.activeId = r.id;
        next.viewContext = {
          ...s.viewContext,
          [r.id]: {
            day: r.day || "all",
            scroll: 0,
            place: loc.panel?.kind === "place" ? loc.panel.id : undefined,
          },
        };
      }
      return next;
    });
  }, [loc]);

  useEffect(() => {
    if (!swapped) return;
    const t = setTimeout(() => setSwapped(null), 1800);
    return () => clearTimeout(t);
  }, [swapped]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.action ? 8000 : 5000);
    return () => clearTimeout(t);
  }, [toast]);
  // Leaving a trip closes trip-only panels.
  const tripKey = route.view === "trip" ? route.id : "";
  useEffect(() => setModeState(null), [tripKey]);

  const notify = useCallback(
    (text: string, action?: ToastAction) =>
      setToast({ text, action, id: Date.now() }),
    [],
  );

  const go = useCallback((next: Route, panel?: PanelRef | null) => {
    setLoc((current) => ({
      route: next,
      panel: panel === undefined ? current.panel : panel || undefined,
    }));
  }, []);
  const openPanel = useCallback((panel: PanelRef | null) => {
    setModeState(null);
    setLoc((current) => ({ route: current.route, panel: panel || undefined }));
  }, []);
  const setMode = useCallback((m: PanelMode | null) => {
    setModeState(m);
    if (m) setLoc((current) => ({ route: current.route }));
  }, []);

  const undoRef = useRef<() => void>(() => {});

  /** Change a trip (the current one by default), record it for undo, return the new trip. */
  const changeTrip = useCallback(
    (
      label: string,
      fn: (t: Trip) => void,
      base?: Trip,
      quiet?: boolean,
    ): Trip | undefined => {
      const current = base || trip;
      if (!current) return;
      const next = structuredClone(current);
      fn(next);
      next.revision = (current.revision || 0) + 1;
      next.updatedAt = Date.now();
      setHistory((h) =>
        [
          ...h,
          {
            tripId: current.id,
            trip: structuredClone(current),
            label,
            time: now(),
          },
        ].slice(-30),
      );
      setState((s) => ({
        ...s,
        trips: s.trips.map((t) => (t.id === next.id ? next : t)),
      }));
      if (!quiet)
        notify(label, { label: "Undo", run: () => undoRef.current() });
      return next;
    },
    [trip, notify],
  );

  const undo = useCallback(() => {
    const last = history.at(-1);
    if (!last) {
      notify("Nothing to undo.");
      return;
    }
    setHistory((h) => h.slice(0, -1));
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => (t.id === last.tripId ? last.trip : t)),
    }));
    setProposals((ps) => rebaseProposals(ps, last.trip));
    notify(`Undone: ${last.label.replace(/\.$/, "")}.`);
  }, [history, notify]);
  undoRef.current = undo;

  const applySwap = useCallback(
    (
      dayId: string,
      index: number,
      placeId: string | null,
      opts: SwapOptions = {},
    ) => {
      if (!trip) return;
      const steps = [{ dayId, index, after: placeId }, ...(opts.batch || [])];
      let working = trip;
      const removed: string[] = [];
      const flashed: string[] = [];
      for (const step of steps) {
        const result = applySwapTo(working, step.dayId, step.index, step.after);
        working = result.trip;
        if (result.removed) removed.push(result.removed);
        if (step.after) flashed.push(`${step.dayId}:${step.index}`);
        if (result.traded)
          flashed.push(`${result.traded.dayId}:${result.traded.index}`);
      }
      const from = getPlace(
        trip.days.find((d) => d.id === dayId)!.places[index],
      );
      const to = placeId ? getPlace(placeId) : null;
      const traded = !!to && trip.days.some((d) => d.places.includes(to.id));
      const label =
        opts.label ||
        (!to
          ? `${from.name} moved to this trip’s ideas to free up time.`
          : traded
            ? `Traded ${from.name} and ${to.name}.`
            : `Swapped ${from.name} for ${to.name}. ${from.name} is in this trip’s ideas.`);
      const next = changeTrip(label, (t) => {
        t.days = working.days;
      });
      if (!next) return;
      setState((s) => {
        let out = removed.length ? keepAsIdeas(s, trip.id, removed) : s;
        if (to)
          out = removeFromCollection(out, tripIdeas(out, trip.id).id, to.id);
        return out;
      });
      const applied = new Set(steps.map((s) => `${s.dayId}:${s.index}`));
      const remaining = rebaseProposals(
        proposals.filter(
          (p) =>
            !(p.tripId === trip.id && applied.has(`${p.dayId}:${p.index}`)),
        ),
        next,
      );
      setProposals(remaining);
      setScope(null);
      setSwapped(flashed.join(","));
      // Step on to the next suggestion in the queue, if any.
      const upcoming = remaining.find((p) => p.tripId === trip.id);
      setModeState(
        upcoming
          ? { kind: "swap", dayId: upcoming.dayId, index: upcoming.index }
          : null,
      );
      if (route.view === "trip" && route.tab !== "itinerary")
        go({ view: "trip", id: trip.id, tab: "itinerary" });
    },
    [trip, proposals, changeTrip, route, go],
  );

  const addToDay = useCallback(
    (dayId: string, placeId: string) => {
      if (!trip) return;
      const day = trip.days.find((d) => d.id === dayId)!;
      const next = changeTrip(
        `${getPlace(placeId).name} added to Day ${trip.days.indexOf(day) + 1}.`,
        (t) => {
          t.days.find((d) => d.id === dayId)!.places.push(placeId);
        },
      );
      if (!next) return;
      setState((s) =>
        removeFromCollection(s, tripIdeas(s, trip.id).id, placeId),
      );
      setProposals((ps) => rebaseProposals(ps, next));
      setSwapped(`${dayId}:${day.places.length}`);
      setModeState(null);
      go(
        {
          view: "trip",
          id: trip.id,
          tab: "itinerary",
          ...(route.view === "trip" && route.day ? { day: route.day } : {}),
        },
        null,
      );
    },
    [trip, changeTrip, go, route],
  );

  const dismissProposal = useCallback(
    (p: EditProposal) => {
      const rest = proposals.filter((x) => x !== p);
      setProposals(rest);
      const next = rest.find((x) => x.tripId === p.tripId);
      setModeState(
        next ? { kind: "swap", dayId: next.dayId, index: next.index } : null,
      );
      if (!next) notify("Suggestion skipped. Your plan is unchanged.");
    },
    [proposals, notify],
  );

  const submit = useCallback(
    (text: string) => {
      if (expired || state.offline) {
        notify(
          expired
            ? "Access expired. Restore it from the status bar; your message is kept."
            : "The assistant is offline. Your message is kept; local edits still work.",
        );
        return false;
      }
      if (!trip) {
        setBrief(
          parseBrief(text, { interests: state.interests, pace: state.pace }),
        );
        setGenerationError("");
        go({ view: "trip", id: "new", tab: "itinerary" }, null);
        return true;
      }
      const result = interpret(text, trip, scope, state);
      setState((s) => ({
        ...s,
        trips: s.trips.map((t) =>
          t.id === trip.id
            ? {
                ...t,
                updatedAt: Date.now(),
                messages: [
                  ...t.messages,
                  { role: "user", text },
                  { role: "assistant", text: result.reply },
                ],
              }
            : t,
        ),
      }));
      if (result.kind === "proposals") {
        const slots = new Set(
          result.proposals.map((p) => `${p.dayId}:${p.index}`),
        );
        setProposals((ps) => [
          ...ps.filter(
            (p) =>
              !(p.tripId === trip.id && slots.has(`${p.dayId}:${p.index}`)),
          ),
          ...result.proposals,
        ]);
        setMode({
          kind: "swap",
          dayId: result.proposals[0].dayId,
          index: result.proposals[0].index,
        });
      } else if (result.kind === "open-swap") {
        setMode({ kind: "swap", dayId: result.dayId, index: result.index });
      }
      return true;
    },
    [expired, state, trip, scope, go, notify, setMode],
  );

  const generate = useCallback(() => {
    if (!brief || busy) return;
    if (state.offline || expired) {
      setGenerationError(
        state.offline
          ? "You’re offline, so the trip can’t be built yet."
          : "Access expired before the trip was built.",
      );
      return;
    }
    setGenerationError("");
    setBusy(true);
    const mine = ++epoch.current;
    const draft = structuredClone(brief);
    setTimeout(() => {
      if (mine !== epoch.current) return;
      if (failNext.current) {
        failNext.current = false;
        setBusy(false);
        setGenerationError("The trip couldn’t be built.");
        return;
      }
      const next = makeTrip(draft);
      next.updatedAt = Date.now();
      const source = sharedItineraries.find(
        (t) => t.id === draft.sourceItineraryId,
      );
      if (source) {
        next.sourceItineraryId = source.id;
        next.name = source.name + " · my copy";
        next.stayId = source.stayId;
        next.days.forEach((d) => (d.places = []));
        source.days.forEach((items, i) =>
          next.days[Math.min(i, next.days.length - 1)].places.push(...items),
        );
        next.messages.push({
          role: "assistant",
          text: `Your own copy of ${source.name}. The original is unchanged. Check hours and reservations for your dates.`,
        });
      }
      if (draft.ideaIds?.length) {
        const ids = draft.ideaIds.filter((id) => getPlace(id).kind !== "stay");
        const stay = draft.ideaIds.find((id) => getPlace(id).kind === "stay");
        if (stay) next.stayId = stay;
        next.days.forEach(
          (d) => (d.places = d.places.filter((id) => !ids.includes(id))),
        );
        ids.forEach((id, i) => next.days[i % next.days.length].places.push(id));
      }
      if (draft.collectionId) {
        next.name = draft.prompt
          .replace(/^Plan /, "")
          .replace(/ in Chicago$/, "");
        next.conversion = {
          collectionId: draft.collectionId,
          placeIds: draft.ideaIds || [],
        };
      }
      if (partialNext.current) {
        partialNext.current = false;
        next.days.slice(1).forEach((d) => (d.places = []));
        next.messages.push({
          role: "assistant",
          text: "Only Day 1 is ready. Use “Fill empty days” to finish the rest.",
        });
      }
      setState((s) =>
        keepAsIdeas(
          {
            ...s,
            collections: s.collections?.map((c) =>
              c.id === draft.collectionId
                ? {
                    ...c,
                    placeIds: c.placeIds.filter(
                      (id) => !draft.ideaIds?.includes(id),
                    ),
                  }
                : c,
            ),
            trips: [next, ...s.trips],
            activeId: next.id,
          },
          next.id,
          [],
        ),
      );
      try {
        localStorage.removeItem("xpmatch-chat-new");
      } catch {}
      setBrief(null);
      setBusy(false);
      setHistory([]);
      go({ view: "trip", id: next.id, tab: "itinerary" }, null);
      const issues = validateTrip(next, state);
      notify(
        issues.length
          ? `Your trip is built. ${issues.length} ${issues.length === 1 ? "thing needs" : "things need"} a look before it’s ready.`
          : "Your trip is ready.",
      );
    }, 1100);
  }, [brief, busy, state, expired, go, notify]);

  const cancelGeneration = useCallback(() => {
    epoch.current++;
    setBusy(false);
    notify("Stopped. Your brief is kept.");
  }, [notify]);

  const startSample = useCallback(() => {
    const parsed = parseBrief(samplePrompt, {
      interests: state.interests,
      pace: state.pace,
    });
    const t = makeTrip(parsed);
    t.updatedAt = Date.now();
    setState((s) =>
      keepAsIdeas({ ...s, trips: [t, ...s.trips], activeId: t.id }, t.id, []),
    );
    setHistory([]);
    go({ view: "trip", id: t.id, tab: "itinerary" }, null);
  }, [state.interests, state.pace, go]);

  const newTrip = useCallback(() => {
    setGenerationError("");
    go({ view: "trip", id: "new", tab: "itinerary" }, null);
  }, [go]);

  const openTrip = useCallback(
    (id: string) => {
      const ctx = state.viewContext?.[id];
      go(
        {
          view: "trip",
          id,
          tab: "itinerary",
          ...(ctx?.day && ctx.day !== "all" ? { day: ctx.day } : {}),
        },
        ctx?.place ? { kind: "place", id: ctx.place } : null,
      );
    },
    [state.viewContext, go],
  );

  const chooseStay = useCallback(
    (placeId: string) => {
      const target = trip || state.trips.find((t) => t.id === state.activeId);
      if (!target) {
        notify("Open a trip first to choose where to stay.");
        return;
      }
      changeTrip(
        `${getPlace(placeId).name} is your base.`,
        (t) => {
          t.stayId = placeId;
        },
        target,
        true,
      );
      notify(`${getPlace(placeId).name} is your base. Nothing is booked.`, {
        label: "Add booking",
        run: () => go({ view: "trip", id: target.id, tab: "bookings" }, null),
      });
    },
    [trip, state.trips, state.activeId, changeTrip, notify, go],
  );

  const toggleSave = useCallback(
    (placeId: string) => {
      const was = isSavedIn(state, placeId);
      setState((s) => toggleSaved(s, placeId));
      notify(
        was
          ? `${getPlace(placeId).name} removed from Saved.`
          : `${getPlace(placeId).name} saved.`,
        {
          label: "Undo",
          run: () => setState((s) => toggleSaved(s, placeId)),
        },
      );
    },
    [state, notify],
  );

  const exportData = useCallback(() => {
    download(
      "xpmatch-data.json",
      JSON.stringify(
        { schemaVersion: 3, ...state, briefDraft: brief },
        null,
        2,
      ),
      "application/json",
    );
    notify("Your data was downloaded.");
  }, [state, brief, notify]);

  const exportTrip = useCallback(() => {
    if (!trip) return;
    download(
      `${trip.name.replace(/[^\w]+/g, "-").toLowerCase()}.txt`,
      `${trip.name}\n${dateLabel(trip.brief.start)}–${dateLabel(trip.brief.end)} · ${trip.brief.travelers} travelers\nSample itinerary · check details before travelling\n\n` +
        trip.days
          .map(
            (d, i) =>
              `Day ${i + 1}: ${d.title}\n` +
              d.places
                .map(
                  (id) =>
                    `- ${getPlace(id).name} (${getPlace(id).duration}) · ${getPlace(id).address}`,
                )
                .join("\n"),
          )
          .join("\n\n"),
    );
    notify("Itinerary downloaded as text.");
  }, [trip, notify]);

  const api: AppApi = useMemo(
    () => ({
      state,
      setState,
      loc,
      go,
      openPanel,
      mode,
      setMode,
      notify,
      trip,
      changeTrip: (label, fn) => void changeTrip(label, fn),
      canUndo: history.length > 0,
      undo,
      history,
      openModal: (name, id) => setModal({ name, id }),
      brief,
      setBrief,
      busy,
      generationError,
      generate,
      cancelGeneration,
      submit,
      scope,
      setScope,
      proposals,
      dismissProposal,
      applySwap,
      addToDay,
      swapped,
      startSample,
      newTrip,
      openTrip,
      isSaved: (id) => isSavedIn(state, id),
      toggleSave,
      chooseStay,
      exportData,
      exportTrip,
      preview: {
        expired,
        setExpired,
        failNext: () => void (failNext.current = true),
        partialNext: () => void (partialNext.current = true),
        storageFailure,
        setStorageFailure,
        sync: () => {
          setSyncing(true);
          setTimeout(() => {
            setSyncing(false);
            notify("Connection check done. Everything stays on this device.");
          }, 900);
        },
      },
      saveState: storageError ? "session" : "local",
    }),
    [
      state,
      loc,
      mode,
      trip,
      history,
      brief,
      busy,
      generationError,
      scope,
      proposals,
      swapped,
      expired,
      storageFailure,
      storageError,
      go,
      openPanel,
      setMode,
      notify,
      changeTrip,
      undo,
      generate,
      cancelGeneration,
      submit,
      dismissProposal,
      applySwap,
      addToDay,
      startSample,
      newTrip,
      openTrip,
      toggleSave,
      chooseStay,
      exportData,
      exportTrip,
    ],
  );

  const rail = railOf(route) as RailId;
  const goRail = (id: RailId) => {
    const routes: Record<RailId, Route> = {
      trips: { view: "trips", tab: "upcoming" },
      discover: { view: "discover", tab: "places" },
      inbox: { view: "inbox" },
      saved: { view: "saved" },
      settings: { view: "settings", section: "general" },
      you: { view: "you", tab: "taste" },
    };
    go(routes[id], null);
  };

  const sidebar =
    route.view === "trips" && (state.trips.length || brief) ? (
      <TripsSidebar />
    ) : route.view === "trip" ? (
      <TripSidebar />
    ) : route.view === "discover" ? (
      <DiscoverSidebar />
    ) : route.view === "saved" ? (
      <SavedSidebar />
    ) : route.view === "settings" ? (
      <SettingsSidebar />
    ) : null;
  const openContext = () => setContextOpen(true);

  const closePanel = () => openPanel(null);
  const place =
    loc.panel?.kind === "place" ? getPlace(loc.panel.id) : undefined;
  const panel = mode ? (
    mode.kind === "visit" ? (
      <VisitPanel
        key={mode.placeId}
        placeId={mode.placeId}
        onClose={() => setMode(null)}
      />
    ) : (
      <SwapPanel
        key={JSON.stringify(mode)}
        mode={mode}
        onClose={() => setMode(null)}
      />
    )
  ) : place ? (
    <PlacePanel key={place.id} place={place} onClose={closePanel} />
  ) : loc.panel?.kind === "member" ? (
    <MemberPanel key={loc.panel.id} id={loc.panel.id} onClose={closePanel} />
  ) : loc.panel?.kind === "itinerary" ? (
    <ItineraryPanel key={loc.panel.id} id={loc.panel.id} onClose={closePanel} />
  ) : trip ? (
    <TripSummaryPanel trip={trip} />
  ) : null;
  const panelOpen = !!(mode || loc.panel);

  return (
    <AppContext.Provider value={api}>
      <div
        className={`shell${sidebar ? "" : " no-sidebar"}${panelOpen ? " has-panel" : ""}`}
      >
        <a
          href="#main-content"
          className="skip-link"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main-content")?.focus();
          }}
        >
          Skip to main content
        </a>
        <Rail
          current={rail}
          onGo={goRail}
          initials={state.demoMember ? "JD" : "G"}
          unread={state.notifications.length}
        />
        {sidebar}
        <main
          id="main-content"
          tabIndex={-1}
          className={`shell-main${route.view === "trip" ? " is-workspace" : ""}`}
        >
          {route.view === "trips" && <TripsView onOpenContext={openContext} />}
          {route.view === "trip" && <TripView onOpenContext={openContext} />}
          {route.view === "discover" && (
            <DiscoverView onOpenContext={openContext} />
          )}
          {route.view === "saved" && <SavedView onOpenContext={openContext} />}
          {route.view === "inbox" && <InboxView />}
          {route.view === "you" && <YouView />}
          {route.view === "settings" && (
            <SettingsView onOpenContext={openContext} />
          )}
        </main>
        {panelOpen && (
          <div
            className="panel-scrim"
            onClick={() => (mode ? setMode(null) : closePanel())}
          />
        )}
        {panel}
        <StatusBar
          save={storageError ? "session" : "local"}
          offline={state.offline}
          expired={expired}
          syncing={syncing}
          canUndo={history.length > 0}
          onUndo={undo}
          onReconnect={() => setState((s) => ({ ...s, offline: false }))}
          onRestore={() => setExpired(false)}
          onRecoveryDownload={exportData}
          helpItems={[
            {
              label: "Show tips again",
              onSelect: () => {
                setState((s) => ({ ...s, dismissedHints: [] }));
                notify("Tips will show again where they apply.");
              },
            },
            {
              label: "What’s real in this preview?",
              onSelect: () =>
                notify(
                  "Sample Chicago data, a local assistant and no bookings. Everything is saved on this device.",
                ),
            },
            {
              label: "Preview tools",
              onSelect: () =>
                go({ view: "settings", section: "preview" }, null),
            },
          ]}
        />
        <TabBar
          current={rail}
          onGo={goRail}
          unread={state.notifications.length}
        />
        <Sheet
          open={contextOpen}
          title="Browse"
          onClose={() => setContextOpen(false)}
        >
          {sidebar}
        </Sheet>
        {toast && (
          <div className="toast" role="status" key={toast.id}>
            <span>{toast.text}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.run();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              className="toast-close"
              aria-label="Dismiss"
              onClick={() => setToast(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {modal && (
          <Modals
            modal={modal.name}
            id={modal.id}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}
