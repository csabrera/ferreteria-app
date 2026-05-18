# Ferretería HCO

Sistema de gestión interna para ferretería en Huánuco, Perú.
Multi-sucursal · Roles Admin/Vendedor · POS + Inventario + Caja + Auditoría.

> 📘 **Arquitectura:** ver [`../plan-ferreteria.md`](../plan-ferreteria.md)
> ✅ **Avance:** ver [`../progreso-ferreteria.md`](../progreso-ferreteria.md)

## Stack

- **Next.js 14** App Router · **TypeScript** estricto · **Tailwind CSS**
- **PostgreSQL** · **Prisma 5** ORM
- **NextAuth v5** (Credentials + JWT, login por documento DNI/CE/PAS)
- **TanStack Query** (estado servidor) · **Zustand** + `persist` (UI / carrito)
- **shadcn/ui** + **Radix** · **Recharts** · **Sonner**
- **Zod + React Hook Form** · **date-fns + date-fns-tz** (TZ Lima)
- **Vitest** (unit) · **Playwright** (E2E)

## Requisitos

- Node.js 20+ (recomendado 22 LTS)
- npm 10+
- Docker Desktop (para Postgres local)
- Windows / macOS / Linux

## Arranque local

```powershell
# 1. Clonar e instalar
git clone <repo>
cd ferreteria/ferreteria-hco
npm install

# 2. Variables de entorno
copy .env.example .env
# Editar .env y poner AUTH_SECRET con un valor aleatorio fuerte
# (puedes generar uno con: openssl rand -base64 32)

# 3. Postgres con Docker (se queda corriendo en background)
docker compose up -d

# 4. Aplicar migraciones y sembrar datos iniciales
npm run db:migrate
npm run db:seed

# 5. Arrancar Next.js en dev
npm run dev
```

Acceso:
- **App:** http://localhost:3000
- **pgAdmin:** http://localhost:5050 (`admin@ferreteria-hco.local` / `admin`)

### 🔑 Credenciales seed

| Rol | Tipo doc | Número | Password | Sucursal |
|---|---|---|---|---|
| ADMIN | DNI | `12345678` | `12345678` | HCO-001 — CENTRAL |
| VENDOR demo | DNI | `11111111` | `11111111` | HCO-001 — CENTRAL |

> 💡 La password inicial siempre coincide con el número de documento. **Cambiar en el primer login** desde `/admin/usuarios` (botón "Resetear contraseña" + login con la nueva).

### 📦 Datos demo incluidos en el seed

El seed crea automáticamente datos representativos para demo y testing:

- **80 productos** cubriendo las 12 categorías raíz (cemento, fierros, pinturas, herramientas, plomería PVC, sanitarios, eléctricos, ferretería general, pegamentos, seguridad, jardinería, iluminación, cerrajería, limpieza) con marcas reales peruanas (Sol, Pacasmayo, Sika, Pavco, Bosch, Makita, Stanley, etc.)
- **Stock inicial** en HCO-001 (suficiente para vender — desde 6 unidades hasta 2000 ladrillos)
- **Supplier demo** "Distribuidora Demo S.A.C." con RUC `20100000001`
- **15 ventas demo** distribuidas en los últimos 7 días con métodos mixtos (efectivo/Yape/Plin), atribuidas al vendor demo en una sesión de caja CLOSED.
- **Auditoría** poblada con todos los eventos correspondientes (entradas, ventas, sesión abierta/cerrada)

Resultado: el dashboard `/dashboard` arranca con KPIs reales, gráfico de 7 días con altibajos, top productos, y alertas de stock. La auditoría `/auditoria` muestra ~120 eventos.

**Para regenerar datos demo desde cero**: `npm run db:reset` (borra BD + re-aplica migraciones + seed completo).

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Arranca Next.js en modo desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Arranca el build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin compilar |
| `npm test` | Vitest tests unitarios (single run) |
| `npm run test:watch` | Vitest en modo watch |
| `npm run test:e2e` | Playwright E2E (requiere browsers instalados) |
| `npm run test:e2e:ui` | Playwright en modo UI interactivo |
| `npm run db:migrate` | Aplica migraciones Prisma (dev) |
| `npm run db:reset` | **⚠️ Borra y recrea la BD** con seed |
| `npm run db:seed` | Ejecuta el seed (idempotente) |
| `npm run db:studio` | Abre Prisma Studio (GUI de BD) |
| `npm run db:generate` | Regenera el cliente Prisma |

## Estructura

```
src/
├── app/
│   ├── (admin)/          # Layout admin con sidebar completo
│   │   ├── dashboard/
│   │   ├── productos/
│   │   ├── inventario/
│   │   ├── sucursales/
│   │   ├── usuarios/
│   │   ├── cajas/        # Dashboard de sesiones de caja
│   │   ├── auditoria/
│   │   └── configuracion/
│   ├── (vendedor)/       # Layout POS con sidebar reducido
│   │   ├── pos/          # Punto de venta
│   │   ├── caja/         # Mi caja (abrir/movimientos/cerrar)
│   │   └── ventas/       # Mis ventas del turno
│   ├── (auth)/
│   │   └── login/
│   └── api/
│       ├── productos/search   # Autocomplete del POS
│       ├── ticket/[saleId]    # HTML del ticket (CSS print)
│       ├── auditoria/[id]     # Detalle de audit log
│       └── upload             # Upload local de imágenes (F1)
├── components/
│   ├── ui/             # shadcn primitives
│   ├── layout/         # Sidebars + topbar
│   ├── shared/         # Reutilizables (ImageUploader, Combobox, etc.)
│   ├── pos/            # Components específicos del POS
│   └── dashboard/      # Cards + charts del dashboard
├── lib/                # prisma, auth, audit, format, cash helpers, etc.
├── server/
│   ├── actions/        # Server Actions tipados (mutaciones)
│   └── queries/        # Server queries cacheadas
├── schemas/            # Zod schemas (compartidos client/server)
├── stores/             # Zustand stores (cart)
└── types/              # Type augmentations (next-auth)

prisma/
├── schema.prisma       # 20 modelos
└── seed.ts             # Admin + sucursal + caja + unidades + métodos pago + 79 categorías + 52 marcas

e2e/                    # Playwright specs
└── auth.spec.ts        # Tests de login y guards

vitest.config.ts        # Config Vitest
playwright.config.ts    # Config Playwright
```

