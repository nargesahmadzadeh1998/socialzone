import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { env } from "./env";

export interface Storage {
  save(buffer: Buffer, filename: string, contentType: string): Promise<string>;
  publicUrl(key: string): string;
}

class LocalStorage implements Storage {
  constructor(private readonly dir: string) {}

  async save(buffer: Buffer, filename: string): Promise<string> {
    await mkdir(this.dir, { recursive: true });
    const ext = path.extname(filename).toLowerCase().slice(0, 10) || ".bin";
    const key = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
    await writeFile(path.join(this.dir, key), buffer);
    return key;
  }

  publicUrl(key: string): string {
    return `/uploads/${key}`;
  }
}

let singleton: Storage | null = null;

export function storage(): Storage {
  if (singleton) return singleton;
  if (env.STORAGE_DRIVER === "local") {
    singleton = new LocalStorage(env.STORAGE_LOCAL_DIR);
  } else {
    throw new Error(`Unsupported STORAGE_DRIVER: ${env.STORAGE_DRIVER}`);
  }
  return singleton;
}
