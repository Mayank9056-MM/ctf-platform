import LeaderboardPage from "@/modules/leaderboard/components/LeaderboardPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — CTF Platform",
  description: "The top operators ranked by total score.",
};

export default function Page() {
  return <LeaderboardPage />;
}
