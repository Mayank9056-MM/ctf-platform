import StoryPlayPage from "@/modules/story/components/user/player/StoryPlayPage";

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  return <StoryPlayPage slug={slug} />;
}
