import test from "node:test";
import assert from "node:assert/strict";
import {
  createAdminSession,
  createRegistrationSession,
  hasAdminAccess,
  hasRegistrationAccess
} from "../lib/auth.js";
import { hashPassword, verifyPassword } from "../lib/security.js";

test("password hashing verifies the original password", async () => {
  const hash = await hashPassword("strong-pass-123");

  assert.equal(await verifyPassword("strong-pass-123", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

test("signed cookies authorize the intended subjects only", () => {
  const registrationToken = createRegistrationSession("evt-abcd1234");
  const adminToken = createAdminSession("admin");

  assert.equal(hasRegistrationAccess(registrationToken, "EVT-ABCD1234"), true);
  assert.equal(hasRegistrationAccess(registrationToken, "EVT-OTHER"), false);
  assert.equal(hasAdminAccess(adminToken), true);
});
