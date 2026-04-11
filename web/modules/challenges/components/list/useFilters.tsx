import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  ChallengeCategory,
  ChallengeDifficulty,
} from "../../types/challenge.types";

/**
 * A hook that provides a convenient way to work with the URL search params.
 * It provides a `get` function to retrieve the value of a search param by key,
 * and a `set` function to update the search params.
 * The `set` function will also reset the page to 1 when any of the filters change.
 *
 * @returns An object containing the current values of the search params,
 * and a `set` function to update them.
 */
export function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const get = useCallback(
    (key: string) => searchParams.get(key),
    [searchParams],
  );

  const set = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === "") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
        // Always reset to page 1 when filters change
        if (key !== "page") params.delete("page");
      }
      router.push(`/challenges?${params.toString()}`);
    },
    [searchParams, router],
  );

  return {
    category: get("category") as ChallengeCategory | null,
    difficulty: get("difficulty") as ChallengeDifficulty | null,
    search: get("search") ?? "",
    solved: get("solved") as "all" | "solved" | "unsolved" | null,
    sortBy: (get("sortBy") ?? "points") as
      | "points"
      | "solveCount"
      | "publishedAt"
      | "difficulty",
    sortOrder: (get("sortOrder") ?? "asc") as "asc" | "desc",
    page: parseInt(get("page") ?? "1", 10),
    set,
  };
}
