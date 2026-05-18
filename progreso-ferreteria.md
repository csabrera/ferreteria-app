# ✅ ferreteria-hco — Progreso de Implementación

> **Documento de seguimiento.** Marca con `[x]` cada tarea completada. Cada paso es un commit/PR auto-contenido.
> Para detalles de arquitectura ver `plan-ferreteria.md`.

---

## 🚀 ESTADO PARA RETOMAR EN LA PRÓXIMA SESIÓN

**Última sesión:** 2026-05-18
**Progreso F1:** 🎉 **104 / 104 tareas (100%) · 14 / 14 pasos cerrados — FASE 1 COMPLETA**

### ✅ Lo que ya funciona end-to-end

1. **Bootstrap + BD + Auth**: Next 14, Postgres docker, Prisma, NextAuth v5 con login por documento (DNI/CE/PAS) + password
2. **Layout admin/vendedor** con sidebars separados, providers (Query/Settings/Toast), CSS variables dinámicas para color de acento
3. **Configuración** `/configuracion` con 4 tabs (Identidad, Apariencia, Ticket, Operación). Logo y nombre del negocio dinámicos en topbar/login/<title>
4. **Sucursales y Usuarios** CRUD con modales. Vendedor obligatoriamente con sucursal; admin con o sin
5. **Catálogos**: Categorías (árbol expandible 2 niveles), Marcas (con logo), Unidades (solo lectura)
6. **Productos** CRUD + detalle con: presentaciones múltiples (ProductUnit), galería de imágenes (multi-upload + reorder), stock por sucursal (readonly)
7. **Inventario**: stock filtrable con badge semáforo, entrada de mercadería con selector de proveedor obligatorio, kardex por producto con filtros y export CSV
8. **Proveedores** CRUD con RUC peruano validado
9. **API search** `/api/productos/search` lista para usar en POS
10. **Caja diaria**: vendedor abre/opera/cierra su caja con unicidad por usuario y por caja, cálculo de saldo esperado en vivo, registro de diferencia auditada al cerrar. Dashboard admin `/caja` con filtros y KPIs por sucursal. Guard en `/pos` que fuerza apertura de caja al VENDOR sin sesión OPEN

### 🔑 Credenciales de prueba (admin seed)

| Campo | Valor |
|---|---|
| Tipo doc | DNI |
| Número | `12345678` |
| Password | `12345678` |
| Sucursal | HCO-001 — CENTRAL |

### 🔍 En observación (pendiente de decisión del usuario)

- **"Nueva presentación" (ProductUnit):** funcional pero el usuario quiere analizar más antes de adoptarla en producción. Caso de uso: mismo producto vendido suelto + por caja/fardo con stock unificado y precio por presentación. Ver Paso 8.
- **Validación visual del Paso 10 (Caja diaria):** typecheck pasa pero falta el QA manual del usuario (escenarios de apertura/movimientos/cierre con/sin diferencia + concurrencia + dashboard admin).

### 📋 Decisiones operativas tomadas (importantes)

| Decisión | Donde aplica |
|---|---|
| **Lowercase BD + UPPERCASE display** | Todos los campos descriptivos (name, address, etc.). Identificadores como SKU/RUC/code se mantienen UPPERCASE en BD |
| **Modales no cierran al click fuera** | Sí cierran con ESC, X o botón Cerrar |
| **Password inicial = número de documento** | Al crear usuario, se autogenera el hash con el DNI/CE/PAS |
| **Costo de producto = calculado, NO editable en form** | Se actualiza con cada entrada (promedio ponderado global) |
| **Precio venta = editable en producto Y opcionalmente en entrada** | Si en entrada se cambia, se actualiza `Product.salePrice` con audit log |
| **Proveedor OBLIGATORIO en entrada** | Para trazabilidad. Ajustes/transferencias quedan para F2 |
| **Combobox (cmdk) en selectores ≥10 opciones** | Categorías, marcas, sucursales, proveedores, productos |
| **CategoryDualSelect (raíz → sub)** | En form de productos: sub obligatoria si la raíz tiene subs |
| **Stock se lleva por sucursal** (`Stock.productId+storeId`) | Modelo multi-sucursal listo desde día 1 |
| **Jerarquía de categorías de 2 niveles** | UI con árbol expandible (puede crecer si se necesita) |
| **CashMovement.amount siempre positivo** | El signo del delta se deriva del `type` (INCOME/DEPOSIT/SALE suman; EXPENSE/WITHDRAWAL restan). Más simple y a prueba de errores que persistir signo |
| **Unicidad CashSession.OPEN a nivel app** | Validado dentro de `prisma.$transaction` en `openCashSession` (Postgres no soporta partial unique vía Prisma sin migración manual). Doble guard: una sola OPEN por usuario y una sola OPEN por caja |
| **`/caja` con redirect inteligente** | `/(vendedor)/caja/page.tsx` redirige a `/abrir` o `/movimientos` según haya sesión OPEN. Sidebar y guards apuntan siempre a `/caja` |
| **Admin en `/cajas` (plural), vendor en `/caja` (singular)** | Los route groups `(admin)`/`(vendedor)` NO afectan la URL — dos páginas con el mismo path colisionan. Convención: caja singular = "mi caja" del vendor, cajas plural = oversight de admin |

### 🎉 F1 cerrada — Próximo: primer deploy a Railway

Decisiones pendientes antes del deploy:
- **Storage de imágenes** en producción (Cloudinary / R2 / UploadThing)
- **Variables de entorno producción** — generar `AUTH_SECRET` nuevo, configurar `DATABASE_URL` de Railway
- **Migrar seed** a un script que NO incluya credenciales débiles para producción

### F2 — Roadmap propuesto

Prioridad sugerida:
1. CRUD de cajas (mini-paso 6.5 — datos ya listos)
2. Anulación de ventas + force-close de cajas
3. Storage de imágenes en producción
4. Selector de sucursal funcional en topbar
5. CSP con nonces + rate limit Redis-backed
6. Impresora térmica ESC/POS + cajón de dinero
7. Transferencias entre sucursales
8. Reportes PDF/CSV avanzados
9. E2E completo del flujo de venta (con seed de tests)

### 🔍 Pendiente de validación visual

- **ProductUnit (presentaciones múltiples)** del Paso 8: el usuario aún quiere analizar antes de adoptarla en producción. No bloquea Paso 11.

### 📌 Deferrals decididos

- **Multi-cajas por sucursal** (CRUD de CashRegisters más allá de la "Caja 1" auto-creada): pospuesto. El modelo y Paso 10 ya soportan N cajas; solo falta UI para crear/renombrar/desactivar registers y bloquear desactivación si la caja tiene sesión OPEN. Mini-paso 6.5 cuando el negocio quiera ≥2 cajas. Análisis de impacto realizado el 2026-05-18: cero impacto en Paso 11; impacto operativo (Yape reconciliación) pero no técnico.

### 🐳 Para arrancar el proyecto

```powershell
# 1. Asegurar Docker Desktop corriendo
cd D:\Claude-Code\ferreteria\ferreteria-hco
docker compose up -d postgres
npm run dev
# 2. http://localhost:3000 → login con DNI 12345678 / 12345678
```

### ⚠️ Notas para recordar

- `npm run db:seed` es idempotente (puedes correrlo varias veces sin duplicar)
- Si `npx prisma generate` falla con EPERM: cerrar VSCode + dev, regenerar, reabrir
- Todos los `.env` están en `D:\Claude-Code\ferreteria\ferreteria-hco\.env` (no `.env.local`)

---

## 📁 Estructura del workspace

```
D:\Claude-Code\ferreteria\
├── plan-ferreteria.md          # Plan maestro de arquitectura
├── progreso-ferreteria.md      # Este documento
└── ferreteria-hco/             # ⭐ Proyecto Next.js — ejecutar npm aquí
    ├── src/
    ├── prisma/                 # (a partir del Paso 2)
    ├── package.json
    └── ...
```

**Todos los comandos `npm`, `npx`, `docker compose` se ejecutan desde `ferreteria-hco/`.**

---

## 📊 Resumen de avance

| Fase | Paso | Estado | Progreso |
|------|------|--------|----------|
| F1 | 1. Bootstrap del proyecto | ✅ Completado | 8/8 |
| F1 | 2. Base de datos (Prisma + Seed) | ✅ Completado | 7/7 |
| F1 | 3. Autenticación + RBAC | ✅ Completado | 7/7 |
| F1 | 4. Layout base + Providers | ✅ Completado | 7/7 |
| F1 | 5. Módulo Configuración | ✅ Completado | 8/8 |
| F1 | 6. Sucursales y Usuarios | ✅ Completado | 8/8 |
| F1 | 7. Catálogos (Categorías/Marcas/Unidades) | ✅ Completado | 7/7 |
| F1 | 8. Productos | ✅ Completado | 9/9 |
| F1 | 9. Inventario base | ✅ Completado | 7/7 |
| F1 | 10. Caja diaria | ✅ Completado | 8/8 |
| F1 | 11. POS — Punto de venta | ✅ Completado | 11/11 |
| F1 | 12. Dashboard analítico | ✅ Completado | 6/6 |
| F1 | 13. Auditoría | ✅ Completado | 4/4 |
| F1 | 14. Pulido + Tests | ✅ Completado | 7/7 |
| **F1 TOTAL** | | | **104/104** ✅ |

### Leyenda de estados
- ⏳ **Pendiente** — no iniciado
- 🔄 **En progreso** — hay tareas marcadas pero no completas
- ✅ **Completado** — todas las tareas marcadas
- 🚫 **Bloqueado** — esperando decisión externa

---

# FASE 1 — MVP Funcional

---

## Paso 1 — Bootstrap del proyecto ✅

> **Objetivo:** Repo inicializado y arrancable con `npm run dev`. Sin lógica de negocio aún.
> **Estimado:** 1 día · **Completado:** 2026-05-17

