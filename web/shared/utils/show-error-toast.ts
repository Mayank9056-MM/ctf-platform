import { toast } from "sonner";
import { ApiError } from "../lib/api-error";

export const showErrorToast = (err: unknown) => {
  if (err instanceof ApiError) {
    // Specific error handling
    if (err.statusCode === 409) {
      toast.error("Email already exists. Try logging in.");
      return;
    }

    if (err.statusCode === 400) {
      toast.error("Invalid input. Check your details.");
      return;
    }

    if (err.statusCode === 500) {
      toast.error("Server error. Please try again later.");
      return;
    }

    toast.error(err.message);
  }
};
