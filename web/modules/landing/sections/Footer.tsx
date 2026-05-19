import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-[#050810]/80 backdrop-blur-sm">
      <div className="mx-auto max-w-screen-xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-lg text-emerald-400">⬡</span>
              <span className="font-mono text-sm font-black tracking-widest text-white">
                CTF<span className="text-emerald-400">Platform</span>
              </span>
            </div>
            <p className="font-mono text-xs leading-relaxed text-slate-600">
              Where hackers sharpen their edge. Real challenges, real
              competition, real skills.
            </p>
          </div>

          {/* Platform */}
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
              Platform
            </p>
            <ul className="space-y-2.5">
              {["Events", "Leaderboard", "Stories", "Teams"].map((l) => (
                <li key={l}>
                  <Link
                    href={`/${l.toLowerCase()}`}
                    className="font-mono text-xs text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
              Account
            </p>
            <ul className="space-y-2.5">
              {[
                ["Sign In", "/login"],
                ["Register", "/register"],
                ["Dashboard", "/dashboard"],
                ["Profile", "/profile"],
              ].map(([l, h]) => (
                <li key={l}>
                  <Link
                    href={h}
                    className="font-mono text-xs text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
              System
            </p>
            <div className="space-y-2">
              {[
                ["API", "Operational"],
                ["WebSocket", "Live"],
                ["Challenges", "340 Active"],
                ["Events", "1 Running"],
              ].map(([svc, status]) => (
                <div key={svc} className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-600">
                    {svc}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800/40 pt-6 sm:flex-row">
          <span className="font-mono text-[10px] text-slate-700">
            © 2025 CTFPlatform. All rights reserved.
          </span>
          <span className="font-mono text-[10px] text-slate-700">
            Built for hackers, by hackers.
          </span>
        </div>
      </div>
    </footer>
  );
}
