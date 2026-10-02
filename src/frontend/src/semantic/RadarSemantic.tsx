import type { RadarScene } from "@/content/types";
import { RANGE_SCALES } from "@/ddi/formats/rdrAttk";
import { DEFAULT_RANGE } from "@/ddi/pages/radar/store";

/** What the RDR ATTK glass shows, as text (design section 10.2). Every range scale is listed, since none has a URL. */
export function RadarSemantic({
  scene,
}: {
  scene: RadarScene;
}): React.JSX.Element {
  const { ownship } = scene;
  return (
    <>
      <p>
        A simulated F/A-18C attack radar in range-while-search mode. It is a
        showcase with fake data: the contacts and flight numbers are made up.
      </p>
      <p>
        The display is a B-scope: azimuth runs left to right across 140°, and
        range runs from the bottom up. A sweep line crosses it every 2.3
        seconds, and each contact&apos;s raw hit refreshes as the sweep passes
        it, then dims.
      </p>
      <dl>
        <dt>Mode</dt>
        <dd>RWS, 4-bar scan, interleaved PRF</dd>
        <dt>Contacts</dt>
        <dd>{scene.contacts.length} raw hits</dd>
        <dt>Range scales</dt>
        <dd>
          {RANGE_SCALES.join(", ")} NM, stepped with the range arrows. It opens
          at {DEFAULT_RANGE} NM.
        </dd>
        <dt>Heading</dt>
        <dd>{ownship.heading}°</dd>
        <dt>Airspeed</dt>
        <dd>
          {ownship.airspeed} knots, Mach {ownship.mach}
        </dd>
        <dt>Altitude</dt>
        <dd>{ownship.altitude} feet</dd>
        <dt>Weapon</dt>
        <dd>{scene.weapon}</dd>
      </dl>
    </>
  );
}
