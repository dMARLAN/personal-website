import type {
  HostReadings,
  ServerMetric,
  ServerSnapshot,
} from "@/content/types";

export type SnapshotListener = (snapshot: ServerSnapshot) => void;

/**
 * Where /server gets its readings. Today the fake provider below jitters the baseline. A live one would poll the API's
 * `GET /stats` (design section 13) and pass each `ServerSnapshot` it returns to the listener.
 */
export interface ServerStatsProvider {
  /** Calls `listener` with each new snapshot until the returned function is called. */
  subscribe(listener: SnapshotListener): () => void;
}

/** (ours) How often the fake readings change: a gentle drift, not an animation. */
export const FAKE_INTERVAL_MS = 1500;

/** (ours) How far each fake reading may wander from its baseline, in the row's unit. Uptime stays put. */
export const FAKE_BAND: Readonly<Record<ServerMetric, number>> = {
  inletTemp: 1,
  cpu: 9,
  ram: 2,
  cpuTemp: 3,
  power: 6,
  fan: 60,
  memPressure: 0.3,
  throughput: 40,
  jitter: 0.2,
  diskTemp: 1,
  loadAvg: 0.3,
  disk: 0,
  uptime: 0,
};

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function jitterHost(
  baseline: HostReadings,
  current: HostReadings,
  random: () => number,
): HostReadings {
  const next = (metric: ServerMetric): number => {
    const band = FAKE_BAND[metric];
    const step = (random() * 2 - 1) * (band / 2);
    const centre = baseline[metric];
    return clamp(
      current[metric] + step,
      Math.max(0, centre - band),
      centre + band,
    );
  };
  return {
    inletTemp: next("inletTemp"),
    cpu: next("cpu"),
    ram: next("ram"),
    cpuTemp: next("cpuTemp"),
    power: next("power"),
    fan: next("fan"),
    memPressure: next("memPressure"),
    throughput: next("throughput"),
    jitter: next("jitter"),
    diskTemp: next("diskTemp"),
    loadAvg: next("loadAvg"),
    disk: next("disk"),
    uptime: next("uptime"),
  };
}

/** One random-walk step: each reading moves up to half its band and stays within the band around its baseline. */
export function jitterSnapshot(
  baseline: ServerSnapshot,
  current: ServerSnapshot,
  random: () => number,
): ServerSnapshot {
  const [left, right] = baseline.hosts;
  return {
    hosts: [
      jitterHost(left, current.hosts[0], random),
      jitterHost(right, current.hosts[1], random),
    ],
  };
}

/** Fake readings: a random walk around `baseline` every `FAKE_INTERVAL_MS`. It skips ticks while the tab is hidden. */
export function fakeServerStatsProvider(
  baseline: ServerSnapshot,
  random: () => number = Math.random,
): ServerStatsProvider {
  return {
    subscribe(listener) {
      let current = baseline;
      const timer = setInterval(() => {
        if (document.hidden) {
          return;
        }
        current = jitterSnapshot(baseline, current, random);
        listener(current);
      }, FAKE_INTERVAL_MS);
      return () => clearInterval(timer);
    },
  };
}
