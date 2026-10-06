import { useEffect, useState } from "react";
import {
  SlidersHorizontal,
  FlaskConical,
  ShieldCheck,
  Flag,
  Download,
  Trash2,
  KeyRound,
} from "lucide-react";
import { useApp } from "../app/context";
import { getPlace } from "../model";
import type { SettingsSection } from "../routes";
import { Button, Section } from "../ui";
import { ContextSidebar, NavList, PageHeader } from "../shell/Shell";

const sections: [SettingsSection, string, typeof FlaskConical][] = [
  ["general", "General", SlidersHorizontal],
  ["preview", "Preview tools", FlaskConical],
  ["privacy", "Privacy & data", ShieldCheck],
  ["moderation", "Moderation preview", Flag],
];

function Toggle({
  label,
  detail,
  on,
  onChange,
}: {
  label: string;
  detail: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <button
        className="toggle"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
      >
        <span />
      </button>
    </div>
  );
}

export function SettingsView({ onOpenContext }: { onOpenContext: () => void }) {
  const app = useApp();
  const section =
    app.loc.route.view === "settings" ? app.loc.route.section : "general";
  // Every section is on one page; the route only says where to scroll.
  useEffect(() => {
    if (section === "general") return;
    document
      .getElementById(`settings-${section}`)
      ?.scrollIntoView({ block: "start" });
  }, [section]);
  return (
    <div className="page narrow">
      <PageHeader
        title="Settings"
        subtitle="Preferences, preview tools and your data."
        onOpenContext={onOpenContext}
      />
      {sections.map(([id, label, Icon]) => (
        <section
          key={id}
          id={`settings-${id}`}
          className="settings-section"
          aria-labelledby={`settings-${id}-title`}
        >
          <h2 id={`settings-${id}-title`}>
            <Icon size={20} /> {label}
          </h2>
          {id === "general" && <General />}
          {id === "preview" && <PreviewTools />}
          {id === "privacy" && <Privacy />}
          {id === "moderation" && <Moderation />}
        </section>
      ))}
    </div>
  );
}

function General() {
  const { state, setState } = useApp();
  return (
    <Section title="When XPMatch opens">
      <label className="field">
        <span>Start screen</span>
        <select
          value={state.startScreen === "resume" ? "resume" : "trips"}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              startScreen: e.target.value as "trips" | "resume",
            }))
          }
        >
          <option value="trips">Your trips</option>
          <option value="resume">Wherever you left off</option>
        </select>
      </label>
    </Section>
  );
}

function PreviewTools() {
  const app = useApp();
  const { state, setState, preview } = app;
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState<{
    tripId: string;
    local: string;
    remote: string;
  } | null>(null);
  const say = (text: string) => setNotice(text);
  const latest = state.trips.find((t) => t.status !== "archived");
  return (
    <>
      <p className="lead">
        These simulate service problems so you can see how the app recovers.
        Nothing is uploaded or synced; this preview has no server.
      </p>
      <Section title="Connection">
        <Toggle
          label="Offline"
          detail="Planning with the assistant pauses; local edits still work."
          on={state.offline}
          onChange={(v) => setState((s) => ({ ...s, offline: v }))}
        />
        <Toggle
          label="Expired access"
          detail="Drafts are kept until access is restored."
          on={preview.expired}
          onChange={preview.setExpired}
        />
        <Toggle
          label="Storage unavailable"
          detail="Changes last only for this session; a download is offered."
          on={preview.storageFailure}
          onChange={preview.setStorageFailure}
        />
      </Section>
      <Section title="Trip generation">
        <div className="button-row">
          <Button
            onClick={() => {
              preview.failNext();
              say(
                "The next trip you build will fail once. The brief stays editable.",
              );
            }}
          >
            Fail the next build once
          </Button>
          <Button
            onClick={() => {
              preview.partialNext();
              say("The next trip you build will only fill Day 1.");
            }}
          >
            Return a partial trip
          </Button>
          <Button onClick={preview.sync}>Run a connection check</Button>
        </div>
      </Section>
      <Section title="Conflicting edits">
        <p className="muted-note">
          Pretend another device renamed your latest trip.
        </p>
        <Button
          disabled={!latest}
          onClick={() =>
            latest &&
            setConflict({
              tripId: latest.id,
              local: latest.name,
              remote: latest.name + " (edited elsewhere)",
            })
          }
        >
          Simulate a conflict
        </Button>
        {conflict && (
          <div className="conflict-box">
            <h4>Two versions of this trip</h4>
            <p>
              On this device: <strong>{conflict.local}</strong>
            </p>
            <p>
              Elsewhere: <strong>{conflict.remote}</strong>
            </p>
            <div className="button-row">
              <Button
                onClick={() => {
                  setConflict(null);
                  say("Kept this device’s version. Nothing was overwritten.");
                }}
              >
                Keep this device’s
              </Button>
              <Button
                onClick={() => {
                  setState((s) => ({
                    ...s,
                    trips: s.trips.map((t) =>
                      t.id === conflict.tripId
                        ? { ...t, name: conflict.remote }
                        : t,
                    ),
                  }));
                  setConflict(null);
                  say(
                    "Used the other name. Everything else on this device was kept.",
                  );
                }}
              >
                Use the other name
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setState((s) => {
                    const local = s.trips.find(
                      (t) => t.id === conflict.tripId,
                    )!;
                    return {
                      ...s,
                      trips: [
                        ...s.trips,
                        {
                          ...structuredClone(local),
                          id: crypto.randomUUID(),
                          name: conflict.remote,
                        },
                      ],
                    };
                  });
                  setConflict(null);
                  say("Kept both as separate trips.");
                }}
              >
                Keep both
              </Button>
            </div>
          </div>
        )}
      </Section>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
    </>
  );
}

