import { writeFile, mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { env } from "./env";

export interface StorageProvider {
  upload(file: File, opts?: { folder?: string }): Promise<{ url: string }>;
  delete(url: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  private readonly publicDir = "public";
  private readonly uploadsPath = "uploads";

  async upload(file: File, opts: { folder?: string } = {}) {
    const folder = opts.folder ?? "";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extFromName = path.extname(file.name).toLowerCase();
    const ext = extFromName || extFromMime(file.type);
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

    const targetDir = path.join(
      process.cwd(),
      this.publicDir,
      this.uploadsPath,
      folder,
    );
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    await writeFile(path.join(targetDir, filename), buffer);

    const url = `/${this.uploadsPath}${folder ? `/${folder}` : ""}/${filename}`;
    return { url };
  }

  async delete(url: string) {
    if (!url.startsWith(`/${this.uploadsPath}/`)) return;
    const filepath = path.join(process.cwd(), this.publicDir, url);
    if (existsSync(filepath)) {
      await unlink(filepath);
    }
  }
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
  };
  return map[mime] ?? ".bin";
}

let cachedProvider: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  switch (env.STORAGE_PROVIDER) {
    case "local":
      cachedProvider = new LocalStorageProvider();
      break;
    case "cloudinary":
    case "r2":
    case "uploadthing":
      throw new Error(
        `Storage provider "${env.STORAGE_PROVIDER}" no implementado todavía (Fase 2)`,
      );
    default:
      cachedProvider = new LocalStorageProvider();
  }

  return cachedProvider;
}