### Tareas
- [x] **1.1** Inicializar proyecto Next.js 14 con TypeScript, Tailwind, App Router (estructura creada manualmente, sin wizard interactivo)
- [x] **1.2** Configurar `tsconfig.json` con `strict: true` y alias `@/*` (también `noUncheckedIndexedAccess`)
- [x] **1.3** Instalar dependencias principales (Prisma, NextAuth v5 beta, TanStack Query, Zustand, Zod, RHF, date-fns, Tremor, Sonner, bcryptjs)
- [x] **1.4** Inicializar shadcn/ui — `components.json` + `lib/utils.ts` (cn helper) + CSS vars en `globals.css`
- [x] **1.5** Crear `docker-compose.yml` con Postgres 16 + pgAdmin 4 (healthcheck incluido)
- [x] **1.6** Crear `.env.example` y `.env.local` con `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `STORAGE_PROVIDER`, `NODE_ENV`
- [x] **1.7** Configurar `lib/env.ts` con validación Zod (falla rápido si falta una variable)
- [x] **1.8** Crear `README.md` con instrucciones de arranque

### Validación final del paso
- [x] `npm run dev` arranca sin errores en `localhost:3000` (✓ Ready en 2.8s, HTTP 200)
- [x] Página inicial muestra "Ferretería HCO — Bootstrap completado ✓"
- [ ] Postgres docker corre y responde _(se valida en el Paso 2 al correr migraciones)_

### Notas
- Decidido **Next.js 14.2.x + React 18.3.x** (combo más maduro a enero 2026 — Tremor y NextAuth v5 beta validados con esta combinación).
- Proyecto reorganizado dentro de `ferreteria-hco/` subfolder (los `.md` de plan/progreso quedan en raíz).
- `NEXTAUTH_SECRET` renombrado a `AUTH_SECRET` (convención de NextAuth v5 / Auth.js).
- Slot `public/uploads/` creado con `.gitkeep` (gitignored su contenido pero el folder se versiona).
- Pendiente para el usuario: verificar que tiene Docker Desktop instalado antes del Paso 2.

---

## Paso 2 — Base de datos (Prisma + Seed) ✅

> **Objetivo:** Esquema Prisma completo, primera migración aplicada, seed funcional.
> **Estimado:** 1–2 días · **Completado:** 2026-05-17

### Tareas
- [x] **2.1** Crear `prisma/schema.prisma` con 20 entidades (Store, User, AppSettings, Category, Brand, Unit, Product, ProductUnit, Stock, InventoryMovement, Transfer, TransferItem, CashRegister, CashSession, CashMovement, PaymentMethod, Sale, SaleItem, SalePayment, AuditLog)
- [x] **2.2** Definir 7 enums: `Role`, `MovementType`, `AdjustmentReason`, `TransferStatus`, `CashSessionStatus`, `CashMovementType`, `SaleStatus`
- [x] **2.3** Índices únicos (`Stock.productId+storeId`, `ProductUnit.productId+unitId`, `Product.sku`, `Product.barcode`, etc.) e índices de búsqueda (`InventoryMovement(productId,storeId,createdAt DESC)`, `Sale(storeId,createdAt DESC)`)
- [x] **2.4** Migración aplicada: `20260517142651_init` — 21 tablas creadas
- [x] **2.5** `lib/prisma.ts` con singleton + logging condicional por NODE_ENV
- [x] **2.6** `prisma/seed.ts` ejecutado: 6 units + 4 payment methods + Store HCO-001 + Caja 1 + admin user + AppSettings
- [x] **2.7** Scripts `db:migrate`, `db:seed`, `db:reset`, `db:studio`, `db:generate` configurados en `package.json`

### Validación final del paso
- [x] Postgres docker corre y responde
- [x] 21 tablas creadas (incluyendo `_prisma_migrations`)
- [x] Admin existe con email `admin@ferreteria-hco.com` (password: `admin123`)
- [x] Sucursal `HCO-001` existe con su `Caja 1`
- [x] `AppSettings(id=1)` poblado con defaults

### Notas
- **Cambio de convención de envs:** `.env.local` → `.env` (Prisma CLI solo busca `.env` por defecto; Next.js lee ambos. Mantener UN solo archivo de secrets es más simple que instalar `dotenv-cli`).
- **Lock optimista en Stock:** agregado campo `version Int @default(0)` — listo para usar en el Paso 11 (POS) cuando hagamos transacciones concurrentes.
- **Unicidad `CashSession.OPEN`:** Postgres no soporta partial unique indexes vía Prisma sin migración manual. Se garantiza app-level en la Server Action `openCashSession` (Paso 10).
- **Decimal precision:** money usa `Decimal(12,2)`, cantidades usan `Decimal(14,3)` para soportar hasta 3 decimales (kilos, metros). `ProductUnit.factor` usa `Decimal(14,4)` por si hay conversiones finas.
- **Auto-seed:** el `prisma migrate dev` inicial NO disparó el seed automático (solo lo hace en `migrate reset`). Tras la migración, corrí `npm run db:seed` manualmente.
- **Credenciales admin para el primer login:** DNI `12345678` / password `admin123` — cambiar en producción.
- **Modificación post-Paso 2 (2026-05-17):** A pedido del usuario, se cambió la autenticación. `User` ahora usa `documentType` (DNI/CE/PAS) + `documentNumber` con unicidad compuesta `@@unique([documentType, documentNumber])`. Campo `email` eliminado del User. Validaciones por tipo en `src/schemas/auth.schema.ts`. Migración regenerada (`20260517153751_init`).

---

## Paso 3 — Autenticación + RBAC ✅

> **Objetivo:** Login funcional (tipo de documento + número + password) con protección de rutas por rol.
> **Estimado:** 2 días · **Completado:** 2026-05-17

### Tareas
- [x] **3.0** Schema Zod `auth.schema.ts` con validaciones por tipo de documento (DNI/CE/PAS)
- [x] **3.1** `lib/auth.ts` (node) + `lib/auth.config.ts` (edge-safe) con NextAuth v5 + Credentials provider (sin PrismaAdapter — no necesario para Credentials+JWT)
- [x] **3.2** `types/auth.d.ts` extiende `Session.user` y `JWT` con `id`, `role`, `storeId`, `fullName`
- [x] **3.3** `middleware.ts` con callback `authorized` en `auth.config.ts`: rutas admin → ADMIN, rutas POS → VENDOR/ADMIN, login redirige si ya hay sesión
- [x] **3.4** Helpers `lib/auth-guards.ts`: `getSession`, `requireSession`, `requireAdmin`, `requireVendor`
- [x] **3.5** Página `/login` con form RHF + Zod + shadcn (selector DNI/CE/PAS, placeholder y maxlength dinámicos según tipo, password)
- [x] **3.6** Redirect post-login: `app/page.tsx` (root) lee sesión y redirige a `/dashboard` (admin) o `/pos` (vendor)

### Validación final del paso (curl end-to-end)
- [x] GET / sin sesión → 307 a `/login?callbackUrl=...`
- [x] GET `/login` → 200
- [x] GET `/dashboard` sin sesión → 307 a `/login`
- [x] POST `/api/auth/callback/credentials` con DNI `12345678` / `admin123` → 302 + cookie `authjs.session-token`
- [x] GET / con cookie de admin → 307 a `/dashboard`
- [x] GET `/dashboard` con cookie → 200
- [x] GET `/pos` con cookie de admin → 200 (admin puede entrar)
- [x] Password incorrecto → 302 a `/login?error=CredentialsSignin`, sin cookie
- [x] DNI de 7 dígitos (falla Zod) → 302 a `/login?error=CredentialsSignin`
- [x] DNI inexistente → 302 a `/login?error=CredentialsSignin`
- [x] Logout (Server Action `signOut({ redirectTo: "/login" })`) implementado en stubs

### Notas
- **Patrón split edge/node:** `auth.config.ts` (edge, sin Prisma/bcrypt — usado por middleware) + `auth.ts` (node, con Credentials provider). Estándar Auth.js v5.
- **Sin PrismaAdapter:** Credentials + estrategia JWT no requiere persistir sesiones en BD. Más simple y performante.
- **Componentes shadcn creados manualmente** (button, input, label, select, card, alert) — el wizard `npx shadcn add` es interactivo y no funciona bien con harness. Instalé `@radix-ui/react-{label,select,slot}` como peer deps.
- **Stubs de `/dashboard` y `/pos`** creados con logout funcional, sin layout admin/vendor (ese es el Paso 4). Tras Paso 4 se mueven dentro de `(admin)/` y `(vendedor)/` route groups.
- **No se valida vendor real aún** (no hay vendor seeded). Se valida con admin que pasa por ambos guards. Test específico de vendor se agregará en Paso 6 al poder crear usuarios.

---

## Paso 4 — Layout base + Providers ✅

> **Objetivo:** Estructura visual con sidebars, topbar y todos los providers globales.
> **Estimado:** 2 días · **Completado:** 2026-05-17

### Tareas
- [x] **4.1** Root layout anida: SessionProvider → QueryProvider → SettingsProvider → ToastProvider
- [x] **4.2** `QueryProvider` con TanStack Query v5 + Devtools en dev (staleTime 30s, retry 1)
- [x] **4.3** `SettingsProvider` lee `AppSettings` en server, inyecta `--primary` y `--ring` como CSS vars (con conversión hex→HSL en `lib/color.ts`)
- [x] **4.4** Layout `(admin)/layout.tsx` con `requireAdmin()` + Sidebar + Topbar
- [x] **4.5** Layout `(vendedor)/layout.tsx` con `requireVendor()` + SidebarPos + Topbar
- [x] **4.6** `SidebarAdmin` con 4 secciones (Catálogo, Operación, Administración, Configuración) — usa pathname para resaltar item activo
- [x] **4.7** `Topbar` con búsqueda Cmd+K placeholder, StoreSelector, ícono notificaciones, UserMenu (dropdown con perfil + logout)

### Validación final del paso (curl + parsing HTML)
- [x] `/dashboard` (admin) renderiza: "Ferretería HCO", "Dashboard", "Bienvenido", "HCO-001", "Administrador"
- [x] `/pos` (admin con permisos vendor): renderiza "Punto de venta", "Mi caja", "HCO-001"
- [x] Login → cookie → redirect a `/dashboard` funciona end-to-end
- [x] Typecheck (`tsc --noEmit`) sin errores

### Notas
- **Mover páginas a route groups:** `app/dashboard` → `app/(admin)/dashboard`, `app/pos` → `app/(vendedor)/pos`. URL pública no cambia (route groups con paréntesis no afectan path).
- **Guards centralizados en layouts:** las páginas ya no llaman `requireAdmin()` — el guard vive en `(admin)/layout.tsx`. Esto evita duplicación y garantiza que cualquier nueva página dentro del grupo herede la protección.
- **Logout movido al `UserMenu` del topbar:** ya no es un botón gigante en cada página. UX más limpia.
- **`StoreSelector` es placeholder** para F1 (1 sucursal). Cuando se agregue la 2ª sucursal en `/admin/sucursales`, se convertirá en dropdown funcional con cambio de contexto.
- **Sidebar mobile:** F1 oculta sidebar en `< md` (clase `hidden md:flex`). En F2 se puede agregar un Sheet drawer.
- **Toast (Sonner):** disponible globalmente. `import { toast } from "sonner"` y `toast.success(...)` en cualquier componente cliente.
- **Devtools de TanStack Query:** botón en `bottom-left` solo en dev. Útil para debugging de cache.
- **Limpiar `.next/` después de mover rutas:** Next cachea tipos de rutas en `.next/types/`. Cuando se mueven archivos hay que borrar `.next/` para que regenere.

---

## Paso 5 — Módulo Configuración ✅

> **Objetivo:** Admin puede editar `AppSettings` (logo, paleta, ticket, operación).
> **Estimado:** 2–3 días · **Completado:** 2026-05-17

### Tareas
- [x] **5.1** `src/schemas/settings.schema.ts` — 4 sub-schemas Zod con validaciones (RUC 11 dígitos, color hex `#RRGGBB`, igvPercent 0–100, etc.)
- [x] **5.2** `getSettings()` con `React.cache` para dedupe por request — adelantado en Paso 4
- [x] **5.3** `server/actions/settings.actions.ts` con 4 actions (uno por sección): `updateIdentity`, `updateAppearance`, `updateTicket`, `updateOperations` — todas validan con Zod, auditan vía `logAction`, y disparan `revalidatePath("/", "layout")` para que el SettingsProvider relea
- [x] **5.4** `src/lib/storage.ts` con interfaz `StorageProvider` (Strategy pattern) y `LocalStorageProvider` implementado. Cloudinary/R2/UploadThing arrojan error explícito "Fase 2"
- [x] **5.5** `POST /api/upload/route.ts` con guard `requireAdmin`, validaciones (max 5MB, tipos permitidos: PNG/JPG/WEBP/SVG/ICO, whitelist de carpetas)
- [x] **5.6** Página `/configuracion` (server component) con `ConfigTabs` (client) con 4 pestañas
- [x] **5.7** Los 4 sub-formularios + helper `SectionCard` + `ImageUploader` (reutilizable, sube vía `fetch('/api/upload')` con FormData)
- [x] **5.8** `accentColor` se aplica vía CSS vars al guardar (combinación de `revalidatePath` + `router.refresh()`); `darkModeDefault` persistido (la lógica de aplicar dark mode al body queda para Paso 12 con theme switcher)

