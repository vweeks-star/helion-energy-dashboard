/* Assets screen — PV array + BESS + inverters detail */

function ScreenAssets({ series, snap, soc, scenario }) {
  const fault = series.scenario.fault;
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {/* PV Array */}
      <div className="panel panel-corner">
        <div className="panel-hd">
          <h3>Solar PV Array</h3>
          <Chip tone={fault ? "err" : "ok"}>{fault ? "DEGRADED" : "NOMINAL"}</Chip>
        </div>
        <div className="panel-bd">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <Lbl>INSTANT</Lbl>
              <Readout value={snap.pv} unit="kW" tone="solar" size="xl" fmt={v=>v.toFixed(1)} />
              <div className="mono" style={{ marginTop: 4, color: "var(--fg-3)", fontSize: 11 }}>{(snap.pv / 47.4 * 100).toFixed(0)}% of nameplate</div>
            </div>
            <div>
              <Lbl>PERFORMANCE RATIO</Lbl>
              <Readout value={fault ? 48 : 92} unit="%" tone={fault?"err":"ok"} size="xl" fmt={v=>v.toFixed(0)} />
              <div className="mono" style={{ marginTop: 4, color: "var(--fg-3)", fontSize: 11 }}>vs expected for GHI/temp</div>
            </div>
          </div>
          <Row label="Nameplate"        value="47.4 kWp · 108 × 440W" />
          <Row label="Inverters"        value="2 × SMA Tripower 25000TL" />
          <Row label="Tilt · Azimuth"   value="22° · 6° W-of-N" />
          <Row label="Commissioned"     value="2023-11-14" />
          <Row label="Lifetime yield"   value="84,219 kWh" tone="solar" />
        </div>
        <div className="panel-bd flush" style={{ borderTop: "1px solid var(--line-soft)" }}>
          <div style={{ padding: "12px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Lbl>STRINGS · 6 OF 6</Lbl>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>DC INPUT · A</span>
          </div>
          <div style={{ padding: "0 18px 18px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {[
              { id: "S1", v: 582, a: 9.2, ok: true },
              { id: "S2", v: 579, a: 9.1, ok: true },
              { id: "S3", v: 584, a: 9.3, ok: true },
              { id: "S4", v: fault?0:581, a: fault?0:9.0, ok: !fault },
              { id: "S5", v: fault?0:580, a: fault?0:9.1, ok: !fault },
              { id: "S6", v: 578, a: 9.0, ok: true },
            ].map(s => (
              <div key={s.id} style={{ border: `1px solid ${s.ok?"var(--line)":"var(--err)"}`, padding: 8, background: s.ok ? "var(--bg-2)" : "color-mix(in oklch, var(--err) 8%, var(--bg-2))" }}>
                <div className="mono" style={{ fontSize: 9.5, color: s.ok ? "var(--fg-3)" : "var(--err)", letterSpacing: "0.1em", display: "flex", justifyContent: "space-between" }}>
                  <span>{s.id}</span>
                  {!s.ok && <span>⚠</span>}
                </div>
                <div className="mono" style={{ fontSize: 11, color: s.ok ? "var(--fg-1)" : "var(--err)", marginTop: 4 }}>{s.v}V</div>
                <div className="mono" style={{ fontSize: 10.5, color: s.ok ? "var(--fg-2)" : "var(--err)" }}>{s.a}A</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BESS */}
      <div className="panel panel-corner">
        <div className="panel-hd"><h3>Battery Energy Storage</h3><Chip tone="ok">HEALTHY</Chip></div>
        <div className="panel-bd">
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <RadialGauge value={soc} size={160} color="var(--battery)" label="SOC" sub={snap.battery > 0 ? `CHARGING ${snap.battery.toFixed(1)} kW` : snap.battery < 0 ? `DISCHARGING ${Math.abs(snap.battery).toFixed(1)} kW` : "IDLE"} />
            <div style={{ flex: 1 }}>
              <Row label="Usable capacity"  value="100 kWh" />
              <Row label="Max power"        value="50 kW / 50 kW" />
              <Row label="Chemistry"        value="LFP" />
              <Row label="State of health"  value="98.4%" tone="ok" />
              <Row label="Cycles total"     value="486" />
              <Row label="Round-trip eff"   value="94.2%" tone="ok" />
              <Row label="Max cell temp"    value="24.8 °C" tone="ok" />
              <Row label="Cell imbalance"   value="18 mV" />
            </div>
          </div>
        </div>
        <div className="panel-bd flush" style={{ borderTop: "1px solid var(--line-soft)" }}>
          <div style={{ padding: "12px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Lbl>STRINGS · 4 OF 4</Lbl>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>CELL BALANCE</span>
          </div>
          <div style={{ padding: "0 18px 18px", display: "grid", gap: 6 }}>
            {["A","B","C","D"].map((l, i) => {
              const v = [soc + 0.8, soc - 1.2, soc + 0.4, soc - 0.3][i];
              return (
                <div key={l} style={{ display: "grid", gridTemplateColumns: "40px 1fr 60px 60px", gap: 10, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>BANK {l}</span>
                  <GaugeBar value={v} color="var(--battery)" ticks={10} height={10} />
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-1)", textAlign: "right" }}>{v.toFixed(1)}%</span>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", textAlign: "right" }}>24.{i+1}°C</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inverters */}
      <div className="panel panel-corner" style={{ gridColumn: "1 / -1" }}>
        <div className="panel-hd"><h3>Inverters · 2 Units</h3><Chip tone={fault?"err":"ok"}>{fault?"1 FAULT":"ALL ONLINE"}</Chip></div>
        <div className="panel-bd flush">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
                {["UNIT","MODEL","STATE","DC POWER","AC POWER","EFF","TEMP","DC V","GRID HZ","PF","UPTIME"].map(c => (
                  <th key={c} style={{ textAlign: "left", padding: "8px 14px", color: "var(--fg-3)", fontWeight: 500, fontSize: 10, letterSpacing: "0.1em" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id: "INV-1", model: "STP 25000TL", state: "RUNNING", dc: snap.pv * 0.52, ac: snap.pv * 0.50, eff: 98.4, temp: 42, v: 582, hz: 50.02, pf: 0.99, up: "412d 08h" },
                { id: "INV-2", model: "STP 25000TL", state: fault?"FAULT":"RUNNING", dc: fault?0:snap.pv * 0.52, ac: fault?0:snap.pv * 0.50, eff: fault?0:98.2, temp: fault?"--":44, v: fault?0:580, hz: fault?"--":50.02, pf: fault?"--":0.98, up: fault?"0d 00h":"412d 08h" },
              ].map((i, idx) => (
                <tr key={i.id} style={{ borderBottom: "1px solid var(--line-soft)", background: idx % 2 ? "var(--bg-1)" : "transparent" }}>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-0)", fontWeight: 500 }}>{i.id}</td>
                  <td style={{ padding: "10px 14px", color: "var(--fg-2)" }}>{i.model}</td>
                  <td style={{ padding: "10px 14px" }}><Chip tone={i.state === "FAULT" ? "err" : "ok"}>{i.state}</Chip></td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--solar)" }}>{typeof i.dc === "number" ? i.dc.toFixed(1) + " kW" : i.dc}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-0)" }}>{typeof i.ac === "number" ? i.ac.toFixed(1) + " kW" : i.ac}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{i.eff ? i.eff.toFixed(1) + "%" : "--"}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{typeof i.temp === "number" ? i.temp + "°C" : i.temp}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{i.v || "--"}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{i.hz}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{i.pf}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>{i.up}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenAssets });
