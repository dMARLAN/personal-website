import type { Employer } from "./types";

// PLACEHOLDER: invented employers, roles and highlights until Chad writes the real work history (design section 18).
// Newest first.
export const EMPLOYERS: readonly Employer[] = [
  {
    id: "northwind",
    tab: "NWIND",
    name: "Northwind Systems",
    location: "Remote",
    span: "2021-NOW",
    roles: [
      {
        title: "Staff Software Engineer",
        span: "2023-NOW",
        bullets: [
          "Placeholder: led the move of 40 services to Kubernetes and cut deploy time from 45 to 6 minutes.",
          "Placeholder: designed the internal developer platform used by 12 teams.",
          "Placeholder: mentored 5 engineers through promotion.",
        ],
      },
      {
        title: "Senior Software Engineer",
        span: "2021-2023",
        bullets: [
          "Placeholder: built the event pipeline that handles 2 billion events a day.",
          "Placeholder: replaced a nightly batch job with streaming updates.",
        ],
      },
    ],
  },
  {
    id: "bluefin",
    tab: "BLUEFIN",
    name: "Bluefin Analytics",
    location: "San Diego, CA",
    span: "2018-2021",
    roles: [
      {
        title: "Senior Software Engineer",
        span: "2019-2021",
        bullets: [
          "Placeholder: owned the Python API behind the customer dashboard.",
          "Placeholder: cut p99 latency by 70 % with query and cache work.",
          "Placeholder: ran the on-call rotation and its postmortems.",
        ],
      },
      {
        title: "Software Engineer II",
        span: "2018-2019",
        bullets: [
          "Placeholder: shipped the first React front end for the reports product.",
          "Placeholder: added typed API clients generated from OpenAPI.",
        ],
      },
    ],
  },
  {
    id: "kestrel",
    tab: "KESTREL",
    name: "Kestrel Labs",
    location: "Austin, TX",
    span: "2014-2018",
    roles: [
      {
        title: "Software Engineer",
        span: "2016-2018",
        bullets: [
          "Placeholder: wrote the flight-data ingest service in Go.",
          "Placeholder: moved CI from a shared server to containers.",
        ],
      },
      {
        title: "Junior Software Engineer",
        span: "2015-2016",
        bullets: [
          "Placeholder: built internal tools for the test team.",
          "Placeholder: fixed 200 bugs in the legacy reporting code.",
        ],
      },
      {
        title: "Software Intern",
        span: "2014",
        bullets: ["Placeholder: automated the nightly regression suite."],
      },
    ],
  },
  {
    id: "harbor",
    tab: "HARBOR",
    name: "Harbor Digital",
    location: "Portland, OR",
    span: "2012-2014",
    roles: [
      {
        title: "Web Developer",
        span: "2013-2014",
        bullets: [
          "Placeholder: built client sites in PHP and JavaScript.",
          "Placeholder: set up the first shared Git workflow.",
        ],
      },
      {
        title: "IT Technician",
        span: "2012-2013",
        bullets: ["Placeholder: ran the office network and backups."],
      },
    ],
  },
];
