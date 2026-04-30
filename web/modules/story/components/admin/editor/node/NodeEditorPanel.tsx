"use client";
// modules/story/components/node/NodeEditorPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The node edit/create panel. Lives in the right 380px drawer.
// Uses the same NodeFormContent as before but now properly wired to the graph.
//
// Key improvements over the old sheet approach:
//   1. The form has its own overflow-y-auto body — the submit button is ALWAYS
//      visible (sticky footer, never hidden by content).
//   2. No React re-renders on every keypress (form state is local to RHF).
//   3. The form is completely independent of canvas renders.
//   4. Edit mode properly loads from the live GraphNode, not the raw StoryNode.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

import { Button   } from "@/components/ui/button";
import { Input    } from "@/components/ui/input";
import { Label    } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch   } from "@/components/ui/switch";
import { Separator} from "@/components/ui/separator";

import {
  AlertCircle, Check, Flag, GitBranch, Loader2, Minus, Plus,
  Search, Terminal, Tv, X, Zap,
} from "lucide-react";

import { useAdminCreateNode } from "@/modules/story/hooks/admin/node/useAdminCreateNode";
import { useAdminUpdateNode } from "@/modules/story/hooks/admin/node/useAdminUpdateNode";
import { useAdminChallenges } from "@/modules/challenges/hooks/admin/useAdminChallenges";
import { useGraphStore      } from "@/modules/story/store/graph.store";

import {
  createNodeSchema, type CreateNodeFormData,
  updateNodeSchema, type UpdateNodeFormData,
} from "@/modules/story/schemas/story.schema";

import type { GraphNode } from "@/modules/story/types/graph.types";
import type { ChoiceNodeData } from "@/modules/story/types/graph.types";
import type { StoryNodeType } from "@/modules/story/types/story.types";

// ─── Config ───────────────────────────────────────────────────────────────────

const NODE_CFG = {
  challenge: { label: "Challenge", desc: "Flag submission", Icon: Flag,       color: "#f87171", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)"  },
  cutscene:  { label: "Cutscene",  desc: "Auto-advance",   Icon: Tv,         color: "#a78bfa", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.35)" },
  briefing:  { label: "Briefing",  desc: "Narrative block", Icon: Terminal,  color: "#38bdf8", bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.35)" },
  choice:    { label: "Choice",    desc: "Branching",       Icon: GitBranch, color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.35)" },
} as const;

const BRANCH_COLORS = ["#34d399","#60a5fa","#f472b6","#fb923c","#a78bfa"];

const DIFF_COLORS: Record<string, string> = { easy: "#34d399", medium: "#fbbf24", hard: "#f87171", insane: "#a78bfa" };

// ─── Field error ─────────────────────────────────────────────────────────────

function FieldErr({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 font-mono text-[10px] text-red-400 mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />{message}
    </p>
  );
}

// ─── Inline challenge picker ──────────────────────────────────────────────────

