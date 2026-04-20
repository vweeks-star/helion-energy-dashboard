/* Overview screen — power flow + KPIs + mini forecast + alerts */

function ScreenOverview({ series, snap, soc, scenario, alerts, onDismissAlert, forecastStyle }) {
  const s = series.scenario;
  const todayGen = series.past.filter(d => d.t >= -24).reduce((a, d) => a + d.pv * 0.25, 0); // kWh
  const todayCon = series.past.filter(d => d.t >= -24).reduce((a, d) => a + d.load * 0.25, 0);
  const selfCon = Math.min(100, ((todayGen - Math.max(0, todayGen - todayCon)) / todayCon) * 100);
  const savings = (todayGen * 2.87).toFixed(0);
  const co2 = (todayGen * 0.95).toFixed(0);
  const critical = alerts.filter(a => a.sev === "err").length;

  return (
    <div className="overview-grid">
      {/* KPI strip — full width, responsive grid */}
      <div className="panel panel-corner" style={{ gridColumn: "1 / -1" }}>
        <div className="kpi-grid">
          <KpiTile label="INSTANT GENERATION" value={snap.pv} unit="kW" tone="solar" fmt={(v)=>v.toFixed(1)} delta={((snap.pv - snap.forecastNext)/Math.max(0.1,snap.forecastNext))*100} footer={`Forecast 15m: ${snap.forecastNext.toFixed(1)} kW`} />
          <KpiTile label="INSTANT LOAD"       value={snap.load} unit="kW" tone="load" fmt={(v)=>v.toFixed(1)} footer="3-phase · 0.98 PF" />
          <KpiTile label="BATTERY SOC"        value={soc} unit="%" tone="battery" fmt={(v)=>v.toFixed(0)} footer={snap.battery > 0 ? `Charging ${snap.battery.toFixed(1)} kW` : snap.battery < 0 ? `Discharging ${Math.abs(snap.battery).toFixed(1)} kW` : "Idle"} />
          <KpiTile label="GRID FLOW"          value={Math.abs(snap.grid)} unit="kW" tone="grid" fmt={(v)=>v.toFixed(1)} footer={snap.grid > 0 ? "Exporting" : snap.grid < 0 ? "Importing" : "Balanced"} />
          <KpiTile label="TODAY · GENERATED"  value={todayGen} unit="kWh" fmt={(v)=>v.toFixed(0)} delta={4.2} footer={`R ${savings} · ${co2} kg CO₂`} />
          <div style={{ padding: "14px 16px", minWidth: 0, borderBottom: "1px solid var(--line-soft)" }}>
            <Lbl>SELF-CONSUMPTION</Lbl>
            <div style={{ marginTop: 8 }}>
              <Readout value={selfCon} unit="%" size="md" fmt={(v)=>v.toFixed(0)} />
            </div>
            <div style={{ marginTop: 10 }}><GaugeBar value={selfCon} color="var(--battery)" /></div>
          </div>
        </div>
      </div>

      {/* Power flow */}
      <div className="panel panel-corner ov-span-3" style={{ minHeight: 400 }}>
        <div className="panel-hd">
          <h3>Live Power Flow</h3>
          <div style={{ display: "flex", gap: 6 }}>
            <LiveChip label="1s POLL" />
            {s.fault && <Chip tone="err">INV-2 FAULT</Chip>}
          </div>
        </div>
        <div className="panel-bd" style={{ padding: "12px 12px 20px" }}>
          <PowerFlow snap={snap} soc={soc} scenario={scenario} fault={s.fault} />
        </div>
      </div>

      {/* Mini forecast */}
      <div className="panel panel-corner ov-span-3" style={{ minHeight: 360 }}>
        <div className="panel-hd">
          <h3>24-Hour Outlook</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>NWP · ECMWF HRES</span>
            <Chip tone="info">P10 – P90</Chip>
          </div>
        </div>
        <div className="panel-bd">
          <ForecastChart series={series} style={forecastStyle} horizon={24} height={260} showToU={true} />
          <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "var(--fg-2)" }}>
            <LegendItem color="var(--solar)" label="PV generation" />
            <LegendItem color="var(--load)" label="Load" />
            <LegendItem color="var(--solar)" label="Uncertainty" dashed />
            <div style={{ flex: 1 }} />
            <span className="mono" style={{ color: "var(--fg-3)" }}>Peak forecast: {Math.max(...series.future.filter(d=>d.t<=24).map(d=>d.pv)).toFixed(1)} kW at 12:30</span>
          </div>
        </div>
      </div>

      {/* Battery detail */}
      <div className="panel panel-corner ov-span-2">
        <div className="panel-hd"><h3>BESS</h3><Chip tone="ok">HEALTHY</Chip></div>
        <div className="panel-bd" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 10 }}>
          <RadialGauge value={soc} color="var(--battery)" label="STATE OF CHARGE" sub={snap.battery > 0 ? `+${snap.battery.toFixed(1)} kW` : snap.battery < 0 ? `${snap.battery.toFixed(1)} kW` : "0.0 kW"} />
          <div style={{ width: "100%", marginTop: 4 }}>
            <Row label="Usable capacity" value={`${(soc/100*100).toFixed(1)} / 100.0 kWh`} />
            <Row label="Runtime @ load"  value={`${(soc/100*100/snap.load).toFixed(1)} h`} />
            <Row label="Cycles (month)"  value="48 · 0.96 eff" />
            <Row label="Temp (cells)"    value="24.2 °C" tone="ok" />
          </div>
        </div>
      </div>

      {/* Tariff block */}
      <div className="panel panel-corner ov-span-2">
        <div className="panel-hd"><h3>Current Tariff</h3><Chip tone="info">ESKOM HOMEFLEX</Chip></div>
        <div className="panel-bd">
          {(() => {
            const now = s.hourNow;
            const t = window.tariffAt(Math.floor(now));
            const nextHour = Math.floor(now) + 1;
            const nextT = window.tariffAt(nextHour % 24);
            const nextChange = Math.ceil(60 - (now - Math.floor(now)) * 60);
            const tone = t.block === "peak" ? "err" : t.block === "standard" ? "info" : "ok";
            return (
              <>
                <Lbl>BLOCK</Lbl>
                <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <div className="readout readout-md" style={{ color: `var(--${tone})`, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.block}</div>
                  <div className="mono" style={{ color: "var(--fg-0)", fontSize: 24, fontWeight: 500 }}>R {t.rate.toFixed(2)}<span className="unit">/kWh</span></div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <Row label="Next block" value={`${nextT.block.toUpperCase()} · R ${nextT.rate.toFixed(2)}`} />
                  <Row label="In" value={`~${nextChange}m`} />
                  <Row label="Billed today" value={`R ${(savings*0.6).toFixed(2)}`} />
                  <Row label="Exported today" value={`${(todayGen - todayCon < 0 ? 0 : todayGen - todayCon).toFixed(1)} kWh`} />
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Alerts preview */}
      <div className="panel panel-corner ov-span-2">
        <div className="panel-hd">
          <h3>Active Alerts</h3>
          <div style={{ display: "flex", gap: 6 }}>
            {critical > 0 && <Chip tone="err">{critical} CRITICAL</Chip>}
            <Chip tone="warn">{alerts.filter(a=>a.sev==="warn").length} WARN</Chip>
            <Chip tone="info">{alerts.filter(a=>a.sev==="info").length} INFO</Chip>
          </div>
        </div>
        <div className="panel-bd flush">
          {alerts.slice(0, 5).map((a) => (
            <AlertRow key={a.id} alert={a} onDismiss={() => onDismissAlert(a.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 14, height: 2, background: dashed ? "transparent" : color, borderTop: dashed ? `1px dashed ${color}` : "none" }} />
      <span>{label}</span>
    </div>
  );
}

function AlertRow({ alert, onDismiss }) {
  const toneMap = { err: "err", warn: "warn", info: "info" };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "60px 80px 90px 1fr auto", gap: 12, alignItems: "center", padding: "10px 18px", borderBottom: "1px solid var(--line-soft)", fontSize: 12 }}>
      <span className="mono" style={{ color: "var(--fg-3)" }}>{alert.ts}</span>
      <Chip tone={toneMap[alert.sev]}>{alert.sev.toUpperCase()}</Chip>
      <span className="mono" style={{ color: "var(--fg-2)", fontSize: 10.5, letterSpacing: "0.05em" }}>{alert.source.toUpperCase()}</span>
      <span style={{ color: "var(--fg-1)" }}>{alert.msg}</span>
      <button className="btn btn-ghost" style={{ height: 24, fontSize: 10.5, padding: "0 8px" }} onClick={onDismiss}>ACK</button>
    </div>
  );
}

Object.assign(window, { ScreenOverview, AlertRow, LegendItem });
