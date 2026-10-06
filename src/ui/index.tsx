import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  full?: boolean;
};

/** The one button. `sm` is visually compact but keeps a 40px hit area. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "secondary", size = "md", full, className = "", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={rest.type || "button"}
        className={`btn btn-${variant} btn-${size}${full ? " btn-full" : ""} ${className}`}
        {...rest}
      />
    );
  },
);

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "sm" | "md";
};

/** Icon-only control. The label is required and becomes the accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, size = "md", className = "", ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={rest.type || "button"}
        aria-label={label}
        title={label}
        className={`icon-btn icon-btn-${size} ${className}`}
        {...rest}
      />
    );
  },
);

export function Chip({
  pressed,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`chip ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button
          type="button"
          key={key}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** A labelled region inside the side panel. */
export function Section({
  title,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`ui-section ${className}`}>
      {(title || action) && (
        <div className="ui-section-head">
          {title && <h3>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * The side panel shell. On wide screens it sits beside the content; below
 * 760px the same element is styled as a bottom sheet.
 */
export function Panel({
  title,
  subtitle,
  onClose,
  leading,
  footer,
  children,
  label,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  leading?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  label?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector(".dialog-overlay"))
        onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <aside
      className="side-panel"
      aria-label={label || (typeof title === "string" ? title : undefined)}
    >
      <header className="side-panel-head">
        {leading}
        <div className="side-panel-title">
          <h2 ref={heading} tabIndex={-1}>
            {title}
          </h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <IconButton label="Close panel" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </header>
      <div className="side-panel-body">{children}</div>
      {footer && <footer className="side-panel-foot">{footer}</footer>}
    </aside>
  );
}

/** Mobile bottom sheet for lists that live in the sidebar on desktop. */
export function Sheet({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="sheet-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
