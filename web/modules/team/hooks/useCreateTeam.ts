import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createTeamApi } from "../api/team.api";
import { DASHBOARD_QUERY_KEYS } from "@/modules/dashboard/queries/dashboard.keys";
import { toast } from "sonner";

export const useCreateTeam = () => {
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createTeamApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.myTeam });
      toast.success("Squad formed. Lead them well.");
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error("Error creating team:", error);
      toast.error("Failed to create squad. Try again.");
    },
  });
};
