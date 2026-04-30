import AnnouncementsPage from "@/modules/announcement/components/user/AnnouncementsPage";
import type { Metadata } from "next";
 
export const metadata: Metadata = {
  title: "Announcements — CTF Platform",
  description: "Official dispatches from command. Platform updates and event alerts.",
};
 
export default function Page() {
  return <AnnouncementsPage />;
}