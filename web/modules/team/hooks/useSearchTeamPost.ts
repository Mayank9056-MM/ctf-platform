import { useMutation, useQueryClient } from "@tanstack/react-query";
import { searchTeamsPostApi } from "../api/team.api";

export const useSearchTeamsPost = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: searchTeamsPostApi,
    onSuccess: (data, variables) => {
      qc.setQueryData(["teams", "search", variables], data.teams);
    },
    onError: (error) => {
      console.error("Error searching teams:", error);
    },
  });
};
