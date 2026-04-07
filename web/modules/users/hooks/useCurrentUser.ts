import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { getMeApi } from "../api/user.api";

export const useCurrentUser = () => {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const data = await getMeApi();
      setUser(data);
      return data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 10, // 10 min
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
