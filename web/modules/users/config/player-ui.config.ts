import { ChallengeCategory } from "@/modules/challenges/types/challenge.types";

export const CAT_CFG: Record<ChallengeCategory, { color: string; label: string }> = {
  web:        { color: "#34d399", label: "Web"       },
  pwn:        { color: "#f87171", label: "Pwn"       },
  crypto:     { color: "#a78bfa", label: "Crypto"    },
  forensics:  { color: "#60a5fa", label: "Forensics" },
  reversing:  { color: "#fb923c", label: "Rev"       },
  misc:       { color: "#94a3b8", label: "Misc"      },
  osint:      { color: "#f472b6", label: "OSINT"     },
  blockchain: { color: "#38bdf8", label: "Chain"     },
  hardware:   { color: "#4ade80", label: "Hardware"  },
  cloud:      { color: "#7dd3fc", label: "Cloud"     },
};
 