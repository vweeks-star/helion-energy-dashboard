/* Alerts & Events screen — full log with filtering */

function ScreenAlerts({ alerts, onDismiss, scenario }) {
  const [filter, setFilter] = React.useState("all");
  const filtered = alerts.filter(a => filter === "all" || a.sev === filter);

  // Synthesize more history for a rich log
  const history = [
    ...filtered,
    { id: "h1", ts: "06:14 · 14 Apr", sev: "info", source: "Tariff",   msg: "Peak ToU window ended." },
    { id: "h2", ts: "05:58 · 14 Apr", sev: "info", source: "BESS",     msg: "Charge cycle #486 complete · SOC 98%." },
    { id: "h3", ts: "22:31 · 13 Apr", sev: "info", source: "Grid",     msg: "Load shedding Stage 2 ended." },
    { id: "h4", ts: "20:00 · 13 Apr", sev: "warn", source: "Grid",     msg: "Load shedding Stage 2 started · BESS islanded." },
    { id: "h5", ts: "19:45 · 13 Apr", sev: "info", source: "BESS",     msg: "Islanding armed · transfer switch ready." },
    { id: "h6", ts: "17:00 · 13 Apr", sev: "info", source: "Tariff",   msg: "Peak ToU window started · dispatch plan active." },
    { id: "h7", ts: "12:04 · 13 Apr", sev: "info", source: "Forecast", msg: "Accuracy 94.2% over last 24h · MAPE 6.4%." },
    { id: "h8", ts: "07:18 · 13 Apr", sev: "warn", source: "Weather",  msg: "Morning fog delayed PV ramp by 22 min." },
    { id: "h9", ts: "03:02 · 13 Apr", sev: "info", source: "System",   msg: "Telemetry heartbeat check · all nodes OK." },
  ];

  const counts = {
    all:  alerts.length,
    err:  alerts.filter(a => a.sev === "err").length,
    warn: alerts.filter(a => a.sev === "warn").length,
    info: alerts.filter(a => a.sev === "info").length,
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 14 }}>
      {/* Summary strip */}
      <div className="panel panel-corner">
        <div className="kpi-grid">
          <KpiTile label="ACTIVE ALERTS" value={counts.all} fmt={v=>v} footer="Unacknowledged" />
          <KpiTile label="CRITICAL" value={counts.err}  tone="err"  fmt={v=>v} footer="Requires attention" />
          <KpiTile label="WARNINGS" value={counts.warn} tone="warn" fmt={v=>v} footer="Degraded state" />
          <KpiTile label="INFO" value={counts.info}  tone="info" fmt={v=>v} footer="Advisory" />
          <KpiTile label="MTTA" value={4.2} unit="min" fmt={v=>v.toFixed(1)} footer="Mean time to ack · 30d" />
          <KpiTile label="MTTR" value={18} unit="min"  fmt={v=>v.toFixed(0)} footer="Mean time to resolve · 30d" />
        </div>
      </div>

      {/* Log */}
      <div className="panel panel-corner">
        <div className="panel-hd">
          <h3>Event Log</h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="seg">
              <button className={filter==="all"?"active":""}  onClick={() => setFilter("all")}>ALL · {counts.all}</button>
              <button className={filter==="err"?"active":""}  onClick={() => setFilter("err")}>CRITICAL · {counts.err}</button>
              <button className={filter==="warn"?"active":""} onClick={() => setFilter("warn")}>WARN · {counts.warn}</button>
              <button className={filter==="info"?"active":""} onClick={() => setFilter("info")}>INFO · {counts.info}</button>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 10.5 }}>EXPORT CSV</button>
          </div>
        </div>
        <div className="panel-bd flush">
          <div style={{ display: "grid", gridTemplateColumns: "130px 90px 110px 1fr 150px", gap: 12, padding: "10px 18px", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
            {["TIMESTAMP","SEVERITY","SOURCE","MESSAGE","ACTIONS"].map(c => (
              <span key={c} className="lbl" style={{ fontSize: 9.5 }}>{c}</span>
            ))}
          </div>
          {history.map((a) => (
            <LogRow key={a.id} alert={a} onDismiss={() => onDismiss(a.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LogRow({ alert, onDismiss }) {
  const toneMap = { err: "err", warn: "warn", info: "info" };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "130px 90px 110px 1fr 150px", gap: 12, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid var(--line-soft)", fontSize: 12, position: "relative" }}>
      {alert.live && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "var(--err)" }} />}
      <span className="mono" style={{ color: "var(--fg-3)", fontSize: 11 }}>{alert.ts}</span>
      <Chip tone={toneMap[alert.sev]}>{alert.sev.toUpperCase()}</Chip>
      <span className="mono" style={{ color: "var(--fg-2)", fontSize: 10.5, letterSpacing: "0.06em" }}>{alert.source.toUpperCase()}</span>
      <span style={{ color: "var(--fg-1)" }}>{alert.msg}</span>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button className="btn" style={{ height: 24, fontSize: 10.5, padding: "0 10px" }} onClick={onDismiss}>ACK</button>
        <button className="btn btn-ghost" style={{ height: 24, fontSize: 10.5, padding: "0 10px" }}>DETAIL</button>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenAlerts });
