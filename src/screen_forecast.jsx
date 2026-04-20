/* Forecast screen — full-width hero chart + weather + accuracy */

function ScreenForecast({ series, scenario, forecastStyle, setForecastStyle, horizon, setHorizon, weather }) {
  const s = series.scenario;
  const peak = Math.max(...series.future.filter(d => d.t <= horizon).map(d => d.pv));
  const peakT = series.future.find(d => d.pv === peak);
  const expectedKWh = series.future.filter(d => d.t <= horizon).reduce((a, d) => a + d.pv * 0.25, 0);
  const uncertPct = (s.uncertainty * 100).toFixed(0);

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
      {/* Hero chart */}
      <div className="panel panel-corner" style={{ gridColumn: "1 / -1" }}>
        <div className="panel-hd">
          <h3>Generation Forecast · {horizon}h Horizon</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="seg">
              <button className={horizon===24?"active":""} onClick={() => setHorizon(24)}>24h</button>
              <button className={horizon===48?"active":""} onClick={() => setHorizon(48)}>48h</button>
            </div>
            <div className="seg">
              <button className={forecastStyle==="band"?"active":""}    onClick={() => setForecastStyle("band")}>BAND</button>
              <button className={forecastStyle==="area"?"active":""}    onClick={() => setForecastStyle("area")}>AREA</button>
              <button className={forecastStyle==="stacked"?"active":""} onClick={() => setForecastStyle("stacked")}>BARS</button>
            </div>
          </div>
        </div>
        <div className="panel-bd">
          <ForecastChart series={series} style={forecastStyle} horizon={horizon} height={380} showToU={true} />
          <div style={{ display: "flex", gap: 18, marginTop: 14, fontSize: 11, color: "var(--fg-2)", borderTop: "1px solid var(--line-soft)", paddingTop: 12 }}>
            <LegendItem color="var(--solar)" label="PV generation (observed)" />
            <LegendItem color="var(--solar)" label="PV forecast (P50)" dashed />
            <LegendItem color="var(--solar)" label="P10–P90 band" />
            <LegendItem color="var(--load)" label="Load" />
            <div style={{ flex: 1 }} />
            <span className="mono" style={{ color: "var(--fg-3)" }}>ToU: OFF-PEAK · STANDARD · PEAK (background tint)</span>
          </div>
        </div>
      </div>

      {/* Expected generation */}
      <div className="panel panel-corner">
        <div className="panel-hd"><h3>Expected Energy</h3><Chip tone="info">P50</Chip></div>
        <div className="panel-bd">
          <Lbl>NEXT {horizon}H</Lbl>
          <div style={{ marginTop: 10 }}>
            <Readout value={expectedKWh} unit="kWh" tone="solar" size="xl" fmt={(v)=>v.toFixed(0)} />
          </div>
          <div style={{ marginTop: 14 }}>
            <Row label="P10 (pessimistic)" value={`${(expectedKWh * (1 - s.uncertainty)).toFixed(0)} kWh`} tone="fg-2" />
            <Row label="P50 (expected)"    value={`${expectedKWh.toFixed(0)} kWh`} />
            <Row label="P90 (optimistic)"  value={`${(expectedKWh * (1 + s.uncertainty)).toFixed(0)} kWh`} tone="fg-2" />
            <Row label="Peak output"       value={`${peak.toFixed(1)} kW`} tone="solar" />
            <Row label="Peak time"         value={`+${peakT ? peakT.t.toFixed(1) : "0.0"}h`} />
          </div>
        </div>
      </div>

      {/* Model ensemble */}
      <div className="panel panel-corner">
        <div className="panel-hd"><h3>Model Ensemble</h3><Chip tone="ok">CONVERGED</Chip></div>
        <div className="panel-bd">
          <div style={{ display: "grid", gap: 10 }}>
            {[
              { k: "ECMWF-HRES",   w: 0.42, rmse: 1.8, latest: "12:00Z", ok: true },
              { k: "GFS-0.25°",    w: 0.24, rmse: 2.4, latest: "12:00Z", ok: true },
              { k: "ICON-EU",      w: 0.18, rmse: 2.1, latest: "09:00Z", ok: true },
              { k: "SA-WRF-SAWS",  w: 0.16, rmse: 2.2, latest: "06:00Z", ok: true },
            ].map((m) => (
              <div key={m.k}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
                  <span style={{ color: "var(--fg-1)" }}>{m.k}</span>
                  <span className="mono" style={{ color: "var(--fg-2)" }}>w={m.w.toFixed(2)} · RMSE {m.rmse}</span>
                </div>
                <GaugeBar value={m.w * 100} max={50} height={4} color="var(--info)" ticks={5} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line-soft)" }}>
            <Row label="Uncertainty (±)"   value={`${uncertPct}%`} tone={s.uncertainty > 0.2 ? "warn" : "ok"} />
            <Row label="Ensemble spread"   value={`${(s.uncertainty * peak).toFixed(1)} kW`} />
            <Row label="Last ingest"       value="12:00Z · 4m ago" />
          </div>
        </div>
      </div>

      {/* Accuracy */}
      <div className="panel panel-corner">
        <div className="panel-hd"><h3>Yesterday's Accuracy</h3><Chip tone="ok">MAPE 6.4%</Chip></div>
        <div className="panel-bd">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <Readout value={94.2} unit="%" size="xl" tone="ok" fmt={v=>v.toFixed(1)} />
            <span className="mono" style={{ color: "var(--fg-3)", fontSize: 11 }}>Accuracy (24h)</span>
          </div>
          <AccuracyBars />
          <div style={{ marginTop: 14 }}>
            <Row label="MAPE (24h)" value="6.4%" tone="ok" />
            <Row label="RMSE"       value="1.94 kW" />
            <Row label="MBE (bias)" value="+0.21 kW" />
            <Row label="Hit-rate P10–P90" value="87%" tone="ok" />
          </div>
        </div>
      </div>

      {/* Weather */}
      <div className="panel panel-corner" style={{ gridColumn: "1 / span 2" }}>
        <div className="panel-hd"><h3>Weather & Irradiance · Next 24h</h3><Chip tone="info">SAWS + ECMWF</Chip></div>
        <div className="panel-bd">
          <WeatherStrip weather={weather.slice(0, 24)} startHour={series.scenario.hourNow} />
        </div>
      </div>

      {/* Now-cast panel */}
      <div className="panel panel-corner">
        <div className="panel-hd"><h3>Intraday Now-cast</h3><Chip tone="info">15 min</Chip></div>
        <div className="panel-bd">
          <Lbl>NEXT 15 MINUTES</Lbl>
          <div style={{ marginTop: 10 }}>
            <Readout value={series.future[1]?.pv || 0} unit="kW" tone="solar" size="xl" fmt={v=>v.toFixed(1)} />
          </div>
          <div style={{ marginTop: 14 }}>
            <Row label="Δ vs now"       value={`${(series.future[1]?.pv - series.past.at(-1).pv).toFixed(2)} kW`} />
            <Row label="Confidence"     value="97%" tone="ok" />
            <Row label="Cloud movement" value="W→E · 22 km/h" />
            <Row label="Shade events"   value="None detected" tone="ok" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccuracyBars() {
  const rng = [89, 92, 95, 96, 94, 91, 93, 97, 95, 94, 92, 90, 88, 94, 96, 98, 96, 95, 93, 91, 90, 92, 95, 94];
  return (
    <div style={{ display: "flex", gap: 1.5, height: 54, alignItems: "flex-end" }}>
      {rng.map((v, i) => (
        <div key={i} title={`${i}:00 · ${v}%`} style={{ flex: 1, height: `${v}%`, background: v >= 90 ? "var(--ok)" : v >= 85 ? "var(--warn)" : "var(--err)", opacity: 0.75 }} />
      ))}
    </div>
  );
}

function WeatherStrip({ weather, startHour = 0 }) {
  const maxGhi = Math.max(...weather.map(w => w.ghi));
  const nextHour = Math.ceil(startHour);
  const LABEL_W = 72;

  const HeaderCell = ({ children, highlight }) => (
    <div className="mono" style={{ fontSize: 9.5, color: highlight ? "var(--solar)" : "var(--fg-3)", fontWeight: highlight ? 600 : 400, letterSpacing: "0.04em", textAlign: "center" }}>{children}</div>
  );
  const DataCell = ({ children, color, bg }) => (
    <div className="mono" style={{ fontSize: 10, color, textAlign: "center", padding: "3px 0", background: bg ? "var(--bg-2)" : "transparent" }}>{children}</div>
  );
  const RowLabel = ({ children, color }) => (
    <div style={{ fontSize: 9.5, color: color || "var(--fg-3)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px 3px 0", textAlign: "right", alignSelf: "center" }}>{children}</div>
  );

  const cellGrid = {
    display: "grid",
    gridTemplateColumns: `${LABEL_W}px repeat(${weather.length}, 1fr)`,
    gap: 1,
    alignItems: "center",
  };

  return (
    <div>
      {/* Time header row */}
      <div style={cellGrid}>
        <div style={{ fontSize: 9.5, color: "var(--fg-3)", letterSpacing: "0.08em", padding: "0 8px 0 0", textAlign: "right" }}>HOUR · SAST</div>
        {weather.map((_, i) => (
          <HeaderCell key={i} highlight={i === 0}>
            {i === 0 ? "NOW" : `${String((nextHour + i) % 24).padStart(2, "0")}:00`}
          </HeaderCell>
        ))}
      </div>

      {/* GHI bar chart row */}
      <div style={{ ...cellGrid, marginTop: 6 }}>
        <RowLabel color="var(--solar)">GHI W/m²</RowLabel>
        {weather.map((w, i) => (
          <div key={i} style={{ height: 38, display: "flex", alignItems: "flex-end", justifyContent: "center", background: i % 2 === 0 ? "var(--bg-2)" : "transparent" }}>
            <div style={{ width: "60%", maxWidth: 8, height: `${(w.ghi / maxGhi) * 100}%`, background: "var(--solar)", opacity: 0.8 }} />
          </div>
        ))}
      </div>

      {/* GHI numeric */}
      <div style={cellGrid}>
        <div />
        {weather.map((w, i) => (
          <DataCell key={i} color="var(--solar)" bg={i % 2 === 0}>{Math.round(w.ghi)}</DataCell>
        ))}
      </div>

      {/* Cloud */}
      <div style={{ ...cellGrid, marginTop: 2 }}>
        <RowLabel>CLOUD %</RowLabel>
        {weather.map((w, i) => (
          <DataCell key={i} color="var(--fg-1)" bg={i % 2 === 0}>{w.cloud.toFixed(0)}</DataCell>
        ))}
      </div>

      {/* Temp */}
      <div style={{ ...cellGrid, marginTop: 2 }}>
        <RowLabel>TEMP °C</RowLabel>
        {weather.map((w, i) => (
          <DataCell key={i} color="var(--fg-1)" bg={i % 2 === 0}>{w.temp.toFixed(0)}°</DataCell>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenForecast });
