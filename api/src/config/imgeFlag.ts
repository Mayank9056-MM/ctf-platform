import sharp from "sharp";
import { ApiError } from "../utils/ApiError";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupportedImageFormat = "jpeg" | "jpg" | "png" | "webp";

export type FlagEmbedOptions = {
  flag: string;
  outputFormat?: SupportedImageFormat;
  extraExif?: Record<string, string | number>;
};

export type FlagEmbedResult = {
  buffer: Buffer;
  mimeType: string;
  /** The EXIF field name the flag was written to */
  embeddedField: string;
};

export type FlagExtractResult = {
  found: boolean;
  flag?: string;
  /** All metadata fields found in the image */
  allMetadata: Record<string, unknown>;
};

// Constants

const MIME_MAP: Record<SupportedImageFormat, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const FLAG_EXIF_FIELD = "ImageDescription";

// Helpers

/**
 * Returns the MIME type associated with the given image format.
 * If the format is not recognized, returns "image/jpeg".
 * @param {SupportedImageFormat} format - The image format to get the MIME type for.
 * @returns {string} The MIME type associated with the given image format.
 */
function getMimeType(format: SupportedImageFormat): string {
  return MIME_MAP[format] ?? "image/jpeg";
}

/**
 * Detects the image format from the given MIME type.
 *
 * @param {string} mimeType - The MIME type of the image.
 * @returns {SupportedImageFormat} The detected image format.
 */
function detectFormat(mimeType: string): SupportedImageFormat {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpeg"; // default
}

/**
 * Validates an image buffer and returns its metadata.
 * @param {Buffer} buffer - The image buffer to validate.
 * @returns {Promise<sharp.Metadata>} The metadata of the image if it is valid.
 * @throws {ApiError} If the image buffer is invalid.
 */
async function validateImage(buffer: Buffer): Promise<sharp.Metadata> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format) {
      throw new Error("Unrecognised image format");
    }
    return metadata;
  } catch {
    throw new ApiError(
      400,
      "Invalid image file. Only JPEG, PNG, and WEBP are supported."
    );
  }
}

// Core

/**
 * Embeds a flag string in an image buffer, modifying its EXIF data.
 * @param {Buffer} imageBuffer - The image buffer to modify.
 * @param {string} mimeType - The MIME type of the image buffer.
 * @param {FlagEmbedOptions} opts - Options for embedding the flag.
 * @returns {Promise<FlagEmbedResult>} The modified image buffer with the embedded flag.
 * @throws {ApiError} If the image buffer is invalid.
 */
export async function embedFlagInImage(
  imageBuffer: Buffer,
  mimeType: string,
  opts: FlagEmbedOptions
): Promise<FlagEmbedResult> {
  const { flag, outputFormat, extraExif = {} } = opts;

  await validateImage(imageBuffer);

  const fmt = outputFormat ?? detectFormat(mimeType);

  const exifData: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(extraExif).map(([k, v]) => [k, String(v)])
    ),
    [FLAG_EXIF_FIELD]: flag,
  };

  let pipeline = sharp(imageBuffer).withMetadata({
    exif: {
      IFD0: exifData,
    },
  });

  // Re-encode to target format
  switch (fmt) {
    case "jpeg":
    case "jpg":
      pipeline = pipeline.jpeg({ quality: 95, progressive: false });
      break;
    case "png":
      pipeline = pipeline.png({ compressionLevel: 6 });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality: 95, lossless: false });
      break;
  }

  const outputBuffer = await pipeline.toBuffer();

  return {
    buffer: outputBuffer,
    mimeType: getMimeType(fmt),
    embeddedField: FLAG_EXIF_FIELD,
  };
}

/**
 * Attempt to extract the flag from an image by reading the EXIF IFD0 data.
 * @param {Buffer} imageBuffer - The image buffer to extract the flag from.
 * @returns {Promise<FlagExtractResult>} - A promise resolving to an object containing
 *  the extracted flag, a boolean indicating if the flag was found, and a Record containing
 *  all the image metadata.
 */
export async function extractFlagFromImage(
  imageBuffer: Buffer
): Promise<FlagExtractResult> {
  const metadata = await sharp(imageBuffer).metadata();

  const allMetadata: Record<string, unknown> = {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    space: metadata.space,
    channels: metadata.channels,
    depth: metadata.depth,
    density: metadata.density,
    hasProfile: metadata.hasProfile,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
  };

  // Attempt to read EXIF IFD0 data
  let flag: string | undefined;

  if (metadata.exif) {
    // sharp exposes EXIF as a raw Buffer — parse manually
    const exifStr = metadata.exif.toString("latin1");
    allMetadata.rawExifLength = metadata.exif.length;

    // Hunt for the flag pattern CTF{...} anywhere in the EXIF blob
    const flagMatch = exifStr.match(/CTF\{[^}]+\}/);
    if (flagMatch) {
      flag = flagMatch[0];
    }

    // Also search for the field name we wrote
    const descMatch = exifStr.match(/ImageDescription[^\0]*\0([^\0]+)/);
    if (descMatch) {
      allMetadata.ImageDescription = descMatch[1].trim();
    }
  }

  return {
    found: flag !== undefined,
    flag,
    allMetadata,
  };
}

/**
 * Embed a flag in an image as a data URI.
 * @param {Buffer} imageBuffer - The image buffer to embed the flag in.
 * @param {string} mimeType - The MIME type of the image.
 * @param {string} flag - The flag to embed in the image.
 * @returns {Promise<string>} - A promise resolving to the data URI containing the image with the embedded flag.
 */
export async function embedFlagAsDataUri(
  imageBuffer: Buffer,
  mimeType: string,
  flag: string
): Promise<string> {
  const result = await embedFlagInImage(imageBuffer, mimeType, { flag });
  return `data:${result.mimeType};base64,${result.buffer.toString("base64")}`;
}

export function isSupportedImage(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return true;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return true;

  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
    return true;

  return false;
}
