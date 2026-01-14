import { useState } from "react";
import { ConvoysView } from "./components/convoys/ConvoysView";
import { CrewStats } from "./components/crew/CrewStats";
import { MailView } from "./components/mail/MailView";
import { NuclearPowerButton } from "./components/power/NuclearPowerButton";
import { SettingsView } from "./components/settings/SettingsView";
import { CRTScreen } from "./components/shared/CRTScreen";
import { QuickInput } from "./components/shared/QuickInput";
import { RigFilter } from "./components/shared/RigFilter";
import { RigProvider } from "./contexts/RigContext";

type TabId = "mail" | "convoys" | "crew" | "settings";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "mail", label: "MAIL", icon: "📧" },
  { id: "convoys", label: "CONVOYS", icon: "🚚" },
  { id: "crew", label: "CREW", icon: "👥" },
  { id: "settings", label: "SETTINGS", icon: "⚙️" },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("mail");

  return (
    <RigProvider>
      <CRTScreen showBootSequence={true} enableFlicker={true} enableScanlines={true} enableNoise={true}>
        <div className="app-container">
          <header className="app-header">
            <h1 className="crt-glow">GASTOWN-BOY</h1>
            <div className="header-controls">
              <RigFilter />
              <NuclearPowerButton />
            </div>
          </header>

          <nav className="app-nav">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <main className="app-content">
            <section
              className="tab-view"
              hidden={activeTab !== "mail"}
              aria-hidden={activeTab !== "mail"}
            >
              <MailView />
            </section>
            <section
              className="tab-view"
              hidden={activeTab !== "convoys"}
              aria-hidden={activeTab !== "convoys"}
            >
              <ConvoysView />
            </section>
            <section
              className="tab-view"
              hidden={activeTab !== "crew"}
              aria-hidden={activeTab !== "crew"}
            >
              <CrewStats />
            </section>
            <section
              className="tab-view"
              hidden={activeTab !== "settings"}
              aria-hidden={activeTab !== "settings"}
            >
              <SettingsView />
            </section>
          </main>

          <QuickInput />
        </div>
      </CRTScreen>
    </RigProvider>
  );
}

export default App;
