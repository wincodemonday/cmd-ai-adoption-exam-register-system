import { hasDatabaseUrl, withDatabase, withTransaction } from "./database.js";
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

async function discardStoredFiles(storageNames, uploadDir) {
  await Promise.allSettled(
    (storageNames || []).filter(Boolean).map((storageName) => deleteUploadedFile(storageName, uploadDir))
  );
}

function cloneRegistration(registration) {
  return {
    ...registration,
    documents: (registration.documents || []).map((document) => ({ ...document }))
  };
}

function resolveStorePath(value) {
  return typeof value === "string" ? value : value?.storePath || getEnv().storePath;
}

function resolveUploadDir(options = {}) {
  return options.uploadDir || getEnv().uploadDir;
}

function normalizeTimestamp(value) {
  return new Date(value).toISOString();
}

function mapDocumentRow(row) {
  return {
    id: row.id,
    originalName: row.original_name,
    storageName: row.storage_name,
    mimeType: row.mime_type,
    size: Number(row.size),
    uploadedAt: normalizeTimestamp(row.uploaded_at)
  };
}

function mapRegistrationRow(row, documents = []) {
  return {
    id: row.id,
    referenceCode: row.reference_code,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    jobTitle: row.job_title,
    dietaryPreferences: row.dietary_preferences,
    notes: row.notes,
    passwordHash: row.password_hash,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
    documents
  };
}

async function fetchDocumentsForRegistrations(db, registrationIds) {
  if (registrationIds.length === 0) {
    return new Map();
  }

  const result = await db.query(
    `
      SELECT *
      FROM registration_documents
      WHERE registration_id = ANY($1::int[])
      ORDER BY id ASC
    `,
    [registrationIds]
  );
  const grouped = new Map();

  for (const row of result.rows) {
    const documents = grouped.get(row.registration_id) || [];
    documents.push(mapDocumentRow(row));
    grouped.set(row.registration_id, documents);
  }

  return grouped;
}

