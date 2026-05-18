import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de Playwright para pruebas E2E.
 *
 * Asume que el dev server local corre en :3000 con Postgres en docker y la BD
 * sembrada con `npm run db:seed`. Si no está corriendo, Playwright lo arranca
 * automáticamente.
 *
 * Para correr:
 *   1. `npx playwright install chromium` (solo primera vez — descarga ~120 MB)
 *   2. `npm run test:e2e` o `npm run test:e2e:ui` para modo interactivo
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // tests comparten BD; serializar para evitar conflictos
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "es-PE",
    timezoneId: "America/Lima",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
