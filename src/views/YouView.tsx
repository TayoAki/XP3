import { Settings, ArrowRight, ShieldCheck } from "lucide-react";
import { useApp } from "../app/context";
import type { YouTab } from "../routes";
import { Button, Section } from "../ui";
import { PageHeader } from "../shell/Shell";
import TasteStudio from "../components/TasteStudio";

const tabs = [
  ["taste", "Taste"],
  ["account", "Account"],
] as const;

export function YouView() {
  const app = useApp();
  const tab = app.loc.route.view === "you" ? app.loc.route.tab : "taste";
  return (
    <div className="page">
      <PageHeader
        title="You"
        subtitle="Your taste shapes every recommendation. It stays on this device."
        tabs={tabs}
        tab={tab}
        onTab={(t: YouTab) => app.go({ view: "you", tab: t })}
      />
      {tab === "taste" && (
        <TasteStudio
          state={app.state}
          onChange={(s) => app.setState(s)}
          onOpen={(id) => app.openPanel({ kind: "place", id })}
          onReview={(id) => app.openModal("review", id)}
        />
      )}
      {tab === "account" && <Account />}
    </div>
  );
}

function Account() {
  const app = useApp();
  const member = app.state.demoMember;
  return (
    <div className="narrow-block">
      <Section title="Your account">
        <div className="account-card">
          <span className="avatar-mark large">{member ? "JD" : "G"}</span>
          <div>
            <strong>
              {member ? "Demo traveller" : "Exploring as a guest"}
            </strong>
            <p className="muted-note">
              {member
                ? "A local demo profile. No account was created."
                : "Everything works without an account. Your plans are saved on this device."}
            </p>
          </div>
        </div>
        <div className="button-row">
          <Button
            variant={member ? "secondary" : "primary"}
            onClick={() => {
              app.setState((s) => ({ ...s, demoMember: !s.demoMember }));
              app.notify(
                member
                  ? "Back to guest mode."
                  : "Demo profile on. No account was created.",
              );
            }}
          >
            {member ? "Return to guest mode" : "Try the demo profile"}
          </Button>
        </div>
        <p className="muted-note">
          <ShieldCheck size={14} /> Sign-in will arrive with the backend.
          Signing in will keep your current trip and return you to the same
          screen.
        </p>
      </Section>
      <Section title="Settings">
        <Button
          onClick={() => app.go({ view: "settings", section: "general" }, null)}
        >
          <Settings size={16} /> Open settings <ArrowRight size={16} />
        </Button>
      </Section>
    </div>
  );
}