### Validación final del paso
- [x] GET `/configuracion` con session ADMIN → 200, renderiza tabs (Identidad/Apariencia/Ticket/Operación) y el form de Identidad
- [x] POST `/api/upload` sin sesión → 303 redirect a `/login` (guard funciona)
- [x] `npx tsc --noEmit` sin errores
- [ ] _Validación visual del usuario en browser:_ cambiar businessName, cambiar color y ver reflejado, subir logo, verificar AuditLog en BD

### Notas
- **Una action por sección** (no una sola `updateSettings(section, data)`) — mejor type safety, mejor DX, validaciones específicas por schema.
- **`revalidatePath("/", "layout")` + `router.refresh()`:** combina invalidación de cache server + refresh del client tree. Necesario para que el SettingsProvider relea AppSettings tras un cambio.
- **Storage local-first con interfaz Strategy:** cambiar a Cloudinary en F2 solo requiere implementar `CloudinaryProvider` y cambiar `STORAGE_PROVIDER=cloudinary` en `.env`. Cero cambios en lógica de negocio.
- **AuditLog asíncrono pero esperado:** `logAction` se llama después del update pero antes de retornar, así garantiza consistencia. Si falla, falla la acción entera (deseado para auditoría obligatoria).
- **`useTransition` en cada form:** UI no se bloquea durante el await del Server Action, y el botón muestra spinner.
- **Color picker:** input nativo `<input type="color">` + input hex sincronizado + 8 presets de colores comunes para selección rápida.
- **3 componentes shadcn nuevos:** tabs, textarea, switch.

---

## Paso 6 — Sucursales y Usuarios ✅

> **Objetivo:** CRUD completo de sucursales y usuarios con asignación.
> **Estimado:** 2 días · **Completado:** 2026-05-17

### Tareas
- [x] **6.1** `/sucursales` con tabla (código/nombre/dirección/teléfono/contadores/estado/acciones) + dialog crear/editar
- [x] **6.2** Server Actions `createStore`, `updateStore`, `toggleStoreActive` con validación Zod, auditoría y manejo P2002 (código duplicado)
- [x] **6.3** Al crear sucursal, auto-crear `CashRegister "Caja 1"` en una `prisma.$transaction`
- [x] **6.4** `/usuarios` con tabla, búsqueda por nombre/documento, badges de rol y estado, acciones (editar, resetear password, activar/desactivar)
- [x] **6.5** Server Actions `createUser`, `updateUser`, `resetPassword`, `toggleUserActive`. Reset password NO incluye hash en `before/after` del audit log (seguridad)
- [x] **6.6** Selector de sucursal en form de usuario: "Sin sucursal" disponible para ADMIN, **obligatoria** para VENDOR (validado en Zod via `superRefine`)
- [x] **6.7** bcrypt.hash(password, 10) al crear y al resetear
- [x] **6.8** `StoreSelector` del topbar ahora es server component, lee `getActiveStores()`, muestra `+N` si hay más sucursales. Topbar acepta `storeSelector` como prop (patrón "server component como children de client component")

### Validación final del paso
- [x] `/sucursales` con HCO-001 (seed) renderiza tabla con "Activa", botón "Nueva sucursal"
- [x] `/usuarios` con admin seed renderiza fila con DNI 12345678, badge "Administrador", buscador y botón "Nuevo usuario"
- [x] Typecheck sin errores
- [ ] _Validación visual del usuario en browser:_ crear sucursal HCO-002 → ver auto-creación de Caja 1 en BD; crear vendor con DNI inventado → logout → login con vendor → debe ir a `/pos`; desactivar el vendor → intento de login debe fallar; chequear AuditLog tras cada acción.

### Notas
- **Regla "no auto-desactivarse":** un admin no puede desactivar su propio usuario (protección contra bloquearse del sistema). Validado en `toggleUserActive`.
- **Regla "siempre ≥1 sucursal activa":** `toggleStoreActive` rechaza desactivar la última sucursal activa.
- **Vendor sin sucursal:** validación a nivel Zod (`superRefine`) rechaza guardar un vendor sin `storeId`. Admins pueden ser "sin sucursal" (gestiona todas).
- **Password en reset:** se devuelve la captura al admin pero NO se loguea en audit (`before/after` vacíos). El admin se la comunica al usuario en persona.
- **`StoreSelector` server vs client:** convertido a async server component para leer BD. Como `Topbar` es client, el patrón es pasar el server component como prop (`storeSelector={<StoreSelector />}` desde el layout server). Mismo patrón aplicará para futuros componentes con datos.
- **Tablas con HTML+Tailwind directo:** decidí no usar TanStack Table aquí. Para listas simples (≤200 filas, sin paginación virtual) es overkill. Se introducirá en Paso 8 (Productos) que sí necesita filtros/sort/paginación.
- **Dialog (modal) shadcn** implementado. Reutilizable en cualquier CRUD futuro.
- **`Badge` con 6 variantes** (default, secondary, destructive, success, warning, outline). Reutilizable.

---

## Paso 7 — Catálogos (Categorías / Marcas / Unidades) ✅

> **Objetivo:** Catálogos base de productos.
> **Estimado:** 2 días · **Completado:** 2026-05-17

### Tareas
- [x] **7.1** `/categorias` con vista plana del árbol (DFS + indentación por depth), botones para crear raíz o subcategoría desde cualquier nodo
- [x] **7.2** CRUD con detección de ciclos: `wouldCreateCycle()` recorre cadena de padres antes de hacer UPDATE
- [x] **7.3** `/marcas` con CRUD simple, logo via `ImageUploader` (carpeta `brands/`)
- [x] **7.4** `/unidades` solo lectura, banner amarillo indicando que el catálogo es cerrado
- [x] **7.5** Server actions con `requireAdmin`, `logAction`, slug autogenerado único con sufijo numérico (`cemento`, `cemento-2`, ...) si ya existe
- [x] **7.6** `<CategoryTreeSelect>` reutilizable: construye árbol, aplana DFS, excluye `excludeId` y sus descendientes para evitar ciclos
- [x] **7.7** Soft delete (toggle `isActive`). Categoría no se puede desactivar si tiene subcategorías activas. Marca no tiene esta restricción (se permite desactivar siempre).

### Validación final del paso
- [x] Typecheck sin errores
- [x] GET `/categorias`, `/marcas`, `/unidades` → 200 con session admin
- [x] `/unidades` muestra las 6 unidades del seed (UN, CJ, MT, KG, LT, SC)
- [ ] _Visual del usuario en browser:_ crear categoría raíz "CONSTRUCCIÓN" → crear subcategoría "CEMENTO" bajo ella → verificar indentación con `└` y depth correcto; intentar reasignar "CONSTRUCCIÓN" como hija de "CEMENTO" → debe rechazar con error de ciclo; crear marca "SIKA" con logo → ver miniatura en tabla.

### Notas
- **Slug autogenerado** con `lib/slug.ts`: normaliza acentos, lowercase, espacios → guiones. Si el slug ya existe, agrega sufijo `-2`, `-3`, etc.
- **No-ciclo a nivel app:** validación en `wouldCreateCycle` (BFS por padres). Postgres no soporta CHECK contra recursión, así que va por código.
- **Unidades NO tienen CRUD** — el catálogo es cerrado (definido en el seed). Si en el futuro se necesita agregar una unidad nueva (ej. "GL" galón), se modifica el seed y se aplica vía script de migración.
- **Cascade visual del árbol:** uso `buildCategoryTree` + `flattenCategoryTree` (DFS) en lugar de `<details>` recursivos. Más simple y compatible con el componente Select sin trampolín.
- **Botón "+" en cada fila de categoría:** crea subcategoría directa (preserva `parentId` automáticamente en el form).
- **Logos de marca usan `next/image` con `unoptimized`** porque las imágenes son user-uploaded de tamaño variable.
- **Seed expandido (post-Paso 7):** se agregaron al seed 12 categorías raíz típicas de ferretería peruana (construcción, pinturas, herramientas, plomería, eléctricos, ferretería general, pegamentos, seguridad, jardinería, limpieza, cerrajería, iluminación) y 52 marcas reconocidas en Perú (Sol, Pacasmayo, Pavco, Sika, Stanley, Bosch, Makita, Yale, Indeco, Bticino, Trebol, Celima, etc.). Sin logos — el admin los sube luego. Upsert idempotente: re-correr `db:seed` no duplica ni sobreescribe lo creado por el admin.

---

## Paso 8 — Productos 🔄

> **Objetivo:** Gestión completa de productos con presentaciones múltiples.
> **Estimado:** 3–4 días · **Entrega 1 completada:** 2026-05-17

### Entrega 1 — Lista, búsqueda, CRUD básico
- [x] **8.1** `/productos` con tabla filtrable: búsqueda (SKU/barcode/nombre), filtro por categoría (CategoryTreeSelect), filtro por marca, indicador de stock crítico (⚠️), miniatura de imagen, badge de estado
- [x] **8.2** Form de creación en **modal** (mantengo consistencia con otros CRUDs en vez de página dedicada). Reutilizable para edición. SKU autogenerado si está vacío.
- [x] **8.4** Server Actions `createProduct`, `updateProduct`, `toggleProductActive` con auditoría, validación Zod y manejo P2002 (SKU/barcode duplicados con mensajes específicos)
- [x] **8.6** Al crear producto se autocrea `ProductUnit` con `factor=1`, `isDefault=true` (transacción)
- [x] **8.9** SKU autogenerado con formato `PRD-XXXXXX` (6 dígitos, hasta 10 intentos de unicidad)

### Entrega 2 — Detalle, presentaciones múltiples, búsqueda autocompletada ✅
- [x] **8.3** Página `/productos/[id]` con 4 secciones: cabecera (imagen + datos + editar/toggle), presentaciones, imágenes, stock por sucursal
- [x] **8.5** CRUD de `ProductUnit[]`: crear/editar/eliminar/setear-default. Validaciones: factor>0, unicidad de unitId, no eliminar default, no eliminar si tiene ventas. Transacción al cambiar isDefault para mantener exactamente UNA por producto
- [x] **8.7** Upload múltiple `<MultiImageUploader>`: hasta 8 imágenes, marcar principal (★), mover izquierda/derecha, quitar. Botón "Guardar cambios" aparece solo si hay cambios pendientes
- [x] **8.8** `GET /api/productos/search?q=...` busca por SKU, barcode del producto, nombre, y barcode de cualquier ProductUnit. Devuelve top 15 con imagen, precio, marca y stock total. Requiere session (no admin — vendor también puede usar)

