import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "../ui";

/** Modal dialog with focus trap. Used only for share, edits and confirmations. */
export default function Dialog({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const el = ref.current;
    const focusable = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>(
          "button,input,textarea,select,a[href]",
        ) || [],
      ).filter((n) => !n.hasAttribute("disabled"));
    (focusable()[1] || focusable()[0])?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = focusable();
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="dialog-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ref={ref}
      >
        <header className="dialog-head">
          <h2 id="dialog-title">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </header>
        <div className="dialog-body">
          {description && <p className="dialog-lead">{description}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
