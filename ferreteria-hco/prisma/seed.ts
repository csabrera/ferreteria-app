import { PrismaClient, Role, DocumentType, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/slug";
import { seedDemo } from "./seed-demo";

const prisma = new PrismaClient();

// ════════════════════════════════════════════════════════════
// CATÁLOGOS DE ARRANQUE
// ════════════════════════════════════════════════════════════

const UNITS = [
  { code: "UN", name: "Unidad", symbol: "un" },
  { code: "CJ", name: "Caja", symbol: "cj" },
  { code: "MT", name: "Metro", symbol: "m" },
  { code: "KG", name: "Kilogramo", symbol: "kg" },
  { code: "LT", name: "Litro", symbol: "L" },
  { code: "SC", name: "Saco", symbol: "sc" },
] as const;

const PAYMENT_METHODS = [
  { code: "CASH", name: "Efectivo", requiresReference: false, affectsCash: true },
  { code: "YAPE", name: "Yape", requiresReference: true, affectsCash: false },
  { code: "PLIN", name: "Plin", requiresReference: true, affectsCash: false },
  { code: "TRANSFER", name: "Transferencia", requiresReference: true, affectsCash: false },
] as const;

/**
 * Categorías de ferretería peruana con jerarquía de 2 niveles
 * (raíz + subcategorías). Total ~12 raíces + ~67 subcategorías.
 *
 * Si en algún momento se decide trabajar con catálogo plano, basta con
 * eliminar la propiedad `children` (sin tocar schema).
 */
type CategorySeed = {
  name: string;
  children?: string[];
};

const CATEGORIES: CategorySeed[] = [
  {
    name: "construcción",
    children: [
      "cemento",
      "ladrillos y bloques",
      "agregados",
      "aceros y fierros",
      "aditivos para concreto",
      "impermeabilizantes",
    ],
  },
  {
    name: "pinturas",
    children: [
      "látex",
      "esmaltes",
      "barnices",
      "solventes y diluyentes",
      "brochas y rodillos",
      "spray y aerosoles",
    ],
  },
  {
    name: "herramientas",
    children: [
      "herramientas eléctricas",
      "herramientas manuales",
      "medición",
      "carpintería",
      "soldadura",
      "accesorios y discos",
    ],
  },
  {
    name: "plomería",
    children: [
      "tubos pvc",
      "accesorios pvc",
      "grifería",
      "sanitarios",
      "tanques de agua",
      "llaves y válvulas",
    ],
  },
  {
    name: "eléctricos",
    children: [
      "cables y alambres",
      "tomacorrientes e interruptores",
      "tableros y breakers",
      "canaletas y tubos eléctricos",
      "enchufes y extensiones",
      "automatización",
    ],
  },
  {
    name: "ferretería general",
    children: [
      "tornillería",
      "clavos y grapas",
      "bisagras",
      "abrazaderas y soportes",
      "alambres",
      "ganchos y ojales",
    ],
  },
  {
    name: "pegamentos y adhesivos",
    children: [
      "silicona",
      "pegamentos pvc",
      "pegamentos universales",
      "selladores",
      "cintas adhesivas",
    ],
  },
  {
    name: "seguridad industrial",
    children: [
      "cascos",
      "lentes de seguridad",
      "guantes",
      "mascarillas",
      "arneses",
      "botas de seguridad",
    ],
  },
  {
    name: "jardinería",
    children: [
      "mangueras",
      "aspersores y riego",
      "macetas",
      "semillas y abonos",
      "herramientas de jardín",
    ],
  },
  {
    name: "limpieza",
    children: [
      "detergentes industriales",
      "escobas y trapeadores",
      "baldes y tachos",
      "desinfectantes",
      "papel y bolsas",
    ],
  },
  {
    name: "cerrajería",
    children: [
      "cerraduras",
      "candados",
      "pestillos y manijas",
      "chapas eléctricas",
      "accesorios para puertas",
    ],
  },
  {
    name: "iluminación",
    children: [
      "focos led",
      "fluorescentes",
      "lámparas",
      "reflectores",
      "cintas led",
    ],
  },
];

/**
 * Marcas reconocidas en el mercado peruano de ferretería.
 * Agrupadas mentalmente por rubro pero todas se siembran como entradas planas.
 * Sin logos: el admin los sube luego desde /marcas.
 */
const BRANDS = [
  // Cementos
  "sol",
  "andino",
  "pacasmayo",
  "inca",
  "yura",
  // Aceros y fierros
  "aceros arequipa",
  "siderperú",
  "prodac",
  // Tubos y conexiones PVC
  "pavco",
  "nicoll",
  "tigre",
  // Pinturas y solventes
  "vencedor",
  "cpp",
  "american colors",
  "anypsa",
  "tekno",
  "pato",
  "jet",
  // Sanitarios y grifería
  "trebol",
  "italgrif",
  "vainsa",
  "edesa",
  "imexa",
  // Herramientas
  "stanley",
  "bosch",
  "makita",
  "dewalt",
  "truper",
  "black & decker",
  "milwaukee",
  "stihl",
  "hilti",
  "einhell",
  "bauker",
  // Eléctricos
  "indeco",
  "bticino",
  "schneider",
  "abb",
  // Pegamentos y adhesivos
  "sika",
  "topex",
  "z",
  "soldimix",
  "wd-40",
  // Cerraduras y seguridad
  "yale",
  "forte",
  "cantol",
  // Iluminación
  "philips",
  "sylvania",
  "osram",
  // Pisos y cerámicos
  "celima",
  "san lorenzo",
  "cassinelli",
] as const;

// ════════════════════════════════════════════════════════════
// SEED
// ════════════════════════════════════════════════════════════

async function main() {
  console.log("🌱 Iniciando seed...");

  // ── Unidades base (catálogo cerrado) ──
  console.log(`  · Unidades (${UNITS.length})...`);
  for (const u of UNITS) {
    await prisma.unit.upsert({
      where: { code: u.code },
      update: {},
      create: u,
    });
  }

  // ── Métodos de pago ──
  console.log(`  · Métodos de pago (${PAYMENT_METHODS.length})...`);
  for (const p of PAYMENT_METHODS) {
    await prisma.paymentMethod.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  // ── Categorías raíz + subcategorías ──
  const totalSubs = CATEGORIES.reduce(
    (sum, c) => sum + (c.children?.length ?? 0),
    0,
  );
  console.log(`  · Categorías (${CATEGORIES.length} raíz + ${totalSubs} subcategorías)...`);
  for (const cat of CATEGORIES) {
    const rootSlug = slugify(cat.name);
    const root = await prisma.category.upsert({
      where: { slug: rootSlug },
      update: {},
      create: { name: cat.name, slug: rootSlug, parentId: null },
    });

    for (const childName of cat.children ?? []) {
      const childSlug = slugify(childName);
      await prisma.category.upsert({
        where: { slug: childSlug },
        update: {},
        create: { name: childName, slug: childSlug, parentId: root.id },
      });
    }
  }

  // ── Marcas ──
  console.log(`  · Marcas (${BRANDS.length})...`);
  for (const name of BRANDS) {
    const slug = slugify(name);
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name, slug, logoUrl: null },
    });
  }

  // ── Sucursal inicial ──
  console.log("  · Sucursal HCO-001...");
  const store = await prisma.store.upsert({
    where: { code: "HCO-001" },
    update: {},
    create: {
      code: "HCO-001",
      name: "central",
      address: "huánuco, perú",
      phone: "999000001",
    },
  });

  // ── Caja de la sucursal ──
  console.log("  · Caja 1...");
  const existingRegister = await prisma.cashRegister.findFirst({
    where: { storeId: store.id, name: "Caja 1" },
  });
  if (!existingRegister) {
    await prisma.cashRegister.create({
      data: { storeId: store.id, name: "Caja 1" },
    });
  }

  // ── Usuario administrador ──
  console.log("  · Admin user...");
  const adminDocType = DocumentType.DNI;
  const adminDocNumber = "12345678";
  // Convención del sistema: password inicial = número de documento
  const passwordHash = await bcrypt.hash(adminDocNumber, 10);
  const admin = await prisma.user.upsert({
    where: {
      documentType_documentNumber: {
        documentType: adminDocType,
        documentNumber: adminDocNumber,
      },
    },
    update: {},
    create: {
      documentType: adminDocType,
      documentNumber: adminDocNumber,
      passwordHash,
      lastNameP: "administrador",
      lastNameM: "sistema",
      firstName: "admin",
      phone: "999000000",
      email: null,
      birthDate: new Date("1990-01-01"),
      address: "av. central 123, huánuco",
      gender: Gender.O,
      role: Role.ADMIN,
    },
  });

  // ── Configuración global (singleton) ──
  console.log("  · AppSettings...");
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: "Ferretería HCO",
      accentColor: "#2563eb",
      thankYouMessage: "¡Gracias por su compra!",
      currency: "PEN",
      currencySymbol: "S/",
      timezone: "America/Lima",
    },
  });

  // ── Datos demo (productos, supplier, vendor, ventas) ──
  console.log("");
  console.log("🎁 Sembrando datos demo...");
  await seedDemo(prisma, store, admin.id);

  console.log("");
  console.log("✅ Seed completado");
  console.log("");
  console.log("   Credenciales admin:");
  console.log(`   ├─ tipo doc: ${adminDocType}`);
  console.log(`   ├─ número:   ${adminDocNumber}`);
  console.log(`   └─ password: ${adminDocNumber}   ⚠️  cambiar en producción`);
  console.log("");
  console.log("   Credenciales vendor demo:");
  console.log("   ├─ tipo doc: DNI");
  console.log("   ├─ número:   11111111");
  console.log("   └─ password: 11111111   (la caja queda CERRADA — abrir nueva para vender)");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
