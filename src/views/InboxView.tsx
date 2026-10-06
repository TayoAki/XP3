import { Bell, Check, CheckCheck, Compass } from "lucide-react";
import { useApp } from "../app/context";
import { Button, IconButton } from "../ui";
import { PageHeader } from "../shell/Shell";

/** Updates about trips. Member messaging needs a backend, so it isn’t shown. */
export function InboxView() {
  const { state, setState, go, notify } = useApp();
  const items = state.notifications;
  return (
    <div className="page narrow">
      <PageHeader
        title="Inbox"
        subtitle="Updates about your trips. Messaging other members isn’t available in this preview."
        actions={
          items.length > 0 && (
            <Button
              size="sm"
              onClick={() => {
                const before = items;
                setState((s) => ({ ...s, notifications: [] }));
                notify("All updates marked as read.", {
                  label: "Undo",
                  run: () => setState((s) => ({ ...s, notifications: before })),
                });
              }}
            >
              <CheckCheck size={16} /> Mark all read
            </Button>
          )
        }
      />
      {items.length ? (
        <ul className="update-list">
          {items.map((n, i) => (
            <li key={`${n}-${i}`}>
              <Bell size={18} />
              <span>{n}</span>
              <IconButton
                label="Mark as read"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    notifications: s.notifications.filter((_, j) => j !== i),
                  }))
                }
              >
                <Check size={18} />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <Compass size={28} />
          <h2>You’re all caught up</h2>
          <p>Changes to your trips and reminders will show up here.</p>
          <Button
            variant="primary"
            onClick={() => go({ view: "trips", tab: "upcoming" }, null)}
          >
            Back to your trips
          </Button>
        </div>
      )}
    </div>
  );
}