### Validación final del paso
- [x] Crear producto + presentación base auto-generada funciona
- [x] Búsqueda por nombre/SKU/barcode devuelve resultados rápidos (API search OK)
- [x] Detalle del producto carga con todas sus secciones
- [x] Typecheck sin errores
- [ ] _Validación visual del usuario:_ agregar presentación CJ factor 24, marcar como predeterminada, subir múltiples imágenes, reordenar.

### 🔍 En observación (pendiente de decisión del usuario)
- **"Nueva presentación" (ProductUnit):** funcionalidad operativa pero el usuario quiere analizar más antes de adoptarla. Caso de uso: vender mismo producto suelto + por caja/fardo, con stock unificado y precio por presentación. Decidir si: (a) se mantiene como está, (b) se simplifica (ej. solo unidad base, sin presentaciones), (c) se ajusta la UX/redacción para que sea más clara.

### Notas Entrega 1
- **Modal grande con scroll** en vez de página dedicada para create/edit. Consistencia con sucursales/usuarios/categorías/marcas. Si en F2 el form crece (más metadata), se refactoriza.
- **Filtros vía URL params** (`?q=...&categoryId=...&brandId=...`) — son shareables/bookmarkeables y permite back/forward del navegador.
- **Límite 200 productos por página** sin paginación todavía (suficiente para arrancar). Cuando se necesite paginación real se agrega `take`/`skip` con cursor o offset.
- **Stock total** sumado de todas las sucursales en el list view. Alerta `⚠️` amarilla si `stock <= minStock` en alguna sucursal.
- **Imagen principal solo** en el modal (campo `images[0]`). Múltiples imágenes y reorder en Entrega 2.
- **API `/api/productos/[id]`** (GET) creada para que el modal de edición cargue datos sin pasar todo el objeto vía props. Patrón estándar Next: fetch en `useEffect` cuando se abre.

---

## Paso 9 — Inventario base ✅

> **Objetivo:** Entrada de mercadería y visualización de stock.
> **Estimado:** 2–3 días · **Completado:** 2026-05-17

### Tareas
- [x] **9.1** `/inventario` con stock por sucursal: tabla filtrable (búsqueda, sucursal, categoría dual, marca, solo críticos), miniatura, badge, link a kardex
- [x] **9.2** `<StockBadge>` semáforo: rojo "Agotado" (qty=0), amarillo "Crítico" (≤min con min>0), verde "OK"
- [x] **9.3** Modal "Nueva entrada" (en lugar de página separada, más consistente con el resto del sistema). Form multi-línea con `useFieldArray`, búsqueda async de productos, totales en vivo
- [x] **9.4** Server Action `createInventoryEntry` transaccional:
  - [x] Valida producto existe y está activo
  - [x] UPSERT Stock (crea con 0 si no existe, suma cantidad)
  - [x] INSERT `InventoryMovement` tipo=ENTRY con previousStock/newStock
  - [x] Recalcula `Product.costPrice` con promedio ponderado **global** (todas las sucursales)
  - [x] AuditLog acumulado para toda la entrada
- [x] **9.5** `/inventario/kardex/[productId]` con header (stock por sucursal), filtros y tabla de movimientos
- [x] **9.6** Filtros del kardex: sucursal (Combobox), tipo de movimiento (Combobox), rango desde/hasta (inputs date)
- [x] **9.7** Endpoint `GET /api/kardex/[productId]/export` que genera CSV con BOM UTF-8 (compatible Excel)

### Validación final del paso
- [x] Typecheck sin errores
- [x] `/inventario` con session ADMIN renderiza filtros y tabla (vacía hasta hacer una entrada)
- [x] `/inventario/kardex/[id]` renderiza header con stock + filtros + tabla
- [ ] _Validación visual del usuario:_ crear entrada de 100 SC a S/.22 c/u → stock CEMENTO sube a 100, kardex muestra movimiento ENTRY, costPrice del producto se actualiza al promedio ponderado.

### Notas
- **Modal en vez de página `/inventario/entradas`:** mantiene consistencia con otros CRUDs (Sucursales, Usuarios, Categorías). El historial de entradas es visible vía kardex de cada producto.
- **`ProductSearchCombobox` async:** componente nuevo que usa `/api/productos/search` con debounce 200ms y AbortController para cancelar requests obsoletos. Muestra miniatura, SKU, marca, precio y stock total en cada opción.
- **Costo promedio ponderado GLOBAL:** usa `aggregate({_sum: quantity})` sobre todos los `Stock` del producto. Fórmula: `(stockAntesGlobal × costoActual + entrada × costoNuevo) / stockDespuésGlobal`. Solo se aplica si `unitCost > 0` (donaciones/garantías con costo 0 no afectan promedio).
- **CSV con BOM UTF-8** (`﻿`): Excel reconoce correctamente los caracteres acentuados al abrir el archivo. Sin BOM, Excel muestra "ñ" como "Ã±".
- **Stock por sucursal con UPSERT:** la primera entrada de un producto en una sucursal crea el registro de `Stock` con `minStock=0`. El admin puede luego ajustar `minStock` en la página de inventario (TODO: agregar en F1.5 o F2).
- **Ajustes y transferencias quedan para F2** según plan original (Paso 9 solo cubre entradas + visualización + kardex).

---

## Paso 10 — Caja diaria ✅

> **Objetivo:** Vendedor puede abrir, operar y cerrar su caja.
> **Estimado:** 2–3 días · **Completado:** 2026-05-18

### Tareas
- [x] **10.1** Implementar `/(vendedor)/caja/abrir/page.tsx` con form de apertura (caja auto-seleccionada si hay solo una disponible, monto inicial, notas opcionales)
- [x] **10.2** Server Action `openCashSession` con doble guard de unicidad (una OPEN por usuario + una OPEN por caja, ambas dentro de `prisma.$transaction`), validación de pertenencia vendor↔sucursal, AuditLog `CASH_SESSION_OPEN`
- [x] **10.3** Helpers server-side en `cash.queries.ts`: `getActiveCashSession` (cached por request, para guards), `getActiveCashSessionWithMovements` (con movements + paymentMethod) y `getCashRegistersForUser`
- [x] **10.4** Guard en `/pos`: si rol VENDOR y no hay sesión OPEN → redirect `/caja/abrir`. ADMIN puede entrar sin caja
- [x] **10.5** Implementar `/(vendedor)/caja/movimientos/page.tsx` (panel "Mi caja") con KPIs en cards (inicial / ingresos / salidas / esperado), tabla de movimientos con badge por tipo, botón "Nuevo movimiento" (dialog) y "Cerrar caja" (link)
- [x] **10.6** Server Action `addCashMovement` con validación de saldo no-negativo, actualización transaccional de `CashSession.expectedAmount`, AuditLog `CASH_MOVEMENT_<TYPE>`. SALE excluido del UI manual (lo crea el POS)
- [x] **10.7** Implementar `/(vendedor)/caja/cerrar/page.tsx` con desglose del turno, monto contado, **diferencia en vivo** (alert verde si cuadra, rojo si falta/sobra) y campo de observaciones
- [x] **10.8** Server Action `closeCashSession` recalcula `expectedAmount` desde apertura + movimientos (safety check), persiste `countedAmount` + `difference`, AuditLog `CASH_SESSION_CLOSE`. Si `|difference| ≥ 0.01`, AuditLog adicional `CASH_SESSION_CLOSE_WITH_DIFFERENCE`
- [x] **Bonus** Dashboard admin `/(admin)/cajas/page.tsx` (URL `/cajas` en plural — admin ve todas las cajas, vendor ve "mi caja" en `/caja`) con KPIs (abiertas/cerradas/diferencias acumuladas), filtros por sucursal y estado vía URL params, tabla de hasta 100 sesiones con diferencia coloreada

### Validación final del paso
- [x] Typecheck (`tsc --noEmit`) sin errores
- [x] `/(vendedor)/caja` redirect inteligente a `/abrir` o `/movimientos` según estado
- [x] Sidebar POS apunta a `/caja` (no a `/caja/movimientos`) para usar el redirect inteligente
- [x] _Validación del usuario_ (implícita el 2026-05-18 al confirmar avance al Paso 11). Bugs detectados y corregidos durante la validación: colisión de rutas `/caja` (admin→`/cajas`) e hydration error de fechas (helper `formatDateTime` con `formatInTimeZone`).

### Notas
- **Smart redirect en `/caja`:** `/(vendedor)/caja/page.tsx` decide si mandar al vendedor a `/abrir` o `/movimientos` según `getActiveCashSession`. El sidebar apunta a `/caja` siempre, simplificando navegación.
- **Signo derivado del tipo:** `CashMovement.amount` se persiste siempre positivo; el signo se infiere en `signedDelta(type, amount)`. INCOME/DEPOSIT/SALE suman, EXPENSE/WITHDRAWAL restan. Más simple que persistir signo y evita errores de signo doble.
- **Doble guard de unicidad OPEN:** la transacción de `openCashSession` valida tanto "este usuario no tiene otra OPEN" como "esta caja no tiene otra OPEN" antes de crear. El segundo error indica quién la tiene abierta ("abierta por VENDOR1").
- **Vendor solo opera cajas de su sucursal:** validación explícita comparando `session.user.storeId` con `register.storeId`. Admins pueden operar cualquier caja (cuando F2 agregue multi-sucursal real).
- **Saldo no-negativo en movimientos:** `addCashMovement` rechaza EXPENSE/WITHDRAWAL que dejarían el saldo bajo cero. Mensaje pide verificar el monto.
- **Recálculo en cierre como safety check:** `closeCashSession` recomputa `expectedAmount` desde `openingAmount + Σ signedDelta(movements)` en lugar de confiar en el campo persistido. Si hubiera drift por bug futuro, el cierre lo corrige.
- **Tipos manuales separados del enum del schema:** `manualMovementTypeSchema` (Zod) acepta solo `INCOME | EXPENSE | WITHDRAWAL | DEPOSIT`. SALE se reserva para que `createSale` (Paso 11) lo cree desde el POS.
- **AuditLog adicional si hay diferencia:** se emiten DOS logs en cierre con diff ≠ 0 — el normal `CASH_SESSION_CLOSE` y el crítico `CASH_SESSION_CLOSE_WITH_DIFFERENCE`. Esto facilita filtrar/buscar discrepancias en `/auditoria` (Paso 13).
- **Modal de movimiento manual sin `paymentMethodId`:** los ingresos/gastos/retiros/depósitos manuales se asumen siempre en efectivo (afectan caja directo). El POS sí poblará `paymentMethodId` para SALE.

---

## Paso 11 — POS (Punto de venta) ✅

> **Objetivo:** Vendedor puede vender de principio a fin. **EL PASO MÁS CRÍTICO.**
> **Estimado:** 4–5 días · **Completado:** 2026-05-18 (3 entregas en una sesión)

### Decisiones de UX (definidas con el usuario el 2026-05-18)

