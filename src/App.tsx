import Inbox, { openConversation } from "./components/Inbox";
import { sharedItineraries } from "./inspiration";
import {
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  Compass,
  Sparkles,
  Map,
  Bookmark,
  Heart,
  Users,
  Settings,
  Bell,
  ArrowRight,
  Plus,
  Check,
  X,
  ChevronRight,
  CloudOff,
  Menu,
  Undo2,
  Download,
  ShieldCheck,
  BedDouble,
  CalendarDays,
  MessageSquare,
  Flag,
  Plane,
  Star,
  Share2,
} from "lucide-react";
import {
  migrateWorkspace,
  initialState,
  defaultBrief,
  makeTrip,
  samplePrompt,
  getPlace,
  places,
  download,
  dateLabel,
  type State,
  type Page,
  type Brief,
  type Trip,
} from "./model";
import { tasteMatch } from "./taste";
import Planner from "./components/Planner";
import RecoveryPanel from "./components/RecoveryPanel";
import { proposalFor, type EditProposal } from "./proposals";
import PlanningWorkspace from "./components/PlanningWorkspace";
import HomeDashboard from "./components/HomeDashboard";
import Pages from "./components/Pages";
import DetailPanel from "./components/DetailPanel";
import Dialog from "./components/Dialog";
import { Calibration, Ideas, ReturnHub } from "./components/JourneyHub";
import TasteSetup from "./components/TasteSetup";
import SwapPanel, { slotName } from "./components/SwapPanel";
const STORAGE = "xpmatch-journey-preview-v1";
const navigation: [Page, string, typeof Map][] = [
  ["home", "Home", Compass],
  ["ideas", "Ideas", Bookmark],
  ["plan", "Plan a trip", Sparkles],
  ["trips", "My trips", Map],
  ["discover", "Discover", Compass],
  ["saved", "Saved places", Bookmark],
  ["taste", "Taste profile", Heart],
  ["community", "Community", Users],
  ["messages", "Messages", MessageSquare],
  ["connected", "Account trips", ShieldCheck],
];
const validPages: Page[] = [
  "connected",
  "messages",
  "home",
  "ideas",
  "plan",
  "trips",
  "discover",
  "saved",
  "taste",
  "community",
  "settings",
  "notifications",
  "moderation",
];
function recoveryDrafts() {
  try {
    return Object.fromEntries(
      Object.keys(localStorage)
        .filter(
          (k) =>
            k.startsWith("xpmatch-chat-") ||
            k.startsWith("xpmatch-view-") ||
            k === "xpmatch-taste-drafts",
        )
        .map((k) => [k, localStorage.getItem(k)]),
    );
  } catch {
    return {};
  }
}
function currentPage(): Page {
  const hash = location.hash.slice(1) as Page;
  if (validPages.includes(hash)) return hash;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    if (saved.startScreen === "home") return "home";
    if (saved.startScreen === "resume" && validPages.includes(saved.lastPage))
      return saved.lastPage;
  } catch {}
  return "plan";
}
function load(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (
      raw &&
      Array.isArray(raw.trips) &&
      Array.isArray(raw.saved) &&
      Array.isArray(raw.reviews) &&
      raw.trips.every(
        (t: Trip) =>
          t.brief && Array.isArray(t.days) && Array.isArray(t.messages),
      )
    )
      return migrateWorkspace({ ...initialState, ...raw });
  } catch {}
  return migrateWorkspace(initialState);
}
const standalonePreview = true;
export default function App() {
  const [liveMember, setLiveMember] = useState<{
    id: string;
    name?: string;
  } | null>(null);
  useEffect(() => {
    if (standalonePreview) return;
    let active = true;
    fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((r) => {
        if (active) setLiveMember(r.user || null);
      })
      .catch(() => {
        if (!navigator.onLine)
          try {
            const identity = JSON.parse(
              sessionStorage.getItem("xp.live.identity") || "null",
            );
            if (active) setLiveMember(identity);
          } catch {}
      });
    return () => {
      active = false;
    };
  }, []);
  const [state, setState] = useState<State>(() => {
    const s = load();
    return {
      ...s,
      collections: s.collections || [
        {
          id: "first-ideas",
          name: "My Chicago ideas",
          placeIds: s.ideaIds || [],
          note: "",
        },
      ],
    };
  });
  const [page, setPage] = useState<Page>(currentPage);
  // Activity being swapped ("dayId:index"), a chosen place being placed into
  // the trip, and the slots just changed (comma-separated, for a highlight).
  const [swapping, setSwapping] = useState<string | null>(null);
  const [placing, setPlacing] = useState<string | null>(null);
  const [swapped, setSwapped] = useState<string | null>(null);
  useEffect(() => {
    if (!swapped) return;
    const t = setTimeout(() => setSwapped(null), 1800);
    return () => clearTimeout(t);
  }, [swapped]);
  useEffect(() => {
    setSwapping(null);
    setPlacing(null);
  }, [state.activeId]);
  const [selected, setSelected] = useState<string | null>(() =>
    currentPage() === "plan"
      ? state.viewContext?.[state.activeId || ""]?.place || null
      : null,
  );
  const [brief, setBrief] = useState<Brief | null>(() => {
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
  });
  const generationEpoch = useRef(0);
  const [scope, setScope] = useState<string | null>(null);
  const [proposals, setProposals] = useState<EditProposal[]>(
    () => state.pendingProposals || [],
  );
  useEffect(() => {
    setState((s) => ({ ...s, pendingProposals: proposals }));
  }, [proposals]);
  const [busy, setBusy] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [failNext, setFailNext] = useState(false);
  const [partialNext, setPartialNext] = useState(false);
  const [expired, setExpired] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [modal, setModal] = useState<{ name: string; id?: string } | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [history, setHistory] = useState<
    { trip: Trip; label: string; time: string }[]
  >([]);
  const [forceStorageFailure, setForceStorageFailure] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [helpful, setHelpful] = useState(false);
  useEffect(() => {
    if (selected)
      setState((s) => ({
        ...s,
        recentPlaces: [
          selected,
          ...(s.recentPlaces || []).filter((id) => id !== selected),
        ].slice(0, 12),
        researchOrigins:
          page === "home"
            ? s.researchOrigins
            : {
                ...s.researchOrigins,
                [selected]:
                  page === "ideas"
                    ? "collection-" +
                      (s.activeCollectionId ||
                        s.collections?.[0]?.id ||
                        "ideas")
                    : "trip-" + (s.activeId || "general"),
              },
        viewContext:
          page === "plan" && s.activeId
            ? {
                ...s.viewContext,
                [s.activeId]: {
                  day: "all",
                  scroll: 0,
                  ...s.viewContext?.[s.activeId],
                  place: selected,
                },
              }
            : s.viewContext,
      }));
  }, [selected]);
  useEffect(() => {
    setState((s) => (s.lastPage === page ? s : { ...s, lastPage: page }));
  }, [page]);
  const trip = state.trips.find((t) => t.id === state.activeId);
  useEffect(() => {
    const fn = () => {
      const next = currentPage();
      setPage(next);
      setSelected(
        next === "plan"
          ? state.viewContext?.[state.activeId || ""]?.place || null
          : null,
      );
      setMobileMenu(false);
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, [state.activeId, state.viewContext]);
  useEffect(() => {
    try {
      if (forceStorageFailure) throw new Error("Simulated storage failure");
      localStorage.setItem(STORAGE, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state, forceStorageFailure]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    try {
      if (brief)
        localStorage.setItem(STORAGE + "-draft", JSON.stringify(brief));
      else localStorage.removeItem(STORAGE + "-draft");
    } catch {
      setStorageError(true);
    }
  }, [brief]);
  const closeModal = useCallback(() => {
    setModal(null);
    if (modal?.name === "edit-brief") setBrief(null);
  }, [modal?.name]);
  function go(next: Page) {
    if (standalonePreview && next === "connected") next = "settings";
    location.hash = next;
    setPage(next);
    setSelected(null);
    setSwapping(null);
    setPlacing(null);
    setMobileMenu(false);
  }
  function save(id: string) {
    setState((s) => ({
      ...s,
      saved: s.saved.includes(id)
        ? s.saved.filter((p) => p !== id)
        : [...s.saved, id],
    }));
    setToast(
      state.saved.includes(id)
        ? "Removed from your collection."
        : "Saved to your Chicago collection.",
    );
  }
  function changeTrip(label: string, fn: (t: Trip) => void) {
    if (!trip) return;
    setHistory((h) =>
      [
        ...h,
        {
          trip: structuredClone(trip),
          label,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        },
      ].slice(-30),
    );
    const next = structuredClone(trip);
    fn(next);
    next.revision = (trip.revision || 0) + 1;
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => (t.id === next.id ? next : t)),
    }));
    setToast(label);
  }
  function undo() {
    const last = history.at(-1);
    if (!last) {
      setToast("No changes to undo yet.");
      return;
    }
    setState((s) => ({
      ...s,
      activeId: last.trip.id,
      trips: s.trips.map((t) => (t.id === last.trip.id ? last.trip : t)),
    }));
    setHistory((h) => h.slice(0, -1));
    setToast("Previous trip version restored.");
  }
  function openSwap(slot: string) {
    setSelected(null);
    setPlacing(null);
    setSwapping(slot);
  }
  // Places that leave the trip are kept in the first ideas collection.
  function keepAsIdea(id: string) {
    setState((s) => ({
      ...s,
      collections: s.collections?.map((c, i) =>
        i === 0 && !c.placeIds.includes(id)
          ? { ...c, placeIds: [...c.placeIds, id] }
          : c,
      ),
    }));
  }
  // The one path every swap takes: replace a slot, trade two slots, or leave
  // a slot free (placeId null).
  function applySwap(dayId: string, index: number, placeId: string | null) {
    if (!trip) return;
    const from = getPlace(trip.days.find((d) => d.id === dayId)!.places[index]);
    const to = placeId ? getPlace(placeId) : null;
    const there = placeId
      ? trip.days.find((d) => d.places.includes(placeId))
      : undefined;
    const otherIndex = there ? there.places.indexOf(placeId!) : -1;
    changeTrip(
      !to
        ? `${slotName(index)} freed up. ${from.name} is kept in your ideas.`
        : there
          ? `Traded ${from.name} and ${to.name}.`
          : `Swapped ${from.name} for ${to.name}. ${from.name} is kept in your ideas.`,
      (t) => {
        const day = t.days.find((d) => d.id === dayId)!;
        if (!placeId) day.places.splice(index, 1);
        else {
          if (there)
            t.days.find((d) => d.id === there.id)!.places[otherIndex] = from.id;
          day.places[index] = placeId;
        }
      },
    );
    if (!there) keepAsIdea(from.id);
    setScope(null);
    // Any applied change makes pending suggestions for this trip stale.
    setProposals((ps) => ps.filter((p) => p.tripId !== trip.id));
    setSwapping(null);
    setPlacing(null);
    if (placeId)
      setSwapped(
        there
          ? `${dayId}:${index},${there.id}:${otherIndex}`
          : `${dayId}:${index}`,
      );
    if (page !== "plan") go("plan");
  }
  function submit(text: string) {
    if (expired || state.offline) {
      setToast(
        expired
          ? "Restore demo access; your request is retained."
          : "AI planning is unavailable offline. Your request is retained; local edits still work.",
      );
      return false;
    }
    if (!trip) {
      const budget = text.match(/\$(\d+)/)?.[1];
      setBrief({
        ...defaultBrief,
        interests: state.interests.length
          ? state.interests
          : ["Local food", "Architecture"],
        pace: state.pace,
        prompt: text,
        budget: budget ? Number(budget) : 200,
      });
      return;
    }
    const number = text.match(/day\s*(\d+)/i)?.[1];
    const explicitDay = number ? trip.days[Number(number) - 1] : undefined;
    const dayId = scope?.split(":")[0] || explicitDay?.id;
    if (!dayId) {
      setToast(
        "Choose Swap on the activity you want to change, or name a day. Your message is kept.",
      );
      return false;
    }
    const index = scope
      ? Number(scope.split(":")[1])
      : /evening|last|slow|fewer/i.test(text)
        ? Math.max(
            0,
            (trip.days.find((d) => d.id === dayId)?.places.length || 1) - 1,
          )
        : /afternoon/i.test(text)
          ? 1
          : 0;
    const named = places.find(
      (p) =>
        p.kind !== "stay" && text.toLowerCase().includes(p.name.toLowerCase()),
    );
    const supported =
      named ||
      /rain|weather|indoor|slow|fatigue|tired|fewer|alternative|replace|swap/i.test(
        text,
      );
    if (!supported) {
      setToast(
        "This preview understands swap, weather and pace requests. Your message is kept; pick an option in the panel instead.",
      );
      openSwap(`${dayId}:${index}`);
      return false;
    }
    const proposed = proposalFor(
      trip,
      dayId,
      index,
      /slow|fatigue|tired|fewer/i.test(text) ? null : named?.id || "cultural",
    );
    if (!proposed) {
      setToast("That activity slot is empty. Choose a current activity.");
      return false;
    }
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) =>
        t.id === trip.id
          ? {
              ...t,
              messages: [
                ...t.messages,
                { role: "user" as const, text },
                {
                  role: "assistant" as const,
                  text: "I’ve put a suggestion at the top of the swap panel, next to the other options for that slot.",
                },
              ],
            }
          : t,
      ),
    }));
    setProposals([proposed]);
    openSwap(`${dayId}:${index}`);
    return true;
  }
  function generate() {
    if (!brief || busy) return;
    if (state.offline || expired) {
      setGenerationError(
        state.offline
          ? "You’re offline. Your brief is kept; reconnect to generate."
          : "Demo session expired. Restore access to continue; your draft is kept.",
      );
      return;
    }
    setGenerationError("");
    setBusy(true);
    const epoch = ++generationEpoch.current;
    const draft = structuredClone(brief);
    const partialResult = partialNext;
    setTimeout(() => {
      if (epoch !== generationEpoch.current) return;
      if (failNext) {
        setFailNext(false);
        setBusy(false);
        setGenerationError(
          "Generation couldn’t finish. Your brief is safe. Retry when you’re ready.",
        );
        return;
      }
      const next = makeTrip(draft);
      const inspiration = sharedItineraries.find(
        (t) => t.id === draft.sourceItineraryId,
      );
      if (inspiration) {
        next.sourceItineraryId = inspiration.id;
        next.name = inspiration.name + " · my copy";
        next.stayId = inspiration.stayId;
        next.days.forEach((d) => {
          d.places = [];
        });
        inspiration.days.forEach((items, i) =>
          next.days[Math.min(i, next.days.length - 1)].places.push(...items),
        );
        next.messages.push({
          role: "assistant",
          text:
            "Personal copy inspired by " +
            inspiration.name +
            ". Original source is unchanged. Check hours, reservations and seasonal suitability; extra days remain open for planning.",
        });
      }
      if (draft.ideaIds?.length) {
        const ids = draft.ideaIds.filter((id) => getPlace(id).kind !== "stay");
        const stay = draft.ideaIds.find((id) => getPlace(id).kind === "stay");
        if (stay) next.stayId = stay;
        next.days.forEach((d) => {
          d.places = d.places.filter((id) => !ids.includes(id));
        });
        ids.forEach((id, i) => next.days[i % next.days.length].places.push(id));
      }
      if (partialNext) {
        next.days.slice(1).forEach((d) => (d.places = []));
        setPartialNext(false);
        next.messages.push({
          role: "assistant",
          text: "Only Day 1 is ready. The other days need completion; use Complete remaining days.",
        });
      }
      if (draft.collectionId) next.name = draft.prompt.replace(/^Plan /, "");
      if (draft.collectionId)
        next.conversion = {
          collectionId: draft.collectionId,
          placeIds: draft.ideaIds || [],
        };
      setBrief(null);
      setState((s) => ({
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
        ideaIds: (s.ideaIds || []).filter((id) => !draft.ideaIds?.includes(id)),
      }));
      setHistory([]);
      setBusy(false);
      setSelected(null);
      setToast(
        partialResult
          ? "Day 1 is ready. Complete the remaining days before traveling."
          : "Your demo itinerary is ready. Explore any place to dive deeper.",
      );
    }, 1100);
  }
  function exportTrip() {
    if (!trip) return;
    download(
      "xpmatch-chicago-itinerary.txt",
      `${trip.name}\n${dateLabel(trip.brief.start)}–${dateLabel(trip.brief.end)} · ${trip.brief.travelers} travelers\nDEMO ITINERARY — verify all details before travel\n\n${trip.days
        .map(
          (d, i) =>
            `DAY ${i + 1}: ${d.title}\n${d.places
              .map((id) => {
                const p = getPlace(id);
                return `- ${p.name}: ${p.duration}, ${p.price}\n  ${p.address}`;
              })
              .join("\n")}`,
        )
        .join("\n\n")}`,
    );
    setToast("Itinerary downloaded as a readable text file.");
  }
  function action(name: string, id?: string) {
    if (name === "message-member" && id) {
      setState((s) => openConversation(s, id));
      go("messages");
      return;
    }
    if (name === "discover") {
      go("discover");
      return;
    }
    if (name === "inspiration-ideas" || name === "inspiration-plan") {
      const source = sharedItineraries.find((t) => t.id === id);
      if (!source) return;
      if (name === "inspiration-ideas") {
        const collectionId = crypto.randomUUID();
        setState((s) => ({
          ...s,
          activeCollectionId: collectionId,
          collections: [
            ...(s.collections || []),
            {
              id: collectionId,
              name: source.name + " · ideas",
              placeIds: [...new Set(source.days.flat())],
              note: "Sample source: " + source.name + ". " + source.caveat,
              dayGroups: source.days.map((places, i) => ({
                id: "source-day-" + i,
                title: "Day " + (i + 1),
                places: [...places],
              })),
            },
          ],
        }));
        go("ideas");
      } else {
        setState((s) => ({ ...s, activeId: null }));
        setBrief({
          ...defaultBrief,
          sourceItineraryId: source.id,
          prompt: "Adapt " + source.name + " for me. " + source.caveat,
        });
        go("plan");
      }
      return;
    }

    if (name === "continue-draft") {
      go("plan");
      return;
    }
    if (name === "cancel-generation") {
      generationEpoch.current++;
      setBusy(false);
      setToast("Generation canceled. Your brief is kept.");
      return;
    }
    if (name === "remove-dates" && trip) {
      setModal(null);
      const collectionId = crypto.randomUUID();
      setState((s) => ({
        ...s,
        collections: [
          ...(s.collections || []),
          {
            id: collectionId,
            name: trip.name + " · undated",
            placeIds: [...new Set(trip.days.flatMap((d) => d.places))],
            note: "Converted from a dated trip. Original activity order and dated backup are preserved.",
            dayGroups: structuredClone(trip.days),
            sourceTripId: trip.id,
          },
        ],
        activeCollectionId: collectionId,
        trips: s.trips.map((t) =>
          t.id === trip.id ? { ...t, status: "archived" } : t,
        ),
      }));
      go("ideas");
      setToast(
        "Undated workspace created. Restore the dated backup from Home → Archived.",
      );
      return;
    }
    if (name === "swap") {
      if (!trip) {
        setToast("Start a sample trip to try this part of the journey.");
        action("sample");
        return;
      }
      if (id) openSwap(id);
      else setSwapping(null);
      return;
    }
    if (name === "ask-place") {
      setScope(id || null);
      setToast("Chat scoped to this activity. Describe the change below.");
      return;
    }
    if (name === "clear-scope") {
      setScope(null);
      return;
    }
    if (name === "review-proposal") {
      const pending = proposals.find((p) => p.tripId === trip?.id);
      if (pending) openSwap(`${pending.dayId}:${pending.index}`);
      return;
    }
    if (name === "restore-access") {
      setExpired(false);
      setGenerationError("");
      setToast("Demo access restored. Your draft and trip are kept.");
      return;
    }
    if (name === "complete-days") {
      if (trip)
        changeTrip("Remaining sample days completed.", (t) => {
          const fixture = makeTrip(t.brief);
          t.days.forEach((d, i) => {
            if (!d.places.length) d.places = fixture.days[i].places;
          });
        });
      return;
    }
    if (name === "ideas" || name === "return-hub") {
      go(name === "ideas" ? "ideas" : "home");
      return;
    }
    if (name === "undo-conversion" && trip?.conversion) {
      setModal(null);
      const conversion = trip.conversion;
      setState((s) => ({
        ...s,
        collections: s.collections?.map((c) =>
          c.id === conversion.collectionId
            ? {
                ...c,
                placeIds: [...new Set([...c.placeIds, ...conversion.placeIds])],
              }
            : c,
        ),
        trips: s.trips.map((t) =>
          t.id === trip.id
            ? { ...t, status: "archived", conversion: undefined }
            : t,
        ),
      }));
      go("ideas");
      setToast(
        "Ideas returned to the collection. The generated trip is kept in your archive.",
      );
      return;
    }
    if (["calibrate", "connection"].includes(name)) {
      setModal({ name });
      return;
    }
    if (validPages.includes(name as Page)) {
      go(name as Page);
      return;
    }
    if (name === "sample") {
      const t = makeTrip({
        ...defaultBrief,
        prompt: samplePrompt,
        interests: state.interests,
      });
      setState((s) => ({ ...s, trips: [t, ...s.trips], activeId: t.id }));
      setBrief(null);
      setHistory([]);
      go("plan");
      return;
    }
    if (name === "new") {
      generationEpoch.current++;
      setBusy(false);
      setScope(null);
      setGenerationError("");
      setState((s) => ({ ...s, activeId: null }));
      setBrief(null);
      setHistory([]);
      go("plan");
      return;
    }
    if (name === "resume") {
      generationEpoch.current++;
      setBusy(false);
      setScope(null);
      setGenerationError("");
      setState((s) => ({ ...s, activeId: id || null }));
      setBrief(null);
      setHistory([]);
      go("plan");
      return;
    }
    if (name === "replay-guide") {
      setState((s) => ({ ...s, tripGuideDismissed: false }));
      setToast("Trip guide reopened above your itinerary.");
      return;
    }
    if (name === "undo") {
      undo();
      return;
    }
    if (name === "edit-brief" && trip) {
      setBrief(structuredClone(trip.brief));
      setModal({ name: "edit-brief" });
      return;
    }
    if (name === "earlier" || name === "later") {
      const [d, j] = id!.split(":");
      changeTrip("Activity reordered.", (t) => {
        const day = t.days.find((x) => x.id === d)!;
        const i = Number(j),
          to = name === "earlier" ? i - 1 : i + 1;
        if (to < 0 || to >= day.places.length) return;
        [day.places[i], day.places[to]] = [day.places[to], day.places[i]];
      });
      return;
    }
    if (name === "drop") {
      try {
        const target = JSON.parse(id!);
        const source = JSON.parse(target.source);
        if (!trip?.days.find((d) => d.id === source.dayId)) return;
        changeTrip("Activity moved.", (t) => {
          const from = t.days.find((d) => d.id === source.dayId)!;
          const to = t.days.find((d) => d.id === target.dayId)!;
          const [item] = from.places.splice(source.index, 1);
          if (item) to.places.splice(target.index, 0, item);
        });
      } catch {
        setToast("Couldn’t move that item. Use the activity menu instead.");
      }
      return;
    }
    if (name === "data-export") {
      download(
        "xpmatch-preview-data.json",
        JSON.stringify(
          {
            schemaVersion: 2,
            ...state,
            briefDraft: brief,
            workspaceDrafts: recoveryDrafts(),
          },
          null,
          2,
        ),
        "application/json",
      );
      setToast("Your prototype data was exported.");
      return;
    }
    if (name === "helpful") {
      setHelpful((v) => !v);
      setToast(
        helpful ? "Helpful mark removed." : "Marked helpful in this demo.",
      );
      return;
    }
    if (name === "dismiss-report" || name === "remove-report") {
      setState((s) => ({
        ...s,
        reviews: s.reviews.filter((r) => r.id !== id),
      }));
      setToast(
        name === "remove-report"
          ? "Review removed from this local demo."
          : "Report dismissed; review kept.",
      );
      return;
    }
    if (
      [
        "add",
        "add-day",
        "move",
        "today",
        "bookings",
        "share",
        "stays",
        "export",
        "history",
        "trip-options",
        "replan",
      ].includes(name) &&
      !trip
    ) {
      setToast("Start a sample trip to try this part of the journey.");
      action("sample");
      return;
    }
    setModal({ name, id });
  }
  const form =
    (fn: (data: FormData) => void) => (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      fn(new FormData(e.currentTarget));
    };
  const selectDay = (defaultId?: string) => (
    <label>
      Add to day
      <select name="day" defaultValue={defaultId || trip?.days[0]?.id}>
        {trip?.days.map((d, i) => (
          <option key={d.id} value={d.id}>
            Day {i + 1} · {d.title}
          </option>
        ))}
      </select>
    </label>
  );
  const modalName = modal?.name || "";
  const titles: Record<string, string> = {
    "choose-stay": "Confirm your trip’s base.",
    "choose-activity": "Choose where this alternative belongs.",
    account: "A little more personal.",
    add: "Make room for a good find.",
    "add-day": "Find your next stop.",
    move: "Give it a new place in your day.",
    stays: "A good base changes everything.",
    share: "Better together.",
    history: "Your trip, as it evolves.",
    "trip-options": "Make this trip yours.",
    bookings: "Keep the details together.",
    export: "Ready when you are.",
    today: "Today, at your pace.",
    review: "Tell us how it felt.",
    "edit-review": "A fresh take.",
    "delete-review": "Remove your demo review?",
    report: "Help keep reviews useful.",
    profile: "A fellow curious wanderer.",
    replan: "A little change, a better day.",
    "edit-brief": "Your trip starts here.",
    "taste-setup": "A little more you.",
    privacy: "Your taste. Your choice.",
    reset: "Start fresh?",
    lifecycle: "The next chapter.",
    "notification-settings": "Stay updated, your way.",
    "saved-list": "Your Chicago collection.",
    "moderate-sample": "Review the report.",
    recovery: "Find your way back.",
    calibrate: "Teach us your taste.",
    ideas: "Good ideas don’t need dates.",
    "return-hub": "Welcome back. Where next?",
    connection: "Your plan, kept safe.",
  };
  return (
    <div
      className={`app-shell ${selected || (swapping && page === "plan") || placing ? "with-detail" : ""}`}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <a className="brand" href="#plan">
          <span className="brand-mark">
            <Compass size={24} />
          </span>
          <span>
            XP<span>Match</span>
          </span>
        </a>
        <button
          className="new-trip"
          onClick={() => {
            if (liveMember) {
              go("plan");
              window.dispatchEvent(new Event("xp.live.newtrip"));
            } else action("new");
          }}
        >
          <Plus size={17} /> New trip
        </button>
        <div className="nav-caption">YOUR WORLD</div>
        <nav aria-label="Main navigation">
          {navigation.filter(([id]) => !standalonePreview || id !== "connected").map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => go(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "saved" && state.saved.length > 0 && (
                <small>{state.saved.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sparkles size={18} />
            <strong>Your kind of places.</strong>
            <p>Better with every discovery.</p>
            <button onClick={() => go("taste")}>
              Shape your taste <ArrowRight size={13} />
            </button>
          </div>
          <button
            className="sidebar-utility"
            onClick={() => go("notifications")}
          >
            <Bell size={18} /> Notifications{" "}
            {!liveMember && state.notifications.length > 0 && (
              <span className="notification-dot" />
            )}
          </button>
          <button className="sidebar-utility" onClick={() => go("settings")}>
            <Settings size={18} /> Settings
          </button>
          <button className="account-button" onClick={() => go("connected")}>
            <span className="avatar blue">
              {liveMember
                ? liveMember.name?.slice(0, 1) || "M"
                : state.demoMember
                  ? "JD"
                  : "G"}
            </span>
            <span>
              <strong>
                {liveMember
                  ? liveMember.name || "Member"
                  : state.demoMember
                    ? "Demo traveler"
                    : "Guest explorer"}
              </strong>
              <small>
                {liveMember
                  ? "Your account workspace"
                  : state.demoMember
                    ? "Your local demo profile"
                    : "Sign in to keep your plans"}
              </small>
            </span>
            <ChevronRight size={16} />
          </button>
          <span className="sidebar-demo">JOURNEY PREVIEW · V1</span>
        </div>
      </aside>
      <div className="mobile-header">
        <button
          className="icon-button"
          onClick={() => setMobileMenu((v) => !v)}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>
        <span className="brand">XPMatch</span>
        <button
          className="icon-button"
          onClick={() => action("account")}
          aria-label="Open account"
        >
          <Users size={19} />
        </button>
      </div>
      <main id="main-content" className="main-content">
        {(state.offline || storageError) && (
          <div className="connection-banner" role="status">
            <CloudOff size={16} />
            {storageError
              ? "Local storage is unavailable. Changes will last for this session."
              : "Offline preview · your local trip is available."}
            {storageError && (
              <button onClick={() => action("data-export")}>
                Download recovery data
              </button>
            )}
            {state.offline && (
              <button
                onClick={() => {
                  setState((s) => ({ ...s, offline: false }));
                  setToast("Reconnected preview. Your local changes are kept.");
                }}
              >
                Reconnect
              </button>
            )}
          </div>
        )}
        {syncing && (
          <div className="recovery-banner" role="status">
            Checking demo connection · changes stay local
          </div>
        )}
        {expired && (
          <div className="recovery-banner">
            Demo access expired · drafts kept
            <button onClick={() => action("restore-access")}>
              Restore access
            </button>
          </div>
        )}
        {generationError && (
          <div className="recovery-banner" role="alert">
            <strong>{generationError}</strong>
            <button
              className="button secondary"
              disabled={busy}
              onClick={generate}
            >
              Retry generation
            </button>
            <button onClick={() => action("connection")}>
              Connection & access
            </button>
          </div>
        )}
        {trip?.days.some((d) => !d.places.length) && (
          <div className="recovery-banner">
            <strong>Some days are still empty.</strong>
            <button onClick={() => action("complete-days")}>
              Complete remaining days
            </button>
          </div>
        )}
        {page === "home" ? (
          <HomeDashboard
            hasDraft={!!brief}
            state={state}
            action={action}
            onOpen={setSelected}
            onRename={(id, name) =>
              setState((s) => ({
                ...s,
                trips: s.trips.map((t) => (t.id === id ? { ...t, name } : t)),
              }))
            }
          />
        ) : page === "messages" ? (
          <Inbox
            state={state}
            onChange={setState}
            onOpen={setSelected}
            onSource={() => go("discover")}
          />
        ) : page === "ideas" ? (
          <PlanningWorkspace
            state={state}
            onChange={setState}
            onOpen={setSelected}
            onPlan={(b) => {
              setState((s) => ({ ...s, activeId: null }));
              setBrief(b);
              go("plan");
            }}
          />
        ) : page === "plan" ? (
          <Planner
            key={trip?.id || "new-trip"}
            onDraft={(text) =>
              setState((s) => ({
                ...s,
                chatDrafts: { ...s.chatDrafts, [trip?.id || "new"]: text },
              }))
            }
            scope={scope}
            hasProposal={proposals.some((p) => p.tripId === trip?.id)}
            trip={trip}
            tasteState={state}
            savedLocally={!storageError}
            guideDismissed={!!state.tripGuideDismissed}
            tasteSetupDone={!!state.tasteSetupDone}
            onDismissGuide={() =>
              setState((s) => ({ ...s, tripGuideDismissed: true }))
            }
            brief={modalName === "edit-brief" ? null : brief}
            busy={busy}
            saved={state.saved}
            onSubmit={submit}
            onBrief={setBrief}
            onGenerate={generate}
            onOpen={(id) => {
              setSwapping(null);
              setPlacing(null);
              setSelected(id);
            }}
            onSave={save}
            action={action}
            swapping={swapping}
            swapped={swapped}
          />
        ) : (
          <Pages
            page={page}
            state={state}
            onChange={setState}
            onOpen={setSelected}
            onSave={save}
            action={action}
          />
        )}
      </main>
      {trip && ((swapping && page === "plan") || placing) ? (
        <SwapPanel
          key={swapping || placing!}
          trip={trip}
          target={
            swapping && page === "plan"
              ? {
                  kind: "slot",
                  dayId: swapping.split(":")[0],
                  index: Number(swapping.split(":")[1]),
                }
              : { kind: "place", placeId: placing! }
          }
          state={state}
          suggestion={
            swapping
              ? proposals.find(
                  (p) =>
                    p.tripId === trip.id &&
                    `${p.dayId}:${p.index}` === swapping,
                )
              : undefined
          }
          onSwap={applySwap}
          onAdd={(dayId, placeId) => {
            changeTrip(`${getPlace(placeId).name} added to your trip.`, (t) => {
              t.days.find((d) => d.id === dayId)!.places.push(placeId);
            });
            const day = trip.days.find((d) => d.id === dayId)!;
            setPlacing(null);
            setSwapped(`${dayId}:${day.places.length}`);
            if (page !== "plan") go("plan");
          }}
          onDismissSuggestion={() =>
            setProposals((ps) =>
              ps.filter(
                (p) =>
                  !(
                    p.tripId === trip.id && `${p.dayId}:${p.index}` === swapping
                  ),
              ),
            )
          }
          onAsk={() => {
            action("ask-place", swapping!);
            setSwapping(null);
          }}
          onBack={
            placing
              ? () => {
                  setSelected(placing);
                  setPlacing(null);
                }
              : undefined
          }
          onClose={() => {
            setSwapping(null);
            setPlacing(null);
          }}
        />
      ) : selected ? (
        <DetailPanel
          key={selected}
          place={{
            ...getPlace(selected),
            fit: tasteMatch(getPlace(selected), state).score,
          }}
          saved={state.saved.includes(selected)}
          onClose={() => {
            setSelected(null);
            if (page === "plan" && state.activeId)
              setState((s) => ({
                ...s,
                viewContext: {
                  ...s.viewContext,
                  [s.activeId!]: {
                    day: "all",
                    scroll: 0,
                    ...s.viewContext?.[s.activeId!],
                    place: undefined,
                  },
                },
              }));
          }}
          onSave={() => save(selected)}
          onAdd={() => action("add", selected)}
          onReview={() => action("review", selected)}
          onReport={() => action("report", selected)}
          onHelpful={() => action("helpful")}
          onProfile={() => action("profile")}
          researchScope={
            page === "home"
              ? state.researchOrigins?.[selected] || "general"
              : page === "ideas"
                ? "collection-" +
                  (state.activeCollectionId ||
                    state.collections?.[0]?.id ||
                    "ideas")
                : "trip-" + (state.activeId || "general")
          }
          onChoose={(id) => {
            if (getPlace(id).kind === "stay") {
              setModal({ name: "choose-stay", id });
            } else if (trip) {
              setSelected(null);
              setSwapping(null);
              setPlacing(id);
            } else setModal({ name: "choose-activity", id });
          }}
          state={state}
          onChange={setState}
          onOpen={setSelected}
          reviews={state.reviews}
        />
      ) : trip && page === "plan" ? (
        <aside className="trip-overview">
          <div className="detail-heading">
            <div>
              <span className="eyebrow">YOUR RESEARCH SPACE</span>
              <h2>Trip details</h2>
            </div>
            <Compass size={21} />
          </div>
          <div className="overview-content">
            <div className="overview-illustration">
              <Map size={32} />
              <span className="orbit-dot one" />
              <span className="orbit-dot two" />
            </div>
            <h3>Your trip, in focus.</h3>
            <p>
              Click a place in your chat, itinerary, or map to explore photos,
              reviews, and why it fits you.
            </p>
            <div className="overview-facts">
              <span>
                <CalendarDays size={17} />
                <strong>
                  {dateLabel(trip.brief.start)}–{dateLabel(trip.brief.end)}
                </strong>
              </span>
              <span>
                <Users size={17} />
                <strong>{trip.brief.travelers} travelers</strong>
              </span>
              <span>
                <BedDouble size={17} />
                <strong>${trip.brief.budget} / night target</strong>
              </span>
            </div>
            <div className="overview-checklist">
              <span className="eyebrow">A LITTLE PREPARATION</span>
              <button onClick={() => setSelected("hotel-loop")}>
                <span className="check-circle">
                  <Check size={13} />
                </span>{" "}
                Compare your stays <ChevronRight size={15} />
              </button>
              <button onClick={() => action("bookings")}>
                <span className="check-circle">
                  <Plus size={13} />
                </span>{" "}
                Add your reservations <ChevronRight size={15} />
              </button>
              <button onClick={() => action("share")}>
                <span className="check-circle">
                  <Users size={13} />
                </span>{" "}
                Bring someone along <ChevronRight size={15} />
              </button>
            </div>
            <div className="overview-tip">
              <Sparkles size={17} />
              <strong>Start with a favorite.</strong>
              <p>The Gage looks like your kind of lunch.</p>
              <button
                className="text-button"
                onClick={() => setSelected("gage")}
              >
                Take a look <ArrowRight size={14} />
              </button>
            </div>
            <span className="fine-print">
              Sample Chicago data · verify details before travel
            </span>
          </div>
        </aside>
      ) : null}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          {history.length > 0 && page === "plan" && (
            <button onClick={undo}>Undo</button>
          )}
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal && (
        <Dialog
          key={`${modal.name}-${modal.id}`}
          title={titles[modal.name] || "Explore your trip."}
          onClose={closeModal}
        >
          {modalName === "choose-stay" && (
            <>
              <p className="dialog-description">
                {getPlace(modal.id!).name} · {getPlace(modal.id!).price}. This
                selects a stay; no booking is made.
              </p>
              {trip ? (
                <>
                  <p>
                    Before:{" "}
                    {trip.stayId
                      ? getPlace(trip.stayId).name
                      : "No stay selected"}
                  </p>
                  <p>After: {getPlace(modal.id!).name}</p>
                  <p className="fine-print">
                    Verify total price, taxes, cancellation terms and
                    availability. Trip dates and budget remain unchanged.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => {
                      changeTrip(
                        "Stay selected. You can undo this choice.",
                        (t) => {
                          t.stayId = modal.id;
                        },
                      );
                      closeModal();
                    }}
                  >
                    Confirm stay choice
                  </button>
                </>
              ) : (
                <button
                  className="button secondary"
                  onClick={() => {
                    closeModal();
                    go("home");
                  }}
                >
                  Resume a trip first
                </button>
              )}
            </>
          )}
          {modalName === "choose-activity" && !trip && (
            <>
              <p>
                Resume a trip to place this alternative, or save it as an idea.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  save(modal.id!);
                  closeModal();
                }}
              >
                Save place
              </button>
            </>
          )}
          {modalName === "calibrate" && (
            <Calibration state={state} onChange={setState} />
          )}
          {modalName === "ideas" && (
            <Ideas
              state={state}
              onChange={setState}
              onOpen={(id) => {
                closeModal();
                setSelected(id);
              }}
              onPlan={(b) => {
                setState((s) => ({ ...s, activeId: null }));
                setBrief(b);
                closeModal();
                go("plan");
              }}
            />
          )}
          {modalName === "return-hub" && (
            <ReturnHub
              state={state}
              onAction={(n, id) => {
                closeModal();
                if (n === "stays" && !trip) {
                  setToast("Resume a trip first to compare its stays.");
                  return;
                }
                action(n, id);
              }}
            />
          )}
          {modalName === "connection" && (
            <RecoveryPanel
              state={state}
              onChange={setState}
              expired={expired}
              onExpired={() => setExpired(!expired)}
              onFail={() => setFailNext(true)}
              onPartial={() => setPartialNext(true)}
              onStorage={() => setForceStorageFailure(!forceStorageFailure)}
              onSync={() => {
                setSyncing(true);
                setTimeout(() => {
                  setSyncing(false);
                  setToast(
                    "Connection check simulated. Local changes kept; no server upload.",
                  );
                }, 900);
              }}
            />
          )}
          {modalName === "taste-setup" && (
            <TasteSetup
              interests={state.interests}
              pace={state.pace}
              onSkip={closeModal}
              onSave={(interests, pace) => {
                setState((s) => ({
                  ...s,
                  interests,
                  pace,
                  tasteSetupDone: true,
                }));
                closeModal();
                setToast(
                  "Taste saved on this device. Future briefs will start with these preferences.",
                );
              }}
            />
          )}
          {modalName === "account" && (
            <>
              <div className="account-preview">
                <span className="profile-avatar">
                  {liveMember
                    ? liveMember.name?.slice(0, 1) || "M"
                    : state.demoMember
                      ? "JD"
                      : "G"}
                </span>
                <p>
                  {state.demoMember
                    ? "You’re using a local demo member profile."
                    : "Keep your trips, build your taste, and discover more with people like you."}
                </p>
              </div>
              <button
                className="button primary full"
                onClick={() => {
                  setState((s) => ({ ...s, demoMember: !s.demoMember }));
                  closeModal();
                  setToast(
                    state.demoMember
                      ? "Switched to guest preview."
                      : "Demo member profile enabled. No account was created.",
                  );
                }}
              >
                {state.demoMember
                  ? "Return to guest preview"
                  : "Continue with demo profile"}
                <ArrowRight size={17} />
              </button>
              <p className="fine-print">
                Google sign-in and secure authentication will connect in the
                backend phase. No credentials are collected here.
              </p>
            </>
          )}
          {(modalName === "add" ||
            modalName === "add-day" ||
            modalName === "move") && (
            <form
              onSubmit={form((data) => {
                const target = String(data.get("day"));
                const placeId = String(data.get("place"));
                if (modalName === "move") {
                  const [from, index] = modal.id!.split(":");
                  changeTrip("Activity moved to a new day.", (t) => {
                    const source = t.days.find((d) => d.id === from)!;
                    const [item] = source.places.splice(Number(index), 1);
                    t.days.find((d) => d.id === target)!.places.push(item);
                  });
                } else if (getPlace(placeId)?.kind === "stay") {
                  changeTrip("Stay selected for your trip.", (t) => {
                    t.stayId = placeId;
                    t.bookings = t.bookings.filter(
                      (b) => b.reference !== "STAY-PREVIEW",
                    );
                    t.bookings.push({
                      name: getPlace(placeId).name,
                      reference: "STAY-PREVIEW",
                      note: "Selected preference · not booked",
                    });
                  });
                } else {
                  changeTrip("Place added to your itinerary.", (t) => {
                    const day = t.days.find((d) => d.id === target)!;
                    if (!day.places.includes(placeId)) day.places.push(placeId);
                  });
                }
                closeModal();
              })}
            >
              {modalName === "add" ? (
                <>
                  <p className="dialog-description">
                    {getPlace(modal.id!).name}
                  </p>
                  <input type="hidden" name="place" value={modal.id} />
                </>
              ) : modalName !== "move" ? (
                <label>
                  Choose a place
                  <select name="place">
                    {places
                      .filter((p) => p.kind !== "stay")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.price}
                        </option>
                      ))}
                  </select>
                </label>
              ) : (
                <p className="dialog-description">
                  Move the activity without losing its place details.
                </p>
              )}
              {getPlace(modal.id || "")?.kind !== "stay" &&
                selectDay(modalName === "add-day" ? modal.id : undefined)}
              <p className="fine-print">
                Your itinerary and route preview update together. You can undo
                this change.
              </p>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button className="button primary">
                  Confirm change
                  <Check size={16} />
                </button>
              </div>
            </form>
          )}
          {modalName === "edit-brief" && brief && (
            <form
              onSubmit={form((data) => {
                const start = String(data.get("start")),
                  end = String(data.get("end"));
                if (end < start) {
                  setToast("End date must come after start date.");
                  return;
                }
                if ((Date.parse(end) - Date.parse(start)) / 86400000 > 6) {
                  setToast("Choose up to seven days for this preview.");
                  return;
                }
                changeTrip(
                  "Trip brief updated. Your days now follow the new dates.",
                  (t) => {
                    t.brief = {
                      ...brief,
                      start,
                      end,
                      budget: Number(data.get("budget")),
                      travelers: Number(data.get("travelers")),
                    };
                    const count = Math.min(
                      7,
                      Math.max(
                        1,
                        Math.round(
                          (Date.parse(end) - Date.parse(start)) / 86400000,
                        ) + 1,
                      ),
                    );
                    while (t.days.length < count)
                      t.days.push({
                        id: crypto.randomUUID(),
                        title: "Room to discover",
                        places: [],
                      });
                    if (t.days.length > count) {
                      const extras = t.days
                        .slice(count)
                        .flatMap((d) => d.places);
                      setState((s) => ({
                        ...s,
                        saved: [...new Set([...s.saved, ...extras])],
                      }));
                      t.days = t.days.slice(0, count);
                    }
                  },
                );
                setBrief(null);
                closeModal();
              })}
            >
              <div className="brief-grid">
                <label>
                  Start date
                  <input
                    name="start"
                    type="date"
                    defaultValue={brief.start}
                    required
                  />
                </label>
                <label>
                  End date
                  <input
                    name="end"
                    type="date"
                    defaultValue={brief.end}
                    required
                  />
                </label>
                <label>
                  Travelers
                  <input
                    name="travelers"
                    type="number"
                    min="1"
                    defaultValue={brief.travelers}
                    required
                  />
                </label>
                <label>
                  Hotel budget / night
                  <input
                    name="budget"
                    type="number"
                    min="1"
                    defaultValue={brief.budget}
                    required
                  />
                </label>
              </div>
              <p className="fine-print">
                Dates adjust your day structure, with removed activities saved
                for later. The preview supports up to seven days.
              </p>
              <button className="button primary">
                Save brief <Check size={16} />
              </button>
            </form>
          )}
          {modalName === "bookings" && (
            <>
              <p className="dialog-description">
                Add the details you’ll want close when you travel.
              </p>
              <form
                onSubmit={form((data) => {
                  changeTrip("Reservation details added.", (t) =>
                    t.bookings.push({
                      name: String(data.get("name")),
                      reference: String(data.get("reference")),
                      note: String(data.get("note")),
                    }),
                  );
                  closeModal();
                })}
              >
                <label>
                  Booking or hotel name
                  <input
                    name="name"
                    placeholder="e.g. Central Loop Hotel"
                    required
                  />
                </label>
                <label>
                  Confirmation reference
                  <input
                    name="reference"
                    placeholder="Your reservation number"
                    required
                  />
                </label>
                <label>
                  Notes or pasted confirmation
                  <textarea
                    name="note"
                    placeholder="Dates, check-in time, or useful details"
                    rows={3}
                  />
                </label>
                <p className="fine-print">
                  Manual entry preview. Email and document import will connect
                  later. Do not enter sensitive booking details in this demo.
                </p>
                <button className="button primary">
                  Add reservation <Plus size={16} />
                </button>
              </form>
              {trip?.bookings.map((b, i) => (
                <div className="booking-row" key={i}>
                  <BedDouble size={17} />
                  <div>
                    <strong>{b.name}</strong>
                    <small>
                      {b.reference} · {b.note}
                    </small>
                  </div>
                </div>
              ))}
            </>
          )}
          {modalName === "share" && (
            <>
              <p className="dialog-description">
                Preview planning together. Add a travel partner and leave a note
                for the group.
              </p>
              <form
                onSubmit={form((data) => {
                  changeTrip(
                    "Travel partner added to the local preview.",
                    (t) =>
                      t.partners.push(
                        `${String(data.get("name"))} · ${String(data.get("permission"))}`,
                      ),
                  );
                  closeModal();
                })}
              >
                <label>
                  Travel partner’s name
                  <input name="name" placeholder="e.g. Alex" required />
                </label>
                <label>
                  Permission
                  <select name="permission">
                    <option>Can edit the trip</option>
                    <option>Can view the trip</option>
                  </select>
                </label>
                <button className="button primary">
                  <Users size={16} /> Add demo partner
                </button>
              </form>
              <p className="fine-print">
                Local collaboration preview. No invitation or message is sent.
              </p>
              <div className="partner-row">
                {trip?.partners.map((p, i) => (
                  <span key={i} className="tags">
                    <span>{p}</span>
                  </span>
                ))}
              </div>
              <form
                onSubmit={form((data) => {
                  changeTrip("Comment added to the trip.", (t) =>
                    t.comments.push(String(data.get("comment"))),
                  );
                  setToast("Comment added to the local trip.");
                })}
              >
                <label>
                  Trip conversation
                  <textarea
                    name="comment"
                    placeholder="I’d love a slower morning on Saturday…"
                    required
                  />
                </label>
                <button className="button secondary">
                  <MessageSquare size={15} /> Add comment
                </button>
              </form>
              {trip?.comments.map((c, i) => (
                <p className="comment" key={i}>
                  You · {c}
                </p>
              ))}
            </>
          )}
          {modalName === "history" && (
            <>
              <p className="dialog-description">
                Review what changed and return to the previous version.
              </p>
              {history.length ? (
                history
                  .slice()
                  .reverse()
                  .map((h, i) => (
                    <div className="history-row" key={i}>
                      <HistoryDot />
                      <span>
                        <strong>{h.label}</strong>
                        <small>{h.time}</small>
                      </span>
                    </div>
                  ))
              ) : (
                <p className="empty-inline">
                  Your trip is at its first version.
                </p>
              )}
              <button
                className="button secondary"
                disabled={!history.length}
                onClick={() => {
                  undo();
                  closeModal();
                }}
              >
                <Undo2 size={16} /> Undo latest change
              </button>
            </>
          )}
          {modalName === "trip-options" && (
            <div className="option-list">
              {[
                ["edit-brief", "Edit trip brief", CalendarDays],
                [
                  "remove-dates",
                  "Continue without dates (keep dated backup)",
                  CalendarDays,
                ],
                ...(trip?.conversion
                  ? [
                      [
                        "undo-conversion",
                        "Return scheduled ideas to collection",
                        Undo2,
                      ],
                    ]
                  : []),
                ["bookings", "Reservations", Plane],
                ["share", "Partners & comments", Users],
                ["history", "Changes & undo", Undo2],
                ["export", "Export & offline preview", Download],
                ["lifecycle", "Complete, archive, or reuse", Check],
              ].map(([name, label, Icon]) => {
                const Component = Icon as typeof Map;
                return (
                  <button
                    key={String(name)}
                    onClick={() => action(String(name))}
                  >
                    <Component size={18} />
                    {String(label)}
                    <ChevronRight size={16} />
                  </button>
                );
              })}
            </div>
          )}
          {modalName === "export" && (
            <>
              <p className="dialog-description">
                Take your days and place details with you.
              </p>
              <button className="settings-action" onClick={exportTrip}>
                <Download size={19} />
                <span>Download a text itinerary</span>
                <ArrowRight size={16} />
              </button>
              <button
                className="settings-action"
                onClick={() => {
                  setState((s) => ({ ...s, offline: true }));
                  closeModal();
                  setToast(
                    "Offline preview enabled. Local trip data is available.",
                  );
                }}
              >
                <CloudOff size={19} />
                <span>Try offline access</span>
                <ArrowRight size={16} />
              </button>
              <p className="fine-print">
                This preview keeps structured trip data locally. Offline image
                downloads, maps, PDF and calendar exports are for the
                backend/integration phase.
              </p>
            </>
          )}
          {modalName === "today" && (
            <>
              <p className="dialog-description">
                Day 1 · {trip?.days[0].title}. Preview travel mode using your
                first day.
              </p>
              {trip?.days[0].places.map((id) => (
                <div className="today-row" key={id}>
                  <span className={visited.includes(id) ? "visited" : ""}>
                    {visited.includes(id) ? (
                      <Check size={17} />
                    ) : (
                      <Map size={17} />
                    )}
                  </span>
                  <button
                    className="text-button"
                    onClick={() => {
                      setSelected(id);
                      closeModal();
                    }}
                  >
                    {getPlace(id).name}
                  </button>
                  <button
                    className="button secondary compact-button"
                    onClick={() =>
                      setVisited((v) =>
                        v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
                      )
                    }
                  >
                    {visited.includes(id) ? "Visited" : "Check in"}
                  </button>
                </div>
              ))}
              <button
                className="button primary"
                onClick={() => {
                  action("review", trip?.days[0].places[0]);
                }}
              >
                How was your visit? <Star size={16} />
              </button>
            </>
          )}
          {(modalName === "review" || modalName === "edit-review") && (
            <form
              onSubmit={form((data) => {
                const review = {
                  id:
                    modalName === "edit-review"
                      ? modal.id!
                      : crypto.randomUUID(),
                  placeId: String(data.get("place")),
                  rating: Number(data.get("rating")),
                  text: String(data.get("text")),
                  public: data.get("visibility") === "public",
                  helpful: false,
                  reported: false,
                };
                setState((s) => ({
                  ...s,
                  reviews:
                    modalName === "edit-review"
                      ? s.reviews.map((r) => (r.id === review.id ? review : r))
                      : [review, ...s.reviews],
                }));
                closeModal();
                setToast(
                  review.public
                    ? "Demo review published locally."
                    : "Private visit feedback saved locally.",
                );
              })}
            >
              <p className="dialog-description">
                Your experience can help shape better matches. Choose whether to
                share it.
              </p>
              <label>
                Place
                <select
                  name="place"
                  defaultValue={
                    modalName === "edit-review"
                      ? state.reviews.find((r) => r.id === modal.id)?.placeId
                      : modal.id || "gage"
                  }
                >
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Your rating
                <select
                  name="rating"
                  defaultValue={
                    modalName === "edit-review"
                      ? state.reviews.find((r) => r.id === modal.id)?.rating
                      : 5
                  }
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} stars
                    </option>
                  ))}
                </select>
              </label>
              <label>
                What made it your kind of place?
                <textarea
                  name="text"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={1500}
                  defaultValue={
                    modalName === "edit-review"
                      ? state.reviews.find((r) => r.id === modal.id)?.text
                      : ""
                  }
                  placeholder="Share the atmosphere, the pace, and what you enjoyed…"
                />
              </label>
              <label>
                Who can see it?
                <select
                  name="visibility"
                  defaultValue={
                    modalName === "edit-review" &&
                    state.reviews.find((r) => r.id === modal.id)?.public
                      ? "public"
                      : "private"
                  }
                >
                  <option value="private">
                    Just me · use as private feedback
                  </option>
                  <option value="public">
                    Community · publish a local demo review
                  </option>
                </select>
              </label>
              <p className="fine-print">
                Nothing is sent to a server. Public means visible in this
                prototype’s Community page.
              </p>
              <button className="button primary">
                Save my experience <Check size={16} />
              </button>
            </form>
          )}
          {modalName === "delete-review" && (
            <>
              <p className="dialog-description">
                This removes only the selected review from this browser’s
                prototype data.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  setState((s) => ({
                    ...s,
                    reviews: s.reviews.filter((r) => r.id !== modal.id),
                  }));
                  closeModal();
                  setToast("Demo review removed.");
                }}
              >
                Remove demo review
              </button>
            </>
          )}
          {modalName === "report" && (
            <form
              onSubmit={form((data) => {
                setState((s) => ({
                  ...s,
                  reviews: [
                    ...s.reviews,
                    {
                      id: crypto.randomUUID(),
                      placeId: modal.id || "gage",
                      text: `Reported sample review: ${String(data.get("reason"))}`,
                      rating: 5,
                      public: false,
                      helpful: false,
                      reported: true,
                    },
                  ],
                }));
                closeModal();
                setToast(
                  "Local report created. View it in the moderation preview.",
                );
              })}
            >
              <label>
                What needs attention?
                <select name="reason">
                  <option>Not relevant to this place</option>
                  <option>Spam or advertising</option>
                  <option>Abusive content</option>
                  <option>Possible conflict of interest</option>
                </select>
              </label>
              <p className="fine-print">
                No real review or member is reported. This creates a sample
                moderation item.
              </p>
              <button className="button primary">
                Submit demo report <Flag size={16} />
              </button>
            </form>
          )}
          {modalName === "profile" && (
            <>
              <div className="profile-banner">
                <span className="avatar rose large">ML</span>
                <div>
                  <h3>Maya L.</h3>
                  <p>Chicago · culture, cozy tables, and slow mornings.</p>
                </div>
              </div>
              <div className="fit-explainer">
                <Sparkles size={20} />
                <span>
                  <strong>Similar taste</strong>
                  <p>8 shared ratings · illustrative match</p>
                </span>
              </div>
              <div className="tags">
                <span>Local food</span>
                <span>Architecture</span>
                <span>Easy pace</span>
              </div>
              <p className="dialog-description">
                A sample member profile showing the context behind a
                recommendation.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  closeModal();
                  setToast("Following Maya in this demo session.");
                }}
              >
                Follow demo traveler <Plus size={16} />
              </button>
            </>
          )}
          {modalName === "replan" && (
            <>
              <div className="evidence-box">
                <strong>Confirmed brief stays in place</strong>
                <p>
                  {trip!.days.length} days · {trip!.brief.travelers} travelers ·{" "}
                  {trip!.brief.pace} · ${trip!.brief.budget}/night · no flights
                </p>
              </div>
              <p className="dialog-description">
                {modal.id === "alternative"
                  ? "Here’s a sample alternative for your first afternoon. Review it before changing the plan; your dates, party, stay and budget remain the same."
                  : modal.id === "rain"
                    ? "Replace the outdoor park stop with an indoor cultural stop."
                    : "Remove the last stop from Day 1 and leave a little room to wander."}
              </p>
              <div className="change-preview">
                <span>BEFORE</span>
                <strong>
                  {
                    getPlace(
                      trip!.days[0].places[
                        modal.id === "alternative"
                          ? 1
                          : modal.id === "rain"
                            ? 0
                            : trip!.days[0].places.length - 1
                      ] || "bean",
                    ).name
                  }
                </strong>
                <ArrowRight size={19} />
                <span>AFTER</span>
                <strong>
                  {modal.id === "rain" || modal.id === "alternative"
                    ? "Chicago Cultural Center"
                    : "Free time · saved for later"}
                </strong>
              </div>
              <p className="fine-print">
                Existing reservations are preserved. Review travel times before
                traveling.
              </p>
              <div className="dialog-actions">
                <button className="button secondary" onClick={closeModal}>
                  Keep current plan
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    const removed =
                      modal.id === "alternative"
                        ? trip!.days[0].places[
                            Math.min(1, trip!.days[0].places.length - 1)
                          ]
                        : modal.id === "rain"
                          ? trip!.days[0].places[0]
                          : trip!.days[0].places.at(-1);
                    changeTrip(
                      "Replan applied. Your itinerary and map are updated.",
                      (t) => {
                        if (modal.id === "rain" || modal.id === "alternative")
                          t.days[0].places[
                            modal.id === "alternative"
                              ? Math.min(1, t.days[0].places.length - 1)
                              : 0
                          ] = "cultural";
                        else t.days[0].places.pop();
                        t.messages.push({
                          role: "assistant",
                          text: "Done. I’ve updated your first day. You can undo the change or explore the new plan.",
                        });
                      },
                    );
                    if (removed)
                      setState((s) => ({
                        ...s,
                        saved: [...new Set([...s.saved, removed])],
                      }));
                    closeModal();
                  }}
                >
                  Apply change <Check size={16} />
                </button>
              </div>
            </>
          )}
          {modalName === "stays" && (
            <>
              <p className="dialog-description">
                Two central bases. Compare route fit and the full cost.
              </p>
              {places
                .filter((p) => p.kind === "stay")
                .map((p) => (
                  <button
                    className="compare-stay"
                    key={p.id}
                    onClick={() => {
                      setSelected(p.id);
                      closeModal();
                    }}
                  >
                    <img src={p.image} alt="Illustrative hotel photo" />
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {p.area} · {p.fit}% demo match
                      </small>
                      <strong>{p.price}</strong>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              <p className="fine-print">
                Demo prices are estimates, not availability or offers.
              </p>
            </>
          )}
          {modalName === "lifecycle" && (
            <div className="option-list">
              {[
                ["complete", "Mark completed"],
                ["archived", "Archive trip"],
                ["planning", "Restore to active planning"],
                ["reuse", "Reuse as a new trip"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    const target = state.trips.find(
                      (t) => t.id === (modal.id || state.activeId),
                    );
                    if (!target) return;
                    if (value === "reuse") {
                      const t = structuredClone(target);
                      t.id = crypto.randomUUID();
                      t.status = "planning";
                      t.name = target.name + " · new chapter";
                      setState((s) => ({
                        ...s,
                        trips: [t, ...s.trips],
                        activeId: t.id,
                      }));
                      go("plan");
                    } else
                      setState((s) => ({
                        ...s,
                        trips: s.trips.map((t) =>
                          t.id === target.id
                            ? { ...t, status: value as Trip["status"] }
                            : t,
                        ),
                      }));
                    closeModal();
                    setToast("Trip updated locally.");
                  }}
                >
                  <Check size={17} />
                  {label}
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          )}
          {modalName === "privacy" && (
            <>
              <p className="dialog-description">
                Private preferences are the default. Each review can be private
                feedback or shared with the demo community.
              </p>
              <div className="privacy-fact">
                <Lock />
                <strong>Preferences</strong>
                <span>Stored locally · never sent</span>
              </div>
              <div className="privacy-fact">
                <ShieldCheck size={18} />
                <strong>Review visibility</strong>
                <span>You choose per review</span>
              </div>
              <button
                className="button secondary"
                onClick={() => action("data-export")}
              >
                Export my demo data <Download size={16} />
              </button>
            </>
          )}
          {modalName === "reset" && (
            <>
              <p className="dialog-description">
                Clear this prototype’s local trips, reviews, and preferences.
                Your existing XPMatch app is unaffected.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  setState(structuredClone(initialState));
                  setBrief(null);
                  setHistory([]);
                  setVisited([]);
                  setSelected(null);
                  closeModal();
                  go("plan");
                  setToast("Prototype reset. You’re ready for a new journey.");
                }}
              >
                Reset this prototype
              </button>
            </>
          )}
          {modalName === "notification-settings" && (
            <>
              <p className="dialog-description">
                In this frontend preview, notifications appear inside the app.
                No email or push messages are sent.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  setState((s) => ({ ...s, notifications: [] }));
                  closeModal();
                  setToast("Demo notifications cleared.");
                }}
              >
                Clear current updates <Check size={16} />
              </button>
            </>
          )}
          {modalName === "saved-list" && (
            <>
              <p className="dialog-description">
                Your saved Chicago places are available while planning. Add any
                place to a day without losing it from your collection.
              </p>
              <div className="option-list">
                {state.saved.map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setSelected(id);
                      closeModal();
                    }}
                  >
                    <Bookmark size={16} />
                    {getPlace(id).name}
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
              <p className="fine-print">
                Named multi-list management is a future extension; this preview
                uses one Chicago collection.
              </p>
            </>
          )}
          {modalName === "moderate-sample" && (
            <>
              <p className="dialog-description">
                Reported for being unrelated to the place. Review the context
                and record a decision.
              </p>
              <blockquote>
                Sample content that doesn’t describe a visit.
              </blockquote>
              <div className="dialog-actions">
                <button
                  className="button secondary"
                  onClick={() => {
                    closeModal();
                    setToast("Sample report dismissed.");
                  }}
                >
                  Keep review
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    closeModal();
                    setToast(
                      "Sample removal decision recorded in this session.",
                    );
                  }}
                >
                  Remove sample
                </button>
              </div>
            </>
          )}
          {modalName === "recovery" && (
            <>
              <p className="dialog-description">
                The connected app will let members recover access through their
                sign-in provider. This prototype uses local data and has no
                password.
              </p>
              <button
                className="button primary"
                onClick={() => {
                  closeModal();
                  setToast("Recovery confirmation preview. No email was sent.");
                }}
              >
                Preview recovery confirmation <ArrowRight size={16} />
              </button>
            </>
          )}
        </Dialog>
      )}
    </div>
  );
}
function HistoryDot() {
  return <span className="history-dot" />;
}
function Lock() {
  return <ShieldCheck size={18} />;
}
