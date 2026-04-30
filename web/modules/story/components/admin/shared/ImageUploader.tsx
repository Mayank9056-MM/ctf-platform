"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  shape?: "square" | "rect";
  label?: string;
  endpoint?: string;
  fieldName?: string;
  type?: string;
  error?: string;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  shape = "square",
  label,
  endpoint = "/api/v1/upload/media",
  fieldName = "file",
  type = "image",
  error: externalError,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const displaySrc = localPreview ?? value;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (JPG, PNG, WebP, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be under 10 MB.");
      return;
    }

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploadError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append(fieldName, file);
      fd.append("type", type);

      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message ?? `Upload failed (${res.status})`);
      }

      const data = await res.json();
      const url = data?.data?.url ?? data?.url ?? data?.data?.fileUrl;

      if (!url) throw new Error("Server returned no URL");

      onChange(url);
      setLocalPreview(null); // server URL takes over
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      );
      setLocalPreview(null);
      onChange(undefined);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (e.target) e.target.value = "";
    }
  };

  const clearImage = () => {
    setLocalPreview(null);
    setUploadError(null);
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  const previewClasses = cn(
    "relative flex shrink-0 items-center justify-center overflow-hidden border-2 transition-all",
    displaySrc ? "border-emerald-500/30" : "border-dashed border-slate-700",
    shape === "square" ? "h-20 w-20 rounded-2xl" : "h-20 w-32 rounded-xl",
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
          {label}
        </Label>
      )}

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className={previewClasses}>
          {displaySrc ? (
            <img
              src={displaySrc}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-7 w-7 text-slate-700" />
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-[inherit]">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            </div>
          )}

          {displaySrc && !uploading && (
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white hover:bg-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Upload trigger + URL fallback */}
        <div className="flex-1 space-y-2">
          {/* Hidden file input — opens native OS file picker */}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
            id={`img-upload-${fieldName}`}
          />

          <label
            htmlFor={`img-upload-${fieldName}`}
            className={cn(
              "flex cursor-pointer select-none items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 transition-colors",
              uploading
                ? "cursor-not-allowed border-slate-800 opacity-50"
                : "border-slate-700 hover:border-emerald-500/40 hover:bg-emerald-500/[0.03]",
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                <span className="font-mono text-xs text-slate-400">
                  Uploading…
                </span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-slate-500" />
                <span className="font-mono text-xs text-slate-400">
                  {displaySrc ? "Replace image" : "Upload from computer"}
                </span>
              </>
            )}
          </label>

          <p className="font-mono text-[10px] text-slate-700">
            JPG, PNG, WebP, GIF · max 10 MB
          </p>

          {/* URL fallback — only when no local preview uploading */}
          {!localPreview && (
            <div className="space-y-1">
              <p className="font-mono text-[10px] text-slate-600">
                Or paste URL:
              </p>
              <Input
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value || undefined)}
                placeholder="https://..."
                className="h-8 bg-slate-900/60 border-slate-700 text-white text-xs placeholder:text-slate-700 focus-visible:ring-emerald-500/30"
              />
            </div>
          )}
        </div>
      </div>

      {(uploadError || externalError) && (
        <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
          <X className="h-3 w-3 shrink-0" />
          {uploadError ?? externalError}
        </p>
      )}
    </div>
  );
}
