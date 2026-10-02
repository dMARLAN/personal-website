import type { FlightControls } from "./types";

// PLACEHOLDER: playful system-health data until Chad reviews it. The surface block, the servo tables, G-LIM and AOA
// keep the values of the DCS guide's FCS screenshot (guide p83); the bottom table's channels become services.
export const FLIGHT_CONTROLS: FlightControls = {
  surfaces: [
    {
      label: "LEF",
      left: { value: "0", arrow: null },
      right: { value: "0", arrow: null },
    },
    {
      label: "TEF",
      left: { value: "1", arrow: "down" },
      right: { value: "1", arrow: "down" },
    },
    {
      label: "AIL",
      left: { value: "0", arrow: null },
      right: { value: "0", arrow: null },
    },
    {
      label: "RUD",
      left: { value: "0", arrow: null },
      right: { value: "0", arrow: null },
    },
    {
      label: "STAB",
      left: { value: "1", arrow: "up" },
      right: { value: "1", arrow: "up" },
    },
  ],
  statusRows: [
    { label: "DB  R", meaning: "Database reads" },
    { label: "    W", meaning: "Database writes" },
    { label: "    B", meaning: "Database backups" },
    { label: "API", meaning: "API" },
    { label: "AUTH", meaning: "Sign-in" },
    { label: "CACHE", meaning: "Cache" },
    { label: "QUEUE", meaning: "Job queue" },
    { label: "CI/CD", meaning: "Build and deploy pipeline" },
    { label: "DNS", meaning: "DNS (it is always DNS)" },
    { label: "CRON", meaning: "Scheduled jobs" },
    { label: "DEGD", meaning: "Degraded overall" },
  ],
  channels: ["Laptop", "CI", "Staging", "Production"],
  failures: [
    { table: "bottom", row: 8, channel: 3 },
    { table: "bottom", row: 10, channel: 3 },
  ],
  gLimit: "7.5",
  aoa: { left: "1.0", right: "1.0" },
  blinCode: "53",
};
