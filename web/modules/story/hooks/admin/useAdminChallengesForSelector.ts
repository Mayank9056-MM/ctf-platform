import { adminGetChallengesApi } from "@/modules/challenges/api/challenges.api";
import { useQuery } from "@tanstack/react-query";

export type ChallengeSummary = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "insane";
  points: number;
  solveCount: number;
  isVisible: boolean;
};

export function useAdminChallengesForSelector() {
  return useQuery({
    queryKey: ["admin", "challenges", "selector"],
    queryFn: async () => {
      // Fetch page 1, limit 200 — enough for all challenges in a CTF
      const result = await adminGetChallengesApi({ page: 1, limit: 200 });
      return (result.challenges ?? []) as ChallengeSummary[];
    },
    staleTime: 1000 * 60 * 5,
    select: (data) =>
      [...data].sort((a, b) => {
        // Group by category, then sort by title
        if (a.category !== b.category)
          return a.category.localeCompare(b.category);
        return a.title.localeCompare(b.title);
      }),
  });
}
