import type { ServerStats } from "@/content/types";
import { ServerReading } from "@/ddi/pages/server/islands";

/** The ENG table as real HTML (design section 10.2): one row per metric, one column per host. */
export function ServerSemantic({
  stats,
}: {
  stats: ServerStats;
}): React.JSX.Element {
  const [left, right] = stats.hosts;
  return (
    <>
      <p>
        The engine page of the Hornet&apos;s displays, with two home-server
        hosts in place of the two engines. The readings are simulated and drift
        a little every couple of seconds.
      </p>
      <table>
        <caption>Host metrics</caption>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">{left.name}</th>
            <th scope="col">{right.name}</th>
          </tr>
        </thead>
        <tbody>
          {stats.rows.map((row, index) => (
            <tr key={row.metric}>
              <th scope="row">{row.name}</th>
              <td>
                <ServerReading row={index} host={0} />
              </td>
              <td>
                <ServerReading row={index} host={1} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
