import { api } from "@/shared/lib/api";
import {
  UpdateProfilePayload,
  UserProfile,
} from "../types/user.types";


/**
 * PATCH /users/me — update username / avatar
 */
export async function updateProfileApi(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  try {
    const { data } = await api.patch<UserProfile>(
      "/api/v1/users/update-account",
      payload,
    );
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

// Me

export const getMeApi = async (): Promise<UserProfile> => {
  try {
    const res = await api.get<UserProfile>("/api/v1/user/current-user");
    return res.data;
  } catch (error) {
    console.error("Error fetching user info:", error);
    throw error;
  }
};
