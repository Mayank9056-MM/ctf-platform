import { api } from "@/shared/lib/api";
import { UpdateProfilePayload, UserProfile } from "../types/user.types";
import { ApiResponse } from "@/shared/types/api.types";

/**
 * PATCH /users/me — update username / avatar
 */
export async function updateProfileApi(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  try {
    const res = await api.patch<ApiResponse<UserProfile>>(
      "/api/v1/user/update-account",
      payload,
    );
    return res.data.data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

// Me

export const getMeApi = async (): Promise<UserProfile> => {
  try {
    const res = await api.get<ApiResponse<UserProfile>>(
      "/api/v1/user/current-user",
    );

    return res.data.data;
  } catch (error) {
    console.error("Error fetching user info:", error);
    throw error;
  }
};
