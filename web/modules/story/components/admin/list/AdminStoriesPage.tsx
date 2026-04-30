"use client";
// modules/story/components/admin/list/AdminStoriesPage.tsx

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAdminStories } from "@/modules/story/hooks/admin/useAdminStories";
import { useAdminCreateStory } from "@/modules/story/hooks/admin/useAdminCreateStory";
import { useAdminDeleteStory } from "@/modules/story/hooks/admin/useAdminDeleteStory";
import { useAdminSetStoryStatus } from "@/modules/story/hooks/admin/useAdminSetStoryStatus";
import { useStoryStore } from "@/modules/story/store/story.store";

import type {
  StorySummary,
  StoryStatus,
  StoryDifficulty,
  StoryListFilters,
} from "@/modules/story/types/story.types";
import {
  STORY_DIFFICULTIES,
  STORY_STATUSES,
} from "@/modules/story/types/story.types";
import {
  createStorySchema,
  type CreateStoryFormData,
  type CreateStoryInput,
} from "@/modules/story/schemas/story.schema";

import {
  AlertTriangle,
  Archive,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Skull,
  Swords,
  Target,
  Flame,
  Trophy,
  Upload,
  X,
  XCircle,
  Zap,
  BookMarked,
  Layers,
  TrendingUp,
} from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────

const DIFF_CFG: Record<
  StoryDifficulty,
  { color: string; dot: string; label: string; icon: React.ElementType }
> = {
  easy: {
    color: "text-emerald-400",
    dot: "bg-emerald-400",
    label: "Easy",
    icon: Target,
  },
  medium: {
    color: "text-amber-400",
    dot: "bg-amber-400",
    label: "Medium",
    icon: Swords,
  },
  hard: {
    color: "text-orange-400",
    dot: "bg-orange-400",
    label: "Hard",
    icon: Flame,
  },
  insane: {
    color: "text-red-400",
    dot: "bg-red-400",
    label: "Insane",
    icon: Skull,
  },
};

const STAT_CFG: Record<
  StoryStatus,
  { bg: string; color: string; ring: string; label: string; dot: string }
> = {
  draft: {
    bg: "bg-slate-700/40",
    color: "text-slate-400",
    ring: "ring-slate-700/50",
    label: "Draft",
    dot: "bg-slate-500",
  },
  published: {
    bg: "bg-emerald-500/10",
    color: "text-emerald-400",
    ring: "ring-emerald-500/20",
    label: "Live",
    dot: "bg-emerald-400",
  },
  archived: {
    bg: "bg-slate-500/10",
    color: "text-slate-500",
    ring: "ring-slate-500/15",
    label: "Archived",
    dot: "bg-slate-600",
  },
};

// ─── File Upload Component ────────────────────────────────────────────────────

function FileUploadZone({
  value,
  onChange,
  label = "Cover Image",
  className,
}: {
  value?: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null);
      setPreview(null);
      return;
    }
    onChange(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
        {label}
      </Label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200",
          dragging
            ? "border-emerald-500/60 bg-emerald-500/5"
            : "border-slate-700/60 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60",
          "flex flex-col items-center justify-center p-4 min-h-[100px]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {preview ? (
          <div className="relative w-full h-32">
            <img
              src={preview}
              alt="preview"
              className="h-full w-full object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 ring-1 ring-slate-700">
              <Upload className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="font-mono text-xs text-slate-400">
                Drop image or click to browse
              </p>
              <p className="font-mono text-[10px] text-slate-600 mt-0.5">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
      {value && (
        <p className="font-mono text-[10px] text-emerald-400/70 truncate">
          ✓ {value.name}
        </p>
      )}
    </div>
  );
}

// ─── Status & Diff Badges ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StoryStatus }) {
  const s = STAT_CFG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold ring-1 uppercase tracking-wider",
        s.bg,
        s.color,
        s.ring,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function DiffBadge({ difficulty }: { difficulty: StoryDifficulty }) {
  const d = DIFF_CFG[difficulty];
  const Icon = d.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("h-3 w-3", d.color)} />
      <span className={cn("font-mono text-[11px] font-medium", d.color)}>
        {d.label}
      </span>
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0a0e15]/60 px-4 py-3 backdrop-blur-sm">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ring-white/5",
          bg,
        )}
      >
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div>
        <p
          className={cn(
            "font-mono text-lg font-black tabular-nums leading-none",
            color,
          )}
        >
          {value}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-slate-600 mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Create Story Form ────────────────────────────────────────────────────────

