import { Request } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  addHintSchema,
  challengeFilterSchema,
  createChallengeSchema,
  purchaseHintSchema,
  updateChallengeSchema,
} from "./challenge.validator";
import { ApiError } from "../../utils/ApiError";
import { challengeService } from "./challenge.service";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  buildAttachmentKey,
  deleteFromR2,
  uploadToR2,
} from "../../config/r2.upload";
import logger from "../../utils/logger";
import {
  embedFlagInImage,
  extractFlagFromImage,
  isSupportedImage,
} from "../../config/imageFlag";
import path from "node:path";
import { parseBody } from "../../utils/helpers";

// helpers\

/**
 * Retrieves the IP address of the client making the request.
 * It first checks if the "x-forwarded-for" header is present and uses the first IP address in the list.
 * If not present, it falls back to the IP address provided by the socket API.
 * If neither is present, it returns "unknown".
 * @param {Request} req - The express request object.
 * @returns {string} - The client's IP address.
 */
const getIp = (req: Request): string => {
  const forwarded = (req.headers["x-forwarded-for"] as string | undefined)
    ?.split(",")[0]
    ?.trim();

  return forwarded || req.socket?.remoteAddress || "unknown";
};

/**
 * Converts a public URL to a key that can be used in R2.
 * If the given URL is not a valid URL, it is assumed to already be a key and is returned as is.
 * @param {string} publicUrl - The public URL to convert to a key.
 * @returns {string} - The converted key.
 */
function urlToKey(publicUrl: string): string {
  try {
    const parsed = new URL(publicUrl);

    return parsed.pathname.slice(1);
  } catch (error) {
    // Already af key
    return publicUrl;
  }
}

// player controllers

const getChallenges = asyncHandler(async (req, res) => {
  const data = parseBody(challengeFilterSchema, req.query);

  const result = await challengeService.getChallenges(data, req.user!._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        challenges: result.challenges,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
          hasNext: result.page * result.limit < result.total,
          hasPrev: result.page > 1,
        },
      },
      "Challenges retrieved successfully"
    )
  );
});

const getChallengeDetail = asyncHandler(async (req, res) => {
  const idOrSlug = req.params.idOrSlug as string;

  if (!idOrSlug) {
    throw new ApiError(400, "Challenge id or slug is required");
  }

  const challenge = await challengeService.getChallengeDetail(
    idOrSlug,
    req.user!._id
  );

  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, challenge, "Challenge retrieved successfully"));
});

const purchaseHint = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  const data = parseBody(purchaseHintSchema, req.body);

  const result = await challengeService.purchaseHint(
    id,
    data.hintIndex,
    req.user!._id
  );

  if (!result) {
    throw new ApiError(404, "Challenge not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Hint unlocked successfully"));
});

const getChallengeSolves = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

  const result = await challengeService.getChallengeSolves(id, page, limit);

  if (!result) {
    throw new ApiError(404, "Challenge not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        solves: result.solves,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      },
      "Solves retrieved successfully"
    )
  );
});

// admin controllers

const adminGetChallenges = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

  const result = await challengeService.getAdminChallenges(page, limit);

  if (!result) {
    throw new ApiError(404, "Challenges not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        challenges: result.challenges,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      },
      "All challenges retrieved successfully"
    )
  );
});

const adminCreateChallenge = asyncHandler(async (req, res) => {
  const data = parseBody(createChallengeSchema, req.body);

  const challenge = await challengeService.createChallenge({
    ...data,
    authorId: req.user!._id,
  });

  if (!challenge) {
    throw new ApiError(400, "Something went wrong while creating challenge");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, challenge, "Challenge created successfully"));
});

const adminUpdateChallenge = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  const data = parseBody(updateChallengeSchema, req.body);

  const challenge = await challengeService.updateChallenge(
    id,
    data,
    req.user!._id
  );

  if (!challenge) {
    throw new ApiError(400, "Something went wrong while updating challenge");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, challenge, "Challenge updated successfully"));
});

const adminPublishChallenge = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  const challenge = await challengeService.setVisibility(
    id,
    true,
    req.user!._id
  );

  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, challenge, "Challenge published successfully"));
});

