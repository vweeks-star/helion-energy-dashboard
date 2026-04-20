/* Chrome: Sidebar, Topbar, Statusbar */

function Sidebar({ active, onNav, scenario, snap, soc }) {
  const nav = [
    { id: "overview", label: "Overview",  kbd: "1" },
    { id: "forecast", label: "Forecast",  kbd: "2" },
    { id: "assets",   label: "Assets",    kbd: "3" },
    { id: "tariffs",  label: "Tariffs",   kbd: "4" },
    { id: "alerts",   label: "Alerts",    kbd: "5" },
  ];
  return (
    <div style={{ background: "var(--bg-1)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand block */}
      <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 24, border: "1.5px solid var(--solar)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 3, background: "var(--solar)", opacity: 0.3 }} />
            <div style={{ position: "absolute", left: 3, right: 3, top: "50%", height: 1, background: "var(--solar)" }} />
            <div style={{ position: "absolute", top: 3, bottom: 3, left: "50%", width: 1, background: "var(--solar)" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", color: "var(--fg-0)" }}>HELION</div>
            <div className="mono" style={{ fontSize: 9.5, color: "var(--fg-3)", letterSpacing: "0.1em", marginTop: 1 }}>OPS · v2.4.0</div>
          </div>
        </div>
      </div>

      {/* Site selector */}
      <div style={{ padding: "10px 14px 14px", borderBottom: "1px solid var(--line)" }}>
        <Lbl style={{ fontSize: 9 }}>SITE</Lbl>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 2, cursor: "pointer" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "var(--fg-0)", fontWeight: 500 }}>Riebeek Logistics</div>
            <div className="mono" style={{ fontSize: 9.5, color: "var(--fg-3)", marginTop: 1 }}>EPPING · CT · –33.93 · 18.54</div>
          </div>
          <span className="mono" style={{ color: "var(--fg-3)", fontSize: 10 }}>▾</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "10px 8px", flex: 1 }}>
        <div style={{ padding: "4px 10px 8px" }}><Lbl style={{ fontSize: 9 }}>OPERATIONS</Lbl></div>
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => onNav(n.id)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "8px 10px", background: active === n.id ? "var(--bg-3)" : "transparent",
              border: "none", borderLeft: `2px solid ${active === n.id ? "var(--solar)" : "transparent"}`,
              color: active === n.id ? "var(--fg-0)" : "var(--fg-1)", fontSize: 12.5, fontFamily: "inherit",
              cursor: "pointer", textAlign: "left", fontWeight: active === n.id ? 600 : 400,
            }}
            onMouseEnter={(e) => { if (active !== n.id) e.currentTarget.style.background = "var(--bg-2)"; }}
            onMouseLeave={(e) => { if (active !== n.id) e.currentTarget.style.background = "transparent"; }}
          >
            <span>{n.label}</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)", border: "1px solid var(--line)", padding: "1px 5px", borderRadius: 2 }}>{n.kbd}</span>
          </button>
        ))}
      </div>

      {/* Footer — system vitals */}
      <div style={{ borderTop: "1px solid var(--line)", padding: "12px 14px" }}>
        <Lbl style={{ fontSize: 9 }}>SYSTEM VITALS</Lbl>
        <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
          <MiniVital label="PV"   value={snap.pv.toFixed(1)} unit="kW"  tone="solar" />
          <MiniVital label="BESS" value={Math.abs(snap.battery).toFixed(1)} unit="kW" tone="battery" prefix={snap.battery > 0 ? "CHG" : snap.battery < 0 ? "DIS" : "IDLE"} />
          <MiniVital label="LOAD" value={snap.load.toFixed(1)} unit="kW" tone="load" />
          <MiniVital label="GRID" value={Math.abs(snap.grid).toFixed(1)} unit="kW" tone="grid" prefix={snap.grid > 0 ? "EXP" : snap.grid < 0 ? "IMP" : "0"} />
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--line-soft)" }}>
            <MiniVital label="SOC" value={soc.toFixed(0)} unit="%" tone="battery" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniVital({ label, value, unit, tone, prefix }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
      <span style={{ color: `var(--${tone})`, letterSpacing: "0.05em", fontWeight: 500 }}>{label}</span>
      <span className="mono" style={{ color: "var(--fg-1)" }}>
        {prefix && <span style={{ color: "var(--fg-3)", marginRight: 6, fontSize: 9.5 }}>{prefix}</span>}
        {value}<span style={{ color: "var(--fg-3)", marginLeft: 3 }}>{unit}</span>
      </span>
    </div>
  );
}

function Topbar({ screen, scenario, stage, onScenarioLabel }) {
  const titles = {
    overview: "Site Overview",
    forecast: "Generation Forecast",
    assets:   "Asset Details",
    tariffs:  "Tariffs & Cost",
    alerts:   "Alerts & Events",
  };
  const subs = {
    overview: "Real-time power flow · live telemetry",
    forecast: "NWP · ECMWF HRES + GFS ensemble",
    assets:   "PV · BESS · inverters · BoS",
    tariffs:  "Eskom Homeflex ToU · ZAR",
    alerts:   "Operational alerts & events",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 14px", borderBottom: "1px solid var(--line)", background: "var(--bg-1)", height: "100%", gap: 12, overflow: "hidden" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--fg-0)", letterSpacing: "-0.01em" }}>{titles[screen]}</h1>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", letterSpacing: "0.05em" }}>/ {onScenarioLabel}</span>
        </div>
        <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subs[screen]}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <LoadShedStage stage={stage} />
        <span className="topbar-hide-sm" style={{ display: "contents" }}>
          <Chip tone="ok">50.02 Hz</Chip>
          <Chip tone="ok">RTT 18ms</Chip>
        </span>
        <LiveChip />
        <span className="topbar-hide-md" style={{ display: "contents" }}>
          <Clock baseHour={window.SCENARIOS[scenario].hourNow} />
        </span>
      </div>
    </div>
  );
}

function Statusbar({ stage, scenario }) {
  const s = window.SCENARIOS[scenario];
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 14px", borderTop: "1px solid var(--line)", background: "var(--bg-1)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.04em", gap: 16, height: "100%" }}>
      <span>HELION-OPS/2.4.0</span>
      <span>●</span>
      <span>SCENARIO: {scenario.toUpperCase()} · {s.label}</span>
      <span>●</span>
      <span>NWP: ECMWF-HRES 12Z · GFS 12Z ENSEMBLE</span>
      <span>●</span>
      <span>POLL: 1s TELEMETRY · 15m FORECAST</span>
      <div className="spacer" />
      <span>LOAD-SHED STAGE {stage}</span>
      <span>●</span>
      <span className="c-ok">● ALL SYSTEMS NOMINAL</span>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, Statusbar });
