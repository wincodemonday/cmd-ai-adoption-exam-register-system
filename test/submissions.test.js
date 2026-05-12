import test from "node:test";
import assert from "node:assert/strict";
import { File } from "node:buffer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  authenticateRegistration,
  createRegistration,
  getRegistrationByReference,
  updateRegistration
} from "../lib/submissions.js";

function makePaths() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "cmd-ai-register-"));

  return {
    baseDir,
    storePath: path.join(baseDir, "registrations.json"),
    uploadDir: path.join(baseDir, "uploads")
  };
}

function cleanup(paths) {
  fs.rmSync(paths.baseDir, { recursive: true, force: true });
}

test("registration create, lookup, and update flow keeps documents accessible", async () => {
  const paths = makePaths();

  try {
    const created = await createRegistration(
      {
        fields: {
          name: "Alice Example",
          email: "alice@example.com",
          phone: "0812345678",
          company: "CMD",
          jobTitle: "Engineer",
          dietaryPreferences: "Vegetarian",
          notes: "Needs parking"
        },
        password: "secretpass",
        confirmPassword: "secretpass",
        files: [new File(["passport"], "passport.pdf", { type: "application/pdf" })]
      },
      paths
    );

    assert.match(created.referenceCode, /^EVT-[A-F0-9]{8}$/);
    assert.equal(created.documents.length, 1);

    const authenticated = await authenticateRegistration(
      created.referenceCode,
      "secretpass",
      paths.storePath
    );

    assert.equal(authenticated?.email, "alice@example.com");

    await updateRegistration(
      {
        referenceCode: created.referenceCode,
        fields: {
          name: "Alice Updated",
          email: "alice@example.com",
          phone: "0812345678",
          company: "CMD Labs",
          jobTitle: "Lead Engineer",
          dietaryPreferences: "Vegan",
          notes: "Updated"
        },
        newFiles: [new File(["agenda"], "agenda.pdf", { type: "application/pdf" })],
        replacements: {
          [created.documents[0].id]: new File(["new-passport"], "passport-new.pdf", {
            type: "application/pdf"
          })
        }
      },
      paths
    );

    const updated = await getRegistrationByReference(created.referenceCode, paths.storePath);

    assert.equal(updated?.name, "Alice Updated");
    assert.equal(updated?.documents.length, 2);
    assert.equal(updated?.documents[0].originalName, "passport-new.pdf");
  } finally {
    cleanup(paths);
  }
});