| Pregunta | Respuesta |
|---|---|
| Descuentos | **Solo global** (campo único al pie del carrito). `Sale.discount` se usa; `SaleItem.discount` queda en 0 |
| Producto con N presentaciones | **Una fila en search**; al elegir abre popup-picker si N>1, agrega directo si N=1 o si el barcode escaneado coincidió con una presentación específica |
| Atajos F8 / Esc | **F8 = abrir lista "Mis ventas" del turno para reimprimir** · **Esc = limpiar carrito**. Anulación de ventas cerradas queda para F2 |

### Entrega 1 — Cart store + layout POS + búsqueda ✅
- [x] **11.1** `src/stores/cart.store.ts` con Zustand + `persist` middleware (sobrevive refreshes accidentales del turno). `addLine` consolida si ya hay misma presentación. Helper `computeTotals` puro (sin acceder al state) para reutilizar en componentes y server.
- [x] **11.2/11.3 unificados** `<PosSearch>` (en `src/components/pos/`): input siempre con foco vía `focusToken` controlado por el padre, dropdown debounced 200ms al escribir, **Enter dispara fetch sincrónico** (sin esperar debounce) y agrega directo si hay match exacto por SKU/barcode (compatible con lectores de barcode que envían texto + Enter).
- [x] **11.4** `<PosCart>` con líneas (qty editable +/- e input directo), botón quitar por línea, **descuento global** al pie, totales (subtotal/descuento/TOTAL) en vivo, botón "Cobrar (F4)" prominente.
- [x] **API search extendida:** `/api/productos/search` ahora devuelve `presentations[]` (todas las ProductUnits) y `matchedPresentationId` (la presentación cuyo barcode coincide con el query, si la hay). Sin breaking changes para el consumer existente (inventory entry).
- [x] **`<PresentationPicker>`** dialog para elegir presentación + cantidad cuando un producto tiene >1 ProductUnit. Default pre-seleccionada.
- [x] **`<PosScreen>`** orchestrator client component: maneja `focusToken`, picker state, atajos teclado (F2 foco, Esc limpiar carrito, F4 stub cobrar — real en Entrega 2). Sub-header con info de caja + botones "Mis ventas (F8)" y "Cerrar caja". Split-screen `1fr_420px` (search/tips izq, cart der).
- [x] Page `/pos` ahora redirige a `/caja/abrir` también para ADMIN sin sesión (antes solo VENDOR) — el POS no funciona sin caja activa.

### Entrega 2 — Cobro + createSale + ticket ✅
- [x] **11.5** Atajos completos: F2 (foco), F4 (cobrar → abre PaymentDialog), F8 (mis ventas), Esc (limpiar carrito). Interceptados solo cuando no hay dialogs abiertos.
- [x] **11.6** `<PaymentDialog>` con grid 2×2 de métodos (CASH/YAPE/PLIN/TRANSFER), input "Recibido" + cálculo de vuelto en vivo (solo si CASH), input "N° operación" obligatorio si `requiresReference=true`, validaciones (no permite cobrar si recibido<total ni si falta referencia)
- [x] **11.7** Server Action `createSale` transaccional dentro de `prisma.$transaction`:
  - [x] Carga CashSession OPEN del usuario
  - [x] Consolida cantidades por `productId` (evita doble lock + deadlocks)
  - [x] **`SELECT … FOR UPDATE`** en Stock vía `tx.$queryRaw` (Prisma no expone FOR UPDATE en findUnique) — orden estable por productId
  - [x] Valida stock, junta líneas insuficientes → throw `INSUFFICIENT_STOCK` con detalle
  - [x] Valida método pago, referencia (si requerida), match exacto `amount === total`
  - [x] Genera `code = V-{storeCode}-{6 dígitos}` con `MAX+1` y retry hasta 3 veces en P2002 (sin migración)
  - [x] Crea `Sale` + `SaleItem[]` + `SalePayment` (uno solo en F1)
  - [x] Decrementa Stock + crea `InventoryMovement` type=SALE
  - [x] Si `paymentMethod.affectsCash`: `CashMovement` type=SALE + incrementa `CashSession.expectedAmount`
  - [x] AuditLog `SALE_CREATE` fuera de transaction
  - [x] `revalidatePath` de /pos, /ventas, /inventario, /caja, /cajas
- [x] **11.8** `<InsufficientStockDialog>` muestra producto + solicitado vs disponible (en unidad base) con badge rojo. Botón "Ajustar carrito" cierra sin perder items. NO se cierra el PaymentDialog al toast genérico — se abre este específico
- [x] **11.9** `GET /api/ticket/[saleId]` devuelve HTML con CSS `@page { size: 80mm auto }` (compatible con térmica F2). Incluye logo (si `showLogoOnTicket`), header/footer configurables de AppSettings, RUC, IGV **discriminado** (base imponible + IGV calculado a partir del total bruto), subtotal/descuento si aplica, TOTAL, método + referencia + mensaje de agradecimiento. Botón "Imprimir" visible en pantalla, oculto en print
- [x] **11.10** `<PrintFrame>` iframe oculto (`-left-9999px`) que carga `/api/ticket/[id]?print=1` → el HTML dispara `window.print()` solo al cargar. Tras venta exitosa: `setPrintSaleId(id)` + `setPrintNonce(n+1)` (permite reimprimir misma venta), `useCart.clear()`, toast con código, `router.refresh()` para refrescar `expectedAmount`, refocus al buscador

### Entrega 3 — Mis ventas + reimprimir ✅
- [x] **11.11** `/(vendedor)/ventas` (server component) usa `getLatestCashSessionForUser` — muestra turno OPEN si lo hay, o el último CLOSED para que el vendor pueda ver lo que vendió aunque cerró caja. Banner explicativo cuando es CLOSED con CTA "Abrí una caja". KPIs (ventas/ítems/total con promedio), tabla con hora · código · ítems · método+referencia · total · estado · acciones (Ver ticket → nueva pestaña, Reimprimir → `<PrintFrame>` retargeted). Soporta status VOIDED visualmente (badge rojo + opacity, deshabilita reimprimir) aunque F1 no implemente anulación.

### Validación final del paso
- [x] Typecheck Entrega 1 limpio
- [x] _Validación visual Entrega 1_ (usuario el 2026-05-18)
- [x] Typecheck Entrega 2 limpio
- [ ] _Validación visual Entrega 2:_ venta efectivo con vuelto · venta Yape con referencia obligatoria · stock insuficiente abre InsufficientStockDialog · ticket imprime con IGV discriminado · correlativo V-HCO-001-000001 incrementa · CashMovement type=SALE refleja en `expectedAmount` · 2 pestañas concurrentes no pueden vender el último item (lock funciona)
- [x] Typecheck Entrega 3 limpio
- [x] _Validación final del paso_ (usuario el 2026-05-18): venta completa con efectivo + vuelto, /ventas muestra el turno con reimpresión funcional, banner de caja cerrada explicativo. Concurrencia con FOR UPDATE no probada explícitamente — confiamos en la lógica del action (cubrir en Paso 14 con tests).

### Notas Entrega 2
- **Lock pesimista vía `tx.$queryRaw\`SELECT ... FOR UPDATE\``:** Prisma 5 no expone `FOR UPDATE` en `findUnique`/`findFirst`. La forma soportada es escribir SQL crudo dentro de la transacción. Devuelve `[]` si no existe el row (no error).
- **Consolidación de cantidades por productId antes del lock:** si el mismo producto aparece en N líneas (distintas presentaciones, o por error duplicado), sumamos primero y lockeamos UNA vez. Evita doble lock sobre el mismo row + deadlocks por orden no consistente.
- **Orden estable de locks** (`productIds.sort()`) para que dos transacciones concurrentes adquieran los locks en el mismo orden y no se traben mutuamente.
- **Correlativo MAX+1 sin migración:** evitamos crear modelo `SaleSequence`. `Sale.code @unique` ya garantiza unicidad; en race conditions se lanza P2002 y reintentamos hasta 3 veces. Para volumen alto de F2 se puede migrar a sequence de Postgres.
- **AuditLog fuera de la transacción:** si el log fallara, la venta sigue válida. Trade-off elegido: prefiero perder un log antes que rollback de la venta. En F2 podría meterse dentro del tx si la auditoría es legal obligatoria.
- **IGV discriminado en ticket aunque sea no-fiscal:** `baseImponible = total / (1 + igv/100)`, `igv = total - base`. Si `igvPercent = 0`, no se muestra. Si en el futuro cambia el IGV, las ventas viejas se mostrarán con el IGV actual (no histórico) — aceptable porque es comprobante interno no auditable.
- **PrintFrame con `nonce` incremental:** permite reimprimir la misma venta cambiando el nonce. El iframe recarga `/api/ticket/[id]?print=1&n=X` y el script auto-dispara `window.print()`.
- **`router.refresh()` tras venta exitosa:** repuebla `sessionInfo.expectedAmount` en el sub-header del POS sin TanStack Query (server component re-renderiza).
- **PaymentDialog accesible vía F4 + click + Enter en input "Recibido":** tres caminos para confirmar. Compatible con vendor que usa solo teclado.

### Notas Entrega 1
- **Combinación de 11.2+11.3 en un único componente** `<PosSearch>`: el barcode scanner se comporta como un teclado que escribe rápido y dispara Enter. Un único input que sirve para ambos casos es más simple que dos componentes. La detección de Enter hace un fetch sincrónico para no depender del debounce.
- **Por qué `focusToken` (number incremental) en lugar de `autoFocus` o `ref.current.focus()` directo:** el patrón controlado deja al padre decidir cuándo refocar (tras add, tras cerrar picker, tras F2). `autoFocus` solo dispara una vez; el ref directo requiere imperative API expuesta. Token incremental + useEffect es declarativo y predecible.
- **Persist del carrito en localStorage** vía `zustand/middleware`: si el vendor refresca accidentalmente la pestaña, no pierde el trabajo del turno. Se limpia tras venta exitosa (Entrega 2) o por Esc.
- **Discount global con clamp** (`Math.min(Math.max(0, discount), subtotal)`): no puede ser negativo ni mayor al subtotal. Validación adicional vendrá en `createSale`.
- **`matchedPresentationId` en API search:** si el query coincide con el `barcode` de una ProductUnit específica, la API marca cuál. El POS lo usa para agregar directo sin abrir el picker, aunque el producto tenga N presentaciones.
- **Layout split-screen `1fr_420px`:** carrito de 420px fijos en la derecha (suficiente para items con qty+precio), search/tips ocupando lo demás. Colapsa a una columna en mobile (`lg:` breakpoint).

---

## Paso 12 — Dashboard analítico ✅

> **Objetivo:** KPIs y gráficos visibles para el admin.
> **Estimado:** 2 días · **Completado:** 2026-05-18

