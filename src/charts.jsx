/* Charts: forecast band/area/stacked, timeline strip, ToU overlay */

const { useMemo: useMemoChart, useState: useStateChart, useRef: useRefChart } = React;

/* Time-series chart — the hero forecast viz */
function ForecastChart({
  series,
  style = "band",    // "band" | "area" | "stacked"
  horizon = 24,      // hours of forecast shown
  height = 300,
  showToU = true,
  showWeather = true,
  weather,
  scenarioKey = "midday",
}) {
  const w = 900;
  const h = height;
  const padL = 48, padR = 24, padT = 16, padB = 30;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const past = series.past;        // t: -24..0
  const future = series.future;    // t: 0..48

  const all = [...past, ...future];
  const maxY = Math.max(
    50,
    ...all.map((d) => Math.max(d.pv || 0, d.load || 0, d.pvHigh || 0))
  );

  const tMin = -24;
  const tMax = horizon;
  const xScale = (t) => padL + ((t - tMin) / (tMax - tMin)) * innerW;
  const yScale = (v) => padT + innerH - (v / maxY) * innerH;

  const pointsPV = past.map((d) => [xScale(d.t), yScale(d.pv)]);
  const pointsLoad = past.map((d) => [xScale(d.t), yScale(d.load)]);
  const futPV = future.filter((d) => d.t <= horizon).map((d) => [xScale(d.t), yScale(d.pv)]);
  const futLoad = future.filter((d) => d.t <= horizon).map((d) => [xScale(d.t), yScale(d.load)]);

  const pathOf = (pts) => pts.map(([x, y], i) => (i ? `L ${x} ${y}` : `M ${x} ${y}`)).join(" ");
  const areaOf = (pts) => {
    if (!pts.length) return "";
    const last = pts.at(-1);
    const first = pts[0];
    return `${pathOf(pts)} L ${last[0]} ${yScale(0)} L ${first[0]} ${yScale(0)} Z`;
  };

  // Uncertainty band
  const bandHi = future.filter((d) => d.t <= horizon).map((d) => [xScale(d.t), yScale(d.pvHigh)]);
  const bandLo = future.filter((d) => d.t <= horizon).map((d) => [xScale(d.t), yScale(d.pvLow)]);
  const bandPath = (() => {
    if (!bandHi.length) return "";
    const hi = bandHi.map(([x, y], i) => (i ? `L ${x} ${y}` : `M ${x} ${y}`)).join(" ");
    const lo = bandLo.slice().reverse().map(([x, y]) => `L ${x} ${y}`).join(" ");
    return `${hi} ${lo} Z`;
  })();

  // X-axis ticks: every 3 hours
  const ticks = [];
  for (let t = Math.ceil(tMin / 3) * 3; t <= tMax; t += 3) ticks.push(t);

  // ToU blocks (for the full window)
  const touBlocks = useMemoChart(() => {
    if (!showToU) return [];
    const blocks = [];
    const now = series.scenario.hourNow;
    for (let t = tMin; t < tMax; t += 0.5) {
      const hr = (now + t + 48) % 24;
      const b = window.tariffAt(hr);
      blocks.push({ t, block: b.block });
    }
    // merge
    const merged = [];
    for (const b of blocks) {
      const last = merged.at(-1);
      if (last && last.block === b.block) last.tEnd = b.t + 0.5;
      else merged.push({ tStart: b.t, tEnd: b.t + 0.5, block: b.block });
    }
    return merged;
  }, [showToU, series, tMin, tMax]);

  const touColor = { peak: "var(--load)", standard: "var(--info)", "off-peak": "var(--ok)" };

  // Hover state
  const [hover, setHover] = useStateChart(null);
  const svgRef = useRefChart(null);
  function onMove(e) {
    const r = svgRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    if (x < padL || x > padL + innerW) return setHover(null);
    const t = tMin + ((x - padL) / innerW) * (tMax - tMin);
    const dataset = t <= 0 ? past : future;
    const nearest = dataset.reduce((best, d) => Math.abs(d.t - t) < Math.abs(best.t - t) ? d : best, dataset[0]);
    setHover({ x: xScale(nearest.t), t: nearest.t, data: nearest });
  }

  // Axis y-ticks
  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY].map((v) => Math.round(v));

  const nowX = xScale(0);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} width="100%" height={h} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: "block" }}>
        <defs>
          <pattern id="diag" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--line-soft)" strokeWidth="1" opacity="0.4" />
          </pattern>
          <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--solar)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--solar)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--load)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--load)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* ToU bands */}
        {showToU && touBlocks.map((b, i) => (
          <rect key={i} x={xScale(b.tStart)} y={padT} width={xScale(b.tEnd) - xScale(b.tStart)} height={innerH} fill={touColor[b.block]} opacity="0.045" />
        ))}

        {/* Y gridlines */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={padL} x2={w - padR} y1={yScale(v)} y2={yScale(v)} className="gridline" opacity="0.6" />
            <text x={padL - 8} y={yScale(v) + 3} className="axis-text" textAnchor="end">{v}</text>
          </g>
        ))}

        {/* X ticks */}
        {ticks.map((t) => {
          const isNow = t === 0;
          const hourOfDay = Math.round((series.scenario.hourNow + t + 48) % 24);
          return (
            <g key={t}>
              <line x1={xScale(t)} x2={xScale(t)} y1={padT} y2={padT + innerH} className="gridline" opacity={isNow ? 0 : 0.35} />
              <text x={xScale(t)} y={h - 12} className="axis-text" textAnchor="middle">
                {String(hourOfDay).padStart(2, "0")}:00
              </text>
            </g>
          );
        })}

        {/* "Now" line */}
        <line x1={nowX} x2={nowX} y1={padT} y2={padT + innerH} stroke="var(--fg-2)" strokeWidth="1" strokeDasharray="3 3" />
        <rect x={nowX - 18} y={padT - 1} width="36" height="14" fill="var(--bg-1)" stroke="var(--line)" />
        <text x={nowX} y={padT + 9} textAnchor="middle" className="axis-text" fill="var(--fg-1)">NOW</text>

        {/* Forecast region shading */}
        <rect x={nowX} y={padT} width={xScale(horizon) - nowX} height={innerH} fill="url(#diag)" opacity="0.6" />

        {/* === Style: BAND === */}
        {style === "band" && (
          <>
            {/* Uncertainty band */}
            <path d={bandPath} fill="var(--solar)" opacity="0.16" />
            {/* Past PV (solid) */}
            <path d={areaOf(pointsPV)} fill="url(#pvFill)" />
            <path d={pathOf(pointsPV)} stroke="var(--solar)" strokeWidth="1.8" fill="none" />
            {/* Future PV (dashed center) */}
            <path d={pathOf(futPV)} stroke="var(--solar)" strokeWidth="1.6" fill="none" strokeDasharray="4 3" opacity="0.95" />
            {/* Load */}
            <path d={pathOf(pointsLoad)} stroke="var(--load)" strokeWidth="1.5" fill="none" />
            <path d={pathOf(futLoad)} stroke="var(--load)" strokeWidth="1.3" fill="none" strokeDasharray="4 3" opacity="0.7" />
          </>
        )}

        {/* === Style: AREA (filled areas, no band) === */}
        {style === "area" && (
          <>
            <path d={areaOf([...pointsPV, ...futPV])} fill="url(#pvFill)" />
            <path d={areaOf([...pointsLoad, ...futLoad])} fill="url(#loadFill)" />
            <path d={pathOf([...pointsPV, ...futPV])} stroke="var(--solar)" strokeWidth="1.6" fill="none" />
            <path d={pathOf([...pointsLoad, ...futLoad])} stroke="var(--load)" strokeWidth="1.5" fill="none" />
          </>
        )}

        {/* === Style: STACKED (stacked bars per hour) === */}
        {style === "stacked" && (
          <>
            {[...past, ...future.filter((d) => d.t <= horizon)]
              .filter((d) => Math.abs(d.t * 2 - Math.round(d.t * 2)) < 0.01) // every 0.5h
              .map((d, i) => {
                const x = xScale(d.t) - 3;
                const pvH = yScale(0) - yScale(d.pv);
                const loadH = yScale(0) - yScale(d.load);
                const isFuture = d.t > 0;
                return (
                  <g key={i} opacity={isFuture ? 0.75 : 1}>
                    <rect x={x} y={yScale(d.pv)} width="6" height={pvH} fill="var(--solar)" opacity="0.72" />
                    <rect x={x + 6} y={yScale(d.load)} width="3" height={loadH} fill="var(--load)" opacity="0.8" />
                  </g>
                );
              })}
          </>
        )}

        {/* Hover crosshair */}
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={padT} y2={padT + innerH} stroke="var(--fg-2)" strokeWidth="1" opacity="0.6" />
            <circle cx={hover.x} cy={yScale(hover.data.pv)} r="3.5" fill="var(--solar)" stroke="var(--bg-0)" strokeWidth="1.5" />
            <circle cx={hover.x} cy={yScale(hover.data.load)} r="3.5" fill="var(--load)" stroke="var(--bg-0)" strokeWidth="1.5" />
          </g>
        )}
      </svg>

      {/* Hover tooltip */}
      {hover && (
        <div style={{ position: "absolute", left: `${(hover.x / w) * 100}%`, top: 8, transform: "translateX(8px)", pointerEvents: "none", background: "var(--bg-2)", border: "1px solid var(--line-strong)", padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: 11, minWidth: 160, borderRadius: 2 }}>
          <div style={{ color: "var(--fg-2)", marginBottom: 4, letterSpacing: "0.04em", fontSize: 10 }}>
            {hover.t <= 0 ? "OBSERVED" : "FORECAST"} · T{hover.t >= 0 ? "+" : ""}{hover.t.toFixed(2)}h
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span className="c-solar">PV</span><span>{hover.data.pv.toFixed(1)} kW</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span className="c-load">Load</span><span>{hover.data.load.toFixed(1)} kW</span>
          </div>
          {hover.data.pvLow !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "var(--fg-3)" }}>
              <span>P10–P90</span><span>{hover.data.pvLow.toFixed(1)}–{hover.data.pvHigh.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Hour strip — compact horizontal timeline */
function HourStrip({ series, horizon = 24, height = 56 }) {
  const w = 900;
  const padL = 0, padR = 0, padT = 6, padB = 6;
  const innerW = w;
  const innerH = height - padT - padB;
  const tMin = -6, tMax = horizon;
  const xScale = (t) => ((t - tMin) / (tMax - tMin)) * innerW;
  const data = [
    ...series.past.filter((d) => d.t >= tMin),
    ...series.future.filter((d) => d.t <= tMax),
  ];
  const maxY = Math.max(30, ...data.map((d) => d.pv));
  const yScale = (v) => padT + innerH - (v / maxY) * innerH;
  const path = data.map((d, i) => `${i ? "L" : "M"} ${xScale(d.t)} ${yScale(d.pv)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <path d={path} stroke="var(--solar)" strokeWidth="1.4" fill="none" />
      <line x1={xScale(0)} x2={xScale(0)} y1={padT} y2={padT + innerH} stroke="var(--fg-2)" strokeDasharray="2 2" />
    </svg>
  );
}

/* Radial mini-meter (for KPIs) */
function MiniMeter({ value, max, color = "var(--battery)", size = 42 }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--bg-3)" strokeWidth="3" fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="3" fill="none"
              strokeDasharray={`${c * pct} ${c}`} strokeLinecap="butt"
              transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}

Object.assign(window, { ForecastChart, HourStrip, MiniMeter });
