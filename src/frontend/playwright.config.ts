import { defineConfig, devices } from "@playwright/test";
import { TUTORIAL_DONE, TUTORIAL_STORAGE_KEY } from "./src/ddi/tutorial/state";

// Override with E2E_PORT when several checkouts run e2e at once, so none reuses another's server.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

// Runs against a production build: static pages, no dev-only remounts. `make e2e` runs it.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1920, height: 1080 },
    // Every test starts as a returning visitor, so the first-visit tutorial stays shut. tutorial.spec.ts opts in.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [{ name: TUTORIAL_STORAGE_KEY, value: TUTORIAL_DONE }],
        },
      ],
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
