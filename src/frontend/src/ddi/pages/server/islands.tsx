"use client";

import { useSyncExternalStore } from "react";
import { SERVER_STATS } from "@/content/server";
import type { ServerSnapshot } from "@/content/types";
import { EngValues } from "../../formats/eng";
import { fakeServerStatsProvider } from "./provider";
import { describeReading, engValues } from "./readings";
import { createSnapshotStore } from "./store";

// One store for the glass and the semantic layer, so both show the same readings.
const STORE = createSnapshotStore(
  SERVER_STATS.baseline,
  fakeServerStatsProvider(SERVER_STATS.baseline),
);

function useServerSnapshot(): ServerSnapshot {
  return useSyncExternalStore(
    STORE.subscribe,
    STORE.getSnapshot,
    STORE.getServerSnapshot,
  );
}

/** The ENG value columns, redrawn on each new snapshot. */
export function ServerValues(): React.JSX.Element {
  return (
    <EngValues values={engValues(SERVER_STATS.rows, useServerSnapshot())} />
  );
}

export interface ServerReadingProps {
  /** Index into `SERVER_STATS.rows`. */
  row: number;
  /** 0 is the left host, 1 the right. */
  host: 0 | 1;
}

/** One reading with its unit, for the semantic layer's table. */
export function ServerReading({
  row,
  host,
}: ServerReadingProps): React.JSX.Element {
  const spec = SERVER_STATS.rows[row];
  const value = useServerSnapshot().hosts[host][spec.metric];
  return <>{describeReading(value, spec)}</>;
}
