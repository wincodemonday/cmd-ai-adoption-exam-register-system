import test from "node:test";
import assert from "node:assert/strict";
import { generateTagPdf } from "../lib/pdf.js";

test("name tag pdf generation returns a PDF document", async () => {
  const bytes = await generateTagPdf({
    name: "Test User",
    company: "CMD",
    jobTitle: "Speaker",
    referenceCode: "EVT-ABCD1234"
  });

  assert.equal(Buffer.isBuffer(bytes), true);
  assert.equal(bytes.subarray(0, 4).toString("utf8"), "%PDF");
});
