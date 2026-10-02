import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ApiSiteContent } from "./adapt";
import { withDrafts } from "./drafts";
import { SNAPSHOT } from "./snapshot";

const headers = vi.hoisted(() => ({
  draftEnabled: false,
  session: null as string | null,
}));

vi.mock("next/headers", () => ({
  draftMode: async () => ({ isEnabled: headers.draftEnabled }),
  cookies: async () => ({
    get: (name: string) =>
      name === "pw_admin_session" && headers.session !== null
        ? { name, value: headers.session }
        : undefined,
  }),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (load: () => Promise<boolean>) => load,
}));

const { getPreviewState, getSiteContent } = await import("./source");

const DRAFT_PROFILE = { ...SNAPSHOT.profile, bio: "A DRAFT BIO" };
const DRAFTS = {
  profile: { content: DRAFT_PROFILE, updatedAt: "2026-10-02T00:00:00Z" },
};

interface Call {
  url: string;
  init: RequestInit | undefined;
}

let calls: Call[] = [];

function stubApi(draftsStatus: number): void {
  vi.stubGlobal(
    "fetch",
    async (url: string, init?: RequestInit): Promise<Response> => {
      calls.push({ url, init });
      if (url.endsWith("/api/content")) {
        return Response.json(SNAPSHOT);
      }
      if (url.endsWith("/api/admin/drafts")) {
        return draftsStatus === 200
          ? Response.json(DRAFTS)
          : Response.json({ detail: "NOT_AUTHENTICATED" }, { status: 401 });
      }
      throw new Error(`unexpected fetch ${url}`);
    },
  );
}

beforeEach(() => {
  calls = [];
  headers.draftEnabled = false;
  headers.session = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("withDrafts", () => {
  test("uses each section's draft where it has one, else the published document", () => {
    const merged: ApiSiteContent = withDrafts(SNAPSHOT, DRAFTS);
    expect(merged.profile.bio).toBe("A DRAFT BIO");
    expect(merged.work).toBe(SNAPSHOT.work);
    expect(merged.projects).toBe(SNAPSHOT.projects);
  });

  test("with no drafts it is the published content", () => {
    expect(withDrafts(SNAPSHOT, {})).toEqual(SNAPSHOT);
  });
});

describe("the content accessors", () => {
  test("outside draft mode they read the published content, cached, and never the drafts", async () => {
    stubApi(200);
    headers.session = "token";

    expect((await getSiteContent()).profile.bio).toBe(SNAPSHOT.profile.bio);
    expect(await getPreviewState()).toBeNull();
    expect(calls.every((call) => !call.url.includes("/admin/"))).toBe(true);
    expect(calls[0].init?.cache).toBe("force-cache");
  });

  test("in draft mode with a session they read the drafts, uncached, with only the session cookie", async () => {
    stubApi(200);
    headers.draftEnabled = true;
    headers.session = "token";

    expect((await getSiteContent()).profile.bio).toBe("A DRAFT BIO");
    expect(await getPreviewState()).toBe("draft");
    const draftsCall = calls.find((call) =>
      call.url.endsWith("/api/admin/drafts"),
    );
    expect(draftsCall?.init?.cache).toBe("no-store");
    expect(new Headers(draftsCall?.init?.headers).get("Cookie")).toBe(
      "pw_admin_session=token",
    );
    expect(calls.every((call) => call.init?.cache === "no-store")).toBe(true);
  });

  test("in draft mode with an expired session they show the published content, reported as signed out", async () => {
    stubApi(401);
    headers.draftEnabled = true;
    headers.session = "expired";

    expect((await getSiteContent()).profile.bio).toBe(SNAPSHOT.profile.bio);
    expect(await getPreviewState()).toBe("signed-out");
  });

  test("in draft mode without a session cookie they do not ask for drafts", async () => {
    stubApi(200);
    headers.draftEnabled = true;

    expect(await getPreviewState()).toBe("signed-out");
    expect(calls.map((call) => call.url)).toEqual([
      expect.stringMatching(/\/api\/content$/),
    ]);
  });

  test("in draft mode an API failure fails the render instead of showing other content", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });
    headers.draftEnabled = true;
    headers.session = "token";

    await expect(getSiteContent()).rejects.toThrow("fetch failed");
  });
});
