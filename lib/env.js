import path from "node:path";

export function getEnv() {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

  return {
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "change-me-now",
    sessionSecret:
      process.env.SESSION_SECRET || "replace-this-secret-before-deploy",
    eventName: process.env.EVENT_NAME || "CMD AI Adoption Exam 2026",
    databaseUrl: process.env.DATABASE_URL || "",
    databaseSsl: process.env.DATABASE_SSL || "",
    storageAccessKey:
      process.env.ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || "",
    storageSecretKey:
      process.env.SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
    storageEndpointUrl:
      process.env.ENDPOINT_URL || process.env.AWS_ENDPOINT || "",
    storageBucket:
      process.env.STORAGE_BUCKET ||
      process.env.BUCKET_NAME ||
      process.env.S3_BUCKET ||
      "event-registration-documents",
    storageRegion: process.env.STORAGE_REGION || process.env.AWS_REGION || "us-east-1",
    storageForcePathStyle:
      process.env.STORAGE_FORCE_PATH_STYLE ||
      process.env.AWS_FORCE_PATH_STYLE ||
      "true",
    dataDir,
    storePath: process.env.STORE_PATH || path.join(dataDir, "registrations.json"),
    uploadDir: process.env.UPLOAD_DIR || path.join(dataDir, "uploads")
  };
}
