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
import logger from "../lib/logger";

// Client

const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

export type UploadOptions = {
  key: string;
  buffer: Buffer;
  mimeType: string;
  metadata?: Record<string, string>;
};

export type UploadResult = {
  key: string;
  size: number;
  mimeType: string;
  etag?: string;
};

// Core Operations

/**
 * Uploads an object to S3.
 * @param {UploadOptions} opts - Options for uploading the object.
 * @returns {Promise<UploadResult>} A promise resolving to the uploaded object's details.
 */
export async function uploadToS3(opts: UploadOptions): Promise<UploadResult> {
  const { key, buffer, mimeType, metadata = {} } = opts;

  const input: PutObjectCommandInput = {
    Bucket: config.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ContentLength: buffer.length,
    Metadata: metadata,
  };

  const response = await s3Client.send(new PutObjectCommand(input));

  return {
    key,
    // publicUrl: buildPublicUrl(key),
    // publicUrl: response.Location,
    size: buffer.length,
    mimeType,
    etag: response.ETag?.replace(/"/g, ""),
  };
}

/**
 * Deletes an object from R2 by key.
 * @param {string} key - The key of the object to delete.
 * @returns {Promise<void>} A promise resolving to void when the object is deleted.
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.AWS_S3_BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Generates a presigned URL for downloading an object from S3.
 * @param {string} key - The key of the object to download.
 * @param {number} [expiresInSeconds=3600] - The number of seconds the presigned URL is valid for.
 * @returns {Promise<string>} A promise resolving to the presigned URL.
 */
export async function getPresignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  if (!key) {
    throw new Error("Key is required");
  }

  const command = new GetObjectCommand({
    Bucket: config.AWS_S3_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generates a presigned URL for uploading an object to S3.
 * @param {string} key - The key of the object to upload.
 * @param {string} mimeType - The MIME type of the object to upload.
 * @param {number} [expiresInSeconds=300] - The number of seconds the presigned URL is valid for.
 * @returns {Promise<string>} A promise resolving to the presigned URL.
 */
export async function getPresignedUploadUrl(
  key: string,
  mimeType: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: config.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Checks if an object exists in R2 by key.
 * @param {string} key - The key of the object to check.
 * @returns {Promise<boolean>} A promise resolving to true if the object exists, false otherwise.
 */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({ Bucket: config.AWS_S3_BUCKET_NAME, Key: key })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds a key for an attachment in R2.
 * The key is in the format: `challenges/<challengeId>/attachments/<timestamp>-<safeFilename>`
 * @param {string} challengeId - The id of the challenge to which the attachment belongs.
 * @param {string} originalFilename - The original filename of the attachment.
 * @returns {string} - The built key for the attachment.
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
