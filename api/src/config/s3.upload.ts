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
  isPublic?: boolean;
  metadata?: Record<string, string>;
};

export type UploadResult = {
  key: string;
  // publicUrl: string;
  size: number;
  mimeType: string;
  etag?: string;
};

// Helpers

/**
 * Builds a public URL for an object in R2.
 * If the public domain is set in the config, it is used to build the URL.
 * Otherwise, the default AWS S3 URL is used.
 * @param {string} key - The key of the object to build the URL for.
 * @returns {string} - The public URL of the object.
 */
// const buildPublicUrl = (key: string): string => {
//   if (config.AWS_S3_PUBLIC_DOMAIN) {
//     const domain = config.AWS_S3_PUBLIC_DOMAIN.replace(/\/$/, "");
//     return `${domain}/${key}`;
//   }

//   return `https://${config.AWS_S3_BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;
// };

// Core Operations

/**
 * Uploads an object to R2.
 * @param {UploadOptions} opts - Options for uploading the object.
 * @returns {Promise<UploadResult>} A promise resolving to the uploaded object's details.
 */
export async function uploadToR2(opts: UploadOptions): Promise<UploadResult> {
  const { key, buffer, mimeType, isPublic = false, metadata = {} } = opts;

  const input: PutObjectCommandInput = {
    Bucket: config.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ContentLength: buffer.length,
    Metadata: metadata,
  };

  // if (isPublic) {
  //   input.ACL = "public-read";
  // }

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
export async function deleteFromR2(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.AWS_S3_BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Generates a presigned URL for downloading an object from R2.
 * @param {string} key - The key of the object to download.
 * @param {number} [expiresInSeconds=3600] - The number of seconds the presigned URL is valid for.
 * @returns {Promise<string>} A promise resolving to the presigned URL.
 */
export async function getPresignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.AWS_S3_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generates a presigned URL for uploading an object to R2.
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
