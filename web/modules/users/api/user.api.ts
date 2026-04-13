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

export const getPublicProfile = async(username: string) => {
  const res = await api.get<
    ApiResponse<
      UserProfile & {
        stats: {
          totalPoints: number;
          rank: number;
          solveCount: number;
          firstBloods: number;
          streak: number;
          solveRate: number;
          averageAttempts: number;
          recentActivity: { date: string; count: number }[];
          solvesByCategory: { category: string; count: number }[];
        };
        recentSolves: {
          _id: string;
          challenge: {
            _id: string;
            title: string;
            slug: string;
            category: string;
            difficulty: string;
            points: number;
            currentPoints: number;
          };
          pointsAwarded: number;
          isFirstBlood: boolean;
          createdAt: string;
        }[];
        team?: { _id: string; name: string; score: number };
      }
    >
  >(`/api/v1/user/profile/${username}`);
  return res.data.data;
}
