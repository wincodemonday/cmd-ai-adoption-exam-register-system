import fs from "node:fs";
import path from "node:path";
import { getEnv } from "./env.js";

const blankStore = {
  nextId: 1,
  nextDocumentId: 1,
  registrations: []
};

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureStoreFile(storePath) {
  ensureDirectory(path.dirname(storePath));

  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, JSON.stringify(blankStore, null, 2));
  }
}

export function readStore(storePath = getEnv().storePath) {
  ensureStoreFile(storePath);
  const content = fs.readFileSync(storePath, "utf8");
  const parsed = JSON.parse(content);

  return {
    nextId: parsed.nextId || 1,
    nextDocumentId: parsed.nextDocumentId || 1,
    registrations: Array.isArray(parsed.registrations) ? parsed.registrations : []
  };
}

export function writeStore(store, storePath = getEnv().storePath) {
  ensureStoreFile(storePath);
  const tempPath = `${storePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(store, null, 2));
  fs.renameSync(tempPath, storePath);
}

export function resetStore(storePath = getEnv().storePath) {
  ensureDirectory(path.dirname(storePath));
  writeStore(blankStore, storePath);
}
