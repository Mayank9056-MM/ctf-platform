import TeamsPage from "@/modules/team/components/TeamPage";
import type { Metadata } from "next";
 
export const metadata: Metadata = {
  title: "Teams — CTF Platform",
  description: "Form alliances, share first bloods, dominate the scoreboard.",
};
 
export default function Page() {
  return <TeamsPage />;
}