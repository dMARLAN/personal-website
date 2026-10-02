import type { FcsArrow, FlightControls } from "@/content/types";

function side(value: string, arrow: FcsArrow | null): string {
  return arrow === null ? `${value}°` : `${value}° ${arrow}`;
}

/** The FCS page as HTML (design section 10.2): the surface positions and the system-health channel table. */
export function FcsSemantic({
  controls,
}: {
  controls: FlightControls;
}): React.JSX.Element {
  const failed = new Set(
    controls.failures
      .filter((failure) => failure.table === "bottom")
      .map(({ row, channel }) => `${row}-${channel}`),
  );
  return (
    <>
      <p>
        The flight control system page, drawn as in the Hornet, with mock data.
        An X in a channel box means that channel has failed.
      </p>
      <h2>Control surfaces</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Surface</th>
            <th scope="col">Left</th>
            <th scope="col">Right</th>
          </tr>
        </thead>
        <tbody>
          {controls.surfaces.map(({ label, left, right }) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{side(left.value, left.arrow)}</td>
              <td>{side(right.value, right.arrow)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>System health</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            {controls.channels.map((channel) => (
              <th key={channel} scope="col">
                {channel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {controls.statusRows.map(({ meaning }, row) => (
            <tr key={meaning}>
              <th scope="row">{meaning}</th>
              {controls.channels.map((channel, index) => (
                <td key={channel}>
                  {failed.has(`${row}-${index + 1}`) ? "Failed" : "OK"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <dl>
        <dt>G limit</dt>
        <dd>{controls.gLimit} G</dd>
        <dt>Angle of attack, left and right</dt>
        <dd>
          {controls.aoa.left}°, {controls.aoa.right}°
        </dd>
        {controls.blinCode !== "" && (
          <>
            <dt>BLIN code</dt>
            <dd>{controls.blinCode}</dd>
          </>
        )}
      </dl>
    </>
  );
}
