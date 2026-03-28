import { config } from "@/config";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import { ApiErrorResponse } from "../types/api.types";
import { ApiError } from "./api-error";

// instance create
const api: AxiosInstance = axios.create({
  baseURL: config.API_URL,
  withCredentials: true,
  timeout: 10000,
});

// request interceptor
api.interceptors.request.use(
  (req: InternalAxiosRequestConfig) => {
    // attach headers if needed
    return req;
  },
  (error) => Promise.reject(error),
);

// response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    // Handle unauthorized (401)
    if (status === 401) {
      // redirect to login
      toast.error("Please login to continue");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    // Refresh token
    // if(){}

    return Promise.reject(
      new ApiError(
        message,
        error.response?.data?.statusCode,
        error.response?.data?.errors,
      ),
    );
  },
);

export { api };
