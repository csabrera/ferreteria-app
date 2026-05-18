import { expect, test } from "@playwright/test";

/**
 * E2E del flujo completo de venta del POS.
 *
 * Pre-requisitos (NO automatizados todavía):
 *   1. BD limpia con `npm run db:reset` y luego `npm run db:seed`
 *   2. Un usuario VENDOR creado manualmente desde `/admin/usuarios` o por
 *      seed extendido para tests. Variables abajo deben actualizarse al
 *      correr en una BD distinta a la de desarrollo del autor.
 *   3. Al menos un producto con stock en la sucursal del vendor.
 *
 * Estado: SKIPPED por defecto. Habilitar (`test` en vez de `test.skip`) cuando
 * el seed para tests esté listo (planeado para F2 — ver README §Tests).
 */

const VENDOR_DOC = "47039105"; // debe existir en BD; tampoco depender del DNI específico en F2
const VENDOR_PASSWORD = "47039105";
const PRODUCT_NAME = "cement"; // substring para search

test.describe("Flujo de venta end-to-end", () => {
  test.skip("login → abrir caja → vender → cerrar caja", async ({ page }) => {
    // 1) Login como vendor
    await page.goto("/login");
    await page.getByLabel(/número de documento/i).fill(VENDOR_DOC);
    await page.getByLabel(/contraseña/i).fill(VENDOR_PASSWORD);
    await page.getByRole("button", { name: /iniciar sesi/i }).click();

    // 2) Vendor sin caja → redirige a /caja/abrir
    await expect(page).toHaveURL(/\/caja\/abrir/);

    // 3) Abrir caja con S/.50
    await page.getByLabel(/monto inicial/i).fill("50");
    await page.getByRole("button", { name: /abrir caja/i }).click();
    await expect(page).toHaveURL(/\/caja\/movimientos/);

    // 4) Ir al POS
    await page.goto("/pos");
    await expect(page.getByRole("heading", { name: /punto de venta/i })).toBeVisible();

    // 5) Buscar producto y agregar al carrito
    const search = page.getByPlaceholder(/escanear código o buscar/i);
    await search.fill(PRODUCT_NAME);
    await page.waitForTimeout(300); // debounce
    await page.locator("ul li button").first().click();

    // 6) Cobrar con F4
    await page.keyboard.press("F4");
    await expect(page.getByText(/total a cobrar/i)).toBeVisible();

    // 7) Pagar efectivo exacto
    const totalText = await page
      .locator(".font-mono.text-primary")
      .first()
      .innerText();
    const total = parseFloat(totalText.replace(/[^\d.]/g, ""));
    await page.getByLabel(/monto recibido/i).fill(String(total));
    await page.getByRole("button", { name: /confirmar venta/i }).click();

    // 8) Toast de éxito + carrito limpio
    await expect(page.getByText(/venta v-/i)).toBeVisible();
    await expect(page.getByText(/escaneá o buscá/i)).toBeVisible(); // empty cart

    // 9) Ver /ventas
    await page.goto("/ventas");
    await expect(page.getByText(/v-/i).first()).toBeVisible();

    // 10) Cerrar caja
    await page.goto("/caja/cerrar");
    const expected = await page
      .locator("text=/saldo esperado/i")
      .locator("..")
      .innerText();
    const expectedNum = parseFloat(expected.replace(/[^\d.]/g, ""));
    await page.getByLabel(/monto contado/i).fill(String(expectedNum));
    await page.getByRole("button", { name: /cerrar caja/i }).click();
    await expect(page).toHaveURL(/\/pos|\/caja\/abrir/);
  });
});