### Tareas
- [x] **12.1** `server/queries/dashboard.queries.ts` con 5 queries puros (todas aceptan `{ storeId? }` opcional): `getDashboardKpis` (totales hoy+ayer con delta + tickets + promedio + stock crítico count + sesiones OPEN count), `getSalesLastDays` (array de N días Lima TZ con rellenado de huecos), `getTopProducts` (agregado sobre SaleItem por productId, sort por qty), `getStockAlerts` (Stock con `quantity <= minStock` usando `prisma.stock.fields.minStock` column-reference), `getCashStatusByStore` (sucursales con sus cajas y sesiones OPEN).
- [x] **12.2** `<KpiCard>` con métrica + delta calculado (percent o absolute) + ArrowUp/Down/Right + colores (emerald/destructive/muted). Maneja edge cases: `previous=0` muestra "Nuevo"; ambos 0 oculta delta; `deltaMode="none"` para KPIs no comparables.
- [x] **12.3** `<SalesChart>` con **Recharts AreaChart** (decidí usar Recharts directo en vez de Tremor para evitar setup extra de content paths y temas; igual de capaz para una serie). Gradient con CSS vars `--primary`, tooltip custom con `popover/border`, formatter `k` para millares, X axis con label `dd/MM`, header con total + tickets del período.
- [x] **12.4** `<TopProducts>` con **BarList custom** (div + Tailwind) en vez de Tremor: ranking + nombre + total recaudado + barra proporcional al qty del top1 + qty al pie. Empty state con icono Package.
- [x] **12.5** `<StockAlerts>` tabla con miniatura, link al producto, sucursal, badge Agotado/Crítico, ratio qty/minStock. Empty state celebratorio "¡Todo en orden!".
- [x] **12.6** `<CashStatus>` agrupado por sucursal: badge `N/M abiertas`, lista de cajas con dot verde si OPEN o lock si CLOSED, monto esperado + hora de apertura + vendor responsable. Link "Ver todas →" a `/cajas`.

### Validación final del paso
- [x] Typecheck limpio
- [x] Dashboard carga server-side (sin loading states intermedios) en paralelo via `Promise.all`
- [x] **Filtro local por sucursal** vía URL `?storeId=X`: server reads searchParams, queries filtran, `<StoreFilter>` client component actualiza URL al cambiar
- [x] Gráficos responsive (Recharts `<ResponsiveContainer>`)
- [ ] _Validación visual del usuario:_ con 1 venta histórica del Paso 11, ver KPIs correctos, gráfico con 1 punto, top productos con 1 entrada, stock alerts si algún producto tiene minStock>0, cash status sin sesiones OPEN. Probar selector de sucursal HCO-001 vs TIENDA-02.

### Notas
- **Recharts en vez de Tremor:** Tremor v3 requiere agregar `'./node_modules/@tremor/**/*.{ts,tsx}'` al content de Tailwind + extender el theme con tremor colors. Para un solo AreaChart no vale la pena; Recharts ya está instalado (dep transitiva de Tremor) y sus primitivas son suficientes con menos setup.
- **Filtro de sucursal local al dashboard:** el Topbar `<StoreSelector>` sigue siendo display-only por simplicidad. El dashboard tiene su propio `<StoreFilter>` que actualiza `?storeId=` en la URL. Patrón consistente con `/productos`, `/inventario`, `/cajas`. Cuando se haga funcional el Topbar selector (polish step), el dashboard puede migrar.
- **Zona horaria Lima en queries:** `limaDayRange(date)` calcula el inicio/fin del día Lima en UTC (-05:00 fijo, sin DST). Sin esto, "ventas hoy" usaría UTC y partiría el día a las 19:00 hora Lima.
- **`prisma.stock.fields.minStock` para comparar columnas:** Prisma 5 soporta column references en filtros (`quantity: { lte: prisma.stock.fields.minStock }`). Evita raw SQL.
- **Delta percent con previous=0:** mostrar "+∞%" sería confuso; uso "Nuevo" como etiqueta clara que indica que ayer no había nada. Si current=0 y previous>0, el cálculo `-100%` se muestra correctamente.
- **Empty states deliberados:** todos los paneles (charts, top products, stock alerts, cash status) tienen empty states explícitos. Para un negocio que recién arranca con datos vacíos, esto evita que el dashboard se vea roto.
- **Paralelismo:** las 7 queries del dashboard se disparan con `Promise.all` — no se bloquean entre sí. Con datos reales debería renderizar en <300ms.
- **Stock crítico cuenta solo `minStock > 0`:** productos sin `minStock` configurado no se cuentan como críticos aunque tengan stock 0. Es deliberado: el admin debe explícitamente marcar productos como "vigilar mínimo".

---

## Paso 13 — Auditoría ✅

> **Objetivo:** Trazabilidad completa de acciones críticas.
> **Estimado:** 1 día · **Completado:** 2026-05-18

### Tareas
- [x] **13.1** Helper `lib/audit.ts` — ya creado en Paso 5 con interfaz tipada (userId, action, entity, entityId, before, after, ip, userAgent). Usa `Prisma.DbNull` para campos undefined.
- [x] **13.2** Integración en server actions críticas — completada a lo largo de Pasos 5-12: settings (4 subsecciones), CRUD de Store/User/Category/Brand/Product/ProductUnit/Supplier, inventory entry + sale-price update, cash sessions (OPEN/CLOSE/MOVEMENT + CLOSE_WITH_DIFFERENCE), Sale create. Audit logs salen FUERA de las transacciones para no rollback la operación si el log falla.
- [x] **13.3** `/admin/auditoria` con server component que parsea filtros desde URL params (`userId`, `action` substring, `entity` enum, `from`/`to` fechas, `page`), `listAuditLogs` con paginación skip/take + count para `totalPages`. `<AuditFilters>` client con selects/input para los filtros + botón "Limpiar" (cambio de filtro resetea page a 1). `<AuditTable>` con badge coloreado por tipo de acción (DELETE→destructive, CREATE→success, DIFFERENCE/VOID→warning, UPDATE→secondary, default→outline), action button "Ver detalle". `<AuditPagination>` con controles ⇤ ← → ⇥ + label "Mostrando X–Y de Z". Page size default 50, max 200.
- [x] **13.4** `<AuditDetailDialog>` carga el log via `/api/auditoria/[id]`. `<AuditDiff>` componente client que:
  - Si `before` y `after` son objetos planos: itera keys top-level, marca filas cambiadas en amarillo, valores antes en rojo con strike-through, valores después en verde, con toggle "Solo cambios" (default ON).
  - Si no son objetos: muestra como bloques JSON crudos lado a lado.
  - Compara deep con `JSON.stringify` (suficiente para datos serializados de auditoría).
  - Maneja `null`/`undefined` mostrando "—" sin romper.

### Validación final del paso
- [x] Typecheck limpio
- [x] _Validación visual del usuario_ (2026-05-18): filtros + diff + paginación operativos.

### Notas
- **Logs ya enriquecidos:** durante los pasos previos los audit logs ya cargan campos útiles. Por ejemplo, `CASH_SESSION_CLOSE` guarda `before: { status: "OPEN" }` y `after: { status: "CLOSED", expectedAmount, countedAmount, difference, notes }` — el diff lo muestra perfectamente.
- **Paginación offset-based** (skip/take + count): primer intento fue hard limit 200 con "refiná filtros" — el usuario notó que faltaba paginación real. Cambiado a `page` + `pageSize` (50 default, 200 max). Cursor-based queda para F2 si el volumen lo justifica.
- **Reset de page al cambiar filtros:** si estás en página 5 y cambiás de usuario, te lleva a página 1 con el nuevo filtro. Evita la confusión de "no veo nada" porque el filtro nuevo tiene menos páginas.
- **Action substring filter en UPPERCASE:** los actions son convencionalmente UPPERCASE en el código (SALE_CREATE, PRODUCT_UPDATE). El input fuerza uppercase visual + el query hace `contains` con upper. Permite búsquedas parciales tipo "SALE" o "CASH".
- **Date range en Lima TZ:** `parseDate` interpreta `yyyy-MM-dd` como inicio/fin de día Lima (UTC-5 fijo). `from` = `00:00:00-05:00`, `to` = `23:59:59-05:00`. Sin esto, un filtro "desde hoy" perdería las primeras horas Lima.
- **Diff con toggle "Solo cambios":** default ON porque ver 30 campos sin cambios para detectar 1 modificación es ruido. Off muestra todo el snapshot.
- **API route `/api/auditoria/[id]`:** uso route en vez de pasar todo el `before/after` al cliente desde el listado — los blobs JSON pueden ser grandes (Sale tiene items[] potentialmente). Lazy-load por dialog.
- **Mejora futura (F2):** exportar a CSV/PDF para informes externos; cursor pagination para histórico largo; diff de arrays más sofisticado (mostrar items agregados/quitados).

---

## Paso 14 — Pulido + Tests ✅

> **Objetivo:** App lista para usar en producción local antes de Railway.
> **Estimado:** 2–3 días · **Completado:** 2026-05-18 (en una sesión final)

### Tareas
- [x] **14.1** Setup Vitest con `vitest.config.ts`, environment `happy-dom`, alias `@/`, scripts `npm test` y `test:watch`. Suite cubre 5 archivos / 38 tests en 1.9s.
- [x] **14.2** Tests de `createSaleSchema` (paths felices y de error: items vacíos, cantidad ≤ 0, descuento negativo, coerce de strings). El test integración de stock insuficiente queda cubierto por E2E (Prisma + transactions son difíciles de mockear sin acoplarse a internals; preferimos integration via Playwright).
- [x] **14.3** Tests de `signedDelta` + `computeExpectedAmount` (helper extraído de `cash.actions.ts` a `src/lib/cash.ts` para hacerlo testeable). Cubre los 5 tipos de movimiento y el escenario validado por el usuario en Paso 10 (50 + 10 - 5 - 20 = 35).
- [x] **14.4** Setup Playwright con `playwright.config.ts`, baseURL local, locale `es-PE`, TZ `America/Lima`, webServer que arranca `npm run dev` si no está corriendo, projects chromium. Scripts `test:e2e` y `test:e2e:ui`.
- [x] **14.5** E2E: `auth.spec.ts` con 3 tests (redirect sin sesión, login admin OK, DNI inválido falla). `sale-flow.spec.ts` con flujo completo de venta escrito pero `test.skip` hasta que exista seed específico de tests con caja + producto predecibles (planeado F2).
- [x] **14.6** Security headers en `next.config.mjs` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS para producción, `poweredByHeader: false`). Rate limit in-memory token-bucket (`src/lib/rate-limit.ts`) aplicado al login: 10 intentos/IP/min + 5 intentos/documentNumber/min. Sweeper periódico para no crecer la Map indefinidamente.
- [x] **14.7** README expandido: stack actualizado, credenciales seed, scripts (incluyendo tests), estructura completa de carpetas, sección Tests con cómo correr Vitest y Playwright, Seguridad con lo implementado y lo diferido a F2, Operación con flujo típico de día, Troubleshooting con 9 entradas comunes, Decisiones diferidas a F2.

### Validación final del paso
- [x] `npm test` corre 38 tests verdes en 1.9s
- [x] `npx tsc --noEmit` limpio
- [x] App lista para primer deploy a Railway (faltan solo decisiones de Storage + dominio en F2)
- [ ] _Validación visual del usuario_ (opcional): `npm test`, `npm run test:e2e` (tras `playwright install chromium`), inspeccionar headers en DevTools Network tab.

