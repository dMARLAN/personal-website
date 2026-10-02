import type { Project, ProjectCategory } from "./types";

// PLACEHOLDER: stand-in categories and projects until Chad picks the real ones (design section 18, question 6).
// Every name, description, field and URL below is invented.

export const PROJECT_CATEGORIES: readonly ProjectCategory[] = [
  { legend: "WEB", name: "Web" },
  { legend: "TOOLS", name: "Tools" },
  { legend: "HOMELAB", name: "Homelab" },
];

export const PROJECTS: readonly Project[] = [
  {
    slug: "personal-site",
    station: 2,
    name: "Personal site",
    code: "SITE",
    store: { kind: "pair" },
    status: "RDY",
    category: "WEB",
    fields: {
      left: [
        { label: "LANG", value: "TS" },
        { label: "YEAR", value: "2026" },
        { label: "ROLE", value: "SOLO" },
      ],
      right: [
        { label: "STACK", value: "NEXT FASTAPI" },
        { label: "HOST", value: "K8S" },
        { label: "FONT", value: "DCS STROKE" },
      ],
    },
    description:
      "Placeholder. This website: an F/A-18C DDI drawn in SVG, with a Next.js front end and a FastAPI back end. " +
      "Every page is a real cockpit format, and the bezel buttons are the only navigation.",
    links: [
      { kind: "REPO", url: "https://github.com/example/personal-website" },
      { kind: "DEMO", url: "https://example.com/" },
    ],
  },
  {
    slug: "trail-log",
    station: 6,
    name: "Trail log",
    code: "TRAIL",
    store: { kind: "missile" },
    status: "DEGD",
    category: "WEB",
    fields: {
      left: [
        { label: "LANG", value: "PY" },
        { label: "YEAR", value: "2023" },
      ],
      right: [
        { label: "STACK", value: "DJANGO LEAFLET" },
        { label: "DATA", value: "GPX" },
      ],
    },
    description:
      "Placeholder. A hiking log that imports GPX tracks, draws them on a map and totals distance and climb per " +
      "season. It still runs, but the map tiles it uses have been retired.",
    links: [{ kind: "REPO", url: "https://github.com/example/trail-log" }],
  },
  {
    slug: "squadron-bot",
    station: 9,
    name: "Squadron bot",
    code: "BOT",
    store: { kind: "missile" },
    status: "HUNG",
    category: "WEB",
    fields: {
      left: [
        { label: "LANG", value: "TS" },
        { label: "YEAR", value: "2022" },
      ],
      right: [
        { label: "API", value: "DISCORD" },
        { label: "USERS", value: "40" },
      ],
    },
    description:
      "Placeholder. A chat bot for a virtual squadron: mission sign-ups, briefing reminders and a sortie board. " +
      "It is hung on the rail until the chat API it depends on settles down.",
    links: [{ kind: "REPO", url: "https://github.com/example/squadron-bot" }],
  },
  {
    slug: "dotfiles",
    station: 1,
    name: "Dotfiles",
    code: "DOTS",
    store: { kind: "missile" },
    status: "RDY",
    category: "TOOLS",
    fields: {
      left: [
        { label: "LANG", value: "SH" },
        { label: "YEAR", value: "2019" },
      ],
      right: [
        { label: "OS", value: "LINUX MACOS" },
        { label: "SHELL", value: "ZSH" },
      ],
    },
    description:
      "Placeholder. Shell, editor and terminal settings, installed on a new machine with one command. A small " +
      "test suite boots a clean container and checks that every tool comes up.",
    links: [{ kind: "REPO", url: "https://github.com/example/dotfiles" }],
  },
  {
    slug: "code-rules",
    station: 4,
    name: "Code review rules",
    code: "RULES",
    store: { kind: "missile" },
    status: "STBY",
    category: "TOOLS",
    fields: {
      left: [
        { label: "LANG", value: "MD" },
        { label: "YEAR", value: "2025" },
      ],
      right: [
        { label: "RULES", value: "40" },
        { label: "USE", value: "AI REVIEW" },
      ],
    },
    description:
      "Placeholder. A shared set of code quality rules, one file per rule with a bad and a good example. " +
      "Review agents load them to check a diff, and people read them as a style guide.",
    links: [{ kind: "REPO", url: "https://github.com/example/code-rules" }],
  },
  {
    slug: "dcs-extract",
    station: 8,
    name: "DCS asset extractor",
    code: "DCSX",
    store: { kind: "pair" },
    status: "RDY",
    category: "TOOLS",
    fields: {
      left: [
        { label: "LANG", value: "PY" },
        { label: "YEAR", value: "2026" },
        { label: "DEPS", value: "NONE" },
      ],
      right: [
        { label: "INPUT", value: "SVG" },
        { label: "OUTPUT", value: "TS MODULES" },
      ],
    },
    description:
      "Placeholder. Reads the stroke font and symbol sheets from a DCS install, snaps every glyph to its cell " +
      "and writes typed path data that this site draws with.",
    links: [{ kind: "REPO", url: "https://github.com/example/dcs-extract" }],
  },
  {
    slug: "home-cluster",
    station: 3,
    name: "Home cluster",
    code: "K8S",
    store: { kind: "rack", amount: 3 },
    status: "RDY",
    category: "HOMELAB",
    fields: {
      left: [
        { label: "NODES", value: "3" },
        { label: "YEAR", value: "2024" },
      ],
      right: [
        { label: "DIST", value: "K3S" },
        { label: "GITOPS", value: "FLUX" },
      ],
    },
    description:
      "Placeholder. Three small machines running Kubernetes, configured from a Git repository. Every service in " +
      "the house deploys to it, and a pull request is the only way to change it.",
    links: [{ kind: "REPO", url: "https://github.com/example/home-cluster" }],
  },
  {
    slug: "storage",
    station: 5,
    name: "Network storage",
    code: "NAS",
    store: { kind: "tank" },
    status: "RDY",
    category: "HOMELAB",
    fields: {
      left: [
        { label: "SIZE", value: "24TB" },
        { label: "YEAR", value: "2021" },
      ],
      right: [
        { label: "FS", value: "ZFS RAIDZ2" },
        { label: "BACKUP", value: "OFFSITE" },
      ],
    },
    description:
      "Placeholder. The centreline tank: a storage server that holds photos, backups and media, with snapshots " +
      "every hour and a nightly copy to a second site.",
    links: [],
  },
  {
    slug: "monitoring",
    station: 7,
    name: "Monitoring stack",
    code: "MON",
    store: { kind: "rack", amount: 4 },
    status: "STBY",
    category: "HOMELAB",
    fields: {
      left: [
        { label: "PARTS", value: "4" },
        { label: "YEAR", value: "2024" },
      ],
      right: [
        { label: "METRIC", value: "PROMETHEUS" },
        { label: "LOGS", value: "LOKI" },
        { label: "ALERT", value: "PHONE" },
      ],
    },
    description:
      "Placeholder. Metrics, logs and alerts for the home cluster, with dashboards for power draw, disk health " +
      "and how long the last backup took.",
    links: [
      { kind: "REPO", url: "https://github.com/example/monitoring" },
      { kind: "DEMO", url: "https://example.com/dashboards" },
    ],
  },
];