function ChallengeField({
  value, onChange, error,
}: {
  value?: string; onChange: (v: string | undefined) => void; error?: string;
}) {
  const [search, setSearch] = useState("");
  const { data } = useAdminChallenges({ search: search || undefined, limit: 50 });
  const challenges = data?.challenges ?? [];
  const selected   = challenges.find((c) => c._id === value);

  return (
    <div className="space-y-2">
      {selected && (
        <div
          className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
        >
          <div>
            <p className="font-mono text-xs font-bold text-emerald-400">{selected.title}</p>
            <p className="font-mono text-[9px] text-slate-600">
              {selected.category} · {selected.difficulty} · {selected.points}pt
            </p>
          </div>
          <button type="button" onClick={() => onChange(undefined)} className="text-slate-600 hover:text-red-400 ml-2">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search challenges…"
          className="pl-8 h-9 bg-[#0a0e15] border-slate-700/60 text-white text-xs placeholder:text-slate-600 focus-visible:ring-0 focus-visible:border-emerald-500/40"
        />
      </div>
      <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-800/60 bg-[#0a0e15]">
        {challenges.length === 0 ? (
          <p className="font-mono text-xs text-slate-600 text-center py-4">No challenges found</p>
        ) : (
          challenges.map((c) => (
            <button key={c._id} type="button" onClick={() => onChange(c._id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/40 border-b border-slate-800/40 last:border-0",
                value === c._id && "bg-emerald-500/5",
              )}>
              <div>
                <p className={cn("font-mono text-xs", value === c._id ? "text-emerald-400" : "text-slate-300")}>{c.title}</p>
                <p className="font-mono text-[9px] text-slate-600">{c.category} · {c.difficulty}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px]" style={{ color: DIFF_COLORS[c.difficulty] ?? "#64748b" }}>{c.points}pt</span>
                {value === c._id && <Check className="h-3 w-3 text-emerald-400" />}
              </div>
            </button>
          ))
        )}
      </div>
      <FieldErr message={error} />
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface NodeEditorPanelProps {
  storyId:      string;
  chapterId:    string;
  node:         GraphNode | null; // null = create mode
  allNodes:     GraphNode[];
  nextOrder:    number;
}

export default function NodeEditorPanel({
  storyId, chapterId, node, allNodes, nextOrder,
}: NodeEditorPanelProps) {
  const isEdit = !!node;
  const { closePanel, pendingSource } = useGraphStore();

  const { mutate: createNode, isPending: isCreating } = useAdminCreateNode(storyId, chapterId);
  const { mutate: updateNode, isPending: isUpdating } = useAdminUpdateNode(storyId, chapterId, node?.id ?? "");
  const isPending = isCreating || isUpdating;

  const schema = isEdit ? updateNodeSchema : createNodeSchema;

  // Derive defaults from graph node data
  const getDefaults = () => {
    if (!isEdit) {
      return {
        type:         "challenge" as StoryNodeType,
        order:        nextOrder,
        isEntryPoint: allNodes.length === 0,
        isOptional:   false,
        xpBonus:      0,
        unlockAfter:  [] as string[],
        choices:      [] as any[],
      };
    }
    const d = node!.data as any;
    return {
      type:          node!.type,
      order:         node!.order,
      isEntryPoint:  node!.isEntryPoint,
      isOptional:    node!.isOptional,
      xpBonus:       node!.xpBonus,
      challengeId:   d.challengeId  ?? "",
      preNarrative:  d.preNarrative  ?? "",
      postNarrative: d.postNarrative ?? "",
      characterId:   d.characterId   ?? "",
      content:       d.content       ?? "",
      nextNode:      "",  // edge is managed by canvas, not this form
      unlockAfter:   [] as string[],
      choices: node!.type === "choice"
        ? (d as ChoiceNodeData).choices?.map((c: any) => ({
            label:       c.label,
            description: c.description ?? "",
            targetNode:  c.targetNode ?? "",
          })) ?? []
        : [] as any[],
    };
  };

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema as any),
    defaultValues: getDefaults(),
  });

  console.log(errors,"errors in node form");  

  // Reset form when switching between nodes
  useEffect(() => { reset(getDefaults()); }, [node?.id]);

  const { fields: choiceFields, append: appendChoice, remove: removeChoice } = useFieldArray({ control, name: "choices" });

  const watchedType: StoryNodeType = watch("type") ?? "challenge";
  const cfg = NODE_CFG[watchedType] ?? NODE_CFG.cutscene;
  const otherNodes = allNodes.filter((n) => n.id !== node?.id);

  const onSubmit = (data: any) => {
    // Strip empty strings to null/undefined
    const clean: any = { ...data };
    ["preNarrative","postNarrative","content","characterId","challengeId"].forEach((k) => {
      if (clean[k] === "") clean[k] = isEdit ? null : undefined;
    });
    // Don't send nextNode from form — edge is managed on canvas via drag
    delete clean.nextNode;

    if (isEdit) {
      updateNode(clean, { onSuccess: closePanel });
    } else {
      createNode(clean, { onSuccess: closePanel });
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ borderLeft: `2px solid ${cfg.color}40` }}>
      {/* ── Header ── */}
      <div
        className="shrink-0 px-5 py-4 border-b border-slate-800/60"
        style={{ background: `linear-gradient(135deg, ${cfg.bg} 0%, transparent 100%)` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <cfg.Icon className="h-4 w-4" style={{ color: cfg.color }} />
            </div>
            <div>
              <p className="font-mono text-sm font-black text-white">
                {isEdit ? `Edit #${node!.order} — ${cfg.label}` : "Add Node"}
              </p>
              <p className="font-mono text-[10px] text-slate-500">{cfg.desc}</p>
            </div>
          </div>
          <button
            onClick={closePanel}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable form body ── */}
      <div className="flex-1 overflow-y-auto bg-[#060a12]">
        <form id="node-editor-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-4">

            {/* Type selector (create only) */}
            {!isEdit && (
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Node Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["challenge","cutscene","briefing","choice"] as StoryNodeType[]).map((t) => {
                    const c = NODE_CFG[t];
                    const active = watchedType === t;
                    return (
                      <button key={t} type="button" onClick={() => setValue("type", t)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                        style={active
                          ? { background: c.bg, border: `1.5px solid ${c.color}`, boxShadow: `0 0 0 1px ${c.border}` }
                          : { border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                        <c.Icon className="h-3.5 w-3.5 shrink-0" style={{ color: active ? c.color : "#4b5563" }} />
                        <div>
                          <p className="font-mono text-xs font-bold" style={{ color: active ? c.color : "#94a3b8" }}>{c.label}</p>
                          <p className="font-mono text-[9px] text-slate-600">{c.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order + XP */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Order *</Label>
                <Input type="number" min={1} {...register("order", { valueAsNumber: true })}
                  className={cn("bg-[#0a0e15] border-slate-700/60 text-white h-9 font-mono focus-visible:ring-0 focus-visible:border-emerald-500/40",
                    errors.order && "border-red-500/60")} />
                <FieldErr message={errors.order?.message as string} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" />XP Bonus
                </Label>
                <Input type="number" min={0} {...register("xpBonus", { valueAsNumber: true })}
                  className="bg-[#0a0e15] border-slate-700/60 text-white h-9 focus-visible:ring-0" />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-4 px-3 py-2.5 rounded-xl bg-slate-900/30 border border-slate-800/40">
              <Controller name="isEntryPoint" control={control} render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={!!field.value} onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-700 scale-90" />
                  <Label className="font-mono text-[10px] text-slate-300 cursor-pointer">Entry Point</Label>
                </div>
              )} />
              <div className="h-4 w-px bg-slate-700/60" />
              <Controller name="isOptional" control={control} render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={!!field.value} onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-slate-500 data-[state=unchecked]:bg-slate-700 scale-90" />
                  <Label className="font-mono text-[10px] text-slate-300 cursor-pointer">Optional</Label>
                </div>
              )} />
            </div>

            <Separator className="bg-slate-800/50" />

            {/* Challenge picker */}
            {watchedType === "challenge" && (
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Challenge <span className="text-red-400">*</span>
                </Label>
                <Controller name="challengeId" control={control} render={({ field }) => (
                  <ChallengeField value={field.value} onChange={field.onChange} error={errors.challengeId?.message as string} />
                )} />
              </div>
            )}

            {/* Narrative content */}
            {(watchedType === "cutscene" || watchedType === "briefing") && (
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Content <span className="text-red-400">*</span>
                </Label>
                <Textarea {...register("content")} rows={4}
                  placeholder="Narrative text shown to the player…"
                  className={cn("bg-[#0a0e15] border-slate-700/60 text-white resize-none text-sm placeholder:text-slate-600 focus-visible:ring-0 focus-visible:border-emerald-500/40",
                    errors.content && "border-red-500/60")} />
                <FieldErr message={errors.content?.message as string} />
              </div>
            )}

            {/* Choices */}
            {watchedType === "choice" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Choices <span className="text-red-400">*</span>{" "}
                    <span className="text-slate-700 normal-case">(min 2)</span>
                  </Label>
                  <button type="button"
                    onClick={() => appendChoice({ label: "", description: "", targetNode: "" })}
                    className="flex items-center gap-1 h-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 font-mono text-[10px] text-amber-400 hover:bg-amber-500/20">
                    <Plus className="h-3 w-3" />Add
                  </button>
                </div>
                <FieldErr message={(errors.choices as any)?.message} />
                {choiceFields.length === 0 && (
                  <div className="rounded-xl border border-dashed border-amber-500/20 p-3 text-center">
                    <p className="font-mono text-[10px] text-amber-500/50">Add at least 2 choices</p>
                  </div>
                )}
                <div className="space-y-2">
                  {choiceFields.map((field, i) => (
                    <div key={field.id} className="rounded-xl border border-slate-800/60 bg-[#0a0e15] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full" style={{ background: BRANCH_COLORS[i % BRANCH_COLORS.length] }} />
                          <span className="font-mono text-[10px] font-bold" style={{ color: BRANCH_COLORS[i % BRANCH_COLORS.length] }}>
                            Branch {String.fromCharCode(65 + i)}
                          </span>
                        </div>
                        <button type="button" onClick={() => removeChoice(i)} className="text-slate-600 hover:text-red-400">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Input {...register(`choices.${i}.label`)} placeholder={`Label — e.g. "Follow the hacker"`}
                        className="h-8 bg-slate-900/50 border-slate-700/60 text-white text-xs placeholder:text-slate-600 focus-visible:ring-0" />
                      <Input {...register(`choices.${i}.description`)} placeholder="Optional description"
                        className="h-7 bg-slate-900/50 border-slate-700/60 text-white text-[10px] placeholder:text-slate-600 focus-visible:ring-0" />
                      <p className="font-mono text-[9px] text-slate-700">
                        Wire target by dragging the <span className="text-amber-400">●</span> handle on the canvas, or select:
                      </p>
                      <select {...register(`choices.${i}.targetNode`)}
                        className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 font-mono text-[11px] text-slate-300 outline-none focus:border-emerald-500/50 [&>option]:bg-[#0d1117]">
                        <option value="">— wire on canvas or select —</option>
                        {otherNodes.map((n) => (
                          <option key={n.id} value={n.id}>#{n.order} {NODE_CFG[n.type].label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pre/Post narrative */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Pre-Narrative <span className="text-slate-700">(opt)</span>
                </Label>
                <Textarea {...register("preNarrative")} rows={2} placeholder="Text shown before this node…"
                  className="bg-[#0a0e15] border-slate-700/60 text-white resize-none text-xs placeholder:text-slate-600 focus-visible:ring-0 focus-visible:border-emerald-500/40" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Post-Narrative <span className="text-slate-700">(opt)</span>
                </Label>
                <Textarea {...register("postNarrative")} rows={2} placeholder="Text shown after completion…"
                  className="bg-[#0a0e15] border-slate-700/60 text-white resize-none text-xs placeholder:text-slate-600 focus-visible:ring-0 focus-visible:border-emerald-500/40" />
              </div>
            </div>

            {/* Character ID */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Character ID <span className="text-slate-700">(opt)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-600">@</span>
                <Input {...register("characterId")} placeholder="agent_cipher"
                  className="pl-7 bg-[#0a0e15] border-slate-700/60 font-mono text-white text-xs placeholder:text-slate-600 focus-visible:ring-0 h-9" />
              </div>
            </div>

            {/* Note about next node */}
            {watchedType !== "choice" && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-800/40 bg-slate-900/20 px-3 py-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                <p className="font-mono text-[10px] text-slate-600">
                  <span className="text-sky-400">Next Node</span> — drag the bottom handle on the canvas to wire this node's output.
                </p>
              </div>
            )}

            <div className="h-2" />
          </div>
        </form>
      </div>

      {/* ── Sticky footer ── */}
      <div className="shrink-0 border-t border-slate-800/60 p-4 flex gap-3 bg-[#060a12]">
        <Button type="button" variant="outline" onClick={closePanel}
          className="flex-1 border-slate-700/60 bg-transparent text-slate-400 hover:border-slate-500 hover:text-white h-10">
          Cancel
        </Button>
        <Button form="node-editor-form" type="submit" disabled={isPending}
          className="flex-1 font-black h-10"
          style={{ background: cfg.color, color: "#060a12" }}>
          {isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : isEdit ? "Save Changes" : `Add ${cfg.label}`
          }
        </Button>
      </div>
    </div>
  );
}

// Fix: useState was used inside a non-hook function — inline import
import { useState } from "react";
import { error } from "console";
