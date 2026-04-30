"use client";
// modules/story/components/admin/editor/EditStorySheet.tsx
// This is the entry component used by:
//   app/(admin)/admin/stories/[storyId]/page.tsx
//
// It simply renders StoryEditorPage with the given storyId.
// The name "EditStorySheet" is kept to match your existing import.

import StoryEditorPage from "./StoryEditorPage";

export function EditStorySheet({ storyId }: { storyId: string }) {
  return <StoryEditorPage storyId={storyId} />;
}