const adminUnpublishChallenge = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  const challenge = await challengeService.setVisibility(
    id,
    false,
    req.user!._id
  );

  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, challenge, "Challenge unpublished successfully")
    );
});

const adminDeleteChallenge = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  await challengeService.deleteChallenge(id, req.user!._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Challenge deleted successfully"));
});

const adminAddHint = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  const data = parseBody(addHintSchema, req.body);

  const challenge = await challengeService.addHint(id, data, req.user!._id);

  if (!challenge) {
    throw new ApiError(400, "Something went wrong while adding hint");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, challenge, "Hint added successfully"));
});

const adminRemoveHint = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  const hintIndexParams = req.params.hintIndex as string;

  if (!hintIndexParams) {
    throw new ApiError(400, "Hint index is required");
  }

  const hintIndex = parseInt(hintIndexParams, 10);

  if (isNaN(hintIndex) || hintIndex < 0) {
    throw new ApiError(400, "Invalid hint index");
  }

  const challenge = await challengeService.removeHint(
    id,
    hintIndex,
    req.user!._id
  );

  if (!challenge) {
    throw new ApiError(400, "Something went wrong while removing hint");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, challenge, "Hint removed successfully"));
});

const adminAddAttachment = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  const file = req.file;

  if (!file) {
    throw new ApiError(400, "No file uploaded. Use field name 'file'");
  }

  const displayName =
    (req.body.name as string | undefined)?.trim() || file.originalname;

  const key = buildAttachmentKey(id, file.originalname);

  const upload = await uploadToR2({
    key,
    buffer: file.buffer,
    mimeType: file.mimetype,
    isPublic: false,
    metadata: {
      challengeId: id,
      uploadedBy: req.user!._id.toString(),
      originalName: file.originalname,
    },
  });

  const challenge = await challengeService.addAttachment(
    id,
    {
      name: displayName,
      url: upload.publicUrl,
      size: upload.size,
      mimeType: upload.mimeType,
      key: upload.key,
    },
    req.user!._id
  );

  return res
    .status(201)
    .json(new ApiResponse(201, challenge, "Attachment added successfully"));
});

const adminRemoveAttachment = asyncHandler(async (req, res) => {
  const { id: challengeId, attachmentId } = req.params as {
    id: string;
    attachmentId: string;
  };

  if (!challengeId) {
    throw new ApiError(400, "Challenge id is required");
  }

  if (!attachmentId) {
    throw new ApiError(400, "Attachment id is required");
  }

  // Fetch current challenge to get the R2 key before removing from DB
  const challenge = await challengeService.getAdminChallengesById(challengeId);

  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  const attachment = challenge.attachments.find(
    (a: { _id: { toString(): string } }) => a._id.toString() === attachmentId
  );

  if (!attachment) {
    throw new ApiError(404, "Attachment not found");
  }

  // Delete from R2 — use stored key if present, otherwise derive from URL
  const r2Key: string = (attachment as unknown as { key?: string }).key
    ? (attachment as unknown as { key: string }).key
    : urlToKey(attachment.url);

  deleteFromR2(r2Key).catch((err: unknown) => {
    console.error(
      `[R2] Failed to delete object "${r2Key}" - manual cleanup needed`,
      err
    );

    logger.error(
      `[R2] Failed to delete object "${r2Key}" - manual cleanup needed`,
      err
    );
  });

  const updated = await challengeService.removeAttachment(
    challengeId,
    attachmentId,
    req.user!._id
  );

  if (!updated) {
    throw new ApiError(400, "Something went wrong while removing attachment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Attachment removed successfully"));
});

