/* Tariffs & Cost screen — ToU schedule + ZAR tracker + savings */

function ScreenTariffs({ series, scenario }) {
  const s = series.scenario;
  const todayGen = series.past.filter(d => d.t >= -24).reduce((a, d) => a + d.pv * 0.25, 0);
  const todayCon = series.past.filter(d => d.t >= -24).reduce((a, d) => a + d.load * 0.25, 0);
  const selfCons = Math.min(todayGen, todayCon);
  const exported = Math.max(0, todayGen - todayCon);
  const imported = Math.max(0, todayCon - todayGen);
  const avoidedCost = selfCons * 2.87;
  const exportRev  = exported * 0.89;
  const gridCost   = imported * 2.87;

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
      {/* Big cost tracker */}
      <div className="panel panel-corner" style={{ gridColumn: "1 / span 4" }}>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
          <KpiTile label="AVOIDED GRID COST · TODAY" value={avoidedCost} unit="ZAR" tone="battery" fmt={v=>"R " + v.toFixed(0)} footer={`${selfCons.toFixed(1)} kWh self-consumed`} />
          <KpiTile label="EXPORT REVENUE · TODAY"    value={exportRev}   unit="ZAR" tone="solar"   fmt={v=>"R " + v.toFixed(0)} footer={`${exported.toFixed(1)} kWh @ R0.89`} />
          <KpiTile label="GRID IMPORT COST"          value={gridCost}    unit="ZAR" tone="grid"    fmt={v=>"R " + v.toFixed(0)} footer={`${imported.toFixed(1)} kWh imported`} />
          <KpiTile label="NET BENEFIT · MONTH"       value={24580}       unit="ZAR" tone="ok"      fmt={v=>"R " + v.toLocaleString()} delta={+12.4} footer="vs baseline (no PV)" />
          <KpiTile label="PAYBACK PROGRESS"          value={43}          unit="%"                  fmt={v=>v.toFixed(0)} footer="3.1 of 7.2 years" />
        </div>
      </div>

      {/* ToU schedule */}
      <div className="panel panel-corner" style={{ gridColumn: "1 / span 3" }}>
        <div className="panel-hd"><h3>Time-of-Use Schedule · Weekday</h3><Chip tone="info">HOMEFLEX</Chip></div>
        <div className="panel-bd">
          <ToUBar />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
            {[
              { block: "OFF-PEAK", hours: "22:00 – 06:00", rate: 1.23, tone: "ok",   export: 0.89 },
              { block: "STANDARD", hours: "09:00 – 17:00 · 20:00 – 22:00", rate: 2.14, tone: "info", export: 1.24 },
              { block: "PEAK",     hours: "06:00 – 09:00 · 17:00 – 20:00", rate: 4.87, tone: "err",  export: 2.18 },
            ].map(t => (
              <div key={t.block} style={{ border: `1px solid var(--${t.tone})`, borderOpacity: 0.3, padding: 12, background: `color-mix(in oklch, var(--${t.tone}) 6%, var(--bg-1))` }}>
                <div className={`lbl c-${t.tone}`} style={{ color: `var(--${t.tone})` }}>{t.block}</div>
                <div className="readout readout-md" style={{ color: "var(--fg-0)", marginTop: 8 }}>
                  R {t.rate.toFixed(2)}<span className="unit">/kWh import</span>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 4 }}>R {t.export.toFixed(2)}/kWh export</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 8 }}>{t.hours}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next rate change */}
      <div className="panel panel-corner">
        <div className="panel-hd"><h3>Rate Horizon</h3><Chip tone="warn">PEAK IN 2h 58m</Chip></div>
        <div className="panel-bd">
          <div style={{ display: "grid", gap: 10 }}>
            {[
              { t: "NOW",     b: "STANDARD", r: 2.14, tone: "info" },
              { t: "+1h",     b: "STANDARD", r: 2.14, tone: "info" },
              { t: "+3h",     b: "PEAK",     r: 4.87, tone: "err"  },
              { t: "+6h",     b: "PEAK",     r: 4.87, tone: "err"  },
              { t: "+8h",     b: "STANDARD", r: 2.14, tone: "info" },
              { t: "+10h",    b: "OFF-PEAK", r: 1.23, tone: "ok"   },
            ].map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "48px 1fr 80px", alignItems: "center", padding: "6px 8px", background: i===0 ? "var(--bg-2)" : "transparent", border: i===0 ? "1px solid var(--line)" : "1px solid transparent" }}>
                <span className="mono" style={{ color: "var(--fg-2)", fontSize: 11 }}>{r.t}</span>
                <span className={`c-${r.tone}`} style={{ fontSize: 11.5, letterSpacing: "0.05em", fontWeight: 500 }}>{r.b}</span>
                <span className="mono" style={{ color: "var(--fg-1)", textAlign: "right", fontSize: 11.5 }}>R {r.r.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dispatch recommendation */}
      <div className="panel panel-corner" style={{ gridColumn: "1 / span 2" }}>
        <div className="panel-hd"><h3>BESS Dispatch Plan · Next 24h</h3><Chip tone="ok">OPTIMIZED</Chip></div>
        <div className="panel-bd">
          <DispatchPlan />
          <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--fg-2)", lineHeight: 1.55 }}>
            Plan reserves <span className="c-battery mono">64 kWh</span> for evening peak (17:00–20:00), arbitraging
            off-peak charge → peak discharge for <span className="c-ok mono">R 218 / day</span> net benefit.
          </div>
        </div>
      </div>

      {/* 30-day cost */}
      <div className="panel panel-corner" style={{ gridColumn: "3 / span 2" }}>
        <div className="panel-hd"><h3>Cost · 30 Days</h3><Chip tone="ok">R 24 580 NET</Chip></div>
        <div className="panel-bd">
          <CostBars />
          <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 11, color: "var(--fg-2)" }}>
            <LegendItem color="var(--battery)" label="Avoided cost" />
            <LegendItem color="var(--solar)" label="Export revenue" />
            <LegendItem color="var(--grid)" label="Grid import" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToUBar() {
  const blocks = [];
  for (let h = 0; h < 24; h++) {
    const t = window.tariffAt(h);
    blocks.push(t.block);
  }
  const colorMap = { peak: "var(--load)", standard: "var(--info)", "off-peak": "var(--ok)" };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", height: 32, gap: 1, border: "1px solid var(--line)" }}>
        {blocks.map((b, i) => (
          <div key={i} title={`${i}:00 – ${i+1}:00 · ${b}`} style={{ background: colorMap[b], opacity: 0.55, position: "relative" }}>
            {i % 3 === 0 && <div className="mono" style={{ position: "absolute", top: -14, left: -2, fontSize: 9.5, color: "var(--fg-3)" }}>{String(i).padStart(2,"0")}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DispatchPlan() {
  // SoC target schedule over 24h
  const plan = [
    { h: 0,  soc: 70, act: "idle" },
    { h: 2,  soc: 55, act: "discharge" },
    { h: 4,  soc: 45, act: "discharge" },
    { h: 6,  soc: 45, act: "idle" },
    { h: 9,  soc: 80, act: "charge" },
    { h: 12, soc: 100, act: "charge" },
    { h: 15, soc: 100, act: "idle" },
    { h: 17, soc: 85, act: "discharge" },
    { h: 19, soc: 45, act: "discharge" },
    { h: 20, soc: 45, act: "idle" },
    { h: 22, soc: 70, act: "charge" },
    { h: 24, soc: 70, act: "idle" },
  ];
  const w = 800, h = 130, padL = 30, padR = 10, padT = 14, padB = 24;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const xScale = (hr) => padL + (hr / 24) * innerW;
  const yScale = (soc) => padT + innerH - (soc / 100) * innerH;
  const path = plan.map((p, i) => `${i?"L":"M"} ${xScale(p.h)} ${yScale(p.soc)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: "block" }}>
      {[0, 50, 100].map(v => (
        <g key={v}>
          <line x1={padL} x2={w-padR} y1={yScale(v)} y2={yScale(v)} className="gridline" />
          <text x={padL - 6} y={yScale(v)+3} className="axis-text" textAnchor="end">{v}</text>
        </g>
      ))}
      {/* Peak windows shading */}
      <rect x={xScale(6)} y={padT} width={xScale(9)-xScale(6)} height={innerH} fill="var(--load)" opacity="0.08" />
      <rect x={xScale(17)} y={padT} width={xScale(20)-xScale(17)} height={innerH} fill="var(--load)" opacity="0.08" />
      <path d={path} stroke="var(--battery)" strokeWidth="1.8" fill="none" />
      {plan.map((p, i) => (
        <circle key={i} cx={xScale(p.h)} cy={yScale(p.soc)} r="3" fill="var(--bg-0)" stroke="var(--battery)" strokeWidth="1.5" />
      ))}
      {[0, 6, 12, 18, 24].map(h => (
        <text key={h} x={xScale(h)} y={130-6} className="axis-text" textAnchor="middle">{String(h).padStart(2,"0")}:00</text>
      ))}
    </svg>
  );
}

function CostBars() {
  const days = Array.from({ length: 30 }, (_, i) => ({
    avoided: 120 + Math.sin(i * 0.4) * 30 + Math.random() * 20,
    export:  40 + Math.sin(i * 0.35) * 12 + Math.random() * 10,
    import:  30 + Math.cos(i * 0.5) * 15 + Math.random() * 12,
  }));
  const max = Math.max(...days.map(d => d.avoided + d.export));
  return (
    <div style={{ display: "flex", gap: 2, height: 100, alignItems: "flex-end" }}>
      {days.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ height: `${(d.export / max) * 40}px`, background: "var(--solar)", opacity: 0.8 }} />
          <div style={{ height: `${(d.avoided / max) * 60}px`, background: "var(--battery)", opacity: 0.75 }} />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { ScreenTariffs });
