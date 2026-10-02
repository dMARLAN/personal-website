import type { components } from "@/lib/api/schema";
import {
  BIT_ITEM_KEYS,
  BIT_LEGEND_KEYS,
  SERVER_METRICS,
  type FcsFailure,
  type FlightControls,
  type HostReadings,
  type Project,
  type ServerStats,
  type SiteContent,
} from "./types";

export type ApiSiteContent = components["schemas"]["SiteContent"];

type ApiProject = components["schemas"]["Project"];
type ApiFcsFailure = components["schemas"]["FcsFailure"];
type ApiHostReadings = components["schemas"]["HostReadings"];

const STATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const FCS_CHANNELS = [1, 2, 3, 4] as const;

/**
 * Shapes `GET /api/content` for the pages: unwraps the list sections (`work.employers`, `links.links`) and narrows
 * what OpenAPI cannot express (a station is 1–9, a host has a reading for every metric). The API validated every
 * document on save, so a failed narrowing means the two schemas drifted: it throws instead of guessing.
 */
export function adaptSiteContent(content: ApiSiteContent): SiteContent {
  return {
    profile: content.profile,
    resume: content.resume,
    employers: content.work.employers,
    projects: {
      categories: content.projects.categories,
      projects: content.projects.projects.map(adaptProject),
    },
    contact: content.contact,
    links: content.links.links,
    server: adaptServer(content.server),
    fuel: content.fuel,
    fcs: adaptFcs(content.fcs),
    checklist: content.checklist,
    bit: {
      checks: pickKeys(BIT_ITEM_KEYS, content.bit.checks, "bit.checks"),
      legendNames: pickKeys(
        BIT_LEGEND_KEYS,
        content.bit.legendNames,
        "bit.legendNames",
      ),
      swConfig: content.bit.swConfig,
    },
    radar: content.radar,
    mumi: content.mumi,
  };
}

function adaptProject(project: ApiProject): Project {
  return {
    ...project,
    station: oneOf(
      STATIONS,
      project.station,
      `project ${project.slug} station`,
    ),
  };
}

function adaptFcs(
  fcs: components["schemas"]["FlightControls"],
): FlightControls {
  return { ...fcs, failures: fcs.failures.map(adaptFailure) };
}

function adaptFailure(failure: ApiFcsFailure): FcsFailure {
  return {
    ...failure,
    channel: oneOf(FCS_CHANNELS, failure.channel, "fcs failure channel"),
  };
}

function adaptServer(
  server: components["schemas"]["ServerStats"],
): ServerStats {
  const [left, right] = server.baseline.hosts;
  return {
    ...server,
    baseline: { hosts: [readings(left, "left"), readings(right, "right")] },
  };
}

function readings(host: ApiHostReadings, side: string): HostReadings {
  return pickKeys(SERVER_METRICS, host, `server ${side} host readings`);
}

function oneOf<T extends number>(
  allowed: readonly T[],
  value: number,
  what: string,
): T {
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) {
    throw new Error(
      `${what} is ${value}; expected one of ${allowed.join(", ")}`,
    );
  }
  return match;
}

/** A record with exactly `keys`, read from an open-keyed API record. */
function pickKeys<K extends string, V>(
  keys: readonly K[],
  record: Readonly<Record<string, V>>,
  what: string,
): Record<K, V> {
  const unknown = Object.keys(record).filter(
    (key) => !keys.some((known) => known === key),
  );
  if (unknown.length > 0) {
    throw new Error(`${what} has unknown keys: ${unknown.join(", ")}`);
  }
  const entries = keys.map((key): [K, V] => {
    if (!(key in record)) {
      throw new Error(`${what} is missing ${key}`);
    }
    return [key, record[key]];
  });
  return Object.fromEntries(entries) as Record<K, V>;
}
