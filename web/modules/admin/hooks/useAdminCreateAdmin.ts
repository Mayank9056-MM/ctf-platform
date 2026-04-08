import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { CreateAdminFormData } from "../schema/admin.schema";
import { adminCreateAdminApi } from "../api/admin.api";
import { adminKeys } from "../queries/admin.queries";

export function useAdminCreateAdmin() {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (payload: CreateAdminFormData) => adminCreateAdminApi(payload),
 
    onSuccess: (admin) => {
      qc.invalidateQueries({ queryKey: adminKeys.admins.lists() });
      toast.success(`Admin account created for ${admin.email}.`);
    },
 
    onError: (err: ApiError) => {
      if (err.statusCode === 409) toast.error("An account with this email already exists.");
      else toast.error(err.message ?? "Failed to create admin account.");
    },
  });
}