import StoryDetailPage from "@/modules/story/components/user/detail/StoryDetailPage";

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  return <StoryDetailPage slug={slug} />;
}
