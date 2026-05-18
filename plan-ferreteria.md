# 📘 ferreteria-hco — Plan Maestro de Arquitectura

> **Versión:** 1.0 · **Fecha:** 2026-05-17
> **Proyecto:** Aplicación web interna de gestión para ferretería en Huánuco, Perú
> **Estado:** Diseño aprobado — listo para iniciar desarrollo paso a paso

---

## Tabla de contenidos

1. [Decisiones confirmadas](#1-decisiones-confirmadas)
2. [Stack técnico y justificaciones](#2-stack-técnico-y-justificaciones)
3. [Árbol de carpetas](#3-árbol-de-carpetas)
4. [Modelo de datos (Prisma)](#4-modelo-de-datos-prisma)
5. [Arquitectura de rutas](#5-arquitectura-de-rutas)
6. [Flujos de trabajo críticos](#6-flujos-de-trabajo-críticos)
7. [Estado global y tiempo real](#7-estado-global-y-tiempo-real)
8. [Diseño del dashboard](#8-diseño-del-dashboard)
9. [Módulo de configuración administrativa](#9-módulo-de-configuración-administrativa)
10. [Estrategia de almacenamiento de imágenes](#10-estrategia-de-almacenamiento-de-imágenes)
11. [Roadmap por fases](#11-roadmap-por-fases)
12. [Consideraciones de seguridad](#12-consideraciones-de-seguridad)
13. [Próximos pasos de implementación](#13-próximos-pasos-de-implementación)

---

## 1. Decisiones confirmadas

| Decisión | Valor | Implicancia |
|---|---|---|
| **Alcance geográfico** | Multi-sucursal desde día 1 | `storeId` en todas las entidades transaccionales |
| **Sucursales iniciales** | 1 sucursal (`HCO-001 — Central`) | Selector auto-selecciona la única en F1 |
| **Comprobantes** | Solo ticket interno (no fiscal) | Sin entidad `Comprobante`, sin integración SUNAT |
| **Métodos de pago** | Efectivo + Yape + Plin + Transferencia | Sin tarjeta, sin pago mixto, sin crédito en F1 |
| **Hardware** | Sin hardware en F1 | Cajón de dinero + impresora térmica → F2 |
| **Despliegue** | Railway | Desarrollo local primero; decisión de storage al primer deploy |
| **Configuración** | Global única (no por sucursal) | Singleton `AppSettings` editable desde `/admin/configuracion` |

---

## 2. Stack técnico y justificaciones

| Capa | Elección | Justificación |
|---|---|---|
| Framework | **Next.js 14+ App Router** | RSC reduce JS al cliente; Server Actions ideales para POS |
| Lenguaje | **TypeScript** estricto | Tipado end-to-end con Prisma + Zod |
| Estilos | **Tailwind CSS** | Estándar de facto, compatible con shadcn |
| ORM | **Prisma** | Tipado E2E, migraciones declarativas, ecosistema maduro |
| Base de datos | **PostgreSQL** | Relacional sólido, transacciones ACID, `SELECT FOR UPDATE` |
| Auth | **NextAuth v5 (Auth.js)** + Credentials + JWT + Prisma adapter | RBAC vía `session.user.role`, middleware edge |
| **Estado servidor** | **TanStack Query v5** | Cache, invalidación quirúrgica, optimistic updates, devtools |
| **Estado UI** | **Zustand** | Mínimo boilerplate, sin re-renders globales, `persist` middleware |
| UI Components | **shadcn/ui + Radix UI** | Componentes accesibles, copy-paste, totalmente customizables |
| Toast | **Sonner** | Oficial de shadcn, API mínima, soporta promesas |
| Gráficos | **Tremor v3** | Componentes de KPI/dashboard listos out-of-the-box |
| Validación | **Zod + React Hook Form** | Schema compartido cliente/servidor |
| Fechas | **date-fns + date-fns-tz** | Manejo de `America/Lima` |
| Tablas | **TanStack Table v8** | Paginación, ordenamiento, filtros |
| PDF/Reportes | `@react-pdf/renderer` | Reportes formales descargables |
| Ticket | CSS `@media print` + `window.print()` | Sin dependencia adicional |
| Tests | Vitest (unit) + Playwright (E2E) | Estándar moderno |

### Decisiones técnicas relevantes

**¿Por qué TanStack Query y NO SWR?** Ambos sirven, pero TanStack tiene mejor soporte para mutaciones complejas con invalidación encadenada (clave en ventas → invalidar stock + caja + dashboard simultáneamente) y devtools más maduras.

**¿Por qué Zustand y NO Jotai/Redux?** El estado UI local de este proyecto es simple (carrito, filtros, sidebar). Zustand tiene menos boilerplate que Redux y un modelo mental más predecible que Jotai para casos no-atómicos.

**¿Por qué Tremor y NO Recharts solo?** Tremor da componentes de alto nivel (`<KpiCard>`, `<BarList>`, `<AreaChart>`) que aceleran el dashboard. Por debajo usa Recharts; si necesitamos algo custom, bajamos a Recharts directamente.

---

## 3. Árbol de carpetas

```
ferreteria-hco/
├── .env.example                      # Plantilla de variables de entorno
├── .env.local                        # (gitignored) DATABASE_URL, NEXTAUTH_SECRET
├── .gitignore
├── docker-compose.yml                # Postgres + pgAdmin para desarrollo local
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
├── plan-ferreteria.md                # Este documento
│
├── prisma/
│   ├── schema.prisma                 # Modelo de datos (sección 4)
│   ├── seed.ts                       # Seed: roles, unidades, sucursal, admin, settings
│   └── migrations/
│
├── public/
│   ├── logo-default.svg
│   ├── uploads/                      # (gitignored) Storage local F1
│   └── icons/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   │
│   │   ├── (auth)/                   # Layout sin sidebar
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (admin)/                  # Layout admin — guard: role=ADMIN
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── productos/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── nuevo/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── categorias/page.tsx
│   │   │   ├── marcas/page.tsx
│   │   │   ├── unidades/page.tsx
│   │   │   ├── inventario/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── entradas/page.tsx
│   │   │   │   ├── ajustes/page.tsx
│   │   │   │   ├── transferencias/page.tsx
│   │   │   │   └── kardex/[productId]/page.tsx
│   │   │   ├── ventas/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── caja/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── sucursales/page.tsx
│   │   │   ├── usuarios/page.tsx
│   │   │   ├── reportes/
│   │   │   │   ├── ventas/page.tsx
│   │   │   │   ├── inventario/page.tsx
│   │   │   │   └── caja/page.tsx
│   │   │   ├── auditoria/page.tsx
│   │   │   └── configuracion/
│   │   │       ├── page.tsx          # Tabs: Identidad/Apariencia/Ticket/Operación
│   │   │       └── _components/
│   │   │           ├── identity-form.tsx
│   │   │           ├── appearance-form.tsx
│   │   │           ├── ticket-form.tsx
│   │   │           └── operations-form.tsx
│   │   │
│   │   ├── (vendedor)/               # Layout POS — guard: role=VENDOR|ADMIN
│   │   │   ├── layout.tsx
│   │   │   ├── pos/page.tsx
│   │   │   ├── caja/
│   │   │   │   ├── abrir/page.tsx
│   │   │   │   ├── cerrar/page.tsx
│   │   │   │   └── movimientos/page.tsx
│   │   │   ├── ventas/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── stock/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── productos/search/route.ts    # Autocomplete POS
│   │   │   ├── upload/route.ts              # Upload local de imágenes
│   │   │   ├── ticket/[saleId]/route.ts     # HTML del ticket
│   │   │   ├── stock/stream/route.ts        # SSE (F2)
│   │   │   └── healthz/route.ts
│   │   │
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Redirect según rol
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui generados
│   │   ├── layout/
│   │   │   ├── sidebar-admin.tsx
│   │   │   ├── sidebar-pos.tsx
│   │   │   ├── topbar.tsx
│   │   │   └── store-selector.tsx
│   │   ├── providers/
│   │   │   ├── query-provider.tsx    # TanStack Query
│   │   │   ├── session-provider.tsx  # NextAuth
│   │   │   ├── settings-provider.tsx # AppSettings + CSS vars
│   │   │   └── toast-provider.tsx    # Sonner
│   │   ├── pos/
│   │   │   ├── product-search.tsx
│   │   │   ├── cart.tsx
│   │   │   ├── payment-dialog.tsx
│   │   │   ├── ticket-preview.tsx
│   │   │   └── barcode-input.tsx
│   │   ├── inventory/
│   │   │   ├── stock-badge.tsx
│   │   │   ├── movement-form.tsx
│   │   │   └── kardex-table.tsx
│   │   ├── dashboard/
│   │   │   ├── kpi-card.tsx
│   │   │   ├── sales-chart.tsx
│   │   │   ├── top-products.tsx
│   │   │   └── stock-alerts.tsx
│   │   └── shared/
│   │       ├── data-table.tsx
│   │       ├── confirm-dialog.tsx
│   │       └── empty-state.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts                 # Singleton de PrismaClient
│   │   ├── auth.ts                   # Config NextAuth
│   │   ├── auth-guards.ts            # requireAdmin(), requireVendor()
│   │   ├── permissions.ts            # Matriz de permisos
│   │   ├── env.ts                    # Validación Zod de process.env
│   │   ├── format.ts                 # formatCurrency, formatDate
│   │   ├── ticket.ts                 # Generador HTML del ticket
│   │   ├── storage.ts                # Strategy: local/cloudinary/r2
│   │   ├── settings.ts               # getSettings() cacheado
│   │   └── audit.ts                  # Helper auditLog.create()
│   │
│   ├── server/
│   │   ├── actions/                  # Server Actions
│   │   │   ├── auth.actions.ts
│   │   │   ├── product.actions.ts
│   │   │   ├── inventory.actions.ts
│   │   │   ├── sale.actions.ts       # createSale — la más crítica
│   │   │   ├── cash.actions.ts
│   │   │   ├── settings.actions.ts
│   │   │   └── user.actions.ts
│   │   ├── services/                 # Lógica de negocio pura
│   │   │   ├── sale.service.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── cash.service.ts
│   │   │   └── audit.service.ts
│   │   └── queries/                  # Lecturas optimizadas
│   │       ├── dashboard.queries.ts
│   │       ├── product.queries.ts
│   │       ├── report.queries.ts
│   │       └── settings.queries.ts
│   │
│   ├── hooks/
│   │   ├── use-products.ts
│   │   ├── use-stock.ts
│   │   ├── use-cart.ts
│   │   ├── use-active-store.ts
│   │   ├── use-cash-session.ts
│   │   ├── use-settings.ts
│   │   └── use-keyboard-shortcuts.ts
│   │
│   ├── stores/                       # Zustand
│   │   ├── cart.store.ts
│   │   ├── ui.store.ts
│   │   └── active-store.store.ts
│   │
│   ├── schemas/                      # Zod (compartidos)
│   │   ├── product.schema.ts
│   │   ├── sale.schema.ts
│   │   ├── cash.schema.ts
│   │   ├── settings.schema.ts
│   │   └── user.schema.ts
│   │
│   ├── types/
│   │   ├── auth.d.ts
│   │   ├── prisma-extensions.ts
│   │   └── index.ts
│   │
│   ├── middleware.ts                 # Auth + RBAC en el edge
│   │
│   └── styles/
│       └── globals.css
│
└── tests/
    ├── unit/
    └── e2e/
```

---

## 4. Modelo de datos (Prisma)

### 4.1 Diagrama relacional

```
                ┌─────────┐
                │  Store  │ (sucursal)
                └────┬────┘
                     │ 1:N
       ┌─────────────┼───────────────┬──────────────┐
       │             │               │              │
   ┌───▼───┐    ┌────▼────┐    ┌─────▼──────┐  ┌────▼─────┐
   │ User  │    │  Stock  │    │CashRegister│  │  Sale   │
   └───┬───┘    └────┬────┘    └─────┬──────┘  └────┬─────┘
       │             │ N:1            │ 1:N         │ 1:N
       │ 1:N    ┌────▼────┐      ┌────▼───────┐  ┌──▼───────┐
       │        │ Product │      │CashSession │  │ SaleItem │
       │        └────┬────┘      └────┬───────┘  └──┬───────┘
       │             │ N:M            │ 1:N         │ N:1
       │       ┌─────▼──────┐    ┌────▼────────┐    │
       │       │ProductUnit │    │CashMovement │    │
       │       └─────┬──────┘    └─────────────┘    │
       │             │ N:1                          │
       │        ┌────▼────┐                         │
       │        │  Unit   │                         │
       │        └─────────┘                         │
       │                                            │
       │ 1:N      ┌─────────────────┐    1:N        │
       └─────────▶│InventoryMovement│◀──────────────┘
                  └─────────────────┘

   Category (self-ref, tree) ──N:1── Product ──N:1── Brand
   Sale ──1:N── SalePayment ──N:1── PaymentMethod
   AuditLog (cross-cutting)
   AppSettings (singleton id=1)
```

### 4.2 Entidades detalladas

#### `Store` — Sucursal
- `id`, `code` (unique, ej. `HCO-001`), `name`, `address`, `phone`, `isActive`, `timestamps`
- Relaciones: `users[]`, `stocks[]`, `cashRegisters[]`, `sales[]`, `inventoryMovements[]`

#### `User`
- `id`, `documentType` (enum: `DNI`|`CE`|`PAS`), `documentNumber` (string), `passwordHash`, `fullName`, `role` (enum: `ADMIN`|`VENDOR`), `storeId` (nullable), `isActive`, `timestamps`
- Unique compuesto: `(documentType, documentNumber)`
- Índices: `(documentNumber)`, `(storeId, role)`
- **Validaciones por tipo de documento** (en `src/schemas/auth.schema.ts`):
  - `DNI`: exactamente 8 dígitos numéricos (`^\d{8}$`)
  - `CE`: 9–12 caracteres alfanuméricos
  - `PAS`: 6–12 caracteres alfanuméricos
- Password: mínimo 8 caracteres (sin reglas de complejidad — uso interno)

#### `Category` (jerárquica)
- `id`, `name`, `slug`, `parentId` (self-ref nullable), `imageUrl`, `isActive`
- Índices: `(parentId)`, `(slug)`

#### `Brand`
- `id`, `name` (unique), `slug`, `logoUrl`, `isActive`

#### `Unit` — Catálogo cerrado
- `id`, `code` (`UN`, `CJ`, `MT`, `KG`, `LT`, `SC`), `name`, `symbol`

#### `Product`
- `id`, `sku` (unique), `barcode` (unique nullable), `name`, `description`, `categoryId`, `brandId` (nullable), `baseUnitId`, `images` (`String[]`), `costPrice` (Decimal), `salePrice` (Decimal), `isActive`, `timestamps`
- Índices: `(sku)`, `(barcode)`, `(name)` GIN trigram, `(categoryId)`, `(brandId)`

#### `ProductUnit` — Presentaciones (unidad/caja/etc.)
- `id`, `productId`, `unitId`, `factor` (Decimal — caja=24), `salePrice` (Decimal), `barcode` (nullable unique), `isDefault` (boolean)
- Unique: `(productId, unitId)`

#### `Stock` — Inventario por sucursal
- `id`, `productId`, `storeId`, `quantity` (Decimal), `minStock` (Decimal), `maxStock` (Decimal nullable), `version` (Int, lock optimista), `updatedAt`
- Unique: `(productId, storeId)` — crítico

#### `InventoryMovement` — Kardex (append-only)
- `id`, `productId`, `storeId`, `type` (enum: `ENTRY`|`EXIT`|`ADJUSTMENT`|`TRANSFER_OUT`|`TRANSFER_IN`|`SALE`|`SALE_VOID`), `quantity` (Decimal positivo), `unitCost` (Decimal nullable), `previousStock`, `newStock`, `reference`, `relatedTransferId`, `relatedSaleId`, `reason`, `userId`, `createdAt`
- Índice: `(productId, storeId, createdAt)`

#### `Transfer` — Transferencia entre sucursales
- `id`, `fromStoreId`, `toStoreId`, `status` (`DRAFT`|`IN_TRANSIT`|`RECEIVED`|`CANCELLED`), `notes`, `createdById`, `receivedById`, `createdAt`, `receivedAt`
- `TransferItem[]`: `productId`, `quantity`

#### `CashRegister` — Caja física
- `id`, `storeId`, `name` (`Caja 1`), `isActive`

#### `CashSession`
- `id`, `cashRegisterId`, `userId`, `openedAt`, `closedAt` (nullable), `openingAmount`, `expectedAmount`, `countedAmount` (nullable), `difference` (nullable), `status` (`OPEN`|`CLOSED`), `notes`
- Constraint: solo una sesión `OPEN` por caja

#### `CashMovement`
- `id`, `cashSessionId`, `type` (`SALE`|`INCOME`|`EXPENSE`|`WITHDRAWAL`|`DEPOSIT`), `amount`, `paymentMethodId`, `description`, `relatedSaleId`, `userId`, `createdAt`

#### `PaymentMethod` (seed)
- `id`, `code` (`CASH`|`YAPE`|`PLIN`|`TRANSFER`), `name`, `requiresReference` (boolean), `affectsCash` (boolean), `isActive`

#### `Sale`
- `id`, `code` (correlativo: `V-HCO-001-000123`), `storeId`, `cashSessionId`, `userId`, `subtotal`, `discount`, `total`, `status` (`COMPLETED`|`VOIDED`), `voidedAt`, `voidedById`, `voidReason`, `notes`, `createdAt`
- Índices: `(storeId, createdAt)`, `(cashSessionId)`, `(code)`

#### `SaleItem`
- `id`, `saleId`, `productId`, `productUnitId`, `quantity`, `unitPrice`, `discount`, `lineTotal`

#### `SalePayment`
- `id`, `saleId`, `paymentMethodId`, `amount`, `reference` (nullable, para Yape/Plin)

#### `AuditLog`
- `id`, `userId`, `action`, `entity`, `entityId`, `before` (Json), `after` (Json), `ip`, `userAgent`, `createdAt`
- Índices: `(entity, entityId)`, `(userId, createdAt)`

#### `AppSettings` (singleton — id=1)
```
Identidad
├── businessName, ruc, logoUrl, slogan
Apariencia
├── accentColor, darkModeDefault, faviconUrl
Ticket
├── ticketHeader, ticketFooter, thankYouMessage, showLogoOnTicket
Operación
├── currency, currencySymbol, igvPercent, timezone, defaultMinStock
Metadata
└── updatedAt, updatedById
```

### 4.3 Reglas de integridad (app-level)

1. No se puede crear `Sale` sin `CashSession.status = OPEN` del vendedor.
2. `Stock.quantity` nunca debe ser negativo — la transacción valida y revierte.
3. `CashRegister` solo puede tener **una** `CashSession` abierta.
4. `InventoryMovement` es append-only.
5. Anular `Sale` genera `InventoryMovement` tipo `SALE_VOID` + `CashMovement` negativo.

---

## 5. Arquitectura de rutas

### 5.1 Públicas
```
/login                        Login con tipo de documento + número + password
```

### 5.2 Admin (guard: ADMIN)
```
/dashboard                    KPIs cross-sucursal
/productos                    CRUD + filtros
/productos/nuevo
/productos/[id]               Detalle + presentaciones + kardex
/categorias                   Árbol jerárquico
/marcas
/unidades                     Solo lectura
/inventario                   Stock por sucursal
/inventario/entradas
/inventario/ajustes
/inventario/transferencias
/inventario/kardex/[productId]
/ventas                       Histórico
/ventas/[id]
/caja                         Sesiones de todas las cajas
/caja/[id]
/sucursales                   CRUD
/usuarios                     CRUD + asignación
/reportes/ventas
/reportes/inventario
/reportes/caja
/auditoria
/configuracion                Tabs: Identidad/Apariencia/Ticket/Operación
```

### 5.3 Vendedor (guard: VENDOR — ADMIN puede entrar)
```
/pos                          Pantalla POS principal
/caja/abrir
/caja/cerrar
/caja/movimientos
/ventas                       Mis ventas del turno
/ventas/[id]
/stock                        Consulta rápida
```

### 5.4 API HTTP (no Server Actions)
```
GET    /api/auth/[...nextauth]
GET    /api/productos/search           Autocomplete POS (debounced)
POST   /api/upload                     Upload local F1
GET    /api/ticket/[saleId]            HTML del ticket
GET    /api/stock/stream               SSE (F2)
GET    /api/healthz
```

**Regla:** mutaciones críticas (venta, ajuste, cierre de caja) → **Server Actions**. Lecturas y operaciones especiales → API Routes.

---

## 6. Flujos de trabajo críticos

### 6.1 Venta completa (POS)

```
[Vendedor] entra a /pos
   │ Valida CashSession.OPEN → si no, redirect /caja/abrir
   ▼
[Vendedor] busca: barcode O nombre/SKU
   │ GET /api/productos/search (TanStack Query, staleTime 30s)
   ▼
[Vendedor] elige presentación + cantidad → cart Zustand
   │ Repite hasta completar carrito
   ▼
[Vendedor] F4 → PaymentDialog
   │ Elige método (CASH/YAPE/PLIN/TRANSFER)
   │ Si requiresReference → pide nro operación
   ▼
[Server Action] createSale(input) dentro de prisma.$transaction:
   │ 1. Re-valida CashSession.OPEN (SELECT FOR UPDATE)
   │ 2. Por cada item:
   │    - Lee Stock con SELECT FOR UPDATE
   │    - Valida quantity >= solicitado
   │    - UPDATE Stock SET quantity -= X
   │    - INSERT InventoryMovement type=SALE
   │ 3. INSERT Sale + SaleItem[] + SalePayment[]
   │ 4. INSERT CashMovement (si efectivo)
   │ 5. INSERT AuditLog
   │ 6. Commit
   │
   │ Si cualquier paso falla → ROLLBACK total
   ▼
[Cliente] recibe { saleId } → abre /api/ticket/[saleId]
   │ window.print() para imprimir
   │ Sonner toast "Venta completada"
   ▼
[Sistema] invalida TanStack Query cache: stock, sales, dashboard
```

**Manejo de conflictos:**
- Lock pesimista en Postgres garantiza atomicidad
- Si stock insuficiente → error `INSUFFICIENT_STOCK` con stock actual
- UI muestra dialog específico para reajustar carrito

### 6.2 Apertura → ventas → cierre de caja

```
APERTURA — /caja/abrir
   - Selecciona CashRegister
   - Valida que no exista CashSession.OPEN
   - Ingresa openingAmount
   - INSERT CashSession status=OPEN + AuditLog

DURANTE TURNO
   - Cada Sale en efectivo → CashMovement SALE +amount
   - Vendedor registra manualmente:
     · INCOME ("Adelanto cliente")
     · EXPENSE ("Compra bolsas")
     · WITHDRAWAL ("Retiro para depósito")
   - expectedAmount = openingAmount + Σ movimientos efectivo

CIERRE — /caja/cerrar
   - Sistema muestra expectedAmount en vivo
   - Vendedor cuenta físico → countedAmount
   - difference = countedAmount - expectedAmount
   - Si difference ≠ 0 → confirma con razón
   - UPDATE CashSession status=CLOSED + AuditLog
   - Genera PDF arqueo
```

### 6.3 Entrada de mercadería

```
/inventario/entradas → "Nueva entrada"
   - Sucursal destino + referencia (orden compra)
   - Agrega productos: SKU/barcode, cantidad, costo
   - Submit → Server Action createInventoryEntry()
     · Por cada item:
       - UPDATE Stock +qty
       - INSERT InventoryMovement type=ENTRY
       - Actualiza Product.costPrice (promedio ponderado)
     · AuditLog
```

### 6.4 Ajuste de stock con justificación

```
/inventario/ajustes → "Nuevo ajuste"
   - Solo ADMIN
   - Sucursal + Producto → muestra stock actual
   - Ingresa nueva cantidad (no diferencia)
   - OBLIGATORIO: razón (ROTURA/MERMA/ROBO/ERROR_CONTEO/OTRO)
   - Si OTRO → campo texto obligatorio
   - Submit:
     · Lock Stock
     · UPDATE Stock SET quantity = newQty
     · INSERT InventoryMovement type=ADJUSTMENT con razón
     · AuditLog (siempre)
```

---

## 7. Estado global y tiempo real

### 7.1 Separación de responsabilidades

| Tipo | Herramienta | Ejemplos |
|---|---|---|
| Datos servidor | TanStack Query | Productos, stock, ventas, KPIs |
| UI efímera | Zustand | Carrito, sidebar, sucursal activa |
| Sesión | NextAuth `useSession` | Usuario, rol, storeId |
| Formularios | React Hook Form | Todos |

### 7.2 Tiempo real — Estrategia por fases

**Fase 1: Polling inteligente**
```typescript
useQuery({
  queryKey: ['product', sku, storeId],
  queryFn: ...,
  staleTime: 10_000,
  refetchInterval: 15_000,
  refetchOnWindowFocus: true,
})
```
+ `revalidateTag('stock')` en cada mutación que afecte stock.

**¿Por qué NO WebSockets en F1?**
- Postgres + Next.js serverless no tiene WS nativo
- Pusher/Ably cuestan dinero
- Para 3–10 vendedores concurrentes, polling cada 15s alcanza
- La protección REAL contra doble venta está en `SELECT FOR UPDATE` del lado servidor

**Fase 2: Server-Sent Events**
- Endpoint `/api/stock/stream` con `ReadableStream`
- Cliente invalida queries al recibir evento

### 7.3 Prevención de doble venta

**Capas defensivas:**
1. UI optimista (no es fuente de verdad)
2. Pre-validación al agregar al carrito
3. **Validación definitiva en transacción con `SELECT FOR UPDATE`**
4. Constraint app-level: stock ≥ 0
5. Error específico → dialog claro al vendedor

---

## 8. Diseño del dashboard

### 8.1 Layout admin (estilo Vercel/Linear/Tremor)

```
┌─────────────────────────────────────────────────────────────────┐
│ [≡] Ferretería HCO   [Sucursal▼] [🔔] [👤 Admin]                │
├──────────┬──────────────────────────────────────────────────────┤
│ Sidebar  │  Dashboard                                            │
│          │  ┌─────────┬─────────┬─────────┬─────────┐           │
│ ▢ Dash   │  │ Ventas  │ Tickets │ Ticket  │ Stock   │           │
│ ▢ Prod   │  │  Hoy    │  Hoy    │ Promedio│ Crítico │           │
│ ▢ Inv    │  │ S/.2840 │   34    │  S/.83  │   12    │           │
│ ▢ Ventas │  └─────────┴─────────┴─────────┴─────────┘           │
│ ▢ Caja   │                                                       │
│ ▢ Usr    │  ┌──────────────────────────┬─────────────────────┐  │
│ ▢ Rep    │  │ Ventas últimos 7 días    │ Top 5 productos     │  │
│ ▢ Aud    │  │ [AreaChart Tremor]       │ [BarList Tremor]    │  │
│ ⚙ Conf   │  └──────────────────────────┴─────────────────────┘  │
│          │  ┌──────────────────────────┬─────────────────────┐  │
│          │  │ Estado de cajas hoy      │ Stock crítico       │  │
│          │  │ Caja 1 Centro: ABIERTA   │ Tornillo 1/4"       │  │
│          │  └──────────────────────────┴─────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────┘
```

- **Sidebar:** 240px desktop / drawer mobile, agrupada por dominios
- **Topbar:** logo, selector sucursal, búsqueda global (`Cmd+K`), notificaciones, avatar
- **KPI Cards:** Tremor `<Card>` con `<Metric>` + delta vs ayer
- **Responsive:** 4 cols → 2 cols → 1 col
- **Tema:** light por defecto, dark opcional; paleta neutra + acento configurable

### 8.2 Layout POS (minimalista, alta densidad)

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] Caja #1 - Central │ Vendedor: J.Pérez │ [Cerrar Caja]  │
├──────────────────────────────┬─────────────────────────────────┤
│ 🔍 Buscar / Escanear         │  Carrito (3 items)             │
│ ┌──────────────────────────┐ │  ─────────────────────────     │
│ │ Cemento Sol x42.5kg      │ │  Cemento Sol    2 SC  ×17.50  │
│ │ SKU: CEM-001  Stock: 87  │ │  Tornillo 1/4" 10 UN  × 0.50  │
│ └──────────────────────────┘ │  Lija 220       1 UN  × 1.20  │
│                              │  ─────────────────────────     │
│ [Categorías rápidas]         │  Subtotal:       S/. 41.20    │
│ [Cemento][Tubos][Pintura]    │  Descuento:      S/.  0.00    │
│                              │  TOTAL:          S/. 41.20    │
│                              │                                │
│                              │  [F4 - COBRAR]                 │
│                              │  [F8 - Anular] [Esc - Limpiar] │
└──────────────────────────────┴─────────────────────────────────┘
```

Énfasis en **atajos de teclado** + **input siempre con foco** (lectores barcode actúan como teclado).

---

## 9. Módulo de configuración administrativa

### 9.1 Entidad `AppSettings` (singleton)

```
AppSettings (id=1)
├── Identidad
│   ├── businessName        string
│   ├── ruc                 string (11 dígitos)
│   ├── logoUrl             string nullable
│   └── slogan              string nullable
├── Apariencia
│   ├── accentColor         string (#RRGGBB)
│   ├── darkModeDefault     boolean
│   └── faviconUrl          string nullable
├── Ticket
│   ├── ticketHeader        text multilínea
│   ├── ticketFooter        text multilínea
│   ├── thankYouMessage     string
│   └── showLogoOnTicket    boolean
├── Operación
│   ├── currency            string default "PEN"
│   ├── currencySymbol      string default "S/"
│   ├── igvPercent          decimal default 18.00
│   ├── timezone            string default "America/Lima"
│   └── defaultMinStock     decimal default 5
└── updatedAt, updatedById
```

### 9.2 Cómo se aplica en runtime

- Cache en TanStack Query con `staleTime: Infinity` + invalidación al guardar
- **Colores:** inyectados como CSS variables (`--accent`) en `<html>`, aplicados vía Tailwind (`bg-accent`)
- **Logo, RUC, mensajes:** consumidos por `ticket.ts` al generar comprobantes
- **`igvPercent`, `currency`:** leídos por `format.ts`

### 9.3 UI — `/admin/configuracion`

Página con 4 tabs:
1. **Identidad** — logo (upload), nombre, RUC, slogan
2. **Apariencia** — color picker, dark mode toggle, favicon
3. **Ticket** — encabezado, pie, mensaje agradecimiento, toggle logo
4. **Operación** — moneda, IGV %, timezone, stock mínimo default

---

## 10. Estrategia de almacenamiento de imágenes

### 10.1 Decisión: Local-first

**Fase de desarrollo (ahora):**
- Subidas a `public/uploads/` (gitignored)
- Endpoint `POST /api/upload` con `fs.writeFile`
- BD guarda ruta relativa (`/uploads/logo-abc123.png`)

**Al desplegar a Railway:**
- Decisión postergada hasta primer deploy
- Opciones: Cloudinary (gratis 25GB) / UploadThing / Cloudflare R2 / Railway Volumes

### 10.2 Patrón Strategy en `lib/storage.ts`

```
StorageProvider interface:
  upload(file): Promise<{ url: string }>
  delete(url): Promise<void>

Implementaciones:
  - LocalStorageProvider (F1)
  - CloudinaryProvider (futuro)
  - R2Provider (futuro)

env.STORAGE_PROVIDER define cuál se carga
```

Esto permite cambiar de adaptador **sin tocar lógica de negocio**.

---

## 11. Roadmap por fases

### Fase 1 — MVP funcional (4–6 semanas)

| # | Hito | Entregable |
|---|---|---|
| 1.1 | Setup base | Repo inicializado, Postgres docker, Prisma migrado, NextAuth funcionando |
| 1.2 | Configuración + Sucursales | `AppSettings` editable, CRUD sucursales, 1 sucursal demo |
| 1.3 | Usuarios y RBAC | CRUD usuarios, middleware con guards, login funcional |
| 1.4 | Catálogos | CRUD categorías (árbol), marcas, unidades (catálogo) |
| 1.5 | Productos | CRUD productos, presentaciones (`ProductUnit`), búsqueda |
| 1.6 | Inventario inicial | Entradas de mercadería, stock por sucursal, kardex básico |
| 1.7 | Caja | Apertura, movimientos manuales, cierre con arqueo |
| 1.8 | POS | Búsqueda, carrito, cobro, transacción atómica, ticket HTML |
| 1.9 | Dashboard | KPIs + 2 gráficos (ventas 7 días, top productos) |
| 1.10 | Auditoría mínima | Log de acciones críticas, vista `/admin/auditoria` |

### Fase 2 — Operación robusta (3–4 semanas)

- Transferencias entre sucursales
- Ajustes de inventario con razón
- Kardex completo por producto
- Anulación de ventas
- Reportes exportables (PDF/Excel)
- Impresión térmica + apertura de cajón (ESC/POS)
- Lector de barcode optimizado
- SSE para invalidación de stock en tiempo real

### Fase 3 — Crecimiento

- Pago mixto
- Clientes y crédito (CxC)
- Devoluciones parciales
- Promociones y descuentos por cantidad
- SUNAT (boleta/factura electrónica)
- PWA para conteo físico

---

## 12. Consideraciones de seguridad

### 12.1 Protección de rutas
- `middleware.ts` valida sesión + rol en cada request
- `/admin/*` → `role === ADMIN`
- `/pos`, `/caja/*` → `role === VENDOR` o `ADMIN`
- Login redirige según rol

### 12.2 Validación en servidor
- **Toda Server Action valida con Zod ANTES de tocar BD**
- Schemas compartidos en `src/schemas/`
- El cliente NUNCA es fuente de verdad: precios, stock, descuentos se re-validan

### 12.3 Sesiones
- JWT 8h con rotación al refrescar
- `httpOnly`, `sameSite=lax`, `secure` en prod
- `NEXTAUTH_SECRET` rotable

### 12.4 Prevención doble venta
- `prisma.$transaction` + `SELECT FOR UPDATE` sobre `Stock`
- Stock no negativo (validación + check constraint)
- Errores tipados (`INSUFFICIENT_STOCK`)

### 12.5 Otras protecciones
- Rate limiting en `/api/auth`
- CSRF nativo de Server Actions
- Sanitización por Zod (rechazo, no escape)
- NUNCA loguear passwords, tokens, datos de Yape/Plin
- Headers: `CSP`, `HSTS`, `X-Frame-Options=DENY`
- **Auditoría obligatoria en:** login, ajuste stock, anulación venta, cierre de caja con diferencia, creación/desactivación usuario, cambio de precio, cambio de configuración

---

## 13. Próximos pasos de implementación

> Ejecutar en orden. Cada paso es un commit/PR auto-contenido.

### Paso 1: Bootstrap del proyecto
- `package.json` con todas las dependencias
- Configs: `tsconfig`, `tailwind`, `next.config`, `.env.example`, `.gitignore`
- `docker-compose.yml` con Postgres
- `README.md` con instrucciones de arranque
- Inicializar shadcn/ui

### Paso 2: Base de datos
- `prisma/schema.prisma` con todas las entidades
- Primera migración
- `prisma/seed.ts`: roles, unidades, payment methods, sucursal demo `HCO-001`, admin inicial, `AppSettings` default

### Paso 3: Autenticación
- Config NextAuth con Credentials + Prisma adapter
- `middleware.ts` con guards por rol
- `/login` con form (RHF + Zod)
- Redirect post-login según rol

### Paso 4: Layout base + Settings provider
- Root layout con providers (TanStack Query, Session, Settings, Toast)
- Layouts `(admin)` y `(vendedor)`
- Sidebars + topbar
- `SettingsProvider` que inyecta CSS vars

### Paso 5: Módulo Configuración
- Página `/admin/configuracion` con tabs
- Server Actions de settings
- Upload local de logo

### Paso 6: Sucursales y Usuarios
- CRUD `/admin/sucursales`
- CRUD `/admin/usuarios` con asignación de sucursal

### Paso 7: Catálogos
- Categorías (árbol), marcas, unidades

### Paso 8: Productos
- CRUD productos
- Presentaciones (`ProductUnit`)
- Búsqueda con autocomplete

### Paso 9: Inventario base
- Entrada de mercadería
- Vista de stock por sucursal
- Kardex básico

### Paso 10: Caja
- Apertura, cierre, movimientos manuales

### Paso 11: POS (lo más crítico)
- Pantalla `/pos`
- Carrito Zustand
- Server Action `createSale` con transacción atómica
- Generación de ticket HTML

### Paso 12: Dashboard
- KPIs en tiempo casi real
- Gráficos Tremor

### Paso 13: Auditoría
- Vista `/admin/auditoria` con filtros

### Paso 14: Pulido + Tests
- Tests E2E del flujo de venta
- Revisión de seguridad
- Documentación final

---

## Notas finales

- Este documento es la **fuente de verdad** del proyecto durante la Fase 1.
- Cualquier desviación debe actualizarse aquí antes de implementarse.
- Decisiones pendientes (a definir cuando llegue el momento):
  - Provider de storage al desplegar a Railway
  - Esquema visual final (paleta corporativa) — configurable desde la app