## Tests

### Unit tests (Vitest)

```bash
npm test               # Single run
npm run test:watch     # Watch mode con reload
```

Cobertura actual:
- Helpers puros: `signedDelta`, `computeExpectedAmount`, `computeTotals`, `formatCurrency`, `formatDateTime`, `slugify`
- Validación Zod: `createSaleSchema` (paths felices y de error)

Diseño: priorizamos tests de **lógica de negocio pura** (sin mocks de Prisma). Las integraciones con la BD se prueban via E2E.

### E2E tests (Playwright)

```bash
# Primera vez: descargar Chromium (~120 MB)
npx playwright install chromium

# Correr todos los E2E
npm run test:e2e

# Modo UI interactivo
npm run test:e2e:ui
```

Tests:
- ✅ `auth.spec.ts` — login, redirects, validaciones
- ⏸ `sale-flow.spec.ts` — **skipped** hasta que exista seed específico de tests (planeado F2)

> El test de venta E2E requiere un usuario VENDOR sembrado con caja predecible. Se habilita modificando `test.skip` → `test` cuando se haya extendido el seed.

## Seguridad

Capa básica implementada en F1:

- **Headers HTTP** (en `next.config.mjs`):
  - `X-Frame-Options: SAMEORIGIN` — protege clickjacking
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` denegando camera, microphone, geolocation, payment
  - `Strict-Transport-Security` (activo bajo HTTPS en prod)
  - `X-Powered-By` suprimido
- **Rate limit del login** (`src/lib/rate-limit.ts`):
  - 10 intentos por IP / minuto
  - 5 intentos por documento / minuto
  - Token bucket in-memory (válido para single instance; migrar a Redis en F2 si se escala)
- **bcrypt** con cost 10 para passwords
- **Server Actions** sólo accesibles tras `requireSession`/`requireAdmin`/`requireVendor`
- **Audit log** de todas las acciones críticas (settings, productos, ventas, caja, etc.)

### Pendiente para F2
- **CSP estricto con nonces** — requiere refactor para evitar `'unsafe-inline'`
- **Rate limit distribuido** (Upstash o Redis)
- **2FA** opcional para administradores
- **Rotación automática de `AUTH_SECRET`**

## Operación

### Configuración inicial recomendada
1. Login admin → `/configuracion`
2. **Identidad**: subir logo, poner RUC y nombre del negocio
3. **Apariencia**: elegir color de acento
4. **Ticket**: encabezado, pie y mensaje de agradecimiento
5. **Operación**: confirmar IGV, moneda, timezone

### Flujo típico de día
1. **Admin**: cargar/ajustar stock vía `/inventario` → "Nueva entrada"
2. **Vendor**: login → abrir caja con monto inicial → vender en `/pos` → ver ventas en `/ventas`
3. **Vendor** al finalizar turno: `/caja/cerrar` con monto contado físico
4. **Admin** revisar `/cajas` por diferencias, `/dashboard` por KPIs, `/auditoria` por trazabilidad

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `npm run dev` arroja "EPERM: operation not permitted" en `.next/types` | Build cache corrupto tras mover rutas | `Remove-Item -Recurse -Force .next` y re-arrancar |
| `npx prisma generate` falla con EPERM | Dev server o VSCode bloqueando archivos | Cerrar dev, regenerar, reabrir |
| Login devuelve error sin razón | JWT cookie stale tras cambios de auth | Logout explícito y re-login |
| `/pos` redirige a `/caja/abrir` aunque hay una caja abierta | La caja OPEN es de otro usuario | Login con el dueño real de la sesión, o cerrar+abrir nueva |
| Search del POS muestra "0 stock" en rojo | Stock está en otra sucursal | Hacer entrada de inventario en la sucursal de la caja |
| Fecha en tabla aparece con hydration error | Función de formato no determinista | Usar `formatDateTime` de `@/lib/format` (TZ Lima fija) |
| Imágenes uploadeadas no se ven | Falta restart de dev tras subir | Hot reload no detecta archivos en `public/uploads/` |
| Vitest no encuentra tests | Falta extensión `.test.ts` o ruta fuera de `src/` | Verificar `vitest.config.ts` `include` |
| Playwright dice "browser not found" | No corriste `playwright install` | `npx playwright install chromium` |

## Estado del proyecto

**Versión 0.1.0** — Fase 1 (MVP funcional).

Ver progreso paso a paso en [`../progreso-ferreteria.md`](../progreso-ferreteria.md).

### Decisiones diferidas a Fase 2
- Storage de imágenes en producción (Cloudinary / R2 / UploadThing)
- Impresora térmica + cajón de dinero (ESC/POS)
- Anulación de ventas cerradas
- Transferencias entre sucursales
- Reportes exportables (PDF / CSV avanzado)
- CRUD de múltiples cajas por sucursal (modelo ya lo soporta)
- Selector de sucursal funcional en el Topbar (hoy es display-only; filtros por página)
- CSP estricto con nonces
- Rate limit distribuido

## Licencia

Privado — uso interno.
