import crypto from "node:crypto";

export function normalizeReferenceCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

export function createReferenceCode(existingCodes = new Set()) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = `EVT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    if (!existingCodes.has(code)) {
      return code;
    }
  }

  throw new Error("Unable to generate a unique reference code.");
}
