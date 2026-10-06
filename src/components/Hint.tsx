import { Lightbulb, X } from "lucide-react";
import { useApp } from "../app/context";
import { IconButton } from "../ui";

/**
 * A one-line tip tied to the thing in front of you. Dismissing it is
 * remembered; Help → "Show tips again" brings every tip back.
 */
export default function Hint({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { state, setState } = useApp();
  if (state.dismissedHints?.includes(id)) return null;
  return (
    <aside className="hint" aria-label="Tip">
      <Lightbulb size={16} />
      <p>{children}</p>
      <IconButton
        label="Dismiss tip"
        size="sm"
        onClick={() =>
          setState((s) => ({
            ...s,
            dismissedHints: [...new Set([...(s.dismissedHints || []), id])],
          }))
        }
      >
        <X size={16} />
      </IconButton>
    </aside>
  );
}
