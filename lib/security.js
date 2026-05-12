import crypto from "node:crypto";
import { promisify } from "node:util";
import { getEnv } from "./env.js";

const scrypt = promisify(crypto.scrypt);
const PASSWORD_KEY_LENGTH = 64;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input) {
  return Buffer.from(input, "base64url");
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_LENGTH);
  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

export async function verifyPassword(password, storedValue) {
  if (!storedValue || !storedValue.includes(":")) {
    return false;
  }

  const [salt, hash] = storedValue.split(":");
  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_LENGTH);
  const storedBuffer = Buffer.from(hash, "hex");

  if (storedBuffer.length !== Buffer.from(derivedKey).length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, Buffer.from(derivedKey));
}

export function createSignedToken(scope, subject) {
  const { sessionSecret } = getEnv();
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${scope}:${subject}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", sessionSecret)
    .update(payload)
    .digest();

  return `${base64Url(subject)}.${expiresAt}.${base64Url(signature)}`;
}

export function readSignedToken(token, scope) {
  const { sessionSecret } = getEnv();

  try {
    if (!token) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const [subjectPart, expiresAtPart, signaturePart] = parts;
    const expiresAt = Number(expiresAtPart);

    if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }

    const subject = fromBase64Url(subjectPart).toString("utf8");
    const payload = `${scope}:${subject}:${expiresAt}`;
    const expected = crypto
      .createHmac("sha256", sessionSecret)
      .update(payload)
      .digest();
    const actual = fromBase64Url(signaturePart);

    if (expected.length !== actual.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(expected, actual)) {
      return null;
    }

    return subject;
  } catch {
    return null;
  }
}
