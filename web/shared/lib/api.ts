import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import { ApiError } from "./api-error";
import { clientConfig } from "@/config/client";
import type { ApiErrorResponse } from "../types/api.types";

// Token Refresh Queue
// When the access token expires, multiple in-flight requests will all hit 401
// simultaneously. We queue them and resolve/reject all at once after one
// refresh attempt — preventing a "thundering herd" of refresh calls.

type QueueItem = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

/**
 * Process the queue of failed requests (due to expired access tokens).
 * If resolved is true, resolve all queued requests with null.
 * If resolved is false, reject all queued requests with the given error.
 * After processing the queue, reset the queue to empty.
 */
function processQueue(error: unknown, resolved = true) {
  failedQueue.forEach((item) => {
    if (resolved) {
      item.resolve(null);
    } else {
      item.reject(error);
    }
  });
  failedQueue = [];
}

// Redirect Helper

/**
 * Redirect the user to the login page.
 * If the user is already on the login page, do nothing.
 * If the user is on a different page, set the "from" query parameter to the current page.
 * If a reason is provided, set the "reason" query parameter to the reason.
 * @param {string} [reason] - The reason for the redirect.
 */
function redirectToLogin(reason?: string) {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname;
  const isAlreadyOnLogin = currentPath === "/login";
  if (isAlreadyOnLogin) return;

  const url = new URL("/login", window.location.origin);
  if (currentPath !== "/" && currentPath !== "/dashboard") {
    url.searchParams.set("from", currentPath);
  }
  if (reason) {
    url.searchParams.set("reason", reason);
  }

  window.location.href = url.toString();
}

// Status-Specific Toast Messages

/**
 * Displays a toast message based on the given HTTP status code and
 * server-provided error message.
 *
 * @param {number | undefined} status - The HTTP status code.
 * @param {string} serverMessage - The error message provided by the server.
 */
function showStatusToast(
  status: number | undefined,
  serverMessage: string,
): void {
  if (typeof window === "undefined") return;

  switch (status) {
    // Auth errors
    case 400:
      toast.error(serverMessage || "Invalid request. Check your input.");
      break;

    case 401:
      // Handled separately in interceptor (with redirect)
      break;

    case 403:
      if (serverMessage?.toLowerCase().includes("ban")) {
        toast.error("Your account has been suspended. Contact support.", {
          duration: 8000,
          description: "appeal@ctfplatform.io",
        });
      } else if (serverMessage?.toLowerCase().includes("verified")) {
        toast.error("Please verify your email to access this resource.", {
          action: {
            label: "Resend",
            onClick: () => {
              import("@/modules/auth/api/auth.api").then(
                ({ resendVerificationApi }) => resendVerificationApi(),
              );
            },
          },
          duration: 8000,
        });
      } else {
        toast.error("You don't have permission to perform this action.");
      }
      break;

    case 404:
      // Usually silent — the component handles missing data
      break;

    case 409:
      toast.error(serverMessage || "This resource already exists.");
      break;

    case 413:
      toast.error("File too large. Maximum allowed size exceeded.");
      break;

    case 415:
      toast.error("Unsupported file type.");
      break;

    case 422:
      toast.error("Validation failed. Check your input and try again.");
      break;

    case 429:
      toast.error("Too many requests. Please slow down and try again.", {
        duration: 6000,
        description: "You've been temporarily rate-limited.",
      });
      break;

    // Server errors
    case 500:
      toast.error("Server error. Our team has been notified.", {
        duration: 5000,
        description: "If this persists, contact support.",
      });
      break;

    case 502:
    case 503:
    case 504:
      toast.error("Service temporarily unavailable. Try again shortly.", {
        duration: 5000,
      });
      break;

    default:
      if (!status) {
        // Network error / timeout / no response
        toast.error("Network error. Check your connection and try again.");
      }
      break;
  }
}

// Axios Instance

const api: AxiosInstance = axios.create({
  baseURL: clientConfig.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add a request ID for tracing (helps correlate client logs with server logs)
    config.headers["X-Request-ID"] = crypto.randomUUID();
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _silentAuth?: boolean;
    };

    const status = error.response?.status;
    const serverMessage =
      error.response?.data?.message || error.message || "Something went wrong";

    // 401 Unauthorized — attempt token refresh
    if (status === 401 && !originalRequest._retry) {
      // Mark as retry so we don't loop infinitely
      originalRequest._retry = true;

      // If a refresh is already in flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Attempt to refresh using the httpOnly refresh token cookie
        await api.post("/api/v1/refresh-token/auth/refresh", {}, {
          _silentAuth: true,
        } as AxiosRequestConfig);

        // Refresh succeeded — retry all queued requests and the original
        processQueue(null, true);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — the session is fully expired or invalid
        processQueue(refreshError, false);
        isRefreshing = false;

        // Clear client auth state
        import("@/modules/auth/store/auth.store").then(({ useAuthStore }) => {
          useAuthStore.getState().logout();
        });

        // Don't show toast for silent auth check requests
        if (!originalRequest._silentAuth) {
          toast.error("Your session has expired. Please sign in again.", {
            id: "session-expired",
            duration: 5000,
          });
        }

        redirectToLogin("session_expired");

        return Promise.reject(
          new ApiError("Session expired. Please sign in again.", 401, []),
        );
      }
    }

    // Suppress toast for silent background checks
    if (originalRequest._silentAuth) {
      return Promise.reject(
        new ApiError(serverMessage, status, error.response?.data?.errors),
      );
    }

    // All other errors
    showStatusToast(status, serverMessage);

    return Promise.reject(
      new ApiError(serverMessage, status, error.response?.data?.errors),
    );
  },
);

// Typed helper for silent requests (no toast, no redirect)

/**
 * Helper function to make a silent request (no toast, no redirect).
 * Catches any errors and returns null.
 * @template T
 * @param {() => Promise<T>} fn - Function to call
 * @returns {Promise<T | null>} - Promise that resolves to null if an error occurs
 */
export function silentRequest<T>(fn: () => Promise<T>): Promise<T | null> {
  return fn().catch(() => null);
}

export { api };
