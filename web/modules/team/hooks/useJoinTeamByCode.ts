import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DASHBOARD_QUERY_KEYS } from "@/modules/dashboard/queries/dashboard.keys";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { joinTeamByCodeApi } from "../api/team.api";

export const useJoinTeamByCode = () => {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: joinTeamByCodeApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.myTeam });
      toast.success("Joined. Welcome to the crew.");
      router.push("/dashboard");
    },
  });
};
