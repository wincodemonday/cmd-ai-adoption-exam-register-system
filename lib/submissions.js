import { getEnv } from "./env.js";
import { saveUploadedFile, deleteUploadedFile } from "./files.js";
import { createReferenceCode, normalizeReferenceCode } from "./reference.js";
import { hashPassword, verifyPassword } from "./security.js";
import { readStore, writeStore } from "./store.js";

const requiredFields = ["name", "email", "phone"];
const editableFields = [
  "name",
  "email",
  "phone",
  "company",
  "jobTitle",
  "dietaryPreferences",
  "notes"
];

export class FormError extends Error {}

function cleanValue(value) {
  return String(value || "").trim();
}

function mapFields(fields) {
  return {
    name: cleanValue(fields.name),
    email: cleanValue(fields.email).toLowerCase(),
    phone: cleanValue(fields.phone),
    company: cleanValue(fields.company),
    jobTitle: cleanValue(fields.jobTitle),
    dietaryPreferences: cleanValue(fields.dietaryPreferences),
    notes: cleanValue(fields.notes)
  };
}

function validateFields(fields) {
  const errors = [];

  for (const field of requiredFields) {
    if (!fields[field]) {
      errors.push(`${field} is required.`);
    }
  }

  if (fields.email && !fields.email.includes("@")) {
    errors.push("Email must be valid.");
  }

  if (fields.phone && fields.phone.length < 8) {
    errors.push("Phone must be at least 8 characters.");
  }

  return errors;
}

function normalizeFiles(files) {
  return (files || []).filter((file) => file && typeof file.size === "number" && file.size > 0);
}

function cloneRegistration(registration) {
  return {
    ...registration,
    documents: (registration.documents || []).map((document) => ({ ...document }))
  };
}

export function listRegistrations(storePath = getEnv().storePath) {
  return readStore(storePath).registrations
    .map(cloneRegistration)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getRegistrationByReference(referenceCode, storePath = getEnv().storePath) {
  const normalized = normalizeReferenceCode(referenceCode);
  const registration = readStore(storePath).registrations.find(
    (entry) => entry.referenceCode === normalized
  );

  return registration ? cloneRegistration(registration) : null;
}

export function getRegistrationById(id, storePath = getEnv().storePath) {
  const registration = readStore(storePath).registrations.find(
    (entry) => String(entry.id) === String(id)
  );

  return registration ? cloneRegistration(registration) : null;
}

export function getDocumentById(documentId, storePath = getEnv().storePath) {
  for (const registration of readStore(storePath).registrations) {
    const document = (registration.documents || []).find(
      (entry) => String(entry.id) === String(documentId)
    );

    if (document) {
      return {
        registration: cloneRegistration(registration),
        document: { ...document }
      };
    }
  }

  return null;
}

export async function authenticateRegistration(
  referenceCode,
  password,
  storePath = getEnv().storePath
) {
  const registration = getRegistrationByReference(referenceCode, storePath);

  if (!registration) {
    return null;
  }

  const isValid = await verifyPassword(password, registration.passwordHash);
  return isValid ? registration : null;
}

export async function createRegistration(
  { fields, password, confirmPassword, files = [] },
  options = {}
) {
  const storePath = options.storePath || getEnv().storePath;
  const uploadDir = options.uploadDir || getEnv().uploadDir;
  const input = mapFields(fields);
  const errors = validateFields(input);

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }

  if (password !== confirmPassword) {
    errors.push("Password confirmation does not match.");
  }

  if (errors.length > 0) {
    throw new FormError(errors[0]);
  }

  const store = readStore(storePath);
  const existingCodes = new Set(store.registrations.map((entry) => entry.referenceCode));
  const referenceCode = createReferenceCode(existingCodes);
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  const uploadedDocuments = [];

  try {
    for (const file of normalizeFiles(files)) {
      uploadedDocuments.push(await saveUploadedFile(file, uploadDir));
    }
  } catch (error) {
    for (const document of uploadedDocuments) {
      deleteUploadedFile(document.storageName, uploadDir);
    }

    throw error;
  }

  const registration = {
    id: store.nextId,
    referenceCode,
    ...input,
    passwordHash,
    createdAt: now,
    updatedAt: now,
    documents: uploadedDocuments.map((document) => ({
      ...document,
      id: store.nextDocumentId++
    }))
  };

  store.nextId += 1;
  store.registrations.push(registration);
  writeStore(store, storePath);
  return cloneRegistration(registration);
}

export async function updateRegistration(
  { referenceCode, fields, newFiles = [], replacements = {} },
  options = {}
) {
  const storePath = options.storePath || getEnv().storePath;
  const uploadDir = options.uploadDir || getEnv().uploadDir;
  const normalizedReferenceCode = normalizeReferenceCode(referenceCode);
  const store = readStore(storePath);
  const index = store.registrations.findIndex(
    (entry) => entry.referenceCode === normalizedReferenceCode
  );

  if (index === -1) {
    throw new FormError("Registration not found.");
  }

  const nextFields = mapFields(fields);
  const errors = validateFields(nextFields);

  if (errors.length > 0) {
    throw new FormError(errors[0]);
  }

  const registration = cloneRegistration(store.registrations[index]);
  const savedFiles = [];

  try {
    registration.documents = await Promise.all(
      registration.documents.map(async (document) => {
        const replacement = replacements[String(document.id)];

        if (!replacement || replacement.size === 0) {
          return document;
        }

        const uploaded = await saveUploadedFile(replacement, uploadDir);
        savedFiles.push(uploaded.storageName);
        deleteUploadedFile(document.storageName, uploadDir);

        return {
          ...document,
          ...uploaded
        };
      })
    );

    for (const file of normalizeFiles(newFiles)) {
      const uploaded = await saveUploadedFile(file, uploadDir);
      savedFiles.push(uploaded.storageName);
      registration.documents.push({
        ...uploaded,
        id: store.nextDocumentId++
      });
    }
  } catch (error) {
    for (const storageName of savedFiles) {
      deleteUploadedFile(storageName, uploadDir);
    }

    throw error;
  }

  for (const field of editableFields) {
    registration[field] = nextFields[field];
  }

  registration.updatedAt = new Date().toISOString();
  store.registrations[index] = registration;
  writeStore(store, storePath);
  return cloneRegistration(registration);
}
