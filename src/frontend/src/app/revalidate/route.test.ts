import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const SECRET = "test-revalidate-secret";

function call(authorization: string | null, body: unknown): Promise<Response> {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (authorization !== null) {
    headers.set("Authorization", authorization);
  }
  return POST(
    new Request("http://localhost/revalidate", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /revalidate", () => {
  beforeEach(() => {
    vi.stubEnv("REVALIDATE_SECRET", SECRET);
    revalidatePath.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("revalidates each path and the homepage group with the right token", async () => {
    const response = await call(`Bearer ${SECRET}`, { paths: ["/about"] });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      revalidated: ["/about", "/(home)"],
    });
    expect(revalidatePath.mock.calls).toEqual([
      ["/about"],
      ["/(home)", "layout"],
    ]);
  });

  it.each([
    ["a wrong token", "Bearer wrong"],
    ["a token without the scheme", SECRET],
    ["no header", null],
  ])("answers 401 to %s and revalidates nothing", async (_, header) => {
    const response = await call(header, { paths: ["/about"] });

    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each([
    ["no paths", {}],
    ["a path that is not a site path", { paths: ["about"] }],
    ["paths that are not strings", { paths: [1] }],
  ])("answers 400 to %s", async (_, body) => {
    const response = await call(`Bearer ${SECRET}`, body);

    expect(response.status).toBe(400);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("fails loudly when the secret is not configured", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");

    await expect(call("Bearer ", { paths: ["/about"] })).rejects.toThrow(
      /REVALIDATE_SECRET/,
    );
  });
});
