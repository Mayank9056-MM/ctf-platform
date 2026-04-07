import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "../queries/notification.keys";
import { getInboxSummaryApi } from "../api/notification.api";
import { useEffect } from "react";
import { getSocket } from "@/shared/lib/socket";

export function useInboxSummary() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: notificationKeys.summary(),
    queryFn: getInboxSummaryApi,

    staleTime: Infinity,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    const socket = getSocket();

    const handler = () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.summary(),
      });
    };

    socket.on("notification:new", handler);

    return () => {
      socket.off("notification:new", handler);
    };
  }, [queryClient]);

  return query;
}