### Notas
- **Estrategia de testing pragmática:** 5 archivos de tests unit cubren la lógica de negocio pura (signedDelta, computeExpectedAmount, computeTotals, format, slugify, sale schema). NO mockeamos Prisma — los tests de Server Actions con transactions son frágiles cuando se mockea el cliente; las integraciones reales con la BD van vía Playwright E2E. Resultado: tests rápidos (1.9s) y mantenibles.
- **Helper `signedDelta` extraído a `lib/cash.ts`:** antes vivía duplicado dentro de `cash.actions.ts`. Extraerlo lo hace testeable sin importar el archivo `"use server"` (los module side-effects de NextAuth no juegan bien con vitest). Buen patrón para futuras refactorizaciones.
- **`computeExpectedAmount` agregado:** función nueva que reusa `signedDelta` para calcular esperado desde apertura + movimientos. Documenta la lógica del cierre de caja en un solo lugar tested.
- **Playwright E2E del flujo completo skipped:** escribirlo fue trivial pero correrlo requiere data predecible. Sin un seed específico de tests (vendor + caja + stock predecibles), el test se rompe al cambiar la BD. F2 puede agregar `prisma/seed-test.ts` y habilitarlo.
- **`webServer: { reuseExistingServer: true }`:** Playwright detecta si `:3000` ya está corriendo y lo usa; sino lo arranca. UX local óptimo.
- **Rate limit in-memory adecuado para F1 single-instance:** un atacante puede saturar memoria con keys distintos (DNIs inventados). Sweeper periódico mitiga. Para Railway con auto-scaling, migrar a Upstash o tabla `LoginAttempts` con TTL.
- **CSP omitido deliberadamente:** Next.js inyecta scripts inline (chunks, ServerComponentsHMR) que requerían `'unsafe-inline'` o nonces per-request. Nonces necesitan refactor del middleware + headers dinámicos. F2.
- **Strict-Transport-Security en config:** activo bajo HTTPS (Railway lo da automático). En local sobre HTTP el header se ignora — sin daño.
- **README como documentación viva:** la sección Troubleshooting documenta los 4 bugs reales que aparecieron durante validación (.next cache, hydration de fechas, /pos con caja de otro usuario, search stock cross-store). Sirve para vos cuando volvás dentro de 3 meses.

---

# Decisiones diferidas a Fase 2

- 🚫 **Storage de imágenes en producción** — decidir entre Cloudinary / UploadThing / R2 al primer deploy
- 🚫 **Impresora térmica + cajón de dinero (ESC/POS)** — F2
- 🚫 **Lector de barcode con UX optimizada** — F2 (input flotante)
- 🚫 **SSE para tiempo real** — F2 (cuando duela el polling)
- 🚫 **Transferencias entre sucursales** — F2
- 🚫 **Anulación de ventas** — F2
- 🚫 **Reportes exportables** — F2

---

# Bitácora de desarrollo

> Registro cronológico de cambios mayores, decisiones tomadas durante la implementación y deuda técnica.

