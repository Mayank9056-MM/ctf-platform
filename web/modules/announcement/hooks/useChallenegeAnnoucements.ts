import { useQuery } from "@tanstack/react-query";
import { getChallengeAnnouncementsApi } from "../api/announcement.api";
import { announcementKeys } from "../queries/announcement.keys";

/**
 * Announcements scoped to a specific challenge — used on the challenge detail page.
 * No auth required. Only fetches when challengeId is present.
 */
export function useChallengeAnnouncements(challengeId: string, enabled = true) {
  return useQuery({
    queryKey: announcementKeys.challengeFeed(challengeId),
    queryFn: () => getChallengeAnnouncementsApi(challengeId),
    enabled: enabled && !!challengeId,
    staleTime: 1000 * 60 * 2,
  });
}
