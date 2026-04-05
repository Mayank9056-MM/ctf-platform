import { useQuery } from "@tanstack/react-query";
import { parseDeviceInfo } from "../lib/helpers/parseDeviceInfo";
import { getSessionsApi } from "../api/refreshToken.api";
import { sessionKeys } from "../queries/refreshToken.queries";

export function useSessions() {
  const query = useQuery({
    queryKey: sessionKeys.list(),
    queryFn: getSessionsApi,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
 
  const devices = (query.data?.sessions ?? []).map(parseDeviceInfo);
 
  return {
    ...query,
    sessions: query.data?.sessions ?? [],
    devices,
    count: query.data?.count ?? 0,
    currentDevice: devices.find((d) => d.isCurrent),
    otherDevices: devices.filter((d) => !d.isCurrent),
  };
}