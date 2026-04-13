import { useAddAttachment } from "@/modules/challenges/hooks/admin/useAddAttachment";
import { useRemoveAttachment } from "@/modules/challenges/hooks/admin/useRemoveAttachment";
import { AdminChallenge } from "@/modules/challenges/types/challenge.types";
import { formatBytes } from "@/shared/utils/formatBytes";
import { Eye, Paperclip, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

export function AttachmentManager({
  challenge,
}: {
  challenge: AdminChallenge;
}) {
  const { mutate: addAttachment, isPending: isUploading } = useAddAttachment(
    challenge._id,
  );
  const { mutate: removeAttachment } = useRemoveAttachment(challenge._id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addAttachment(
      { file, onProgress: (pct) => setUploadPct(pct) },
      {
        onSuccess: () => setUploadPct(null),
        onError: () => setUploadPct(null),
      },
    );
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase">
          Attachments ({challenge.attachments.length})
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          <Upload className="h-2.5 w-2.5" />
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {uploadPct !== null && (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
          <p className="font-mono text-[10px] text-slate-500">
            Uploading... {uploadPct}%
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        {challenge.attachments.map((att) => (
          <div
            key={att._id}
            className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
          >
            <Paperclip className="h-3.5 w-3.5 text-slate-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 truncate">{att.name}</p>
              <p className="font-mono text-[10px] text-slate-600">
                {formatBytes(att.size)} · {att.mimeType}
              </p>
            </div>
            <a
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-emerald-400 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={() => removeAttachment(att._id)}
              className="text-slate-600 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {challenge.attachments.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-3">
            No attachments.
          </p>
        )}
      </div>
    </div>
  );
}