function listRegistrationsFromFile(storePath) {
  return readStore(storePath).registrations
    .map(cloneRegistration)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function getRegistrationByReferenceFromFile(referenceCode, storePath) {
  const normalized = normalizeReferenceCode(referenceCode);
  const registration = readStore(storePath).registrations.find(
    (entry) => entry.referenceCode === normalized
  );

  return registration ? cloneRegistration(registration) : null;
}

function getRegistrationByIdFromFile(id, storePath) {
  const registration = readStore(storePath).registrations.find(
    (entry) => String(entry.id) === String(id)
  );

  return registration ? cloneRegistration(registration) : null;
}

function getDocumentByIdFromFile(documentId, storePath) {
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

export async function listRegistrations(options = undefined) {
  if (!hasDatabaseUrl(options)) {
    return listRegistrationsFromFile(resolveStorePath(options));
  }

  return withDatabase(async (db) => {
    const registrationsResult = await db.query(`
      SELECT *
      FROM registrations
      ORDER BY updated_at DESC, id DESC
    `);
    const documentsByRegistration = await fetchDocumentsForRegistrations(
      db,
      registrationsResult.rows.map((row) => row.id)
    );

    return registrationsResult.rows.map((row) =>
      mapRegistrationRow(row, documentsByRegistration.get(row.id) || [])
    );
  }, options);
}

export async function getRegistrationByReference(referenceCode, options = undefined) {
  if (!hasDatabaseUrl(options)) {
    return getRegistrationByReferenceFromFile(referenceCode, resolveStorePath(options));
  }

  return withDatabase(async (db) => {
    const registrationResult = await db.query(
      `
        SELECT *
        FROM registrations
        WHERE reference_code = $1
        LIMIT 1
      `,
      [normalizeReferenceCode(referenceCode)]
    );

    if (registrationResult.rows.length === 0) {
      return null;
    }

    const row = registrationResult.rows[0];
    const documentsByRegistration = await fetchDocumentsForRegistrations(db, [row.id]);
    return mapRegistrationRow(row, documentsByRegistration.get(row.id) || []);
  }, options);
}

export async function getRegistrationById(id, options = undefined) {
  if (!hasDatabaseUrl(options)) {
    return getRegistrationByIdFromFile(id, resolveStorePath(options));
  }

  return withDatabase(async (db) => {
    const registrationResult = await db.query(
      `
        SELECT *
        FROM registrations
        WHERE id = $1
        LIMIT 1
      `,
      [Number(id)]
    );

    if (registrationResult.rows.length === 0) {
      return null;
    }

    const row = registrationResult.rows[0];
    const documentsByRegistration = await fetchDocumentsForRegistrations(db, [row.id]);
    return mapRegistrationRow(row, documentsByRegistration.get(row.id) || []);
  }, options);
}

export async function getDocumentById(documentId, options = undefined) {
  if (!hasDatabaseUrl(options)) {
    return getDocumentByIdFromFile(documentId, resolveStorePath(options));
  }

  return withDatabase(async (db) => {
    const result = await db.query(
      `
        SELECT
          d.id AS document_id,
          d.original_name,
          d.storage_name,
          d.mime_type,
          d.size,
          d.uploaded_at,
          r.id AS registration_id,
          r.reference_code,
          r.name,
          r.email,
          r.phone,
          r.company,
          r.job_title,
          r.dietary_preferences,
          r.notes,
          r.password_hash,
          r.created_at,
          r.updated_at
        FROM registration_documents d
        INNER JOIN registrations r ON r.id = d.registration_id
        WHERE d.id = $1
        LIMIT 1
      `,
      [Number(documentId)]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      registration: mapRegistrationRow(
        {
          id: row.registration_id,
          reference_code: row.reference_code,
          name: row.name,
          email: row.email,
          phone: row.phone,
          company: row.company,
          job_title: row.job_title,
          dietary_preferences: row.dietary_preferences,
          notes: row.notes,
          password_hash: row.password_hash,
          created_at: row.created_at,
          updated_at: row.updated_at
        },
        []
      ),
      document: {
        id: row.document_id,
        originalName: row.original_name,
        storageName: row.storage_name,
        mimeType: row.mime_type,
        size: Number(row.size),
        uploadedAt: normalizeTimestamp(row.uploaded_at)
      }
    };
  }, options);
}

export async function authenticateRegistration(referenceCode, password, options = undefined) {
  const registration = await getRegistrationByReference(referenceCode, options);

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
  const storePath = resolveStorePath(options);
  const uploadDir = resolveUploadDir(options);
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

  const passwordHash = await hashPassword(password);
  const uploadedDocuments = [];

  try {
    for (const file of normalizeFiles(files)) {
      uploadedDocuments.push(await saveUploadedFile(file, uploadDir));
    }
  } catch (error) {
    await discardStoredFiles(
      uploadedDocuments.map((document) => document.storageName),
      uploadDir
    );
    throw error;
  }

  if (!hasDatabaseUrl(options)) {
    const store = readStore(storePath);
    const existingCodes = new Set(store.registrations.map((entry) => entry.referenceCode));
    const referenceCode = createReferenceCode(existingCodes);
    const now = new Date().toISOString();
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

  try {
    return await withTransaction(async (db) => {
      let registrationRow;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const referenceCode = createReferenceCode();

        try {
          const result = await db.query(
            `
              INSERT INTO registrations (
                reference_code,
                name,
                email,
                phone,
                company,
                job_title,
                dietary_preferences,
                notes,
                password_hash
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING *
            `,
            [
              referenceCode,
              input.name,
              input.email,
              input.phone,
              input.company,
              input.jobTitle,
              input.dietaryPreferences,
              input.notes,
              passwordHash
            ]
          );
          registrationRow = result.rows[0];
          break;
        } catch (error) {
          if (error.code !== "23505") {
            throw error;
          }
        }
      }

      if (!registrationRow) {
        throw new Error("Unable to generate a unique reference code.");
      }

      const documents = [];

      for (const document of uploadedDocuments) {
        const result = await db.query(
          `
            INSERT INTO registration_documents (
              registration_id,
              original_name,
              storage_name,
              mime_type,
              size,
              uploaded_at
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `,
          [
            registrationRow.id,
            document.originalName,
            document.storageName,
            document.mimeType,
            document.size,
            document.uploadedAt
          ]
        );

        documents.push(mapDocumentRow(result.rows[0]));
      }

      return mapRegistrationRow(registrationRow, documents);
    }, options);
  } catch (error) {
    await discardStoredFiles(
      uploadedDocuments.map((document) => document.storageName),
      uploadDir
    );
    throw error;
  }
}

export async function updateRegistration(
  { referenceCode, fields, newFiles = [], replacements = {} },
  options = {}
) {
  const storePath = resolveStorePath(options);
  const uploadDir = resolveUploadDir(options);
  const normalizedReferenceCode = normalizeReferenceCode(referenceCode);
  const nextFields = mapFields(fields);
  const errors = validateFields(nextFields);

  if (errors.length > 0) {
    throw new FormError(errors[0]);
  }

  if (!hasDatabaseUrl(options)) {
    const store = readStore(storePath);
    const index = store.registrations.findIndex(
      (entry) => entry.referenceCode === normalizedReferenceCode
    );

    if (index === -1) {
      throw new FormError("Registration not found.");
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
          await deleteUploadedFile(document.storageName, uploadDir);

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
      await discardStoredFiles(savedFiles, uploadDir);
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

  const currentRegistration = await getRegistrationByReference(referenceCode, options);

  if (!currentRegistration) {
    throw new FormError("Registration not found.");
  }

  const replacementUploads = new Map();
  const appendedUploads = [];
  const cleanupStorageNames = [];
  const replacedOldStorageNames = [];

  try {
    for (const document of currentRegistration.documents) {
      const replacement = replacements[String(document.id)];

      if (!replacement || replacement.size === 0) {
        continue;
      }

      const uploaded = await saveUploadedFile(replacement, uploadDir);
      replacementUploads.set(String(document.id), uploaded);
      cleanupStorageNames.push(uploaded.storageName);
      replacedOldStorageNames.push(document.storageName);
    }

    for (const file of normalizeFiles(newFiles)) {
      const uploaded = await saveUploadedFile(file, uploadDir);
      appendedUploads.push(uploaded);
      cleanupStorageNames.push(uploaded.storageName);
    }
  } catch (error) {
    await discardStoredFiles(cleanupStorageNames, uploadDir);
    throw error;
  }

  try {
    const updatedRegistration = await withTransaction(async (db) => {
      const registrationResult = await db.query(
        `
          UPDATE registrations
          SET
            name = $2,
            email = $3,
            phone = $4,
            company = $5,
            job_title = $6,
            dietary_preferences = $7,
            notes = $8,
            updated_at = NOW()
          WHERE reference_code = $1
          RETURNING *
        `,
        [
          normalizedReferenceCode,
          nextFields.name,
          nextFields.email,
          nextFields.phone,
          nextFields.company,
          nextFields.jobTitle,
          nextFields.dietaryPreferences,
          nextFields.notes
        ]
      );

      if (registrationResult.rows.length === 0) {
        throw new FormError("Registration not found.");
      }

      for (const document of currentRegistration.documents) {
        const uploaded = replacementUploads.get(String(document.id));

        if (!uploaded) {
          continue;
        }

        await db.query(
          `
            UPDATE registration_documents
            SET
              original_name = $2,
              storage_name = $3,
              mime_type = $4,
              size = $5,
              uploaded_at = $6
            WHERE id = $1
          `,
          [
            document.id,
            uploaded.originalName,
            uploaded.storageName,
            uploaded.mimeType,
            uploaded.size,
            uploaded.uploadedAt
          ]
        );
      }

      for (const uploaded of appendedUploads) {
        await db.query(
          `
            INSERT INTO registration_documents (
              registration_id,
              original_name,
              storage_name,
              mime_type,
              size,
              uploaded_at
            )
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            registrationResult.rows[0].id,
            uploaded.originalName,
            uploaded.storageName,
            uploaded.mimeType,
            uploaded.size,
            uploaded.uploadedAt
          ]
        );
      }

      const documentsByRegistration = await fetchDocumentsForRegistrations(db, [
        registrationResult.rows[0].id
      ]);

      return mapRegistrationRow(
        registrationResult.rows[0],
        documentsByRegistration.get(registrationResult.rows[0].id) || []
      );
    }, options);

    await discardStoredFiles(replacedOldStorageNames, uploadDir);
    return updatedRegistration;
  } catch (error) {
    await discardStoredFiles(cleanupStorageNames, uploadDir);
    throw error;
  }
}
