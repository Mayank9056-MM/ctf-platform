import { clientConfig } from "@/config/client";

/**
 * Initiates a GitHub OAuth login flow.
 *
 * @returns {Object} An object containing the `initiateGitHubLogin` function.
 * @example
 * const { initiateGitHubLogin } = useGitHubAuth();
 * initiateGitHubLogin();
 */
export const useGitHubAuth = () => {
  const initiateGitHubLogin = () => {
    const clientId = clientConfig.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = "read:user user:email";
    const state = crypto.randomUUID(); // CSRF protection
    sessionStorage.setItem("github_oauth_state", state);

    const url =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${state}`;

    window.location.href = url;
  };

  return { initiateGitHubLogin };
};
