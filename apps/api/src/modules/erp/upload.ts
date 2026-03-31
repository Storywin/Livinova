import { randomUUID } from "crypto";
import * as fs from "fs";
import { extname, join } from "path";

import type { Request } from "express";
import { diskStorage } from "multer";

function uploadDir() {
  const cwd = process.cwd();
  const normalized = cwd.replaceAll("\\", "/").toLowerCase();
  if (normalized.endsWith("/apps/api")) {
    return join(cwd, "..", "web", "public", "uploads");
  }
  return join(cwd, "apps", "web", "public", "uploads");
}

export const erpProjectImageStorage = diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    const dir = uploadDir();
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const safeExt = extname(file.originalname || "").slice(0, 12);
    cb(null, `${randomUUID()}${safeExt}`);
  },
});
