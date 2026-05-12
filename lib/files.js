import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getEnv } from "./env.js";

function ensureUploadDirectory(uploadDir) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function fileExtension(name) {
  const extension = path.extname(name || "").toLowerCase();
  return extension.replace(/[^a-z0-9.]/g, "") || "";
}

export async function saveUploadedFile(file, uploadDir = getEnv().uploadDir) {
  ensureUploadDirectory(uploadDir);
  const extension = fileExtension(file.name);
  const storageName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const targetPath = path.join(uploadDir, storageName);
  const buffer = Buffer.from(await file.arrayBuffer());

  fs.writeFileSync(targetPath, buffer);

  return {
    originalName: file.name || "document",
    storageName,
    mimeType: file.type || "application/octet-stream",
    size: buffer.length,
    uploadedAt: new Date().toISOString()
  };
}

export function readUploadedFile(storageName, uploadDir = getEnv().uploadDir) {
  return fs.readFileSync(path.join(uploadDir, storageName));
}

export function deleteUploadedFile(storageName, uploadDir = getEnv().uploadDir) {
  const filePath = path.join(uploadDir, storageName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
