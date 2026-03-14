import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import path from "path";
import { ApiError } from "../utils/ApiError";

// ─── Constants ────────────────────────────────────────────────────────────────

/** 50 MB upper bound for challenge attachments */
const MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024;

/** 5 MB upper bound for image-flag attachments (needs to fit in memory for sharp processing) */
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_ATTACHMENT_MIMES = new Set([
  // Images (for hidden-flag challenges)
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // Archives
  "application/zip",
  "application/x-tar",
  "application/gzip",
  "application/x-bzip2",
  "application/x-7z-compressed",
  // Documents
  "application/pdf",
  // Code / text
  "text/plain",
  "text/html",
  "text/x-python",
  "application/json",
  // Binary / forensics
  "application/octet-stream",
  "application/x-executable",
  "application/x-elf",
  "application/x-sharedlib",
]);

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

const DANGEROUS_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".vbs",
  ".js",
  ".jar",
  ".php",
  ".asp",
  ".aspx",
  ".py",
  ".rb",
  ".pl",
]);

// Helpers

/**
 * Checks if the given filename has an extension that is
 * considered dangerous (executable, scriptable, etc.).
 * @param {string} filename - The filename to check.
 * @returns {boolean} True if the extension is dangerous, false otherwise.
 */
function hasDangerousExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return DANGEROUS_EXTENSIONS.has(ext);
}

// Multer Instances

export const attachmentUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_ATTACHMENT_SIZE_BYTES,
    files: 1,
  },

  fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    if (!ALLOWED_ATTACHMENT_MIMES.has(file.mimetype)) {
      return cb(
        new ApiError(
          415,
          `Unsupported file type: ${file.mimetype}. ` +
            "Allowed: images, archives, PDFs, text files, and binaries."
        ) as unknown as null,
        false
      );
    }

    if (hasDangerousExtension(file.originalname)) {
      return cb(
        new ApiError(
          415,
          `Files with extension "${path.extname(file.originalname)}" are not allowed.`
        ) as unknown as null,
        false
      );
    }

    cb(null, true);
  },
});

export const imageUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },

  fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    if (!IMAGE_MIMES.has(file.mimetype)) {
      return cb(
        new ApiError(
          415,
          "Only JPEG, PNG, and WEBP images are accepted for image-flag attachments."
        ) as unknown as null,
        false
      );
    }
    cb(null, true);
  },
});

// Error Handler

/**
 * Handles multer upload errors and converts them into ApiErrors.
 * If the error is an instance of multer.MulterError, it is converted into an ApiError with a descriptive message.
 * If the error is an instance of ApiError, it is passed through as-is.
 * Otherwise, the error is wrapped in an ApiError with code 400 and a message indicating that an unexpected upload error occurred.
 *
 * @param {Error} err - The error to be handled.
 * @param {Request} _req - The express request object, not used.
 * @param {unknown} _res - The express response object, not used.
 * @param {(err: unknown) => void} next - The express next function, used to pass the error to the next middleware or route handler.
 */
export function handleUploadError(
  err: Error,
  _req: Request,
  _res: unknown,
  next: (err: unknown) => void
): void {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return next(
          new ApiError(
            413,
            `File too large. Maximum allowed size is ${MAX_ATTACHMENT_SIZE_BYTES / 1024 / 1024} MB.`
          )
        );
      case "LIMIT_FILE_COUNT":
        return next(
          new ApiError(400, "Only one file can be uploaded at a time.")
        );
      case "LIMIT_UNEXPECTED_FILE":
        return next(
          new ApiError(
            400,
            `Unexpected field: "${err.field}". Use the "file" field.`
          )
        );
      default:
        return next(new ApiError(400, `Upload error: ${err.message}`));
    }
  }

  // ApiErrors thrown from fileFilter pass through as-is
  if (err instanceof ApiError) {
    return next(err);
  }

  next(err);
}
