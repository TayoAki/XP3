import { useEffect, useState } from "react";
import { ArrowUp, Plus, X } from "lucide-react";
import { IconButton } from "../../ui";

/**
 * The docked chat composer. Drafts are kept per trip so leaving and coming
 * back (or a reload) never loses what was typed.
 */
export default function Composer({
  draftKey,
  placeholder,
  busy,
  onSend,
  onAttach,
  scopeLabel,
  onClearScope,
}: {
  draftKey: string;
  placeholder: string;
  busy: boolean;
  onSend: (text: string) => boolean | void;
  onAttach?: () => void;
  scopeLabel?: string;
  onClearScope?: () => void;
}) {
  const storageKey = "xpmatch-chat-" + draftKey;
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || "";
    } catch {
      return "";
    }
  });
  const [sending, setSending] = useState(false);
  useEffect(() => {
    try {
      if (text) localStorage.setItem(storageKey, text);
      else localStorage.removeItem(storageKey);
    } catch {}
  }, [text, storageKey]);
  function send() {
    const value = text.trim();
    if (!value || busy || sending) return;
    setSending(true);
    // A short beat so the "Sending" state is visible and double-sends are blocked.
    setTimeout(() => {
      if (onSend(value) !== false) setText("");
      setSending(false);
    }, 250);
  }
  return (
    <div className="composer-dock">
      {scopeLabel && (
        <div className="composer-scope">
          <span>
            Editing <strong>{scopeLabel}</strong>
          </span>
          <IconButton
            label="Stop editing this activity"
            size="sm"
            onClick={onClearScope}
          >
            <X size={16} />
          </IconButton>
        </div>
      )}
      <form
        className="composer-box"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label className="sr-only" htmlFor={`composer-${draftKey}`}>
          Message your travel assistant
        </label>
        <textarea
          id={`composer-${draftKey}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="composer-actions">
          {onAttach && (
            <IconButton
              label="Add a booking or travel detail"
              onClick={onAttach}
            >
              <Plus size={20} />
            </IconButton>
          )}
          <span className="composer-hint" aria-live="polite">
            {sending
              ? "Sending…"
              : busy
                ? "Working on your trip…"
                : "Enter to send · Shift+Enter for a new line"}
          </span>
          <button
            className="composer-send"
            type="submit"
            disabled={!text.trim() || busy || sending}
            aria-label="Send message"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
