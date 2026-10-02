import { describe, expect, it } from "vitest";
import { adaptSiteContent, type ApiSiteContent } from "./adapt";
import { SNAPSHOT } from "./snapshot";
import { BIT_ITEM_KEYS, SERVER_METRICS } from "./types";

function withProjectStation(station: number): ApiSiteContent {
  const [first, ...rest] = SNAPSHOT.projects.projects;
  return {
    ...SNAPSHOT,
    projects: {
      ...SNAPSHOT.projects,
      projects: [{ ...first, station }, ...rest],
    },
  };
}

describe("adaptSiteContent", () => {
  it("unwraps the list sections the API stores in an object", () => {
    const content = adaptSiteContent(SNAPSHOT);

    expect(content.employers).toEqual(SNAPSHOT.work.employers);
    expect(content.links).toEqual(SNAPSHOT.links.links);
    expect(content.projects.categories).toEqual(SNAPSHOT.projects.categories);
    expect(content.projects.projects).toEqual(SNAPSHOT.projects.projects);
  });

  it("passes the other sections through unchanged", () => {
    const content = adaptSiteContent(SNAPSHOT);

    expect(content.profile).toEqual(SNAPSHOT.profile);
    expect(content.resume).toEqual(SNAPSHOT.resume);
    expect(content.contact).toEqual(SNAPSHOT.contact);
    expect(content.fcs).toEqual(SNAPSHOT.fcs);
    expect(content.radar).toEqual(SNAPSHOT.radar);
  });

  it("keys the BIT checks and the server readings by their known names", () => {
    const content = adaptSiteContent(SNAPSHOT);

    expect(Object.keys(content.bit.checks).sort()).toEqual(
      [...BIT_ITEM_KEYS].sort(),
    );
    for (const host of content.server.baseline.hosts) {
      expect(Object.keys(host).sort()).toEqual([...SERVER_METRICS].sort());
    }
  });

  it("rejects a station the wing does not have", () => {
    expect(() => adaptSiteContent(withProjectStation(10))).toThrow(
      /station is 10/,
    );
  });

  it("rejects a BIT check the page cannot place", () => {
    const content: ApiSiteContent = {
      ...SNAPSHOT,
      bit: {
        ...SNAPSHOT.bit,
        checks: {
          ...SNAPSHOT.bit.checks,
          XYZ: { name: "X", status: "GO", afterTest: "GO" },
        },
      },
    };

    expect(() => adaptSiteContent(content)).toThrow(/unknown keys: XYZ/);
  });

  it("rejects host readings that miss a metric", () => {
    const [left, right] = SNAPSHOT.server.baseline.hosts;
    const withoutCpu = Object.fromEntries(
      Object.entries(left).filter(([metric]) => metric !== "cpu"),
    );
    const content: ApiSiteContent = {
      ...SNAPSHOT,
      server: {
        ...SNAPSHOT.server,
        baseline: { hosts: [withoutCpu, right] },
      },
    };

    expect(() => adaptSiteContent(content)).toThrow(/missing cpu/);
  });
});
