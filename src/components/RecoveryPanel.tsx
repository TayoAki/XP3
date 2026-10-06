import { useState } from "react";
import { type State } from "../model";
export default function RecoveryPanel({
  state,
  onChange,
  expired,
  onExpired,
  onFail,
  onPartial,
  onStorage,
  onSync,
}: {
  state: State;
  onChange: (s: State) => void;
  expired: boolean;
  onExpired: () => void;
  onFail: () => void;
  onPartial: () => void;
  onStorage: () => void;
  onSync: () => void;
}) {
  const [conflict, setConflict] = useState<{
    tripId: string;
    remoteName: string;
    localName: string;
  } | null>(null);
  const [notice, setNotice] = useState("");
  return (
    <>
      <p className="dialog-description">
        Preview testing tools. These simulate service failures; nothing is
        uploaded or synchronized with an account.
      </p>
      <div className="hub-actions">
        <button onClick={() => onChange({ ...state, offline: !state.offline })}>
          {state.offline ? "Reconnect preview" : "Simulate offline"}
        </button>
        <button onClick={onExpired}>
          {expired ? "Restore demo access" : "Simulate expired access"}
        </button>
        <button
          onClick={() => {
            onFail();
            setNotice(
              "Next generation will fail once; its brief will remain editable.",
            );
          }}
        >
          Fail next generation once
        </button>
        <button
          onClick={() => {
            onPartial();
            setNotice("Next generation will return partial days.");
          }}
        >
          Simulate partial result
        </button>
        <button onClick={onStorage}>Toggle storage failure</button>
        <button onClick={onSync}>Simulate connection check</button>
        <button
          disabled={!state.activeId}
          onClick={() => {
            const t = state.trips.find((t) => t.id === state.activeId);
            if (t)
              setConflict({
                tripId: t.id,
                localName: t.name,
                remoteName: t.name + " · remote demo revision",
              });
          }}
        >
          Simulate conflicting trip revision
        </button>
      </div>
      {conflict && (
        <section className="evidence-box">
          <h3>Review before replacing anything</h3>
          <p>Local: {conflict.localName}</p>
          <p>Remote demo: {conflict.remoteName}</p>
          <p className="fine-print">
            This simulation conflicts only on the trip name. Both versions can
            be kept.
          </p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => {
                setConflict(null);
                setNotice("Local version kept. No local edits overwritten.");
              }}
            >
              Keep local
            </button>
            <button
              className="button secondary"
              onClick={() => {
                onChange({
                  ...state,
                  trips: state.trips.map((t) =>
                    t.id === conflict.tripId
                      ? {
                          ...t,
                          name: conflict.remoteName,
                          revision: (t.revision || 0) + 1,
                        }
                      : t,
                  ),
                });
                setConflict(null);
                setNotice(
                  "Remote demo name chosen. Other local fields preserved.",
                );
              }}
            >
              Use remote name
            </button>
            <button
              className="button primary"
              onClick={() => {
                const local = state.trips.find(
                  (t) => t.id === conflict.tripId,
                )!;
                onChange({
                  ...state,
                  trips: [
                    ...state.trips,
                    {
                      ...structuredClone(local),
                      id: crypto.randomUUID(),
                      name: conflict.remoteName,
                    },
                  ],
                });
                setConflict(null);
                setNotice("Both versions kept as separate local trips.");
              }}
            >
              Keep both versions
            </button>
          </div>
        </section>
      )}
      {notice && <p role="status">{notice}</p>}
      <p className="fine-print">
        Real server conflict resolution and secure session restoration need
        backend integration.
      </p>
    </>
  );
}
