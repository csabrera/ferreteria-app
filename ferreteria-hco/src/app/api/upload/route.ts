import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth-guards";
import { getStorage } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];
const ALLOWED_FOLDERS = ["settings", "products", "brands", "categories"];

export async function POST(req: NextRequest) {
  await requireAdmin();

  const formData = await req.formData();
  const file = formData.get("file");
  const folderRaw = String(formData.get("folder") ?? "settings");
  const folder = ALLOWED_FOLDERS.includes(folderRaw) ? folderRaw : "settings";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No se envió ningún archivo" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "El archivo excede 5MB" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Tipo no permitido: ${file.type}` },
      { status: 400 },
    );
  }

  try {
    const storage = getStorage();
    const { url } = await storage.upload(file, { folder });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[api/upload]", err);
    return NextResponse.json(
      { error: "No se pudo guardar el archivo" },
      { status: 500 },
    );
  }
}
