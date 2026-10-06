import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Brief, State, Trip } from "../model";
import type { Location, PanelRef, Route } from "../routes";
import type { EditProposal } from "../proposals";

/** Side-panel modes that are not addressable by URL. */
export type PanelMode =
  | { kind: "swap"; dayId: string; index: number }
  | { kind: "placing"; placeId: string }
  | { kind: "add"; dayId: string }
  | { kind: "visit"; placeId: string };

export type ToastAction = { label: string; run: () => void };

export type Modal =
  | "share"
  | "edit-brief"
  | "review"
  | "edit-review"
  | "delete-review"
  | "report"
  | "reset"
  | "history"
  | "today"
  | "move";

export type AppApi = {
  state: State;
  setState: Dispatch<SetStateAction<State>>;
  loc: Location;
  /** Navigate. `panel: null` closes the panel; omitted keeps the current one. */
  go: (route: Route, panel?: PanelRef | null) => void;
  openPanel: (panel: PanelRef | null) => void;
  mode: PanelMode | null;
  setMode: (mode: PanelMode | null) => void;
  notify: (text: string, action?: ToastAction) => void;
  /** The trip in the current route, if any. */
  trip?: Trip;
  changeTrip: (label: string, fn: (t: Trip) => void) => void;
  canUndo: boolean;
  undo: () => void;
  history: { label: string; time: string }[];
  openModal: (name: Modal, id?: string) => void;
  // Planning
  brief: Brief | null;
  setBrief: (b: Brief | null) => void;
  busy: boolean;
  generationError: string;
  generate: () => void;
  cancelGeneration: () => void;
  submit: (text: string) => boolean | void;
  scope: string | null;
  setScope: (slot: string | null) => void;
  proposals: EditProposal[];
  dismissProposal: (p: EditProposal) => void;
  applySwap: (
    dayId: string,
    index: number,
    placeId: string | null,
    opts?: {
      batch?: {
        dayId: string;
        index: number;
        after: string | null;
        before: string;
      }[];
      label?: string;
    },
  ) => void;
  addToDay: (dayId: string, placeId: string) => void;
  swapped: string | null;
  startSample: () => void;
  newTrip: () => void;
  openTrip: (id: string) => void;
  // Places
  isSaved: (placeId: string) => boolean;
  toggleSave: (placeId: string) => void;
  chooseStay: (placeId: string) => void;
  exportData: () => void;
  exportTrip: () => void;
  // Preview tools
  preview: {
    expired: boolean;
    setExpired: (v: boolean) => void;
    failNext: () => void;
    partialNext: () => void;
    storageFailure: boolean;
    setStorageFailure: (v: boolean) => void;
    sync: () => void;
  };
  saveState: "local" | "session";
};

export const AppContext = createContext<AppApi | null>(null);

export function useApp() {
  const api = useContext(AppContext);
  if (!api) throw new Error("useApp outside AppContext");
  return api;
}
