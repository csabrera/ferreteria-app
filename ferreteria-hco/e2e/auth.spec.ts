import { expect, test } from "@playwright/test";

const ADMIN_DOC = "12345678";
const ADMIN_PASSWORD = "12345678"; // del seed; cambiar si se modificó

test.describe("Autenticación", () => {
  test("rutas protegidas redirigen a /login sin sesión", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /iniciar sesi/i }),
    ).toBeVisible();
  });

  test("login admin con credenciales seed → /dashboard", async ({ page }) => {
    await page.goto("/login");

    // Form de login: tipo doc (DNI default) + número + password
    await page.getByLabel(/número de documento/i).fill(ADMIN_DOC);
    await page.getByLabel(/contraseña/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /iniciar sesi/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();
  });

  test("login con DNI inválido (7 dígitos) falla", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/número de documento/i).fill("1234567");
    await page.getByLabel(/contraseña/i).fill("xxxxxxxx");
    await page.getByRole("button", { name: /iniciar sesi/i }).click();

    // Sigue en /login con error
    await expect(page).toHaveURL(/\/login/);
  });
});
