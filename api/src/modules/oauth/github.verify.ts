import { config } from "../../config/config";
import { ApiError } from "../../utils/ApiError";

type GithubProfile = {
  email: string;
  name: string;
  avatar?: string;
  providerId: string;
};

export const getGithubAccessToken = async (code: string) => {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.GITHUB_CLIENT_ID,
      client_secret: config.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new ApiError(401, "Failed to get GitHub access token");
  }

  return data.access_token;
};

export const verifyGithubToken = async (
  token: string
): Promise<GithubProfile> => {
  try {
    console.log(token, "token received for GitHub verification");
    // fetch user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!userRes.ok) {
      throw new ApiError(401, "Invalid GitHub token");
    }

    const user = await userRes.json();

    // fetch user emails (GitHub hides email by default)
    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!emailRes.ok) {
      throw new ApiError(401, "Unable to fetch GitHub email");
    }

    const emails = await emailRes.json();

    const primaryEmail = emails.find(
      (email: { primary: boolean; verified: boolean }) =>
        email.primary && email.verified
    );

    if (!primaryEmail?.email) {
      throw new ApiError(401, "Verified GitHub email not found");
    }

    return {
      email: primaryEmail.email,
      name: user.name ?? user.login,
      avatar: user.avatar_url,
      providerId: String(user.id),
    };
  } catch (error) {
    console.error("GitHub token verification error:", error);
    throw new ApiError(401, "Invalid or expired GitHub token");
  }
};
