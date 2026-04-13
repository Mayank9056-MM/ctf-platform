import { useResendVerification } from "@/modules/auth/hooks/useResendVerification";
import { Loader2, Mail } from "lucide-react";

export function VerifyEmailBanner() {
  const { mutate: resend, isPending } = useResendVerification();

  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-950/10 px-3 py-2.5">
      <Mail className="h-3.5 w-3.5 shrink-0 text-orange-400" />
      <p className="flex-1 text-xs text-orange-300">
        Verify your email to unlock all features.
      </p>
      <button
        onClick={() => resend()}
        disabled={isPending}
        className="flex items-center gap-1 font-mono text-[10px] text-orange-400 hover:text-orange-300 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        Resend
      </button>
    </div>
  );
}
