import { getMeApi } from "@/modules/auth/api/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useQuery } from "@tanstack/react-query";

export const useCurrentUser = () => {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await getMeApi();
      setUser(res.data);
      return res.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min
    refetchOnWindowFocus: true,
  });
};
