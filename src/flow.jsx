/* Power flow diagram — PV ⇄ BESS ⇄ Load ⇄ Grid nodes with animated flow */

function PowerFlow({ snap, soc = 78, scenario = "midday", fault = false }) {
  const w = 520, h = 390;
  // Node positions
  const NODES = {
    pv:      { x: 100, y: 60,  label: "SOLAR PV",  sub: "47.4 kWp · 2 inverters", tone: "solar" },
    bess:    { x: 420, y: 60,  label: "BESS",      sub: "100 kWh · 50 kW",        tone: "battery" },
    load:    { x: 420, y: 300, label: "LOAD",      sub: "Commercial · 3-phase",   tone: "load" },
    grid:    { x: 100, y: 300, label: "GRID",      sub: "Eskom · Homeflex",       tone: "grid" },
    bus:     { x: 260, y: 180, label: "AC BUS",    sub: "400V · 50 Hz",           tone: null },
  };

  const flows = [
    { from: "pv",   to: "bus",  value: snap.pv,   tone: "solar",   active: snap.pv > 0.5 },
    { from: "bus",  to: "bess", value: snap.battery > 0 ? snap.battery : 0, tone: "battery", active: snap.battery > 0.5, dir: "charge" },
    { from: "bess", to: "bus",  value: snap.battery < 0 ? -snap.battery : 0, tone: "battery", active: snap.battery < -0.5, dir: "discharge" },
    { from: "bus",  to: "load", value: snap.load, tone: "load",    active: true, reverse: false },
    { from: "grid", to: "bus",  value: snap.grid < 0 ? -snap.grid : 0, tone: "grid", active: snap.grid < -0.3, dir: "import" },
    { from: "bus",  to: "grid", value: snap.grid > 0 ? snap.grid : 0,  tone: "grid", active: snap.grid > 0.3,  dir: "export" },
  ].filter((f) => f.active && f.value > 0.1);

  function flowPath(fromK, toK) {
    const f = NODES[fromK], t = NODES[toK];
    // Elbow routing
    const mx = (f.x + t.x) / 2;
    return `M ${f.x} ${f.y} L ${mx} ${f.y} L ${mx} ${t.y} L ${t.x} ${t.y}`;
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{ display: "block", maxHeight: 380 }}>
      <defs>
        {/* Flow animation pattern */}
        <marker id="arrow-solar" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--solar)" />
        </marker>
        <marker id="arrow-battery" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--battery)" />
        </marker>
        <marker id="arrow-load" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--load)" />
        </marker>
        <marker id="arrow-grid" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--grid)" />
        </marker>
      </defs>

      {/* Static connection lines */}
      {["pv","bess","load","grid"].map((k) => (
        <path key={k} d={flowPath(k, "bus")} stroke="var(--line)" strokeWidth="1" fill="none" />
      ))}

      {/* Active flows */}
      {flows.map((f, i) => {
        const d = f.from === "bess" || f.from === "grid" || f.from === "pv"
          ? flowPath(f.from, "bus")
          : flowPath(f.to === "bus" ? f.from : "bus", f.to === "bus" ? "bus" : f.to);
        const pathD = flowPath(f.from, f.to);
        return (
          <g key={i}>
            <path
              d={pathD}
              stroke={`var(--${f.tone})`}
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 6"
              markerEnd={`url(#arrow-${f.tone})`}
              opacity="0.9"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.2s" repeatCount="indefinite" />
            </path>
            {/* value label on line */}
            {(() => {
              const fn = NODES[f.from], tn = NODES[f.to];
              const mx = (fn.x + tn.x) / 2;
              const my = fn.y === tn.y ? fn.y - 10 : (fn.y + tn.y) / 2;
              return (
                <g>
                  <rect x={mx - 26} y={my - 8} width="52" height="16" fill="var(--bg-0)" stroke={`var(--${f.tone})`} strokeOpacity="0.4" />
                  <text x={mx} y={my + 3} textAnchor="middle" fill={`var(--${f.tone})`} fontFamily="var(--font-mono)" fontSize="10" fontWeight="500">
                    {f.value.toFixed(1)} kW
                  </text>
                </g>
              );
            })()}
          </g>
        );
      })}

      {/* Nodes */}
      {Object.entries(NODES).map(([k, n]) => {
        const isBus = k === "bus";
        const size = isBus ? 64 : 76;
        const color = n.tone ? `var(--${n.tone})` : "var(--fg-2)";
        const hasFault = fault && k === "pv";
        return (
          <g key={k} transform={`translate(${n.x - size/2} ${n.y - size/2})`}>
            {/* Outer frame */}
            <rect width={size} height={size} fill="var(--bg-1)" stroke={hasFault ? "var(--err)" : color} strokeOpacity={isBus ? 0.4 : 0.8} strokeWidth={isBus ? 1 : 1.5} />
            {/* Corner ticks */}
            {[[0,0,1,0,0,1], [size,0,-1,0,0,1], [0,size,1,0,0,-1], [size,size,-1,0,0,-1]].map((c, i) => {
              const [cx, cy, dx1, dy1, dx2, dy2] = c;
              return (
                <g key={i} stroke={hasFault ? "var(--err)" : color} strokeWidth="1.5">
                  <line x1={cx} y1={cy} x2={cx + dx1*6} y2={cy + dy1*6} />
                  <line x1={cx} y1={cy} x2={cx + dx2*6} y2={cy + dy2*6} />
                </g>
              );
            })}

            {/* Icon area */}
            {k === "pv" && <PVIcon size={size} color={hasFault ? "var(--err)" : color} />}
            {k === "bess" && <BessIcon size={size} color={color} soc={soc} />}
            {k === "load" && <LoadIcon size={size} color={color} />}
            {k === "grid" && <GridIcon size={size} color={color} />}
            {k === "bus" && <BusIcon size={size} />}

            {/* Fault indicator */}
            {hasFault && (
              <g transform={`translate(${size - 10} 4)`}>
                <circle r="5" fill="var(--err)">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                </circle>
              </g>
            )}

            {/* Label below */}
            <g transform={`translate(${size/2} ${size + 14})`}>
              <text textAnchor="middle" fontFamily="var(--font-sans)" fontSize="10" fontWeight="600" letterSpacing="0.1em" fill={color}>{n.label}</text>
              <text textAnchor="middle" y="13" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--fg-3)">{n.sub}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function PVIcon({ size, color }) {
  const p = 10;
  return (
    <g stroke={color} fill="none" strokeWidth="1.2">
      {[0,1].map((r) => [0,1,2].map((c) => (
        <rect key={r+"-"+c} x={p + c*(size-2*p)/3} y={p + r*(size-2*p)/2} width={(size-2*p)/3 - 2} height={(size-2*p)/2 - 2} />
      )))}
    </g>
  );
}
function BessIcon({ size, color, soc }) {
  const p = 14;
  const inner = size - 2*p;
  const fillH = (soc/100) * (inner - 4);
  return (
    <g>
      <rect x={p} y={p} width={inner} height={inner} stroke={color} fill="none" strokeWidth="1.2" />
      <rect x={p + inner/2 - 4} y={p - 3} width="8" height="3" fill={color} />
      <rect x={p + 2} y={p + inner - 2 - fillH} width={inner - 4} height={fillH} fill={color} opacity="0.4" />
      <text x={size/2} y={size/2 + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" fill={color}>{Math.round(soc)}%</text>
    </g>
  );
}
function LoadIcon({ size, color }) {
  const cx = size/2, cy = size/2;
  return (
    <g stroke={color} fill="none" strokeWidth="1.2">
      <rect x={cx-18} y={cy-14} width="36" height="22" />
      <rect x={cx-10} y={cy+10} width="20" height="4" fill={color} opacity="0.3" />
      <line x1={cx-12} y1={cy-8} x2={cx+12} y2={cy-8} />
      <line x1={cx-12} y1={cy-2} x2={cx+12} y2={cy-2} />
      <line x1={cx-12} y1={cy+4} x2={cx+4} y2={cy+4} />
    </g>
  );
}
function GridIcon({ size, color }) {
  const cx = size/2;
  return (
    <g stroke={color} fill="none" strokeWidth="1.2">
      <polygon points={`${cx},14 ${cx-14},32 ${cx+14},32`} />
      <line x1={cx} y1={32} x2={cx} y2={size-12} />
      <line x1={cx-10} y1={size-12} x2={cx+10} y2={size-12} />
      <line x1={cx-6} y1={40} x2={cx+6} y2={40} />
      <line x1={cx-8} y1={48} x2={cx+8} y2={48} />
    </g>
  );
}
function BusIcon({ size }) {
  const cx = size/2;
  return (
    <g>
      <circle cx={cx} cy={cx} r="14" fill="var(--bg-2)" stroke="var(--fg-3)" strokeWidth="1" />
      <text x={cx} y={cx + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fontWeight="500" fill="var(--fg-2)">400V</text>
    </g>
  );
}

Object.assign(window, { PowerFlow });
