/* Simulated telemetry + scenario generator.
   All values are plausible for a ~50 kWp rooftop PV + 100 kWh BESS
   small commercial site in Cape Town. Not real data. */

(function () {
  const HOURS = 48;

  // Deterministic pseudo-random for stable charts
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Bell curve solar profile centered at 12:30, width varies by scenario
  function solarProfile(hour, peak, width, cloudiness, rng) {
    const t = hour - 12.5;
    const base = peak * Math.exp(-(t * t) / (2 * width * width));
    const cloud = cloudiness * Math.sin(hour * 1.7) * Math.sin(hour * 0.4);
    const noise = (rng() - 0.5) * 1.2;
    return Math.max(0, base * (1 - Math.max(0, cloud)) + noise);
  }

  // Load profile — commercial bldg (morning ramp, midday plateau, evening dip)
  function loadProfile(hour, rng) {
    const base = 8;
    const work =
      hour >= 7 && hour <= 18
        ? 14 + 6 * Math.sin(((hour - 7) / 11) * Math.PI)
        : 4;
    const evening = hour >= 18 && hour <= 22 ? 6 * ((22 - hour) / 4) : 0;
    return Math.max(2, base + work + evening + (rng() - 0.5) * 2.5);
  }

  const SCENARIOS = {
    midday: {
      label: "Midday · clear",
      hourNow: 12.5,
      peak: 42,
      width: 3.2,
      cloudiness: 0.05,
      uncertainty: 0.08,
      soc: 78,
      gridMode: "export",
      description: "Heavy generation, battery charging, exporting to grid.",
    },
    evening: {
      label: "Evening · discharge",
      hourNow: 19.25,
      peak: 42,
      width: 3.2,
      cloudiness: 0.05,
      uncertainty: 0.08,
      soc: 38,
      gridMode: "import-low",
      description: "BESS powering load, no sun. Grid supplementing peak tariff.",
    },
    cloudy: {
      label: "Cloudy · uncertain",
      hourNow: 11.0,
      peak: 38,
      width: 3.2,
      cloudiness: 0.55,
      uncertainty: 0.28,
      soc: 52,
      gridMode: "import",
      description: "Broken cloud. PV intermittent, importing to cover shortfall.",
    },
    alert: {
      label: "Alert · inverter fault",
      hourNow: 13.75,
      peak: 42,
      width: 3.2,
      cloudiness: 0.15,
      uncertainty: 0.10,
      soc: 71,
      gridMode: "import",
      description: "INV-2 tripped offline. Generation at 48% of forecast.",
      fault: true,
    },
  };

  function buildSeries(scenarioKey) {
    const s = SCENARIOS[scenarioKey] || SCENARIOS.midday;
    const rng = mulberry32(
      [...scenarioKey].reduce((a, c) => a + c.charCodeAt(0), 0)
    );

    const past = [];
    const future = [];

    // 24h history
    for (let h = -24; h <= 0; h += 0.25) {
      const hour = (s.hourNow + h + 48) % 24;
      let pv = solarProfile(hour, s.peak, s.width, s.cloudiness, rng);
      if (s.fault && h > -1) pv *= 0.48;
      const load = loadProfile(hour, rng);
      past.push({ t: h, hour, pv, load });
    }

    // 48h forecast
    for (let h = 0; h <= 48; h += 0.25) {
      const hour = (s.hourNow + h) % 24;
      const pv = solarProfile(hour, s.peak, s.width, s.cloudiness, rng);
      const load = loadProfile(hour, rng);
      // Uncertainty band widens with horizon
      const band = (0.6 + h / 24) * s.uncertainty * Math.max(pv, 3);
      future.push({
        t: h,
        hour,
        pv,
        pvLow: Math.max(0, pv - band),
        pvHigh: pv + band,
        load,
      });
    }

    return { scenario: s, past, future };
  }

  // Hourly ToU tariff (Eskom Homeflex / Megaflex-ish, simplified, ZAR/kWh)
  // Peak 06-09 & 17-20, Standard 09-17 & 20-22, Off-peak 22-06
  function tariffAt(hour, weekday = true) {
    const h = Math.floor(hour);
    if (!weekday) return { block: "standard", rate: 2.14 };
    if ((h >= 6 && h < 9) || (h >= 17 && h < 20))
      return { block: "peak", rate: 4.87 };
    if ((h >= 9 && h < 17) || (h >= 20 && h < 22))
      return { block: "standard", rate: 2.14 };
    return { block: "off-peak", rate: 1.23 };
  }

  // Alerts by scenario
  function alertsFor(scenarioKey) {
    const base = [
      { id: "a-201", ts: "14:02", sev: "info",  source: "System",      msg: "Firmware update INV-1 → v4.2.1 complete." },
      { id: "a-198", ts: "11:47", sev: "info",  source: "Forecast",    msg: "NWP model refreshed · ECMWF HRES 12Z." },
      { id: "a-195", ts: "08:30", sev: "warn",  source: "Tariff",      msg: "Peak ToU window begins at 17:00 · 2h 58m." },
      { id: "a-192", ts: "07:14", sev: "info",  source: "Grid",        msg: "Load shedding Stage 2 scheduled 20:00–22:30." },
    ];
    if (scenarioKey === "alert") {
      return [
        { id: "a-205", ts: "13:42", sev: "err",  source: "Inverter",  msg: "INV-2 AC breaker tripped · DC bus fault.", live: true },
        { id: "a-204", ts: "13:43", sev: "warn", source: "Forecast",  msg: "Generation 48% below 15-min forecast." },
        { id: "a-203", ts: "13:44", sev: "warn", source: "BESS",      msg: "String B-2 cell imbalance > 120mV." },
        ...base,
      ];
    }
    if (scenarioKey === "cloudy") {
      return [
        { id: "a-210", ts: "10:58", sev: "warn", source: "Forecast",  msg: "GHI variability high · uncertainty band widened." },
        ...base,
      ];
    }
    return base;
  }

  // Live-tick values — proper energy balance:
  //   pv + import = load + charge + export
  //   battery: + = charging,  − = discharging
  //   grid:    + = exporting, − = importing
  //
  // Simple dispatch heuristic:
  //   surplus = pv − load
  //   if surplus > 0 → charge battery first (up to 12 kW nominal), then export the remainder
  //   if surplus < 0 → discharge battery (up to 12 kW nominal), then import the remainder
  function snapshot(series) {
    const s = series.scenario;
    const p = series.past[series.past.length - 1];
    const f = series.future[0];
    // If fault active, PV is throttled at runtime (not just history tail)
    const pv = s.fault ? p.pv * 0.42 : p.pv;
    const load = p.load;
    const surplus = pv - load;

    // BESS power limit derated by SoC:
    //   ≤20% SoC: heavy derate (near empty)
    //   20–40%:   moderate derate
    //   40–80%:   near-nominal
    //   ≥80%:     charge-limited
    const soc = s.soc;
    const dischargeLimit =
      soc < 15 ? 0 :
      soc < 30 ? 5 :
      soc < 50 ? 9 :
                 12;
    const chargeLimit =
      soc > 95 ? 0 :
      soc > 85 ? 4 :
                 12;

    let battery, grid;

    // Fault state: BESS cannot charge reliably from upstream fault → restrict to discharge
    if (s.fault) {
      battery = Math.max(surplus, -dischargeLimit);
      if (battery > 0) battery = 0;           // never charge in fault
      grid = surplus - battery;                // negative = import
    } else if (surplus >= 0) {
      // Charging + export
      battery = Math.min(surplus, chargeLimit);
      grid = surplus - battery;                // positive = export
    } else {
      // Discharging + import (grid fills any shortfall below discharge limit)
      battery = Math.max(surplus, -dischargeLimit);  // negative
      grid = surplus - battery;                // negative = import
    }

    return {
      pv,
      load,
      battery,
      grid,
      forecastNext: f.pv,
    };
  }

  // Weather / irradiance hourly (48h, indexed by h)
  function weatherFor(scenarioKey) {
    const rng = mulberry32(99);
    const hours = [];
    for (let h = 0; h < 48; h++) {
      const base =
        scenarioKey === "cloudy"
          ? 320 + (rng() - 0.5) * 180
          : scenarioKey === "alert"
          ? 540 + (rng() - 0.5) * 120
          : 720 + (rng() - 0.5) * 90;
      const tempC = 14 + 8 * Math.sin(((h % 24) - 4) / 24 * Math.PI * 2) + (rng() - 0.5) * 2;
      hours.push({
        h,
        ghi: Math.max(0, base),
        cloud: scenarioKey === "cloudy" ? 60 + (rng() - 0.5) * 30 : 15 + (rng() - 0.5) * 20,
        temp: tempC,
      });
    }
    return hours;
  }

  // Expose
  Object.assign(window, {
    SCENARIOS,
    buildSeries,
    tariffAt,
    alertsFor,
    snapshot,
    weatherFor,
    HOURS,
  });
})();
