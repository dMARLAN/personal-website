import type { RadarScene } from "./types";

// PLACEHOLDER: fake flight data for the RDR ATTK showcase. The numbers are programmer jokes: heading 2^8, 404 knots,
// 20 KiB of altitude. Swap them for anything plausible.
export const RADAR_SCENE: RadarScene = {
  ownship: { heading: 256, airspeed: 404, mach: "0.90", altitude: 20480 },
  weapon: "9X 2",
  contacts: [
    { range: 33, azimuth: -24, speed: 880, track: 172, altitude: 17500 },
    { range: 19, azimuth: 31, speed: 320, track: 245, altitude: 21300 },
    { range: 52, azimuth: 8, speed: 720, track: 186, altitude: 30500 },
    { range: 27, azimuth: 52, speed: 460, track: 212, altitude: 19000 },
    { range: 38, azimuth: -49, speed: 610, track: 150, altitude: 27500 },
  ],
};
