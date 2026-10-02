import { fuelReading } from "@/ddi/formats/fuelModel";
import type { FuelReserves } from "@/content/types";

/** The FUEL page as HTML (design section 10.2): each reserve at its starting level. The display moves them gently. */
export function FuelSemantic({
  reserves,
}: {
  reserves: FuelReserves;
}): React.JSX.Element {
  const reading = fuelReading(reserves.tanks, 0);
  const pounds = new Map(reading.tanks.map((tank) => [tank.id, tank.pounds]));
  return (
    <>
      <p>
        The fuel page, drawn as in the Hornet, with energy reserves in place of
        fuel tanks. The levels drift slowly on the display; these are their
        starting values, in pounds.
      </p>
      <dl>
        {reserves.tanks.map((tank) => (
          <div key={tank.id}>
            <dt>{tank.name}</dt>
            <dd>
              {pounds.get(tank.id)} of {tank.capacity}
            </dd>
          </div>
        ))}
        <div>
          <dt>Total</dt>
          <dd>{reading.total}</dd>
        </div>
        <div>
          <dt>Internal</dt>
          <dd>{reading.internal}</dd>
        </div>
        <div>
          <dt>Bingo</dt>
          <dd>{reserves.bingo}</dd>
        </div>
      </dl>
    </>
  );
}
