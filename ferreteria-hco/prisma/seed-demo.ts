/**
 * Seed de datos demo: ~80 productos representativos de ferretería peruana,
 * stock inicial, 15 ventas de ejemplo distribuidas en los últimos 7 días.
 *
 * Idempotente:
 *   - Productos: upsert por SKU (SEED-001..SEED-080)
 *   - Supplier demo: upsert por RUC
 *   - Vendor demo: upsert por documento (DNI 11111111)
 *   - Stock inicial: solo si no existe el row
 *   - Ventas demo: solo si no hay ventas con código "V-HCO-001-D*"
 *
 * Para resetear y regenerar: `npm run db:reset`
 */

import {
  PrismaClient,
  DocumentType,
  Gender,
  Role,
  type Store,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { slugify } from "../src/lib/slug";

// ════════════════════════════════════════════════════════════
// CATÁLOGO DEMO — ~80 productos representativos
// ════════════════════════════════════════════════════════════

type ProductSeed = {
  sku: string;
  name: string;
  /** slug o nombre de la categoría (raíz o sub) */
  category: string;
  brand?: string;
  /** código de unidad: UN | CJ | MT | KG | LT | SC */
  unit: string;
  salePrice: number; // PEN, incluye IGV (precio mostrado al cliente)
  barcode?: string;  // EAN-13 demo (prefijo 775 Perú)
  minStock: number;
  initialStock: number;
};

const PRODUCTS: ProductSeed[] = [
  // ───────────── CONSTRUCCIÓN ─────────────
  { sku: "SEED-001", name: "cemento sol tipo i x 42.5 kg", category: "cemento", brand: "sol", unit: "SC", salePrice: 24.50, barcode: "7751000000018", minStock: 20, initialStock: 100 },
  { sku: "SEED-002", name: "cemento pacasmayo tipo ip x 42.5 kg", category: "cemento", brand: "pacasmayo", unit: "SC", salePrice: 25.90, barcode: "7751000000025", minStock: 15, initialStock: 80 },
  { sku: "SEED-003", name: "cemento sol antisalitre tipo he", category: "cemento", brand: "sol", unit: "SC", salePrice: 26.50, barcode: "7751000000032", minStock: 10, initialStock: 40 },
  { sku: "SEED-004", name: "cemento yura tipo ip", category: "cemento", brand: "yura", unit: "SC", salePrice: 23.80, barcode: "7751000000049", minStock: 10, initialStock: 60 },
  { sku: "SEED-005", name: "ladrillo king kong 18 huecos", category: "ladrillos y bloques", brand: "lark", unit: "UN", salePrice: 1.10, barcode: "7751000000056", minStock: 200, initialStock: 2000 },
  { sku: "SEED-006", name: "ladrillo pandereta 9x12x24", category: "ladrillos y bloques", brand: "lark", unit: "UN", salePrice: 0.85, barcode: "7751000000063", minStock: 200, initialStock: 1500 },
  { sku: "SEED-007", name: "bloque de concreto 12x20x40", category: "ladrillos y bloques", unit: "UN", salePrice: 2.40, barcode: "7751000000070", minStock: 100, initialStock: 500 },
  { sku: "SEED-008", name: "saco de arena gruesa 40 kg", category: "agregados", unit: "SC", salePrice: 12.00, barcode: "7751000000087", minStock: 30, initialStock: 150 },
  { sku: "SEED-009", name: "saco de piedra chancada 1/2 pulgada 40 kg", category: "agregados", unit: "SC", salePrice: 14.50, barcode: "7751000000094", minStock: 30, initialStock: 120 },
  { sku: "SEED-010", name: "fierro corrugado 1/2 pulgada x 9m", category: "aceros y fierros", brand: "aceros arequipa", unit: "UN", salePrice: 58.00, barcode: "7751000000100", minStock: 30, initialStock: 200 },
  { sku: "SEED-011", name: "fierro corrugado 3/8 pulgada x 9m", category: "aceros y fierros", brand: "aceros arequipa", unit: "UN", salePrice: 32.50, barcode: "7751000000117", minStock: 30, initialStock: 250 },
  { sku: "SEED-012", name: "fierro corrugado 5/8 pulgada x 9m", category: "aceros y fierros", brand: "aceros arequipa", unit: "UN", salePrice: 88.00, barcode: "7751000000124", minStock: 15, initialStock: 80 },
  { sku: "SEED-013", name: "alambre negro recocido n°8 (kg)", category: "aceros y fierros", unit: "KG", salePrice: 6.80, barcode: "7751000000131", minStock: 20, initialStock: 80 },
  { sku: "SEED-014", name: "alambre n°16 (kg)", category: "aceros y fierros", unit: "KG", salePrice: 7.20, barcode: "7751000000148", minStock: 15, initialStock: 60 },
  { sku: "SEED-015", name: "clavos 2 1/2 pulgada (kg)", category: "ferretería general", unit: "KG", salePrice: 8.50, barcode: "7751000000155", minStock: 15, initialStock: 50 },
  { sku: "SEED-016", name: "clavos 3 pulgada (kg)", category: "ferretería general", unit: "KG", salePrice: 8.20, barcode: "7751000000162", minStock: 15, initialStock: 50 },
  { sku: "SEED-017", name: "sika-1 impermeabilizante x 1 gal", category: "aditivos para concreto", brand: "sika", unit: "UN", salePrice: 28.50, barcode: "7751000000179", minStock: 10, initialStock: 35 },
  { sku: "SEED-018", name: "chema impermeabilizante elastomérico", category: "impermeabilizantes", brand: "chema", unit: "UN", salePrice: 72.00, barcode: "7751000000186", minStock: 5, initialStock: 18 },

  // ───────────── PINTURAS ─────────────
  { sku: "SEED-019", name: "pintura látex blanco interior x 1 gal", category: "látex", brand: "vencedor", unit: "UN", salePrice: 78.00, barcode: "7751000000193", minStock: 10, initialStock: 40 },
  { sku: "SEED-020", name: "pintura látex satinado x 1 gal", category: "látex", brand: "cpp", unit: "UN", salePrice: 92.00, barcode: "7751000000209", minStock: 8, initialStock: 28 },
  { sku: "SEED-021", name: "pintura esmalte sintético blanco x 1 gal", category: "esmaltes", brand: "tekno", unit: "UN", salePrice: 95.00, barcode: "7751000000216", minStock: 8, initialStock: 30 },
  { sku: "SEED-022", name: "pintura anticorrosiva x 1 gal", category: "esmaltes", brand: "tricolor", unit: "UN", salePrice: 88.00, barcode: "7751000000223", minStock: 6, initialStock: 22 },
  { sku: "SEED-023", name: "barniz madera transparente x 1 gal", category: "barnices", brand: "anypsa", unit: "UN", salePrice: 65.00, barcode: "7751000000230", minStock: 5, initialStock: 18 },
  { sku: "SEED-024", name: "thinner acrílico x 1 gal", category: "solventes y diluyentes", brand: "tekno", unit: "UN", salePrice: 28.00, barcode: "7751000000247", minStock: 10, initialStock: 45 },
  { sku: "SEED-025", name: "brocha 3 pulgadas", category: "brochas y rodillos", brand: "tumi", unit: "UN", salePrice: 8.50, barcode: "7751000000254", minStock: 15, initialStock: 60 },
  { sku: "SEED-026", name: "brocha 4 pulgadas", category: "brochas y rodillos", brand: "tumi", unit: "UN", salePrice: 11.00, barcode: "7751000000261", minStock: 15, initialStock: 50 },
  { sku: "SEED-027", name: "rodillo de lana 9 pulgadas", category: "brochas y rodillos", unit: "UN", salePrice: 12.50, barcode: "7751000000278", minStock: 10, initialStock: 40 },
  { sku: "SEED-028", name: "spray aerosol negro mate", category: "spray y aerosoles", brand: "tekno", unit: "UN", salePrice: 14.50, barcode: "7751000000285", minStock: 12, initialStock: 50 },

  // ───────────── HERRAMIENTAS ─────────────
  { sku: "SEED-029", name: "taladro percutor 13mm 650w", category: "herramientas eléctricas", brand: "bosch", unit: "UN", salePrice: 349.00, barcode: "7751000000292", minStock: 3, initialStock: 12 },
  { sku: "SEED-030", name: "esmeril angular 4 1/2 pulgada 720w", category: "herramientas eléctricas", brand: "makita", unit: "UN", salePrice: 289.00, barcode: "7751000000308", minStock: 3, initialStock: 10 },
  { sku: "SEED-031", name: "sierra circular 7 1/4 pulgada", category: "herramientas eléctricas", brand: "bosch", unit: "UN", salePrice: 459.00, barcode: "7751000000315", minStock: 2, initialStock: 6 },
  { sku: "SEED-032", name: "martillo de uña 16 oz", category: "herramientas manuales", brand: "stanley", unit: "UN", salePrice: 38.00, barcode: "7751000000322", minStock: 8, initialStock: 25 },
  { sku: "SEED-033", name: "destornillador plano 1/4 x 6 pulgada", category: "herramientas manuales", brand: "stanley", unit: "UN", salePrice: 12.50, barcode: "7751000000339", minStock: 15, initialStock: 50 },
  { sku: "SEED-034", name: "destornillador estrella ph2 x 6 pulgada", category: "herramientas manuales", brand: "stanley", unit: "UN", salePrice: 12.50, barcode: "7751000000346", minStock: 15, initialStock: 50 },
  { sku: "SEED-035", name: "llave francesa 12 pulgada", category: "herramientas manuales", brand: "truper", unit: "UN", salePrice: 45.00, barcode: "7751000000353", minStock: 6, initialStock: 18 },
  { sku: "SEED-036", name: "llave stillson 14 pulgada", category: "herramientas manuales", brand: "truper", unit: "UN", salePrice: 68.00, barcode: "7751000000360", minStock: 5, initialStock: 12 },
  { sku: "SEED-037", name: "wincha 5m", category: "medición", brand: "stanley", unit: "UN", salePrice: 18.00, barcode: "7751000000377", minStock: 12, initialStock: 40 },
  { sku: "SEED-038", name: "wincha 8m", category: "medición", brand: "stanley", unit: "UN", salePrice: 28.00, barcode: "7751000000384", minStock: 8, initialStock: 25 },
  { sku: "SEED-039", name: "nivel de burbuja 60cm", category: "medición", brand: "stanley", unit: "UN", salePrice: 35.00, barcode: "7751000000391", minStock: 5, initialStock: 15 },
  { sku: "SEED-040", name: "disco de corte metal 4 1/2 pulgada", category: "accesorios y discos", brand: "bosch", unit: "UN", salePrice: 4.50, barcode: "7751000000407", minStock: 50, initialStock: 200 },
  { sku: "SEED-041", name: "disco diamantado 7 pulgada", category: "accesorios y discos", brand: "bosch", unit: "UN", salePrice: 32.00, barcode: "7751000000414", minStock: 10, initialStock: 30 },
  { sku: "SEED-042", name: "alicate universal 8 pulgada", category: "herramientas manuales", brand: "truper", unit: "UN", salePrice: 24.00, barcode: "7751000000421", minStock: 10, initialStock: 30 },

  // ───────────── PLOMERÍA ─────────────
  { sku: "SEED-043", name: "tubo pvc desagüe 4 pulgada x 3m", category: "tubos pvc", brand: "pavco", unit: "UN", salePrice: 48.00, barcode: "7751000000438", minStock: 15, initialStock: 60 },
  { sku: "SEED-044", name: "tubo pvc desagüe 2 pulgada x 3m", category: "tubos pvc", brand: "pavco", unit: "UN", salePrice: 22.00, barcode: "7751000000445", minStock: 20, initialStock: 80 },
  { sku: "SEED-045", name: "tubo pvc agua c-10 1/2 pulgada x 5m", category: "tubos pvc", brand: "pavco", unit: "UN", salePrice: 18.50, barcode: "7751000000452", minStock: 20, initialStock: 75 },
  { sku: "SEED-046", name: "tubo pvc agua c-10 3/4 pulgada x 5m", category: "tubos pvc", brand: "pavco", unit: "UN", salePrice: 28.00, barcode: "7751000000469", minStock: 15, initialStock: 55 },
  { sku: "SEED-047", name: "codo pvc 90° 1/2 pulgada", category: "accesorios pvc", brand: "pavco", unit: "UN", salePrice: 1.20, barcode: "7751000000476", minStock: 50, initialStock: 200 },
  { sku: "SEED-048", name: "tee pvc 1/2 pulgada", category: "accesorios pvc", brand: "pavco", unit: "UN", salePrice: 1.50, barcode: "7751000000483", minStock: 50, initialStock: 200 },
  { sku: "SEED-049", name: "caño con base lavatorio cromado", category: "grifería", brand: "trebol", unit: "UN", salePrice: 85.00, barcode: "7751000000490", minStock: 4, initialStock: 12 },
  { sku: "SEED-050", name: "inodoro rapid jet blanco", category: "sanitarios", brand: "trebol", unit: "UN", salePrice: 285.00, barcode: "7751000000506", minStock: 2, initialStock: 6 },
  { sku: "SEED-051", name: "lavatorio oval blanco", category: "sanitarios", brand: "trebol", unit: "UN", salePrice: 95.00, barcode: "7751000000513", minStock: 3, initialStock: 8 },
  { sku: "SEED-052", name: "pegamento pvc azul x 1/4 gal", category: "pegamentos y adhesivos", brand: "oatey", unit: "UN", salePrice: 18.50, barcode: "7751000000520", minStock: 15, initialStock: 45 },

  // ───────────── ELÉCTRICOS ─────────────
  { sku: "SEED-053", name: "cable thw 14 awg rojo x 100m", category: "cables y alambres", brand: "indeco", unit: "UN", salePrice: 145.00, barcode: "7751000000537", minStock: 4, initialStock: 15 },
  { sku: "SEED-054", name: "cable thw 12 awg negro x 100m", category: "cables y alambres", brand: "indeco", unit: "UN", salePrice: 215.00, barcode: "7751000000544", minStock: 4, initialStock: 12 },
  { sku: "SEED-055", name: "cable vulcan tw 14 (m)", category: "cables y alambres", brand: "indeco", unit: "MT", salePrice: 1.65, barcode: "7751000000551", minStock: 100, initialStock: 500 },
  { sku: "SEED-056", name: "tomacorriente doble magic blanco", category: "tomacorrientes e interruptores", brand: "bticino", unit: "UN", salePrice: 18.50, barcode: "7751000000568", minStock: 15, initialStock: 50 },
  { sku: "SEED-057", name: "interruptor simple magic", category: "tomacorrientes e interruptores", brand: "bticino", unit: "UN", salePrice: 14.00, barcode: "7751000000575", minStock: 20, initialStock: 70 },
  { sku: "SEED-058", name: "llave termomagnética 20a", category: "tableros y breakers", brand: "bticino", unit: "UN", salePrice: 28.00, barcode: "7751000000582", minStock: 10, initialStock: 30 },
  { sku: "SEED-059", name: "foco led 9w e27 luz blanca", category: "iluminación", brand: "philips", unit: "UN", salePrice: 12.50, barcode: "7751000000599", minStock: 20, initialStock: 80 },
  { sku: "SEED-060", name: "cinta aislante negra 18mm", category: "ferretería general", brand: "3m", unit: "UN", salePrice: 4.50, barcode: "7751000000605", minStock: 30, initialStock: 100 },

  // ───────────── CERRAJERÍA / FERRETERÍA GENERAL ─────────────
  { sku: "SEED-061", name: "candado 50mm bronce", category: "cerrajería", brand: "yale", unit: "UN", salePrice: 32.00, barcode: "7751000000612", minStock: 10, initialStock: 35 },
  { sku: "SEED-062", name: "candado 60mm acero", category: "cerrajería", brand: "forte", unit: "UN", salePrice: 42.00, barcode: "7751000000629", minStock: 8, initialStock: 25 },
  { sku: "SEED-063", name: "cerradura embutir blanca", category: "cerrajería", brand: "yale", unit: "UN", salePrice: 95.00, barcode: "7751000000636", minStock: 5, initialStock: 15 },
  { sku: "SEED-064", name: "bisagra 3 pulgada acero", category: "ferretería general", brand: "stanley", unit: "UN", salePrice: 6.80, barcode: "7751000000643", minStock: 20, initialStock: 80 },
  { sku: "SEED-065", name: "tornillo 1/8 x 1 pulgada autorroscante (kg)", category: "ferretería general", unit: "KG", salePrice: 22.00, barcode: "7751000000650", minStock: 8, initialStock: 25 },
  { sku: "SEED-066", name: "tornillo madera 1 pulgada cabeza estrella (kg)", category: "ferretería general", unit: "KG", salePrice: 24.00, barcode: "7751000000667", minStock: 8, initialStock: 25 },
  { sku: "SEED-067", name: "perno 5/16 x 2 pulgada zincado (kg)", category: "ferretería general", unit: "KG", salePrice: 18.50, barcode: "7751000000674", minStock: 8, initialStock: 25 },

  // ───────────── PEGAMENTOS ─────────────
  { sku: "SEED-068", name: "silicona transparente 280ml", category: "pegamentos y adhesivos", brand: "loctite", unit: "UN", salePrice: 16.50, barcode: "7751000000681", minStock: 15, initialStock: 50 },
  { sku: "SEED-069", name: "soldimix 10 min epoxi", category: "pegamentos y adhesivos", brand: "soldimix", unit: "UN", salePrice: 9.50, barcode: "7751000000698", minStock: 20, initialStock: 60 },
  { sku: "SEED-070", name: "pegamento de contacto 250ml", category: "pegamentos y adhesivos", brand: "terokal", unit: "UN", salePrice: 22.00, barcode: "7751000000704", minStock: 10, initialStock: 35 },

  // ───────────── SEGURIDAD ─────────────
  { sku: "SEED-071", name: "casco de seguridad amarillo", category: "seguridad industrial", brand: "steelpro", unit: "UN", salePrice: 32.00, barcode: "7751000000711", minStock: 8, initialStock: 25 },
  { sku: "SEED-072", name: "guantes nitrilo talla l (par)", category: "seguridad industrial", unit: "UN", salePrice: 6.50, barcode: "7751000000728", minStock: 30, initialStock: 100 },
  { sku: "SEED-073", name: "lentes de seguridad transparentes", category: "seguridad industrial", brand: "steelpro", unit: "UN", salePrice: 8.50, barcode: "7751000000735", minStock: 20, initialStock: 60 },
  { sku: "SEED-074", name: "mascarilla n95 (caja x 10)", category: "seguridad industrial", brand: "3m", unit: "CJ", salePrice: 95.00, barcode: "7751000000742", minStock: 5, initialStock: 15 },

  // ───────────── JARDINERÍA ─────────────
  { sku: "SEED-075", name: "manguera de jardín 1/2 pulgada x 15m", category: "jardinería", unit: "UN", salePrice: 42.00, barcode: "7751000000759", minStock: 5, initialStock: 15 },
  { sku: "SEED-076", name: "tijera de podar acero", category: "jardinería", brand: "truper", unit: "UN", salePrice: 38.00, barcode: "7751000000766", minStock: 6, initialStock: 18 },
  { sku: "SEED-077", name: "pala punta cuadrada con cabo", category: "jardinería", brand: "truper", unit: "UN", salePrice: 52.00, barcode: "7751000000773", minStock: 5, initialStock: 15 },

  // ───────────── LIMPIEZA ─────────────
  { sku: "SEED-078", name: "escoba plástica con palo", category: "limpieza", unit: "UN", salePrice: 12.50, barcode: "7751000000780", minStock: 10, initialStock: 30 },
  { sku: "SEED-079", name: "cubeta plástica 10 litros", category: "limpieza", unit: "UN", salePrice: 14.50, barcode: "7751000000797", minStock: 10, initialStock: 25 },

  // ───────────── ILUMINACIÓN ─────────────
  { sku: "SEED-080", name: "lámpara led panel 24w cuadrada", category: "iluminación", brand: "philips", unit: "UN", salePrice: 58.00, barcode: "7751000000803", minStock: 8, initialStock: 25 },
];

// ════════════════════════════════════════════════════════════
// VENTAS DEMO — 15 ventas distribuidas en últimos 7 días
// ════════════════════════════════════════════════════════════

type DemoSale = {
  daysAgo: number;
  hour: number; // 0-23 hora Lima
  items: { sku: string; qty: number }[];
  payment: "CASH" | "YAPE" | "PLIN";
};

const DEMO_SALES: DemoSale[] = [
  { daysAgo: 6, hour: 10, payment: "CASH", items: [{ sku: "SEED-001", qty: 5 }, { sku: "SEED-013", qty: 2 }] },
  { daysAgo: 6, hour: 14, payment: "YAPE", items: [{ sku: "SEED-019", qty: 1 }, { sku: "SEED-025", qty: 2 }] },
  { daysAgo: 5, hour: 9,  payment: "CASH", items: [{ sku: "SEED-010", qty: 4 }, { sku: "SEED-011", qty: 6 }] },
  { daysAgo: 5, hour: 15, payment: "CASH", items: [{ sku: "SEED-032", qty: 2 }, { sku: "SEED-033", qty: 3 }, { sku: "SEED-034", qty: 3 }] },
  { daysAgo: 4, hour: 11, payment: "PLIN", items: [{ sku: "SEED-029", qty: 1 }] },
  { daysAgo: 4, hour: 16, payment: "CASH", items: [{ sku: "SEED-005", qty: 50 }] },
  { daysAgo: 3, hour: 10, payment: "CASH", items: [{ sku: "SEED-043", qty: 2 }, { sku: "SEED-052", qty: 1 }] },
  { daysAgo: 3, hour: 13, payment: "YAPE", items: [{ sku: "SEED-002", qty: 8 }, { sku: "SEED-008", qty: 5 }] },
  { daysAgo: 3, hour: 17, payment: "CASH", items: [{ sku: "SEED-061", qty: 1 }, { sku: "SEED-064", qty: 4 }] },
  { daysAgo: 2, hour: 9,  payment: "CASH", items: [{ sku: "SEED-056", qty: 5 }, { sku: "SEED-057", qty: 8 }, { sku: "SEED-060", qty: 3 }] },
  { daysAgo: 2, hour: 14, payment: "YAPE", items: [{ sku: "SEED-021", qty: 1 }, { sku: "SEED-026", qty: 1 }] },
  { daysAgo: 1, hour: 10, payment: "CASH", items: [{ sku: "SEED-001", qty: 10 }, { sku: "SEED-008", qty: 3 }] },
  { daysAgo: 1, hour: 15, payment: "CASH", items: [{ sku: "SEED-037", qty: 2 }, { sku: "SEED-072", qty: 5 }] },
  { daysAgo: 0, hour: 10, payment: "CASH", items: [{ sku: "SEED-005", qty: 30 }, { sku: "SEED-013", qty: 3 }] },
  { daysAgo: 0, hour: 14, payment: "YAPE", items: [{ sku: "SEED-068", qty: 4 }, { sku: "SEED-080", qty: 2 }] },
];

// ════════════════════════════════════════════════════════════
// SEED FUNCTION
// ════════════════════════════════════════════════════════════

/** Marcas usadas por los productos demo que pueden no estar en el seed base. */
const DEMO_BRANDS = [
  "lark",
  "chema",
  "tricolor",
  "tumi",
  "oatey",
  "loctite",
  "terokal",
  "steelpro",
  "3m",
] as const;

export async function seedDemo(prisma: PrismaClient, store: Store, adminId: string) {
  // ── 0. Marcas faltantes ──
  console.log(`  · Marcas demo (${DEMO_BRANDS.length})...`);
  for (const name of DEMO_BRANDS) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name), logoUrl: null },
    });
  }

  // ── 1. Supplier demo ──
  console.log("  · Supplier demo...");
  const supplier = await prisma.supplier.upsert({
    where: { ruc: "20100000001" },
    update: {},
    create: {
      ruc: "20100000001",
      businessName: "distribuidora demo s.a.c.",
      contactName: "juan vendedor demo",
      phone: "999111222",
      email: "ventas@demo-proveedor.com",
      address: "av. industrial 100, lima",
      notes: "proveedor sintético generado por seed-demo.ts",
    },
  });

  // ── 2. Productos + ProductUnit (default) + Stock + InventoryMovement ENTRY ──
  console.log(`  · Productos demo (${PRODUCTS.length})...`);
  let productsCreated = 0;
  let stocksCreated = 0;

  for (const p of PRODUCTS) {
    const categorySlug = slugify(p.category);
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (!category) {
      console.warn(`    ⚠️  Categoría no encontrada: ${p.category} (slug=${categorySlug}) — saltando ${p.sku}`);
      continue;
    }

    const brand = p.brand
      ? await prisma.brand.findUnique({ where: { name: p.brand } })
      : null;
    if (p.brand && !brand) {
      console.warn(`    ⚠️  Marca no encontrada: ${p.brand} — usando null para ${p.sku}`);
    }

    const unit = await prisma.unit.findUnique({ where: { code: p.unit } });
    if (!unit) {
      console.warn(`    ⚠️  Unidad no encontrada: ${p.unit} — saltando ${p.sku}`);
      continue;
    }

    // Producto
    const existed = await prisma.product.findUnique({ where: { sku: p.sku } });
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        barcode: p.barcode ?? null,
        categoryId: category.id,
        brandId: brand?.id ?? null,
        baseUnitId: unit.id,
        salePrice: p.salePrice,
        costPrice: +(p.salePrice * 0.7).toFixed(2),
      },
    });
    if (!existed) productsCreated++;

    // ProductUnit default
    const existingPU = await prisma.productUnit.findFirst({
      where: { productId: product.id, isDefault: true },
    });
    if (!existingPU) {
      await prisma.productUnit.create({
        data: {
          productId: product.id,
          unitId: unit.id,
          factor: 1,
          salePrice: p.salePrice,
          isDefault: true,
        },
      });
    }

    // Stock inicial + InventoryMovement (solo si no existe el row de stock)
    const existingStock = await prisma.stock.findUnique({
      where: {
        productId_storeId: { productId: product.id, storeId: store.id },
      },
    });
    if (!existingStock) {
      await prisma.stock.create({
        data: {
          productId: product.id,
          storeId: store.id,
          quantity: p.initialStock,
          minStock: p.minStock,
          version: 1,
        },
      });
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          storeId: store.id,
          type: "ENTRY",
          quantity: p.initialStock,
          unitCost: +(p.salePrice * 0.7).toFixed(2),
          previousStock: 0,
          newStock: p.initialStock,
          reference: "carga inicial demo",
          supplierId: supplier.id,
          userId: adminId,
        },
      });
      stocksCreated++;
    }
  }
  console.log(`    → ${productsCreated} productos nuevos, ${stocksCreated} stocks inicializados`);

  // ── 3. Vendor demo ──
  console.log("  · Vendor demo (DNI 11111111)...");
  const vendorDoc = "11111111";
  const vendor = await prisma.user.upsert({
    where: {
      documentType_documentNumber: {
        documentType: DocumentType.DNI,
        documentNumber: vendorDoc,
      },
    },
    update: {},
    create: {
      documentType: DocumentType.DNI,
      documentNumber: vendorDoc,
      passwordHash: await bcrypt.hash(vendorDoc, 10),
      lastNameP: "rojas",
      lastNameM: "demo",
      firstName: "vendedor",
      phone: "999100100",
      birthDate: new Date("1995-06-15"),
      address: "av. demo 456, huánuco",
      gender: Gender.M,
      role: Role.VENDOR,
      storeId: store.id,
    },
  });

  // ── 4. Demo cash session + ventas ──
  // Skip si ya hay ventas demo (idempotente)
  const existingDemoSales = await prisma.sale.count({
    where: { code: { startsWith: "V-HCO-001-D" } },
  });
  if (existingDemoSales > 0) {
    console.log(`  · Ventas demo: ya existen ${existingDemoSales} ventas demo — saltando`);
    return;
  }

  console.log(`  · Ventas demo (${DEMO_SALES.length})...`);
  const caja = await prisma.cashRegister.findFirst({
    where: { storeId: store.id, name: "Caja 1" },
  });
  if (!caja) {
    console.warn("    ⚠️  Caja 1 no encontrada — saltando ventas demo");
    return;
  }

  const cashPM = await prisma.paymentMethod.findUniqueOrThrow({ where: { code: "CASH" } });
  const yapePM = await prisma.paymentMethod.findUniqueOrThrow({ where: { code: "YAPE" } });
  const plinPM = await prisma.paymentMethod.findUniqueOrThrow({ where: { code: "PLIN" } });
  const pmByCode = { CASH: cashPM, YAPE: yapePM, PLIN: plinPM };

  // CashSession demo (CLOSED, abierta hace 7d, cerrada ahora)
  const now = new Date();
  const sessionStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const openingAmount = 50;

  const session = await prisma.cashSession.create({
    data: {
      cashRegisterId: caja.id,
      userId: vendor.id,
      openedAt: sessionStart,
      closedAt: now,
      openingAmount,
      expectedAmount: 0, // se actualiza al final
      countedAmount: 0,
      difference: 0,
      status: "CLOSED",
      notes: "turno demo generado por seed-demo.ts — datos sintéticos",
    },
  });

  let cashTotal = 0;
  let saleCounter = 1;

  for (const ds of DEMO_SALES) {
    const saleDate = new Date(now.getTime() - ds.daysAgo * 24 * 60 * 60 * 1000);
    saleDate.setHours(ds.hour, Math.floor(Math.random() * 60), 0, 0);

    const code = `V-HCO-001-D${String(saleCounter).padStart(5, "0")}`;
    saleCounter++;

    // Cargar productos del item y calcular totales
    const itemRows: {
      productId: string;
      productUnitId: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    let subtotal = 0;
    for (const item of ds.items) {
      const product = await prisma.product.findUnique({
        where: { sku: item.sku },
        include: { productUnits: { where: { isDefault: true } } },
      });
      if (!product || !product.productUnits[0]) {
        console.warn(`    ⚠️  Producto ${item.sku} no encontrado en venta ${code}`);
        continue;
      }
      const pu = product.productUnits[0];
      const unitPrice = Number(pu.salePrice);
      const lineTotal = +(unitPrice * item.qty).toFixed(2);
      subtotal += lineTotal;
      itemRows.push({
        productId: product.id,
        productUnitId: pu.id,
        quantity: item.qty,
        unitPrice,
        lineTotal,
      });
    }

    if (itemRows.length === 0) continue;
    const total = +subtotal.toFixed(2);
    const pm = pmByCode[ds.payment];

    // Sale + items + payment
    const sale = await prisma.sale.create({
      data: {
        code,
        storeId: store.id,
        cashSessionId: session.id,
        userId: vendor.id,
        subtotal,
        discount: 0,
        total,
        status: "COMPLETED",
        createdAt: saleDate,
      },
    });

    await prisma.saleItem.createMany({
      data: itemRows.map((r) => ({
        saleId: sale.id,
        productId: r.productId,
        productUnitId: r.productUnitId,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        discount: 0,
        lineTotal: r.lineTotal,
      })),
    });

    await prisma.salePayment.create({
      data: {
        saleId: sale.id,
        paymentMethodId: pm.id,
        amount: total,
        reference: pm.requiresReference
          ? `OP${Math.floor(Math.random() * 1_000_000)
              .toString()
              .padStart(6, "0")}`
          : null,
      },
    });

    // Decrement stock + InventoryMovement type=SALE
    for (const r of itemRows) {
      const stock = await prisma.stock.findUnique({
        where: {
          productId_storeId: { productId: r.productId, storeId: store.id },
        },
      });
      if (!stock) continue;
      const prev = Number(stock.quantity);
      const newQty = prev - r.quantity;
      await prisma.stock.update({
        where: { id: stock.id },
        data: { quantity: newQty, version: { increment: 1 } },
      });
      await prisma.inventoryMovement.create({
        data: {
          productId: r.productId,
          storeId: store.id,
          type: "SALE",
          quantity: r.quantity,
          previousStock: prev,
          newStock: newQty,
          relatedSaleId: sale.id,
          userId: vendor.id,
          createdAt: saleDate,
        },
      });
    }

    // CashMovement si el método afecta caja
    if (pm.affectsCash) {
      cashTotal += total;
      await prisma.cashMovement.create({
        data: {
          cashSessionId: session.id,
          type: "SALE",
          amount: total,
          paymentMethodId: pm.id,
          description: `Venta ${code}`,
          relatedSaleId: sale.id,
          userId: vendor.id,
          createdAt: saleDate,
        },
      });
    }
  }

  // Actualizar totales de la sesión cerrada
  const expected = +(openingAmount + cashTotal).toFixed(2);
  await prisma.cashSession.update({
    where: { id: session.id },
    data: {
      expectedAmount: expected,
      countedAmount: expected,
      difference: 0,
    },
  });
  console.log(`    → ${DEMO_SALES.length} ventas, S/${expected.toFixed(2)} en efectivo`);
}