function CreateStoryForm({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useAdminCreateStory();
  const [tagInput, setTagInput] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateStoryInput, unknown, CreateStoryFormData>({
    resolver: zodResolver(createStorySchema),
    defaultValues: { difficulty: "medium", completionXpBonus: 0, tags: [] },
  });

  const tags = (watch("tags") ?? []) as string[];

  const pushTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t) || tags.length >= 15) return;
    setValue("tags", [...tags, t], { shouldValidate: true });
    setTagInput("");
  };

  const close = () => {
    reset();
    setTagInput("");
    setCoverFile(null);
    onClose();
  };

  const onSubmit = (data: CreateStoryFormData) => {
    const fd = new FormData();
    fd.append("title", data.title);
    if (data.tagline) fd.append("tagline", data.tagline);
    if (data.description) fd.append("description", data.description);
    fd.append("difficulty", data.difficulty ?? "medium");
    fd.append("completionXpBonus", String(data.completionXpBonus ?? 0));
    if (data.accentColor) fd.append("accentColor", data.accentColor);
    if (data.estimatedMinutes)
      fd.append("estimatedMinutes", String(data.estimatedMinutes));
    (data.tags ?? []).forEach((t) => fd.append("tags", t));
    if (coverFile) fd.append("coverImage", coverFile);
    create(fd, { onSuccess: close });
  };

  return (
    <form
      id="create-story-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col h-full"
    >
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-5">
          {/* Cover upload */}
          <FileUploadZone
            value={coverFile}
            onChange={setCoverFile}
            label="Cover Image (optional)"
          />

          <Separator className="bg-slate-800/60" />

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              {...register("title")}
              placeholder="Operation Shadow Protocol"
              className={cn(
                "bg-slate-900/60 border-slate-700/60 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/40",
                errors.title && "border-red-500/60",
              )}
            />
            {errors.title && (
              <p className="font-mono text-[10px] text-red-400">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Tagline */}
          <div className="space-y-1.5">
            <Label className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
              Tagline <span className="text-slate-600">(opt)</span>
            </Label>
            <Input
              {...register("tagline")}
              placeholder="Uncover the truth before it's too late..."
              className="bg-slate-900/60 border-slate-700/60 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
              Description <span className="text-slate-600">(opt)</span>
            </Label>
            <Textarea
              {...register("description")}
              rows={3}
              placeholder="Full synopsis shown before players start..."
              className="bg-slate-900/60 border-slate-700/60 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500/30 resize-none"
            />
          </div>

          <Separator className="bg-slate-800/60" />

          {/* Difficulty + XP */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
                Difficulty
              </Label>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as StoryDifficulty)}
                  >
                    <SelectTrigger className="bg-slate-900/60 border-slate-700/60 text-slate-300 focus:ring-emerald-500/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1117] border-slate-800">
                      {STORY_DIFFICULTIES.map((d) => {
                        const cfg = DIFF_CFG[d];
                        const Icon = cfg.icon;
                        return (
                          <SelectItem
                            key={d}
                            value={d}
                            className="text-slate-300 focus:bg-slate-800 focus:text-white"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                              <span>{cfg.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
                XP Bonus
              </Label>
              <Input
                type="number"
                min={0}
                {...register("completionXpBonus", { valueAsNumber: true })}
                placeholder="500"
                className="bg-slate-900/60 border-slate-700/60 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Estimated minutes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
                Est. Duration <span className="text-slate-600">(min)</span>
              </Label>
              <Input
                type="number"
                min={1}
                {...register("estimatedMinutes", {
                  setValueAs: (v: string) =>
                    v === "" ? undefined : parseInt(v, 10),
                })}
                placeholder="90"
                className="bg-slate-900/60 border-slate-700/60 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
                Accent Color
              </Label>
              <Controller
                name="accentColor"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={field.value ?? "#10b981"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-1"
                    />
                    <Input
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value || undefined)
                      }
                      placeholder="#10b981"
                      className="bg-slate-900/60 border-slate-700/60 text-white font-mono text-xs placeholder:text-slate-600 focus-visible:ring-emerald-500/30"
                    />
                  </div>
                )}
              />
            </div>
          </div>

          <Separator className="bg-slate-800/60" />

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
              Tags <span className="text-slate-600">(up to 15)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    pushTag();
                  }
                }}
                placeholder="Add a tag..."
                disabled={tags.length >= 15}
                className="bg-slate-900/60 border-slate-700/60 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500/30"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={pushTag}
                disabled={tags.length >= 15}
                className="border-slate-700 bg-transparent text-slate-400 hover:border-slate-500 hover:text-white shrink-0"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] text-slate-400"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() =>
                        setValue(
                          "tags",
                          tags.filter((t) => t !== tag),
                          { shouldValidate: true },
                        )
                      }
                      className="text-slate-600 hover:text-red-400 transition-colors ml-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <Separator className="bg-slate-800/60" />
      <div className="flex gap-3 p-4 shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={close}
          className="flex-1 border-slate-700 bg-transparent text-slate-300 hover:border-slate-500 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          form="create-story-form"
          type="submit"
          disabled={isPending}
          className="flex-1 bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <BookOpen className="h-3.5 w-3.5 mr-2" />
              Create Story
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Story Row ────────────────────────────────────────────────────────────────

