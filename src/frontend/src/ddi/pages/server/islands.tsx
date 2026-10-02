"use client";

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import type { ServerSnapshot, ServerStats } from "@/content/types";
import { EngValues } from "../../formats/eng";
import { fakeServerStatsProvider } from "./provider";
import { describeReading, engValues } from "./readings";
import { createSnapshotStore, type SnapshotStore } from "./store";

interface ServerReadings {
  stats: ServerStats;
  store: SnapshotStore;
}

const ServerReadingsContext = createContext<ServerReadings | null>(null);

/** One store for the glass and the semantic layer, so both show the same readings. Wrap the whole page in it. */
export function ServerReadingsProvider({
  stats,
  children,
}: {
  stats: ServerStats;
  children: React.ReactNode;
}): React.JSX.Element {
  const [store] = useState(() =>
    createSnapshotStore(
      stats.baseline,
      fakeServerStatsProvider(stats.baseline),
    ),
  );
  return (
    <ServerReadingsContext value={{ stats, store }}>
      {children}
    </ServerReadingsContext>
  );
}

function useServerReadings(): ServerReadings & { snapshot: ServerSnapshot } {
  const readings = useContext(ServerReadingsContext);
  if (readings === null) {
    throw new Error("server readings are used outside ServerReadingsProvider");
  }
  const { store } = readings;
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return { ...readings, snapshot };
}

/** The ENG value columns, redrawn on each new snapshot. */
export function ServerValues(): React.JSX.Element {
  const { stats, snapshot } = useServerReadings();
  return <EngValues values={engValues(stats.rows, snapshot)} />;
}

export interface ServerReadingProps {
  /** Index into the stats' `rows`. */
  row: number;
  /** 0 is the left host, 1 the right. */
  host: 0 | 1;
}

/** One reading with its unit, for the semantic layer's table. */
export function ServerReading({
  row,
  host,
}: ServerReadingProps): React.JSX.Element {
  const { stats, snapshot } = useServerReadings();
  const spec = stats.rows[row];
  return <>{describeReading(snapshot.hosts[host][spec.metric], spec)}</>;
}
