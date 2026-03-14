import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config";

// ─── Client ───────────────────────────────────────────────────────────────────

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.R2_ACCESS_KEY_ID,
    secretAccessKey: config.R2_SECRET_ACCESS_KEY,
  },
});

// Types

export type UploadOptions = {
  key: string;
  buffer: Buffer;
  mimeType: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
};

export type UploadResult = {
  key: string;
  publicUrl: string;
  size: number;
  mimeType: string;
  etag?: string;
};

// Helpers

/**
 * Builds a public URL for the given key, only valid when the bucket has public access enabled.
 * @param {string} key - The key of the object to generate a public URL for.
 * @returns {string} - The public URL for the given key.
 */
const buildPublicUrl = (key: string): string =>
  `https://${config.R2_PUBLIC_DOMAIN}/${key}`;

//  Core Operations

export async function uploadToR2(opts: UploadOptions): Promise<UploadResult> {
  const { key, buffer, mimeType, isPublic = false, metadata = {} } = opts;

  const input: PutObjectCommandInput = {
    Bucket: config.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ContentLength: buffer.length,
    Metadata: metadata,
  };

  if (isPublic) {
    input.ACL = "public-read";
  }

  const response = await r2Client.send(new PutObjectCommand(input));

  return {
    key,
    publicUrl: buildPublicUrl(key),
    size: buffer.length,
    mimeType,
    etag: response.ETag?.replace(/"/g, ""),
  };
}

/**
 * Deletes an object from R2.
 * @param {string} key - The key of the object to delete.
 * @returns {Promise<void>} - A promise that resolves when the object is deleted successfully.
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Generates a pre-signed URL for an object in R2.
 * @param {string} key - The key of the object to generate a pre-signed URL for.
 * @param {number} [expiresInSeconds=3600] - The number of seconds the pre-signed URL will be valid for.
 * @returns {Promise<string>} - A promise that resolves to the pre-signed URL.
 */
export async function getPresignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generates a pre-signed URL for uploading an object to R2.
 * @param {string} key - The key of the object to generate a pre-signed URL for.
 * @param {string} mimeType - The MIME type of the object to be uploaded.
 * @param {number} [expiresInSeconds=300] - The number of seconds the pre-signed URL will be valid for.
 * @returns {Promise<string>} - A promise that resolves to the pre-signed URL.
 */
export async function getPresignedUploadUrl(
  key: string,
  mimeType: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
  });

  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Check if an object exists in R2.
 * @param {string} key - The key of the object to check.
 * @returns {Promise<boolean>} - A promise that resolves to true if the object exists, false otherwise.
 */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({ Bucket: config.R2_BUCKET_NAME, Key: key })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds a key for an attachment in R2.
 * The key is in the format `challenges/<challengeId>/attachments/<timestamp>-<safeFilename>`.
 * @param {string} challengeId - The id of the challenge the attachment belongs to.
 * @param {string} originalFilename - The original filename of the attachment.
 * @returns {string} - The key for the attachment.
 */
export function buildAttachmentKey(
  challengeId: string,
  originalFilename: string
): string {
  const safeFilename = originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "_")
    .substring(0, 100);

  return `challenges/${challengeId}/attachments/${Date.now()}-${safeFilename}`;
}
