import { defineConfig, devices } from "@playwright/test";
import { TUTORIAL_DONE, TUTORIAL_STORAGE_KEY } from "./src/ddi/tutorial/state";
import {
  ADMIN_PASSWORD_HASH,
  API_DATA_DIR,
  API_PORT,
  API_URL,
  BASE_URL,
  PORT,
  REVALIDATE_SECRET,
} from "./e2e/stack";

// Runs against a production build (static pages, no dev-only remounts) and the API on a fresh database. `make e2e`
// runs it.
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
      testIgnore: /admin\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      // The admin tests change the stored content, so they run after every test that reads the seed content.
      name: "admin",
      testMatch: /admin\.spec\.ts/,
      dependencies: ["chromium"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: `rm -rf "${API_DATA_DIR}" && cd ../api/src && uv run --frozen uvicorn main:app --host 127.0.0.1 --port ${API_PORT}`,
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        STORAGE_DATA_DIR: API_DATA_DIR,
        ADMIN_AUTH_PASSWORD_HASH: ADMIN_PASSWORD_HASH,
        REVALIDATE_URL: `${BASE_URL}/revalidate`,
        REVALIDATE_SECRET,
      },
    },
    {
      command: `npm run build && npm run start -- --port ${PORT}`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        API_INTERNAL_URL: API_URL,
        REVALIDATE_SECRET,
      },
    },
  ],
});