function Privacy() {
  const app = useApp();
  const [recovery, setRecovery] = useState(false);
  return (
    <>
      <Section title="What’s stored">
        <ul className="fact-list">
          <li>
            <strong>Trips, collections and notes</strong>
            <span>In this browser only</span>
          </li>
          <li>
            <strong>Taste profile and private ratings</strong>
            <span>In this browser only · never shared</span>
          </li>
          <li>
            <strong>Public reviews</strong>
            <span>Visible on Discover → People in this preview</span>
          </li>
        </ul>
      </Section>
      <Section title="Your data">
        <div className="button-row">
          <Button onClick={app.exportData}>
            <Download size={16} /> Download my data
          </Button>
          <Button variant="danger" onClick={() => app.openModal("reset")}>
            <Trash2 size={16} /> Reset everything
          </Button>
        </div>
      </Section>
      <Section title="Lost access">
        <p className="muted-note">
          With accounts, you’ll recover access through your sign-in provider.
          This preview has no password to recover.
        </p>
        <Button onClick={() => setRecovery(true)}>
          <KeyRound size={16} /> Preview the recovery message
        </Button>
        {recovery && (
          <p className="notice" role="status">
            “We’ve sent a sign-in link to your email.” (Preview only. No email
            was sent.)
          </p>
        )}
      </Section>
    </>
  );
}

function Moderation() {
  const app = useApp();
  const reported = app.state.reviews.filter((r) => r.reported);
  const [sample, setSample] = useState<"open" | "kept" | "removed">("open");
  return (
    <>
      <p className="lead">
        A preview of how reported reviews are handled. This isn’t an admin
        account.
      </p>
      <Section title="Reported reviews">
        {reported.map((r) => (
          <div className="report-card" key={r.id}>
            <h4>{getPlace(r.placeId).name}</h4>
            <p>{r.text}</p>
            <div className="button-row">
              <Button
                onClick={() => {
                  app.setState((s) => ({
                    ...s,
                    reviews: s.reviews.filter((x) => x.id !== r.id),
                  }));
                  app.notify("Report dismissed; the review stays.");
                }}
              >
                Keep review
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  app.setState((s) => ({
                    ...s,
                    reviews: s.reviews.filter((x) => x.id !== r.id),
                  }));
                  app.notify("Review removed from this preview.");
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        <div className="report-card">
          <h4>The Gage · sample report</h4>
          <p>“Reported as not describing a visit.”</p>
          {sample === "open" ? (
            <div className="button-row">
              <Button onClick={() => setSample("kept")}>Keep review</Button>
              <Button variant="danger" onClick={() => setSample("removed")}>
                Remove
              </Button>
            </div>
          ) : (
            <p className="notice" role="status">
              Decision recorded:{" "}
              {sample === "kept" ? "review kept" : "review removed"} (this
              session only).
            </p>
          )}
        </div>
      </Section>
    </>
  );
}

export function SettingsSidebar() {
  const app = useApp();
  const section =
    app.loc.route.view === "settings" ? app.loc.route.section : "general";
  return (
    <ContextSidebar title="Settings">
      <NavList
        label="Settings sections"
        items={sections.map(([id, label, Icon]) => ({
          id,
          label,
          icon: <Icon size={18} />,
          active: section === id,
          onSelect: () => app.go({ view: "settings", section: id }, null),
        }))}
      />
    </ContextSidebar>
  );
}
