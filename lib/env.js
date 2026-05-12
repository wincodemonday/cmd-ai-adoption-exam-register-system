import path from "node:path";

export function getEnv() {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

  return {
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "change-me-now",
    sessionSecret:
      process.env.SESSION_SECRET || "replace-this-secret-before-deploy",
    eventName: process.env.EVENT_NAME || "CMD AI Adoption Exam 2026",
    dataDir,
    storePath: process.env.STORE_PATH || path.join(dataDir, "registrations.json"),
    uploadDir: process.env.UPLOAD_DIR || path.join(dataDir, "uploads")
  };
}
