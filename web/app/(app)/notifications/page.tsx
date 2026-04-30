import NotificationsPage from "@/modules/notification/components/user/NotificationsPage";
import type { Metadata } from "next";
 
export const metadata: Metadata = {
  title: "Notifications — CTF Platform",
  description: "Your intel feed — solves, team invites, and system alerts.",
};
 
export default function Page() {
  return <NotificationsPage />;
}