import { EditStorySheet } from "@/modules/story/components/admin/editor/EditStorySheet";


const page = async ({ params }: { params: { storyId: string } }) => {
  const { storyId } = await params;

  return <EditStorySheet storyId={storyId} />;
};

export default page;
