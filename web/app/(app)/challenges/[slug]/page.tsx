import ChallengeDetailPage from "@/modules/challenges/components/user/detail/ChallengeDetailPage";
import type { Metadata } from "next";

// Dynamic metadata — the page title shows the challenge name
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title: `${params.slug} — CTF Platform`,
    description: "Solve the challenge and capture the flag.",
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  return <ChallengeDetailPage slug={slug} />;
}
