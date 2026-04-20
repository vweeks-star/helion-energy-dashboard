/* Tweaks panel — scenario + density + forecast style + stage */

function TweaksPanel({ state, setState }) {
  const scenarios = [
    { k: "midday",  label: "Midday · clear"     },
    { k: "evening", label: "Evening · discharge"},
    { k: "cloudy",  label: "Cloudy · uncertain" },
    { k: "alert",   label: "Alert · inverter fault" },
  ];
  return (
    <div style={{ background: "var(--bg-1)", borderLeft: "1px solid var(--line)", display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="lbl">TWEAKS</div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>Simulate operating states and visual variants.</div>
      </div>

      {/* Scenario */}
      <TweakGroup title="SCENARIO" subtitle={window.SCENARIOS[state.scenario].description}>
        {scenarios.map(s => (
          <button key={s.k}
            className="btn"
            style={{ width: "100%", justifyContent: "flex-start", fontSize: 12, height: 32, marginBottom: 6,
                    background: state.scenario === s.k ? "var(--bg-3)" : "var(--bg-2)",
                    borderColor: state.scenario === s.k ? "var(--solar)" : "var(--line)",
                    color: state.scenario === s.k ? "var(--fg-0)" : "var(--fg-1)" }}
            onClick={() => setState({ ...state, scenario: s.k })}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: state.scenario === s.k ? "var(--solar)" : "var(--fg-3)", marginRight: 8 }} />
            {s.label}
          </button>
        ))}
      </TweakGroup>

      {/* Density */}
      <TweakGroup title="DENSITY">
        <div className="seg" style={{ width: "100%" }}>
          <button style={{ flex: 1 }} className={state.density==="comfortable"?"active":""} onClick={() => setState({ ...state, density: "comfortable" })}>COMFORTABLE</button>
          <button style={{ flex: 1 }} className={state.density==="compact"?"active":""}     onClick={() => setState({ ...state, density: "compact" })}>COMPACT</button>
        </div>
      </TweakGroup>

      {/* Forecast style */}
      <TweakGroup title="FORECAST CHART" subtitle="Visualization style for uncertainty.">
        <div className="seg" style={{ width: "100%" }}>
          <button style={{ flex: 1 }} className={state.forecastStyle==="band"?"active":""}    onClick={() => setState({ ...state, forecastStyle: "band" })}>BAND</button>
          <button style={{ flex: 1 }} className={state.forecastStyle==="area"?"active":""}    onClick={() => setState({ ...state, forecastStyle: "area" })}>AREA</button>
          <button style={{ flex: 1 }} className={state.forecastStyle==="stacked"?"active":""} onClick={() => setState({ ...state, forecastStyle: "stacked" })}>BARS</button>
        </div>
      </TweakGroup>

      {/* Load-shed stage */}
      <TweakGroup title="LOAD-SHEDDING STAGE">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
          {[0,1,2,3,4,5,6,7,8].map(n => (
            <button key={n}
              onClick={() => setState({ ...state, stage: n })}
              style={{ height: 32, background: state.stage === n ? "var(--bg-3)" : "var(--bg-2)",
                       border: `1px solid ${state.stage === n ? (n >= 5 ? "var(--err)" : n >= 3 ? "var(--load)" : n >= 1 ? "var(--warn)" : "var(--ok)") : "var(--line)"}`,
                       color: state.stage === n ? "var(--fg-0)" : "var(--fg-2)", fontFamily: "var(--font-mono)", fontSize: 11, cursor: "pointer" }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 8, lineHeight: 1.5 }}>
          South African grid load-shedding stage. BESS autonomously islands at Stage 2+ during scheduled windows.
        </div>
      </TweakGroup>

      {/* Live tick toggle */}
      <TweakGroup title="SIMULATION">
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, cursor: "pointer" }}>
          <span>Live tick</span>
          <input type="checkbox" checked={state.tick} onChange={(e) => setState({ ...state, tick: e.target.checked })} />
        </label>
        <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 6 }}>1 Hz telemetry pulse with value jitter.</div>
      </TweakGroup>
    </div>
  );
}

function TweakGroup({ title, subtitle, children }) {
  return (
    <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-soft)" }}>
      <div className="lbl" style={{ fontSize: 9.5 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4, marginBottom: 10, lineHeight: 1.5 }}>{subtitle}</div>}
      {!subtitle && <div style={{ marginTop: 10 }} />}
      {children}
    </div>
  );
}

Object.assign(window, { TweaksPanel, TweakGroup });
