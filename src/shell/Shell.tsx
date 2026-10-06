import type { ReactNode } from "react";
import {
  Compass,
  Search,
  Bell,
  Bookmark,
  Settings,
  ChevronDown,
  CloudOff,
  Check,
  HardDrive,
  Undo2,
  CircleHelp,
  Sparkles,
} from "lucide-react";
import { Menu, Segmented } from "../ui";

export type RailId =
  | "trips"
  | "discover"
  | "inbox"
  | "saved"
  | "settings"
  | "you";

const railItems: [Exclude<RailId, "you">, string, typeof Compass][] = [
  ["trips", "Trips", Compass],
  ["discover", "Discover", Search],
  ["inbox", "Inbox", Bell],
  ["saved", "Saved", Bookmark],
  ["settings", "Settings", Settings],
];

/** Desktop and tablet: a narrow rail of five destinations plus "You". */
export function Rail({
  current,
  onGo,
  initials,
  unread,
}: {
  current: RailId;
  onGo: (id: RailId) => void;
  initials: string;
  unread: number;
}) {
  return (
    <nav className="rail" aria-label="Main">
      <a className="rail-brand" href="#/trips" aria-label="XPMatch home">
        <Compass size={22} />
      </a>
      <div className="rail-items">
        {railItems.map(([id, label, Icon]) => (
          <button
            key={id}
            className="rail-item"
            aria-current={current === id ? "page" : undefined}
            onClick={() => onGo(id)}
          >
            <span className="rail-icon">
              <Icon size={20} />
              {id === "inbox" && unread > 0 && (
                <span className="rail-dot" aria-hidden="true" />
              )}
            </span>
            <span>{label}</span>
            {id === "inbox" && unread > 0 && (
              <span className="sr-only">, {unread} unread</span>
            )}
          </button>
        ))}
      </div>
      <button
        className="rail-item rail-you"
        aria-current={current === "you" ? "page" : undefined}
        onClick={() => onGo("you")}
      >
        <span className="avatar-mark">{initials}</span>
        <span>You</span>
      </button>
    </nav>
  );
}

const tabItems: [RailId, string, typeof Compass][] = [
  ["trips", "Trips", Compass],
  ["discover", "Discover", Search],
  ["saved", "Saved", Bookmark],
  ["inbox", "Inbox", Bell],
  ["you", "You", Sparkles],
];

/** Phones: the rail becomes a bottom tab bar. Settings lives under You. */
export function TabBar({
  current,
  onGo,
  unread,
}: {
  current: RailId;
  onGo: (id: RailId) => void;
  unread: number;
}) {
  return (
    <nav className="tab-bar" aria-label="Main">
      {tabItems.map(([id, label, Icon]) => (
        <button
          key={id}
          aria-current={
            current === id || (id === "you" && current === "settings")
              ? "page"
              : undefined
          }
          onClick={() => onGo(id)}
        >
          <span className="rail-icon">
            <Icon size={20} />
            {id === "inbox" && unread > 0 && <span className="rail-dot" />}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export type NavItem = {
  id: string;
  label: string;
  meta?: string;
  icon?: ReactNode;
  active?: boolean;
  onSelect: () => void;
};

/** The context list shown in the sidebar (or in a sheet on small screens). */
export function NavList({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <ul className="nav-list" aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            aria-current={item.active ? "true" : undefined}
            onClick={item.onSelect}
          >
            {item.icon}
            <span className="nav-list-text">
              <span>{item.label}</span>
              {item.meta && <small>{item.meta}</small>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ContextSidebar({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <aside className="context-sidebar" aria-label={title}>
      <div className="context-head">
        <h2>{title}</h2>
      </div>
      {action && <div className="context-action">{action}</div>}
      <div className="context-body">{children}</div>
    </aside>
  );
}

/**
 * Page title, optional tabs and actions. When the view has a context list
 * and the sidebar is hidden (tablet and phone), the title opens it.
 */
export function PageHeader<T extends string>({
  title,
  subtitle,
  tabs,
  tab,
  onTab,
  actions,
  onOpenContext,
  leading,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  tabs?: readonly (readonly [T, string])[];
  tab?: T;
  onTab?: (t: T) => void;
  actions?: ReactNode;
  onOpenContext?: () => void;
  leading?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="page-head-row">
        {leading}
        <div className="page-head-title">
          {onOpenContext ? (
            <>
              <h1 className="title-wide">{title}</h1>
              <button
                className="title-button"
                onClick={onOpenContext}
                aria-haspopup="dialog"
              >
                <h1>{title}</h1>
                <ChevronDown size={18} />
              </button>
            </>
          ) : (
            <h1>{title}</h1>
          )}
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {tabs && tab && onTab && (
        <Segmented
          label="Sections"
          options={tabs}
          value={tab}
          onChange={onTab}
        />
      )}
    </header>
  );
}

export type SaveState = "local" | "session";

/** Quiet status bar: save, sync and preview state on the left; undo and help on the right. */
export function StatusBar({
  save,
  offline,
  expired,
  syncing,
  canUndo,
  onUndo,
  onReconnect,
  onRestore,
  onRecoveryDownload,
  helpItems,
}: {
  save: SaveState;
  offline: boolean;
  expired: boolean;
  syncing: boolean;
  canUndo: boolean;
  onUndo: () => void;
  onReconnect: () => void;
  onRestore: () => void;
  onRecoveryDownload: () => void;
  helpItems: { label: string; onSelect: () => void }[];
}) {
  return (
    <footer className="status-bar">
      <div className="status-left" role="status">
        {save === "local" ? (
          <span>
            <Check size={14} /> Saved on this device
          </span>
        ) : (
          <span className="status-warn">
            <HardDrive size={14} /> Storage unavailable · this session only
            <button onClick={onRecoveryDownload}>Download a copy</button>
          </span>
        )}
        {offline && (
          <span className="status-warn">
            <CloudOff size={14} /> Offline preview
            <button onClick={onReconnect}>Reconnect</button>
          </span>
        )}
        {expired && (
          <span className="status-warn">
            Demo access expired · drafts kept
            <button onClick={onRestore}>Restore access</button>
          </span>
        )}
        {syncing && <span>Checking connection…</span>}
        <span className="status-muted">Preview · sample Chicago data</span>
      </div>
      <div className="status-right">
        <button onClick={onUndo} disabled={!canUndo}>
          <Undo2 size={14} /> Undo
        </button>
        <Menu
          label="Help"
          trigger={<CircleHelp size={16} />}
          items={helpItems}
        />
      </div>
    </footer>
  );
}
