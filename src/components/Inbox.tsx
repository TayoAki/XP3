import { useState } from "react";
import { members, sharedItineraries } from "../inspiration";
import { places, type State } from "../model";
export type Conversation = {
  id: string;
  status: "incoming" | "outgoing" | "accepted" | "declined";
  unread: boolean;
  draft: string;
  messages: {
    id: string;
    text: string;
    time: string;
    from: "me" | "member";
    failed?: boolean;
    attachment?: string;
  }[];
};
export function openConversation(state: State, id: string): State {
  return {
    ...state,
    activeConversation: id,
    conversations: state.conversations?.some((c) => c.id === id)
      ? state.conversations
      : [
          ...(state.conversations || []),
          { id, status: "outgoing", unread: false, draft: "", messages: [] },
        ],
  };
}
export default function Inbox({
  state,
  onChange,
  onOpen,
}: {
  state: State;
  onChange: (s: State) => void;
  onOpen: (id: string) => void;
}) {
  const [sourceId, setSourceId] = useState("");
  const [attachment, setAttachment] = useState("");
  const [report, setReport] = useState(false);
  const threads = state.conversations || [];
  const current = threads.find((c) => c.id === state.activeConversation);
  const blocked = state.blockedMembers?.includes(current?.id || "");
  const update = (patch: Partial<Conversation>) =>
    onChange({
      ...state,
      conversations: threads.map((c) =>
        c.id === current?.id ? { ...c, ...patch } : c,
      ),
    });
  const send = () => {
    if (!current || blocked || !current.draft.trim()) return;
    update({
      draft: "",
      messages: [
        ...current.messages,
        {
          id: crypto.randomUUID(),
          text: current.draft.trim(),
          time: new Date().toISOString(),
          from: "me",
          attachment: attachment || undefined,
          failed: state.offline,
        },
      ],
    });
    setAttachment("");
  };
  return (
    <section className="secondary-page">
      <header className="page-header">
        <span className="eyebrow">MEMBER MESSAGES · LOCAL PREVIEW</span>
        <h1>A conversation worth having.</h1>
        <p>
          No message is delivered to another person. Requests, delivery and
          reports are simulated on this device.
        </p>
      </header>
      <label>
        Who can request a conversation?{" "}
        <select
          value={state.messagePrivacy || "requests"}
          onChange={(e) =>
            onChange({
              ...state,
              messagePrivacy: e.target.value as "requests" | "nobody",
            })
          }
        >
          <option value="requests">Members, through requests</option>
          <option value="nobody">Nobody new</option>
        </select>
      </label>
      <div className="inbox-layout">
        <aside>
          <h2>Inbox</h2>
          {!threads.length && (
            <p>
              No conversations yet. Open a sample member profile or start below.
            </p>
          )}
          {threads.map((c) => (
            <button
              className="btn btn-secondary btn-md"
              key={c.id}
              onClick={() =>
                onChange({
                  ...state,
                  activeConversation: c.id,
                  conversations: threads.map((t) =>
                    t.id === c.id ? { ...t, unread: false } : t,
                  ),
                })
              }
            >
              {members.find((m) => m.id === c.id)?.name} · {c.status}
              {c.unread ? " · Unread" : ""}
            </button>
          ))}
          <h3>Sample members</h3>
          {members.map((m) => (
            <button
              className="text-button"
              key={m.id}
              onClick={() => onChange(openConversation(state, m.id))}
            >
              Message {m.name}
            </button>
          ))}
          <button
            className="btn btn-secondary btn-md"
            disabled={
              state.messagePrivacy === "nobody" ||
              threads.some((c) => c.id === "leo")
            }
            onClick={() =>
              onChange({
                ...state,
                activeConversation: "leo",
                conversations: [
                  ...threads.filter((c) => c.id !== "leo"),
                  {
                    id: "leo",
                    status: "incoming",
                    unread: true,
                    draft: "",
                    messages: [
                      {
                        id: crypto.randomUUID(),
                        from: "member",
                        time: new Date().toISOString(),
                        text: "Sample request: happy to discuss my food itinerary.",
                      },
                    ],
                  },
                ],
              })
            }
          >
            Preview incoming request
          </button>
        </aside>
        <section aria-label="Conversation">
          {!current ? (
            <p>
              Select a conversation. Private messages are separate from trip
              collaboration comments.
            </p>
          ) : (
            <>
              <h2>{members.find((m) => m.id === current.id)?.name}</h2>
              <p>
                {current.status === "outgoing"
                  ? "Your first message is a request. Follow-ups wait for acceptance."
                  : current.status === "incoming"
                    ? "Accept this request before replying."
                    : current.status === "declined"
                      ? "Request declined. No messages can be sent."
                      : "Conversation accepted · demo"}
              </p>
              {current.status === "incoming" && (
                <>
                  <button
                    className="button primary"
                    onClick={() =>
                      update({ status: "accepted", unread: false })
                    }
                  >
                    Accept request
                  </button>
                  <button
                    className="btn btn-secondary btn-md"
                    onClick={() =>
                      update({ status: "declined", unread: false })
                    }
                  >
                    Decline request
                  </button>
                </>
              )}
              {current.status === "outgoing" && current.messages.length > 0 && (
                <button
                  className="btn btn-secondary btn-md"
                  onClick={() => update({ status: "accepted" })}
                >
                  Preview recipient acceptance
                </button>
              )}
              <button
                className="btn btn-secondary btn-md"
                onClick={() =>
                  onChange({
                    ...state,
                    blockedMembers: blocked
                      ? state.blockedMembers?.filter((id) => id !== current.id)
                      : [...(state.blockedMembers || []), current.id],
                  })
                }
              >
                {blocked ? "Unblock member" : "Block member"}
              </button>
              <button className="text-button" onClick={() => setReport(true)}>
                Report conversation
              </button>
              {report && (
                <div className="member-evidence">
                  <p>Create a local demo report? No report is sent.</p>
                  <button
                    className="btn btn-secondary btn-md"
                    onClick={() => {
                      onChange({
                        ...state,
                        messageReports: [
                          ...(state.messageReports || []),
                          current.id,
                        ],
                      });
                      setReport(false);
                    }}
                  >
                    Save local report
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setReport(false)}
                  >
                    Cancel report
                  </button>
                </div>
              )}
              {state.messageReports?.includes(current.id) && (
                <p role="status">Local report saved</p>
              )}
              {blocked && (
                <p role="status">Member blocked. Sending is disabled.</p>
              )}
              {sourceId && (
                <div className="member-evidence">
                  <h3>
                    {sharedItineraries.find((t) => t.id === sourceId)?.name}
                  </h3>
                  <p>
                    {sharedItineraries.find((t) => t.id === sourceId)?.caveat}
                  </p>
                  {sharedItineraries
                    .find((t) => t.id === sourceId)
                    ?.days.map((day, i) => (
                      <p key={i}>
                        Day {i + 1}:{" "}
                        {day
                          .map((id) => places.find((p) => p.id === id)?.name)
                          .join(" → ")}
                      </p>
                    ))}
                  <button
                    className="text-button"
                    onClick={() => setSourceId("")}
                  >
                    Close attached itinerary
                  </button>
                </div>
              )}
              <div className="message-history" aria-label="Message history">
                {current.messages.map((m) => (
                  <article className="member-evidence" key={m.id}>
                    <strong>{m.from === "me" ? "You" : "Sample member"}</strong>
                    <p>{m.text}</p>
                    {m.attachment && (
                      <button
                        className="text-button"
                        onClick={() =>
                          m.attachment?.startsWith("trip:")
                            ? setSourceId(m.attachment.slice(5))
                            : onOpen(m.attachment!)
                        }
                      >
                        {m.attachment.startsWith("trip:")
                          ? "Research itinerary: " +
                            sharedItineraries.find(
                              (t) => t.id === m.attachment?.slice(5),
                            )?.name
                          : "Research place: " +
                            places.find((p) => p.id === m.attachment)?.name}
                      </button>
                    )}
                    <small>
                      {new Date(m.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ·{" "}
                      {m.failed
                        ? "Not sent · simulated offline"
                        : "Saved locally · no delivery"}
                    </small>
                    {m.failed && (
                      <button
                        className="btn btn-secondary btn-md"
                        disabled={state.offline || blocked}
                        onClick={() =>
                          update({
                            messages: current.messages.map((item) =>
                              item.id === m.id
                                ? { ...item, failed: false }
                                : item,
                            ),
                          })
                        }
                      >
                        Retry locally
                      </button>
                    )}
                  </article>
                ))}
              </div>
              <label htmlFor="member-message">
                Message {members.find((m) => m.id === current.id)?.name}
              </label>
              <textarea
                id="member-message"
                value={current.draft}
                onChange={(e) => update({ draft: e.target.value })}
                placeholder="Ask about a recommendation…"
              />
              <label>
                Attach research{" "}
                <select
                  value={attachment}
                  onChange={(e) => setAttachment(e.target.value)}
                >
                  <option value="">No attachment</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  {sharedItineraries.map((t) => (
                    <option key={t.id} value={"trip:" + t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button primary"
                disabled={
                  blocked ||
                  !current.draft.trim() ||
                  current.status === "incoming" ||
                  current.status === "declined" ||
                  (current.status === "outgoing" && current.messages.length > 0)
                }
                onClick={send}
              >
                {current.status === "outgoing"
                  ? "Send local request"
                  : "Save local message"}
              </button>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
