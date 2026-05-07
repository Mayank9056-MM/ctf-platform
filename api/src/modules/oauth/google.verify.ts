import { OAuth2Client, TokenPayload } from "google-auth-library";
import { config } from "../../config/config";
import { ApiError } from "../../utils/ApiError";
import logger from "../../lib/logger";

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

export type GoogleProfile = {
  email: string;
  name: string;
  avatar?: string;
  providerId: string;
};

/**
 * Verifies a Google token and returns the corresponding Google profile information.
 * @param {string} token - The Google token to verify.
 * @returns {Promise<GoogleProfile>} - A promise that resolves to a GoogleProfile object containing the email, name, avatar, and providerId of the user.
 * @throws {ApiError} - If the token is invalid, expired, or if the user's email is not verified.
 */
export const verifyGoogleToken = async (
  token: string
): Promise<GoogleProfile> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload: TokenPayload | undefined = ticket.getPayload();

    if (!payload) {
      throw new ApiError(401, "Invalid Google Token");
    }

    if (!payload.email) {
      throw new ApiError(401, "Google account email not available");
    }

    if (!payload.sub) {
      throw new ApiError(401, "Invalid Google provider ID");
    }

    if (!payload.email_verified) {
      throw new ApiError(401, "Google email not verified");
    }

    return {
      email: payload.email,
      name: payload.name ?? "",
      avatar: payload.picture,
      providerId: payload.sub,
    };
  } catch (error) {
    logger.error("Error verifying Google token:", { error });
    throw new ApiError(401, "Invalid or expired Google token");
  }
};
