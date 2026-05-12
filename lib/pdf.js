import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getEnv } from "./env.js";

export async function generateTagPdf(registration) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 240]);
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const { eventName } = getEnv();

  page.drawRectangle({
    x: 18,
    y: 18,
    width: 384,
    height: 204,
    color: rgb(0.98, 0.95, 0.9),
    borderColor: rgb(0.21, 0.15, 0.08),
    borderWidth: 2
  });

  page.drawText(eventName, {
    x: 34,
    y: 184,
    size: 18,
    font: titleFont,
    color: rgb(0.35, 0.18, 0.05)
  });

  page.drawText(registration.name, {
    x: 34,
    y: 126,
    size: 30,
    font: titleFont,
    color: rgb(0.08, 0.08, 0.08)
  });

  page.drawText(
    [registration.company, registration.jobTitle].filter(Boolean).join(" | ") ||
      "Registered attendee",
    {
      x: 34,
      y: 94,
      size: 14,
      font: bodyFont,
      color: rgb(0.2, 0.2, 0.2)
    }
  );

  page.drawText(`Reference: ${registration.referenceCode}`, {
    x: 34,
    y: 48,
    size: 13,
    font: bodyFont,
    color: rgb(0.3, 0.2, 0.15)
  });

  return Buffer.from(await pdf.save());
}
