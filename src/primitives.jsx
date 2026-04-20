/* Shared primitives: KPI tiles, sparklines, gauges, chip styles */

const { useEffect, useRef, useState } = React;

/* Small label */
function Lbl({ children, ...rest }) {
  return <div className="lbl" {...rest}>{children}</div>;
}

/* Chip with semantic state */
function Chip({ tone = "info", children }) {
  return (
    <span className={`chip chip-${tone}`}>
      <span className="dot" />
      {children}
    </span>
  );
}

/* Live pulse chip */
function LiveChip({ label = "LIVE" }) {
  return (
    <span className="chip" style={{ color: "var(--ok)", borderColor: "var(--line)" }}>
      <span className="live-dot" />
      <span style={{ color: "var(--fg-1)", letterSpacing: "0.1em" }}>{label}</span>
    </span>
  );
}

/* Big numeric readout: value w/ unit */
function Readout({ value, unit, size = "lg", tone, fmt = (v) => v.toFixed(1) }) {
  const cls = { xl: "readout-xl", lg: "readout-lg", md: "readout-md", sm: "readout-sm" }[size] || "readout-lg";
  const colorVar = tone ? `var(--${tone})` : "var(--fg-0)";
  return (
    <div className={`readout ${cls}`} style={{ color: colorVar }}>
      {typeof value === "number" ? fmt(value) : value}
      {unit && <span className="unit">{unit}</span>}
    </div>
  );
}

/* Delta indicator */
function Delta({ v, fmt = (x) => (x > 0 ? "+" : "") + x.toFixed(1), unit = "%" }) {
  const tone = v > 0 ? "ok" : v < 0 ? "err" : "fg-2";
  const arrow = v > 0 ? "▲" : v < 0 ? "▼" : "–";
  return (
    <span className={`mono c-${tone}`} style={{ fontSize: 11 }}>
      {arrow} {fmt(v)}{unit}
    </span>
  );
}

/* KPI Tile */
function KpiTile({ label, value, unit, tone, delta, footer, fmt, size = "md" }) {
  return (
    <div style={{ padding: "14px 16px", borderRight: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)", minWidth: 0 }}>
      <Lbl>{label}</Lbl>
      <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6, minWidth: 0 }}>
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <Readout value={value} unit={unit} tone={tone} size={size} fmt={fmt} />
        </div>
        {delta !== undefined && <Delta v={delta} />}
      </div>
      {footer && <div style={{ marginTop: 6, fontSize: 10.5, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{footer}</div>}
    </div>
  );
}

/* Sparkline (compact) */
function Sparkline({ data, color = "var(--solar)", fill = true, height = 36, width = 120, showDot = false }) {
  if (!data || !data.length) return null;
  const min = Math.min(...data, 0);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const points = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const path = points.map(([x, y], i) => (i ? `L ${x} ${y}` : `M ${x} ${y}`)).join(" ");
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {fill && <path d={area} fill={color} opacity="0.14" />}
      <path d={path} stroke={color} strokeWidth="1.4" fill="none" />
      {showDot && (
        <circle cx={points.at(-1)[0]} cy={points.at(-1)[1]} r="2.5" fill={color} />
      )}
    </svg>
  );
}

/* Horizontal gauge bar (battery SoC, etc.) */
function GaugeBar({ value, max = 100, color = "var(--battery)", height = 8, ticks = 10 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ position: "relative", width: "100%", height, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: pct + "%", height: "100%", background: color, opacity: 0.85, transition: "width 400ms var(--ease)" }} />
      {Array.from({ length: ticks - 1 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: `${((i + 1) / ticks) * 100}%`, top: 0, bottom: 0, width: 1, background: "var(--bg-0)", opacity: 0.4 }} />
      ))}
    </div>
  );
}

/* Radial gauge (battery SoC etc.) */
function RadialGauge({ value, max = 100, size = 140, color = "var(--battery)", label, sub }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct * 0.75); // 3/4 arc
  const rot = 135; // start bottom-left
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: `rotate(${rot}deg)` }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--bg-2)" strokeWidth={stroke} fill="none" strokeDasharray={`${c*0.75} ${c*0.25}`} strokeLinecap="butt" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={`${c*0.75} ${c*0.25}`} strokeDashoffset={off} strokeLinecap="butt" style={{ transition: "stroke-dashoffset 500ms var(--ease)" }} />
        {/* tick marks */}
        {Array.from({ length: 11 }).map((_, i) => {
          const a = (i / 10) * 0.75 * 2 * Math.PI;
          const x1 = size/2 + Math.cos(a) * (r + 5);
          const y1 = size/2 + Math.sin(a) * (r + 5);
          const x2 = size/2 + Math.cos(a) * (r + 9);
          const y2 = size/2 + Math.sin(a) * (r + 9);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line)" strokeWidth="1" />;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <div className="readout readout-xl" style={{ color: "var(--fg-0)" }}>
          {Math.round(value)}<span className="unit">%</span>
        </div>
        {label && <div className="lbl" style={{ marginTop: 4 }}>{label}</div>}
        {sub && <div style={{ fontSize: 11, color: "var(--fg-2)" }} className="mono">{sub}</div>}
      </div>
    </div>
  );
}

/* ZA load-shedding stage pill */
function LoadShedStage({ stage }) {
  const color = stage === 0 ? "var(--ok)" : stage <= 2 ? "var(--warn)" : stage <= 4 ? "var(--load)" : "var(--err)";
  const label = stage === 0 ? "NO LOAD SHED" : `STAGE ${stage}`;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${color}`, color, padding: "3px 10px", borderRadius: 2, fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.1em", background: "color-mix(in oklch, currentColor 10%, transparent)" }}>
      <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
      {label}
    </div>
  );
}

/* Timestamp (e.g. 15:42:08 SAST) */
function Clock({ baseHour = 12.5 }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const totalSec = baseHour * 3600 + s;
  const hh = Math.floor(totalSec / 3600) % 24;
  const mm = Math.floor((totalSec / 60) % 60);
  const ss = Math.floor(totalSec % 60);
  const pad = (n) => String(n).padStart(2, "0");
  return <span className="mono" style={{ color: "var(--fg-1)", letterSpacing: "0.04em" }}>{pad(hh)}:{pad(mm)}:{pad(ss)} <span style={{ color: "var(--fg-3)" }}>SAST</span></span>;
}

/* Data row */
function Row({ label, value, tone, mono = true }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line-soft)", fontSize: 12 }}>
      <span style={{ color: "var(--fg-2)" }}>{label}</span>
      <span className={mono ? "mono" : ""} style={{ color: tone ? `var(--${tone})` : "var(--fg-0)" }}>{value}</span>
    </div>
  );
}

Object.assign(window, { Lbl, Chip, LiveChip, Readout, Delta, KpiTile, Sparkline, GaugeBar, RadialGauge, LoadShedStage, Clock, Row });
