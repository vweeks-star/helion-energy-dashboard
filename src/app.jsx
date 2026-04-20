/* App — root component, state, routing, live tick, tweaks wiring */

const TWEAK_DEFAULS = /*EDITMODE-BEGIN*/{
  "scenario": "midday",
  "density": "comfortable",
  "forecastStyle": "band",
  "stage": 2,
  "tick": true
}/*EDITMODE-END*/;

function App() {
  const [screen, setScreen] = React.useState(() => localStorage.getItem("helion:screen") || "overview");
  const [tweaksOpen, setTweaksOpen] = React.useState(true);
  const [state, setState] = React.useState(TWEAK_DEFAULS);
  const [horizon, setHorizon] = React.useState(24);
  const [jitter, setJitter] = React.useState(0);

  // Tweaks host protocol
  React.useEffect(() => {
    function onMsg(e) {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "__activate_edit_mode") setTweaksOpen(true);
      if (e.data.type === "__deactivate_edit_mode") setTweaksOpen(false);
    }
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Persist screen
  React.useEffect(() => { localStorage.setItem("helion:screen", screen); }, [screen]);

  // Apply density to body
  React.useEffect(() => { document.body.setAttribute("data-density", state.density); }, [state.density]);

  // Keyboard shortcuts
  React.useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT") return;
      const map = { "1": "overview", "2": "forecast", "3": "assets", "4": "tariffs", "5": "alerts" };
      if (map[e.key]) setScreen(map[e.key]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Live tick
  React.useEffect(() => {
    if (!state.tick) return;
    const id = setInterval(() => setJitter((x) => x + 1), 1500);
    return () => clearInterval(id);
  }, [state.tick]);

  // Build data
  const series = React.useMemo(() => window.buildSeries(state.scenario), [state.scenario]);
  const weather = React.useMemo(() => window.weatherFor(state.scenario), [state.scenario]);
  const baseAlerts = React.useMemo(() => window.alertsFor(state.scenario), [state.scenario]);

  const [dismissed, setDismissed] = React.useState(new Set());
  const alerts = baseAlerts.filter(a => !dismissed.has(a.id));
  const onDismissAlert = (id) => setDismissed(prev => new Set([...prev, id]));
  React.useEffect(() => setDismissed(new Set()), [state.scenario]);

  // Snapshot with jitter
  const snap = React.useMemo(() => {
    const s = window.snapshot(series);
    const j = (x) => x + (Math.sin(jitter * 1.7 + x) * 0.2);
    return {
      pv: Math.max(0, j(s.pv)),
      load: Math.max(0, j(s.load)),
      battery: s.battery + Math.sin(jitter) * 0.15,
      grid: s.grid + Math.cos(jitter) * 0.12,
      forecastNext: s.forecastNext,
    };
  }, [series, jitter]);

  const soc = React.useMemo(() => {
    // Drift SoC slightly by scenario state
    const base = series.scenario.soc;
    return base + Math.sin(jitter * 0.3) * 0.4;
  }, [series, jitter]);

  const scenarioLabel = series.scenario.label;

  return (
    <div className={`app ${tweaksOpen ? "" : "tweaks-off"}`}>
      <div className="topbar">
        <Topbar screen={screen} scenario={state.scenario} stage={state.stage} onScenarioLabel={scenarioLabel} />
      </div>

      <div style={{ gridColumn: 1 }} data-screen-label="Sidebar">
        <Sidebar active={screen} onNav={setScreen} scenario={state.scenario} snap={snap} soc={soc} />
      </div>

      <main className="main-col" data-screen-label={`${screen[0].toUpperCase()}${screen.slice(1)}`}>
        {screen === "overview" && (
          <ScreenOverview series={series} snap={snap} soc={soc} scenario={state.scenario} alerts={alerts} onDismissAlert={onDismissAlert} forecastStyle={state.forecastStyle} />
        )}
        {screen === "forecast" && (
          <ScreenForecast series={series} scenario={state.scenario} forecastStyle={state.forecastStyle} setForecastStyle={(v) => setState({ ...state, forecastStyle: v })} horizon={horizon} setHorizon={setHorizon} weather={weather} />
        )}
        {screen === "assets" && (
          <ScreenAssets series={series} snap={snap} soc={soc} scenario={state.scenario} />
        )}
        {screen === "tariffs" && (
          <ScreenTariffs series={series} scenario={state.scenario} />
        )}
        {screen === "alerts" && (
          <ScreenAlerts alerts={alerts} onDismiss={onDismissAlert} scenario={state.scenario} />
        )}
      </main>

      {tweaksOpen && (
        <aside className="tweaks-col">
          <TweaksPanel state={state} setState={(next) => {
            setState(next);
            window.parent.postMessage({ type: "__edit_mode_set_keys", edits: next }, "*");
          }} />
        </aside>
      )}

      <div className="statusbar">
        <Statusbar stage={state.stage} scenario={state.scenario} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
