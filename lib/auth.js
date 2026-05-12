import { getEnv } from "./env.js";
import { normalizeReferenceCode } from "./reference.js";
import { createSignedToken, readSignedToken } from "./security.js";

export const REGISTRATION_SESSION_COOKIE = "registration_session";
export const ADMIN_SESSION_COOKIE = "admin_session";

function secureCookie() {
  return process.env.NODE_ENV === "production";
}

export function cookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(),
    path: "/",
    maxAge: maxAgeSeconds
  };
}

export function createRegistrationSession(referenceCode) {
  return createSignedToken("registration", normalizeReferenceCode(referenceCode));
}

export function readRegistrationSession(token) {
  return readSignedToken(token, "registration");
}

export function createAdminSession(username) {
  return createSignedToken("admin", username);
}

export function readAdminSession(token) {
  return readSignedToken(token, "admin");
}

export function hasAdminAccess(token) {
  return readAdminSession(token) === getEnv().adminUsername;
}

export function hasRegistrationAccess(token, referenceCode) {
  return readRegistrationSession(token) === normalizeReferenceCode(referenceCode);
}