function StoryRow({
  story,
  onDelete,
  onStatusChange,
}: {
  story: StorySummary;
  onDelete: () => void;
  onStatusChange: (s: StoryStatus) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="group grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 rounded-xl border border-slate-800/60 bg-[#0a0e15]/60 px-4 py-3.5 hover:border-slate-700/80 hover:bg-[#0d1117]/80 transition-all duration-200"
    >
      {/* Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-10 w-0.5 rounded-full shrink-0"
          style={{ background: story.accentColor ?? "#10b981" }}
        />
        <div className="min-w-0">
          <Link
            href={`/admin/stories/${story._id}`}
            className="font-mono text-sm font-bold text-slate-200 hover:text-emerald-400 transition-colors truncate block"
          >
            {story.title}
          </Link>
          {story.tagline && (
            <p className="font-mono text-[10px] text-slate-600 truncate mt-0.5">
              {story.tagline}
            </p>
          )}
          {story.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {story.tags.slice(0, 3).map((t) => (
                <span key={t} className="font-mono text-[8px] text-slate-700">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Difficulty */}
      <DiffBadge difficulty={story.difficulty} />

      {/* Status */}
      <StatusBadge status={story.status} />

      {/* Completions */}
      <div className="flex items-center gap-1.5">
        <Trophy className="h-3 w-3 text-amber-400/70" />
        <span className="font-mono text-sm font-bold text-slate-300">
          {story.completionCount.toLocaleString()}
        </span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-slate-600" />
        <span className="font-mono text-xs text-slate-500">
          {story.estimatedMinutes ? `~${story.estimatedMinutes}m` : "—"}
        </span>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-[#0d1117] border-slate-800 w-44"
        >
          <DropdownMenuItem
            asChild
            className="text-slate-300 focus:bg-slate-800 focus:text-white font-mono text-xs cursor-pointer gap-2"
          >
            <Link href={`/admin/stories/${story._id}`}>
              <Edit3 className="h-3.5 w-3.5" />
              Open editor
            </Link>
          </DropdownMenuItem>
          {story.status !== "published" && (
            <DropdownMenuItem
              onClick={() => onStatusChange("published")}
              className="text-emerald-400 focus:bg-slate-800 focus:text-emerald-300 font-mono text-xs cursor-pointer gap-2"
            >
              <Eye className="h-3.5 w-3.5" />
              Publish
            </DropdownMenuItem>
          )}
          {story.status === "published" && (
            <DropdownMenuItem
              onClick={() => onStatusChange("draft")}
              className="text-amber-400 focus:bg-slate-800 focus:text-amber-300 font-mono text-xs cursor-pointer gap-2"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Unpublish
            </DropdownMenuItem>
          )}
          {story.status !== "archived" && (
            <DropdownMenuItem
              onClick={() => onStatusChange("archived")}
              className="text-slate-400 focus:bg-slate-800 font-mono text-xs cursor-pointer gap-2"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="bg-slate-800" />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-400 focus:bg-slate-800 focus:text-red-300 font-mono text-xs cursor-pointer gap-2"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 rounded-xl border border-slate-800/40 bg-[#0a0e15]/40 px-4 py-3.5 animate-pulse">
      {[200, 80, 70, 60, 50, 28].map((w, i) => (
        <div
          key={i}
          className="h-4 rounded bg-slate-800/60"
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminStoriesPage() {
  const {
    adminPage,
    adminStatusFilter,
    adminSearch,
    setAdminPage,
    setAdminStatusFilter,
    setAdminSearch,
    resetAdminFilters,
  } = useStoryStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StorySummary | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    story: StorySummary;
    status: StoryStatus;
  } | null>(null);

  const filters: StoryListFilters = {
    page: adminPage,
    limit: 20,
    search: adminSearch || undefined,
    status:
      adminStatusFilter === "all"
        ? undefined
        : (adminStatusFilter as StoryStatus),
  };

  const { data, isLoading, isFetching, refetch } = useAdminStories(filters);
  const { mutate: deleteStory, isPending: isDeleting } = useAdminDeleteStory();
  const { mutate: setStatus, isPending: isSettingStatus } =
    useAdminSetStoryStatus(statusTarget?.story._id ?? "");

  const stories = data?.stories ?? [];
  const meta = data?.meta as
    | {
        total: number;
        page: number;
        totalPages: number;
        hasPrev: boolean;
        hasNext: boolean;
        limit: number;
      }
    | undefined;
  const hasFilter = !!adminSearch || adminStatusFilter !== "all";

  const statCards = [
    {
      label: "Total Stories",
      value: meta?.total ?? 0,
      icon: BookMarked,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Published",
      value: stories.filter((s: StorySummary) => s.status === "published")
        .length,
      icon: Eye,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Draft",
      value: stories.filter((s: StorySummary) => s.status === "draft").length,
      icon: Layers,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Completions",
      value: stories.reduce(
        (a: number, s: StorySummary) => a + (s.completionCount ?? 0),
        0,
      ),
      icon: TrendingUp,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060a12]">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-800/60 px-4 sm:px-6 py-5 shrink-0">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 right-0 h-40 w-72 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400/60 uppercase mb-1">
              // story engine
            </p>
            <h1 className="font-mono text-xl font-black text-white tracking-tight">
              Story Arcs
            </h1>
            <p className="font-mono text-[10px] text-slate-600 mt-0.5">
              {meta
                ? `${meta.total} stor${meta.total === 1 ? "y" : "ies"} · page ${meta.page}/${meta.totalPages}`
                : "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-slate-700 bg-transparent text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400 h-9 w-9"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
              />
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 gap-1.5 text-xs shadow-lg shadow-emerald-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              New Story
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 pointer-events-none" />
              <Input
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search stories..."
                className="pl-9 bg-slate-900/60 border-slate-700/60 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/40"
              />
              {adminSearch && (
                <button
                  onClick={() => setAdminSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-800/60 bg-slate-900/40 p-1">
              {(["all", ...STORY_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setAdminStatusFilter(s)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 font-mono text-[11px] capitalize transition-all",
                    adminStatusFilter === s
                      ? "bg-slate-700/80 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  {s === "all" ? "All" : STAT_CFG[s as StoryStatus].label}
                </button>
              ))}
            </div>
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAdminFilters}
                className="text-slate-500 hover:text-red-400 font-mono text-xs gap-1 px-2"
              >
                <XCircle className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          {/* Table header */}
          {stories.length > 0 && (
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 pb-1">
              {[
                "Story",
                "Difficulty",
                "Status",
                "Completions",
                "Duration",
                "",
              ].map((h, i) => (
                <p
                  key={i}
                  className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700"
                >
                  {h}
                </p>
              ))}
            </div>
          )}

          {/* Story list */}
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
            ) : stories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-5 rounded-2xl border border-dashed border-slate-800/60">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50">
                  <BookOpen className="h-7 w-7 text-slate-700" />
                </div>
                <div className="text-center">
                  <p className="font-mono font-bold text-slate-400">
                    No stories yet
                  </p>
                  <p className="font-mono text-sm text-slate-700 mt-1">
                    Create your first narrative arc.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                  className="bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create story
                </Button>
              </div>
            ) : (
              stories.map((story: StorySummary, i: number) => (
                <motion.div
                  key={story._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <StoryRow
                    story={story}
                    onDelete={() => setDeleteTarget(story)}
                    onStatusChange={(s) =>
                      setStatusTarget({ story, status: s })
                    }
                  />
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="font-mono text-xs text-slate-600">
                {(meta.page - 1) * meta.limit + 1}–
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdminPage(meta.page - 1)}
                  disabled={!meta.hasPrev}
                  className="h-8 w-8 border-slate-700/60 bg-transparent text-slate-500 hover:border-slate-600 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from(
                  { length: Math.min(meta.totalPages, 5) },
                  (_, i) => i + 1,
                ).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={meta.page === p ? "default" : "outline"}
                    onClick={() => setAdminPage(p)}
                    className={cn(
                      "h-8 min-w-[32px] px-2 font-mono text-xs",
                      meta.page === p
                        ? "bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 border-0"
                        : "border-slate-700/60 bg-transparent text-slate-500 hover:border-slate-600 hover:text-white",
                    )}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdminPage(meta.page + 1)}
                  disabled={!meta.hasNext}
                  className="h-8 w-8 border-slate-700/60 bg-transparent text-slate-500 hover:border-slate-600 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Sheet */}
      <Sheet
        open={createOpen}
        onOpenChange={(v) => {
          if (!v) setCreateOpen(false);
        }}
      >
        <SheetContent
          side="right"
          className="w-full max-w-xl bg-[#060a12] border-l border-slate-800/60 p-0 flex flex-col [&>button]:hidden"
        >
          <SheetHeader className="relative overflow-hidden border-b border-slate-800/60 px-6 py-5 shrink-0">
            <div
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage:
                  "linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <SheetTitle className="font-mono text-white font-black">
                    New Story Arc
                  </SheetTitle>
                  <p className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">
                    Create narrative
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="text-slate-600 hover:text-slate-300 transition-colors rounded-lg p-1 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </SheetHeader>
          <CreateStoryForm onClose={() => setCreateOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[#0a0e15] border-slate-800 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-white">
              Delete "{deleteTarget?.title}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-sm">
              Permanently removes the story, all chapters, nodes, and player
              progress. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 font-mono">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() =>
                deleteTarget &&
                deleteStory(deleteTarget._id, {
                  onSuccess: () => setDeleteTarget(null),
                })
              }
              className="bg-red-500 text-white hover:bg-red-400 font-mono font-bold"
            >
              {isDeleting && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Dialog */}
      <AlertDialog
        open={!!statusTarget}
        onOpenChange={(v) => {
          if (!v) setStatusTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[#0a0e15] border-slate-800 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-white">
              {statusTarget?.status === "published"
                ? "Publish"
                : statusTarget?.status === "archived"
                  ? "Archive"
                  : "Unpublish"}{" "}
              story?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-sm">
              {statusTarget?.status === "published"
                ? "Makes this story immediately visible to all participants."
                : statusTarget?.status === "archived"
                  ? "Hides the story from all listings. Player progress is preserved."
                  : "Returns to draft. Players can no longer access it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 font-mono">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSettingStatus}
              onClick={() =>
                statusTarget &&
                setStatus(
                  { status: statusTarget.status },
                  { onSuccess: () => setStatusTarget(null) },
                )
              }
              className={cn(
                "font-mono font-black",
                statusTarget?.status === "published"
                  ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  : statusTarget?.status === "archived"
                    ? "bg-slate-600 text-white hover:bg-slate-500"
                    : "bg-amber-500 text-slate-950 hover:bg-amber-400",
              )}
            >
              {isSettingStatus && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
