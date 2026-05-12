import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getEnv } from "./env.js";

let s3Client;
let s3ClientKey = "";
let bucketReadyPromise;

function ensureUploadDirectory(uploadDir) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function fileExtension(name) {
  const extension = path.extname(name || "").toLowerCase();
  return extension.replace(/[^a-z0-9.]/g, "") || "";
}

function objectKey(name) {
  const extension = fileExtension(name);
  return `registrations/${Date.now()}-${crypto.randomUUID()}${extension}`;
}

function hasExternalStorageConfig() {
  const env = getEnv();
  return Boolean(env.storageAccessKey && env.storageSecretKey && env.storageEndpointUrl);
}

function shouldForcePathStyle() {
  return getEnv().storageForcePathStyle !== "false";
}

function getS3Client() {
  const env = getEnv();
  const clientKey = [
    env.storageEndpointUrl,
    env.storageAccessKey,
    env.storageSecretKey,
    env.storageRegion,
    env.storageForcePathStyle
  ].join("|");

  if (!s3Client || s3ClientKey !== clientKey) {
    s3Client = new S3Client({
      endpoint: env.storageEndpointUrl,
      region: env.storageRegion,
      forcePathStyle: shouldForcePathStyle(),
      credentials: {
        accessKeyId: env.storageAccessKey,
        secretAccessKey: env.storageSecretKey
      }
    });
    s3ClientKey = clientKey;
    bucketReadyPromise = undefined;
  }

  return s3Client;
}

async function ensureBucketReady() {
  if (!hasExternalStorageConfig()) {
    return;
  }

  if (!bucketReadyPromise) {
    bucketReadyPromise = (async () => {
      const env = getEnv();
      const client = getS3Client();

      try {
        await client.send(new HeadBucketCommand({ Bucket: env.storageBucket }));
      } catch (error) {
        const statusCode = error?.$metadata?.httpStatusCode;
        const name = error?.name || "";
        const code = error?.Code || "";
        const missingBucket =
          statusCode === 404 ||
          name === "NotFound" ||
          name === "NoSuchBucket" ||
          code === "NotFound" ||
          code === "NoSuchBucket";

        if (!missingBucket) {
          throw error;
        }

        await client.send(
          new CreateBucketCommand({
            Bucket: env.storageBucket,
            ...(env.storageRegion === "us-east-1"
              ? {}
              : {
                  CreateBucketConfiguration: {
                    LocationConstraint: env.storageRegion
                  }
                })
          })
        );
      }
    })();
  }

  await bucketReadyPromise;
}

async function bodyToBuffer(body) {
  if (!body) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks = [];

  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export async function saveUploadedFile(file, uploadDir = getEnv().uploadDir) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const storageName = objectKey(file.name);

  if (hasExternalStorageConfig()) {
    const env = getEnv();
    await ensureBucketReady();
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: env.storageBucket,
        Key: storageName,
        Body: buffer,
        ContentType: file.type || "application/octet-stream"
      })
    );
  } else {
    ensureUploadDirectory(uploadDir);
    const targetPath = path.join(uploadDir, storageName);
    ensureUploadDirectory(path.dirname(targetPath));
    fs.writeFileSync(targetPath, buffer);
  }

  return {
    originalName: file.name || "document",
    storageName,
    mimeType: file.type || "application/octet-stream",
    size: buffer.length,
    uploadedAt: new Date().toISOString()
  };
}

export async function readUploadedFile(storageName, uploadDir = getEnv().uploadDir) {
  if (hasExternalStorageConfig()) {
    const env = getEnv();
    await ensureBucketReady();
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: env.storageBucket,
        Key: storageName
      })
    );

    return bodyToBuffer(response.Body);
  }

  return fs.readFileSync(path.join(uploadDir, storageName));
}

export async function deleteUploadedFile(storageName, uploadDir = getEnv().uploadDir) {
  if (hasExternalStorageConfig()) {
    const env = getEnv();

    try {
      await ensureBucketReady();
      await getS3Client().send(
        new DeleteObjectCommand({
          Bucket: env.storageBucket,
          Key: storageName
        })
      );
    } catch (error) {
      if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
        return;
      }

      throw error;
    }

    return;
  }

  const filePath = path.join(uploadDir, storageName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
