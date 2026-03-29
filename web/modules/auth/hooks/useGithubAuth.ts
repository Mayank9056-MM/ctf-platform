import { clientConfig } from "@/config/client";
import { toast } from "sonner";

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
    if (!clientId) {
      toast.error("GitHub OAuth is not configured.");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/github/callback`;

    const state = crypto.randomUUID(); // CSRF protection

    sessionStorage.setItem("github_oauth_state", state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "read:user user:email",
      state,
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  return { initiateGitHubLogin };
};