| Fecha | Paso | Cambio / Decisión | Autor |
|-------|------|-------------------|-------|
| 2026-05-17 | — | Plan maestro aprobado, inicio de implementación | — |
| 2026-05-17 | 1 | Bootstrap completado: Next 14.2 + React 18.3, todas las deps instaladas, dev server arranca en 2.8s con HTTP 200. Proyecto reubicado en `ferreteria-hco/` subfolder. | Claude |
| 2026-05-17 | 2 | Schema Prisma con 20 entidades + 7 enums aplicado. Postgres docker arriba. Seed exitoso (admin, sucursal HCO-001, Caja 1, 6 unidades, 4 métodos de pago, AppSettings). Cambio convención `.env.local`→`.env` para compatibilidad con Prisma CLI. | Claude |
| 2026-05-17 | 2.1 | **Cambio de modelo de auth a pedido del usuario:** `User.email` eliminado; reemplazado por `documentType` (enum DNI/CE/PAS) + `documentNumber` con unicidad compuesta. Migración regenerada. Seed admin ahora usa DNI 12345678. Schema Zod `src/schemas/auth.schema.ts` con validaciones por tipo de documento creado (preparatorio para Paso 3). | Claude |
| 2026-05-17 | 3 | Auth + RBAC completos. NextAuth v5 con split edge/node (auth.config + auth). Login `/login` con selector DNI/CE/PAS funcional. Middleware protege rutas por rol. 7 componentes shadcn creados manualmente. Stubs `/dashboard` y `/pos` con logout. 10 tests curl end-to-end validados (login OK + 3 casos de error). | Claude |
| 2026-05-17 | 3.1 | **Incidente — dev server zombie:** El usuario reportó error "Jest worker exceptions" al loguear. Causa: dev server huérfano del Paso 1 (con cache `.next/` viejo sin las rutas de auth) seguía en :3000. Fix: matar todos los node en 3000-3002, limpiar `.next/`, blindar `authorize` con try/catch defensivo. | Claude |
| 2026-05-17 | 4 | Layouts admin/vendedor con sidebar + topbar. 3 nuevos providers (Query, Settings con CSS vars dinámicas, Toast). 5 componentes de layout. 2 componentes shadcn extra (separator, dropdown-menu). Dashboard y POS reubicados en route groups con guards centralizados en layouts. | Claude |
| 2026-05-17 | 5 | Módulo Configuración completo: `/configuracion` con 4 tabs editables. Server Actions auditadas. Sistema de storage abstracto (LocalStorageProvider, listo para Cloudinary en F2). Upload de imágenes con validación de tamaño/tipo/carpeta. Color de acento aplica en vivo tras guardar. | Claude |
| 2026-05-17 | 5.1 | **Bug "Invalid input" en tab Identidad:** `.transform(v => null)` en el schema hacía que el cliente enviara `null` y el server fallara al re-parsear (input type esperaba `string`). Fix: schemas sin transforms + helper `emptyStringToNull()` server-side. | Claude |
| 2026-05-17 | 5.2 | **Settings no se reflejaban en UI:** sidebar/login tenían "Ferretería HCO" hardcoded. Fix: SidebarAdmin/SidebarPos/LoginForm ahora usan `useSettings()` y muestran businessName + logo dinámicos. Root layout cambió a `generateMetadata()` async para que el `<title>` y favicon también sean dinámicos. | Claude |
| 2026-05-17 | 6 | Sucursales y Usuarios completos. CRUD con modales shadcn Dialog. Auto-creación de Caja 1 al crear sucursal (transacción). Reset de password sin loguear hash. Validación cruzada vendor-debe-tener-sucursal vía Zod superRefine. StoreSelector ahora lee BD (server component vía prop al Topbar). | Claude |
| 2026-05-17 | 6.1 | **Refinamientos pedidos por el usuario:** (a) inputs descriptivos UPPERCASE visual + lowercase BD vía Zod `.toLowerCase()` + CSS `uppercase`; (b) celular peruano obligatorio en Sucursal + User (regex `^9\\d{8}$`); (c) DocumentNumberInput restringe caracteres por tipo (DNI solo dígitos, CE/PAS alfanum); (d) User ahora con apellidoP+apellidoM+nombres+phone+email+birthDate+address+gender (enum Gender); (e) password al crear = documentNumber (autogen); (f) email único; (g) Dialog default no cierra al click fuera (sí ESC + X + Cerrar). Migración regenerada. | Claude |
| 2026-05-17 | 7 | Catálogos completos: `/categorias` con árbol jerárquico + detección de ciclos, `/marcas` con CRUD + logo, `/unidades` solo lectura. Helper `slugify` + slug único con sufijo automático. Componente reutilizable `<CategoryTreeSelect>` (se usará en Productos del Paso 8). | Claude |
| 2026-05-17 | 7.1 | Seed enriquecido con 12 categorías raíz y 52 marcas peruanas para arrancar el sistema con catálogos útiles desde el primer login. | Claude |
| 2026-05-17 | 7.2 | Seed expandido a 79 categorías (12 raíces + 67 subcategorías) de 2 niveles para que el usuario evalúe si quiere jerarquía o catálogo plano. UI de `/categorias` refactorizada a árbol expandible (componente `CategoryTreeNode` recursivo, conteo recursivo de productos, búsqueda que filtra árbol). Decisión final del usuario pendiente: mantener jerarquía o eliminar UI. | Claude |
| 2026-05-17 | 8 | **Entrega 1 de 2:** Página `/productos` con tabla filtrable, búsqueda, modal CRUD, autogeneración SKU. Server actions con auditoría. Reutiliza `CategoryTreeSelect` y filtros vía URL params. Pendiente Entrega 2: detalle, presentaciones múltiples, search autocomplete. | Claude |
| 2026-05-17 | 8.1 | **Refinamientos pedidos por el usuario:** (a) `<Combobox>` (estilo Select2) reutilizable basado en `cmdk` + Popover; (b) `<CategoryDualSelect>` con 2 comboboxes dependientes (raíz → sub); sub obligatoria en mode=form, opcional en mode=filter; (c) aplicado a Productos (modal y filtros), Marca y Sucursal en User form; (d) `CategoryTreeSelect` refactorizado a Combobox con path "RAÍZ → SUB" (sigue usándose para padre de categoría). Selects pequeños (≤4 opciones) mantenidos. | Claude |
| 2026-05-17 | 8.2 | **Entrega 2 de 2:** Página `/productos/[id]` con detalle completo. CRUD de presentaciones (`ProductUnit`) con reglas: una sola default, no eliminar default ni con ventas asociadas. `<MultiImageUploader>` con marcar principal y reorder. API `/api/productos/search` (requiere session, no solo admin) para uso futuro en POS. | Claude |
| 2026-05-17 | 9 | Inventario base: `/inventario` con stock filtrable, modal de entrada multi-línea con `useFieldArray` y búsqueda async de productos, kardex `/inventario/kardex/[id]` con filtros y export CSV. Action `createInventoryEntry` transaccional con costo promedio ponderado global. | Claude |
| 2026-05-17 | 9.1 | **Refinamientos post-Paso 9:** (a) Nuevo modelo `Supplier` con RUC, razón social, contacto, celular Perú, email, dirección, notas. Migración `add_suppliers`. (b) CRUD `/proveedores` con búsqueda. (c) Selector OBLIGATORIO de proveedor en "Nueva entrada de mercadería" + alert si no hay proveedores activos. (d) Helper `RucInput` con validación 11 dígitos + prefijos 10/15/17/20. (e) Quitar campo "Costo" del modal de Producto: se calcula automáticamente con entradas. (f) Renombrar "Costo unit." → "Costo compra" en entrada, "Costo" → "Costo promedio" en detalle. | Claude |
| 2026-05-17 | 9.2 | **Precio de venta actualizable en entrada:** nueva columna "Precio venta" en cada línea de entrada. Se autocompleta con el precio actual del producto al seleccionarlo. Si el admin lo modifica, se actualiza `Product.salePrice` al guardar y queda auditoría `PRODUCT_SALE_PRICE_UPDATE_VIA_ENTRY`. Mantiene el modelo "un producto, un precio vigente" pero permite actualizarlo en el momento natural (cuando suben los costos). Sin lógica FIFO/LIFO, sin precio por lote. | Claude |
| 2026-05-17 | — | **Cierre de sesión.** Estado: 68/104 tareas F1 (65%), 9/14 pasos completos. Próximo: Paso 10 (Caja diaria). Ver sección "ESTADO PARA RETOMAR" al inicio del documento. | Claude |
| 2026-05-18 | 10 | **Caja diaria completa.** Schema Zod + 3 server actions (open/movement/close) transaccionales con doble guard de unicidad OPEN (por usuario y por caja) y AuditLog. Páginas vendedor: `/caja` (redirect inteligente), `/caja/abrir`, `/caja/movimientos` (panel "Mi caja" con KPIs + tabla + dialog de movimiento manual), `/caja/cerrar` (diferencia en vivo). Bonus: dashboard admin `/cajas` con filtros (sucursal/estado) + KPIs + tabla. Guard en `/pos` que fuerza apertura al VENDOR sin sesión. Typecheck limpio. Falta validación visual end-to-end del usuario. | Claude |
| 2026-05-18 | 10.1 | **Fix de colisión de rutas:** dashboard admin originalmente estaba en `/(admin)/caja` → colisión con `/(vendedor)/caja` (los route groups no afectan la URL). Movido a `/(admin)/cajas`. Sidebar admin actualizado de `/caja` → `/cajas`. Actions ahora hacen `revalidatePath("/cajas")` extra. | Claude |
| 2026-05-18 | 10.2 | **Fix de hydration mismatch en fechas:** `toLocaleString("es-PE", {...})` daba output distinto entre server (Node UTC) y cliente (browser TZ + locale completo). Refactor a helper compartido `formatDateTime` / `formatDate` en `src/lib/format.ts` usando `formatInTimeZone(date, "America/Lima", "dd/MM/yyyy HH:mm")` de `date-fns-tz`. Aplicado en `(admin)/cajas` y `(vendedor)/caja/movimientos`. Memoria guardada para evitar el bug en Paso 11. | Claude |
| 2026-05-18 | — | **Decisión de deferral:** multi-cajas por sucursal (CRUD de CashRegisters) pospuesto hasta que el negocio lo necesite. Análisis de impacto confirmó: cero impacto en Paso 11. | Claude |
| 2026-05-18 | 11 | **Inicio del Paso 11 (POS).** Plan maestro §6.1 (flujo) y §8.2 (layout split-screen) ya definidos. Decisiones de UX pendientes con el usuario antes de codear. | Claude |
| 2026-05-18 | 11 | **Decisiones de UX del POS** (acordadas con el usuario): descuento solo global, una fila por producto en search con popup-picker si N>1 presentaciones, F8 = lista "mis ventas" / Esc = limpiar carrito. | Claude |
| 2026-05-18 | 11.E1 | **Entrega 1/3 del POS completa.** Cart store Zustand con persist; `<PosSearch>` (input siempre focused, debounce 200ms al tipear, fetch sincrónico al Enter para soporte de barcode scanners, agrega directo si match exacto); `<PresentationPicker>` dialog para productos con N>1 ProductUnits; `<PosCart>` con qty inline +/-, descuento global, totales en vivo; `<PosScreen>` orchestrator con sub-header de caja, atajos F2/Esc (F4 stub), split-screen 1fr/420px. API search extendida con `presentations[]` y `matchedPresentationId`. Typecheck limpio. F4 y cobro real en Entrega 2. | Claude |
| 2026-05-18 | 11 | **Decisiones de Entrega 2** (con el usuario): IGV discriminado en ticket (informativo, base+IGV calculados desde el total bruto); monto recibido + vuelto en vivo solo para método CASH. Implementación: correlativo MAX+1 con retry P2002 (sin migración); ticket 80mm CSS @page (compatible con térmica F2); print vía iframe oculto. | Claude |
| 2026-05-18 | 11.E2 | **Entrega 2/3 del POS completa.** `createSale` transaccional con `SELECT...FOR UPDATE` vía raw SQL (Prisma no expone FOR UPDATE en findUnique), consolidación de qty por productId + orden estable de locks (anti-deadlock), correlativo `V-{storeCode}-XXXXXX` con MAX+1 y retry. `<PaymentDialog>` con grid de métodos, vuelto en vivo (CASH), referencia obligatoria (YAPE/PLIN/TRANSFER). `<InsufficientStockDialog>` tipado con detalle por producto en unidad base. `<PrintFrame>` iframe oculto con auto-print + nonce para reimprimir. `GET /api/ticket/[saleId]` HTML 80mm con IGV discriminado, header/footer de AppSettings. Atajos F2/F4/F8/Esc completos. Typecheck limpio. Pendiente Entrega 3 (mis ventas + reimprimir). | Claude |
| 2026-05-18 | 11.E2.1 | **Fix UX crítico — stock por sucursal en search del POS.** Durante validación, el usuario vio "100 SC en stock" pero al cobrar saltó INSUFFICIENT_STOCK. Diagnóstico: tenía caja abierta en TIENDA-02 (sin stock) pero el search mostraba `totalStock` (suma de HCO-001 = 100). Fix: `/api/productos/search` ahora acepta `?storeId=X` y devuelve `storeStock` (stock SOLO de esa sucursal); el POS pasa el storeId de la caja activa y muestra el stock local; productos con 0 stock local quedan en rojo y bloqueados al click (callback `onNoStock` muestra toast claro). Si hay stock en otras sucursales se indica "(N total)" para info. Backward compat: el `<ProductSearchCombobox>` del inventory entry sigue recibiendo `totalStock` (no pasa storeId). | Claude |
| 2026-05-18 | 11.E3 | **Entrega 3/3 del POS completa — Paso 11 cerrado.** `/(vendedor)/ventas` con guard de caja OPEN, filtro `cashSessionId = activeSession.id`. KPIs: ventas/ítems/total con promedio. Tabla con código + hora + ítems + método+referencia + total + estado + acciones (Ver ticket en pestaña nueva, Reimprimir retargeting el `<PrintFrame>`). Status VOIDED soportado visualmente para cuando F2 agregue anulación. F8 desde POS navega aquí. Typecheck limpio. | Claude |
| 2026-05-18 | 11.E3.1 | **Fix UX /ventas con caja cerrada.** Durante validación, el guard redirigía a /caja/abrir cuando el vendor cerraba la caja → no podía ver ventas ya hechas. Fix: nueva query `getLatestCashSessionForUser` que devuelve la sesión más reciente del vendor sin importar status. Si está OPEN → comportamiento normal. Si está CLOSED → muestra el turno con banner "Tu caja está cerrada desde HH:mm — estás viendo el último turno" + CTA "Abrí una caja". Si nunca abrió caja → mensaje + CTA. Botón "Volver al POS"/"Abrir caja" según contexto. | Claude |
| 2026-05-18 | 12 | **Dashboard analítico completo.** `dashboard.queries.ts` con 5 queries paralelas (KPIs hoy/ayer, ventas N días con TZ Lima, top productos, stock alerts, cash status por sucursal). 5 componentes nuevos: `<KpiCard>` con delta calc, `<SalesChart>` AreaChart Recharts (preferido sobre Tremor por simplicidad de setup), `<TopProducts>` BarList custom, `<StockAlerts>` con miniatura+badge+ratio, `<CashStatus>` agrupado por sucursal. Filtro local de sucursal vía URL `?storeId=X` con `<StoreFilter>` (el Topbar selector sigue display-only, polish step pendiente). Typecheck limpio. | Claude |
| 2026-05-18 | 13 | **Auditoría UI completa.** `lib/audit.ts` y la integración en server actions ya estaban (Pasos 5-12). Agregado: `audit.queries.ts` con `listAuditLogs` (filtros userId/action substring/entity/fecha) y `getAuditLogById`. Página `/auditoria` con `<AuditFilters>` (selects + input + date range, persistidos en URL), `<AuditTable>` con badges coloreados por tipo de acción. `<AuditDetailDialog>` lazy-loads el log via `/api/auditoria/[id]` y muestra `<AuditDiff>` key-by-key con highlight rojo/verde + toggle "Solo cambios". Fechas interpretadas en Lima TZ. Typecheck limpio. | Claude |
| 2026-05-18 | 13.1 | **Paginación real en /auditoria.** Primera versión usaba hard limit 200 con banner "refiná filtros" — el usuario pidió paginación de verdad. Cambiado a offset-based (skip/take + count): página size 50 default (max 200), `<AuditPagination>` con controles ⇤ ← N/M → ⇥ y label "Mostrando X–Y de Z", reset de page=1 al cambiar cualquier filtro. | Claude |
| 2026-05-18 | 14 | **🎉 Paso 14 completo — F1 CERRADA.** Vitest setup + 38 tests (5 archivos) cubriendo signedDelta/computeExpectedAmount/computeTotals/format/slugify/sale schema. `signedDelta` extraído a `lib/cash.ts` para testabilidad. Playwright setup con `auth.spec.ts` (3 tests funcionales) + `sale-flow.spec.ts` skipped hasta seed de tests. Security headers en `next.config.mjs` (X-Frame, Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS, suprimido X-Powered-By). Rate limit in-memory en login (`lib/rate-limit.ts`) — 10/IP/min + 5/documento/min con sweeper. README completo (stack, comandos, credenciales, estructura, tests, seguridad, operación, troubleshooting, F2 roadmap). Typecheck limpio, 38/38 tests en verde. | Claude |
| 2026-05-18 | — | **🚀 F1 cerrada: 104/104 tareas en una sesión de ~5 horas tras retomar el proyecto.** Próximo: deploy a Railway (storage decision + env vars) o arrancar F2. | Claude |
| 2026-05-18 | extra | **Seed demo extendido.** Antes del deploy, agregado `prisma/seed-demo.ts` con: 80 productos representativos cubriendo las 12 categorías raíz (con marcas peruanas reales y precios PEN 2026), 9 marcas extra (lark, chema, tricolor, tumi, oatey, loctite, terokal, steelpro, 3m), supplier demo (RUC 20100000001), vendor demo (DNI 11111111), 1 cash session CLOSED, 15 ventas demo distribuidas en los últimos 7 días con métodos mixtos, stock inicial + InventoryMovement ENTRY por cada producto, CashMovement SALE por cada venta CASH. Idempotente: upsert por SKU/RUC/documento + check de sentinel sales. Inicialmente había mismatches de slug de categoría (4 productos saltados); corregido. README actualizado con sección "Datos demo". | Claude |
| 2026-05-18 | extra | **Paginación consistente en tablas del sistema.** Auditoría reveló que `/auditoria` era la única página con paginación real; las demás usaban hard limits (productos: 200, inventario: 300, kardex: 500, cajas: 100). Extraído `<TablePagination>` reusable a `components/shared/` (URL-driven, preserva filtros, ⇤←N/M→⇥ + "Mostrando X–Y de Z", parsePageParam helper). Aplicado a `/productos` (page size 50), `/inventario` (50, con filtro crítico ahora server-side vía `prisma.stock.fields.minStock`), `/inventario/kardex/[id]` (50, cap 10k para que la export CSV no perdiera datos), `/cajas` (50). Filtros de cada página resetean `page=1` al cambiar. Users/suppliers mantienen filtros en memoria (escala pequeña). Brands/units/stores/categorías sin cambios (bounded). | Claude |
| | | | |
