import PlayerProfilePage from "@/modules/users/components/user/player/PlayerProfilePage";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  return {
    title: `${params.username} — CTF Platform`,
    description: `${params.username}'s CTF profile — stats, solves, and rank.`,
  };
}

export default async function Page({
  params,
}: {
  params: { username: string };
}) {
  const { username } = await params;

  return <PlayerProfilePage username={username} />;
}