const adminEmbedImageFlag = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  const file = req.file;

  if (!file)
    throw new ApiError(400, "No file uploaded. Use field name 'file'.");

  // Validate magic bytes — don't trust the Content-Type header alone
  if (!isSupportedImage(file.buffer)) {
    throw new ApiError(
      415,
      "File does not appear to be a valid JPEG, PNG, or WEBP image."
    );
  }

  // Fetch the raw challenge flag (select: false field — use admin method)
  const flag = await challengeService.getRawFlag(id);

  const outputFormat =
    (req.body.format as "jpeg" | "png" | "webp" | undefined) ??
    (file.mimetype.includes("png")
      ? "png"
      : file.mimetype.includes("webp")
        ? "webp"
        : "jpeg");

  // Embed flag into image EXIF
  const embedded = await embedFlagInImage(file.buffer, file.mimetype, {
    flag,
    outputFormat,
    extraExif: {
      Software: "CTF Platform v1.0",
      Artist: "challenge-author",
    },
  });

  // Build key using the correct extension for the output format
  const ext = outputFormat === "jpeg" ? "jpg" : outputFormat;
  const baseName =
    path.basename(file.originalname, path.extname(file.originalname)) +
    `-flag.${ext}`;

  const key = buildAttachmentKey(id, baseName);

  const upload = await uploadToR2({
    key,
    buffer: embedded.buffer,
    mimeType: embedded.mimeType,
    isPublic: true,
    metadata: {
      challengeId: id,
      uploadedBy: req.user!._id.toString(),
      flagEmbedded: "true",
      embeddedField: embedded.embeddedField,
    },
  });

  const displayName = (req.body.name as string | undefined)?.trim() || baseName;

  const challenge = await challengeService.addAttachment(
    id,
    {
      name: displayName,
      url: upload.publicUrl,
      size: upload.size,
      mimeType: upload.mimeType,
      key: upload.key,
    },
    req.user!._id
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        challenge,
        embed: {
          field: embedded.embeddedField,
          outputFormat,
          originalSize: file.buffer.length,
          processedSize: embedded.buffer.length,
          publicUrl: upload.publicUrl,
        },
      },
      `Flag embedded in image metadata (${embedded.embeddedField}) and uploaded successfully`
    )
  );
});

const adminVerifyEmbeddedFlag = asyncHandler(async (req, res) => {
  const { id: challengeId, attachmentId } = req.params as {
    id: string;
    attachmentId: string;
  };

  if (!challengeId) {
    throw new ApiError(400, "Challenge id is required");
  }

  if (!attachmentId) {
    throw new ApiError(400, "Attachment id is required");
  }

  const challenge = await challengeService.getAdminChallengesById(challengeId);

  const attachment = challenge.attachments.find(
    (a: { _id: { toString(): string } }) => a._id.toString() === attachmentId
  );

  if (!attachment) {
    throw new ApiError(404, "Attachment not found");
  }

  if (
    !["image/jpeg", "image/png", "image/webp"].includes(attachment.mimeType)
  ) {
    throw new ApiError(
      400,
      "This attachment is not an image. Flag verification only applies to image files."
    );
  }

  // Fetch the file from R2 via the public URL
  const response = await fetch(attachment.url);

  if (!response.ok) {
    throw new ApiError(502, "Could not fetch attachment from R2");
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const result = await extractFlagFromImage(imageBuffer);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        attachmentId,
        url: attachment.url,
        flagFound: result.found,
        extractedFlag: result.flag ?? null,
        metadata: result.allMetadata,
      },
      result.found
        ? "Flag successfully verified in image metadata"
        : "No flag pattern found in image metadata"
    )
  );
});

const adminGetStats = asyncHandler(async (_req, res) => {
  const stats = await challengeService.getAdminStats();

  if (!stats) {
    throw new ApiError(404, "Stats not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Challenge stats retrieved"));
});

const adminGetSubmissions = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Challenge id is required");
  }

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
  const isCorrect =
    req.query.isCorrect === "true"
      ? true
      : req.query.isCorrect === "false"
        ? false
        : undefined;

  const result = await challengeService.getAdminSubmissions(
    id,
    page,
    limit,
    isCorrect
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        submissions: result.submissions,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      },
      "Submissions retrieved"
    )
  );
});

export {
  getChallenges,
  getChallengeDetail,
  purchaseHint,
  getChallengeSolves,
  adminGetChallenges,
  adminCreateChallenge,
  adminUpdateChallenge,
  adminPublishChallenge,
  adminUnpublishChallenge,
  adminDeleteChallenge,
  adminAddHint,
  adminRemoveHint,
  adminAddAttachment,
  adminRemoveAttachment,
  adminEmbedImageFlag,
  adminVerifyEmbeddedFlag,
  adminGetStats,
  adminGetSubmissions,
};
