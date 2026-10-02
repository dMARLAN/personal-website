import type { RadarScene } from "@/content/types";
import { RANGE_SCALES } from "@/ddi/formats/rdrAttk";
import { RadarSettings } from "@/ddi/pages/radar/islands";
import {
  AGING_OPTIONS,
  BAR_OPTIONS,
  OPENING_SCAN,
  PRF_OPTIONS,
  RWS_AZIMUTHS,
} from "@/ddi/pages/radar/settings";

/**
 * What the RDR ATTK glass shows, as text (design section 10.2). The radar settings have no URL, so this lists every
 * option, and the current settings as they stand.
 */
export function RadarSemantic({
  scene,
}: {
  scene: RadarScene;
}): React.JSX.Element {
  const { ownship } = scene;
  return (
    <>
      <p>
        A simulated F/A-18C attack radar. It opens in range-while-search mode
        and can switch to track-while-scan. It is a showcase with fake data: the
        contacts and flight numbers are made up.
      </p>
      <p>
        The display is a B-scope: azimuth runs left to right across 140°, and
        range runs from the bottom up. A sweep line crosses the scan, one
        elevation bar per pass. Each contact&apos;s raw hit refreshes when a bar
        that covers its altitude sweeps it, then dims. In track-while-scan, each
        tracked contact shows as a ranked track file.
      </p>
      <h2>Current settings</h2>
      <RadarSettings />
      <h2>Controls</h2>
      <dl>
        <dt>Mode</dt>
        <dd>Range while search (RWS) or track while scan (TWS).</dd>
        <dt>Elevation bars</dt>
        <dd>
          {BAR_OPTIONS.RWS.join(", ")} bars in RWS; {BAR_OPTIONS.TWS.join(", ")}{" "}
          in TWS. More bars cover more altitude but take longer per frame.
        </dd>
        <dt>Azimuth scan</dt>
        <dd>
          {RWS_AZIMUTHS.join("°, ")}° in RWS. TWS allows up to 80° with 2 bars,
          40° with 4 and 20° with 6.
        </dd>
        <dt>Range scale</dt>
        <dd>
          {RANGE_SCALES.join(", ")} NM, stepped with the range arrows. It opens
          at {OPENING_SCAN.range} NM.
        </dd>
        <dt>Pulse repetition frequency</dt>
        <dd>
          {PRF_OPTIONS.join(", ")}. HI sees far but misses slow-closing
          contacts; MED sees every aspect but not as far; INTL alternates them
          bar by bar.
        </dd>
        <dt>Silent</dt>
        <dd>
          Stops the radar transmitting: the sweep stops and the hits fade.
          ACTIVE then runs a single frame.
        </dd>
        <dt>Erase</dt>
        <dd>Clears the hit history.</dd>
        <dt>Set and reset</dt>
        <dd>SET saves the scan settings; RSET returns to the saved ones.</dd>
        <dt>Data</dt>
        <dd>
          Target aging ({AGING_OPTIONS.join(", ")} seconds), declutter, the
          speed gate, bearing and range to the cursor, and the colour, LTWS, MSI
          and one-look raid options.
        </dd>
        <dt>Scan centring (TWS)</dt>
        <dd>MAN keeps the scan on the nose; AUTO centres it on the L&amp;S.</dd>
      </dl>
      <h2>Our aircraft</h2>
      <dl>
        <dt>Contacts</dt>
        <dd>{scene.contacts.length}</dd>
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
