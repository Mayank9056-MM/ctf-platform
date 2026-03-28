"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Terminal } from "lucide-react";
import { useGithubCallback } from "@/modules/auth/hooks/useGithubCallback";

export default function GitHubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const called = useRef(false);
  const { mutate: githubOAuth } = useGithubCallback();

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = sessionStorage.getItem("github_oauth_state");
    sessionStorage.removeItem("github_oauth_state");

    if (!code) {
      toast.error("GitHub auth failed — no code received.");
      router.push("/login");
      return;
    }

    if (state !== storedState) {
      toast.error("Invalid OAuth state. Possible CSRF attack.");
      router.push("/login");
      return;
    }

    githubOAuth({ provider: "github", token: code });
  }, []);

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
          <Terminal className="h-6 w-6 text-emerald-400 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="font-mono text-sm text-emerald-400">
            Authenticating with GitHub...
          </p>
          <p className="text-xs text-slate-600 mt-1">
            You&apos;ll be redirected shortly
          </p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
