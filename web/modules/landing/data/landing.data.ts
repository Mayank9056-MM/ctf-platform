export const STATS = [
  { value: "12,400+", label: "Registered Hackers", suffix: "" },
  { value: "24/7", label: "Live Events", suffix: "" },
  { value: "98", label: "Avg. CTF Rating", suffix: "/100" },
  { value: "24/7", label: "Uptime Guarantee", suffix: "" },
];

export const FEATURES = [
  {
    icon: "⬡",
    title: "Graph-Based Story Engine",
    desc: "Non-linear narrative missions. Every choice branches the story. Solve challenges to unlock lore, characters, and hidden paths.",
    tag: "Unique",
    color: "emerald",
  },
  {
    icon: "◈",
    title: "Live Event Infrastructure",
    desc: "Compete in real-time CTF events with frozen scoreboards, per-challenge first-blood tracking, and team coordination tools.",
    tag: "Real-time",
    color: "cyan",
  },
  {
    icon: "▣",
    title: "Dynamic Scoring Engine",
    desc: "Exponential decay scoring — early solves pay more. Full submission history, attempt rate-limiting, and first-blood bonuses.",
    tag: "Fair",
    color: "violet",
  },
  {
    icon: "◎",
    title: "Team Collaboration",
    desc: "Form squads, share invite codes, and track your team leaderboard position. Joint solves, live notifications, member presence.",
    tag: "Social",
    color: "amber",
  },
  {
    icon: "⬢",
    title: "Multi-Category Challenges",
    desc: "Web, Pwn, Crypto, Forensics, Reversing, OSINT, Hardware, Cloud. Progressive difficulty from beginner to insane.",
    tag: "Comprehensive",
    color: "red",
  },
  {
    icon: "◉",
    title: "Live Leaderboard",
    desc: "WebSocket-powered realtime rankings. Global board, per-event boards, team boards. Scoreboard freeze with reveal sequence.",
    tag: "Live",
    color: "emerald",
  },
];

export const LEADERBOARD_PREVIEW = [
  {
    rank: 1,
    name: "0xDEADBEEF",
    score: 18_420,
    team: "RedTeamAlpha",
    country: "🇺🇸",
  },
  {
    rank: 2,
    name: "NULL_PTR",
    score: 17_880,
    team: "ByteForce",
    country: "🇩🇪",
  },
  {
    rank: 3,
    name: "h4x0r_supreme",
    score: 16_644,
    team: "ShellShockers",
    country: "🇯🇵",
  },
  {
    rank: 4,
    name: "stack_smash",
    score: 15_912,
    team: "RedTeamAlpha",
    country: "🇬🇧",
  },
  {
    rank: 5,
    name: "re_verse",
    score: 15_200,
    team: "CryptoKings",
    country: "🇰🇷",
  },
];

export const TERMINAL_LINES = [
  { delay: 0, text: "$ ./ctf-platform --boot", type: "cmd" },
  {
    delay: 300,
    text: "[✓] Database connected — 12,400 users loaded",
    type: "ok",
  },
  {
    delay: 600,
    text: "[✓] Challenge engine initialised — 340 active",
    type: "ok",
  },
  {
    delay: 900,
    text: "[✓] Story graph engine ready — 8 arcs loaded",
    type: "ok",
  },
  { delay: 1200, text: "[✓] WebSocket server live on :3001", type: "ok" },
  {
    delay: 1500,
    text: "[✓] Redis cache warm — leaderboard cached",
    type: "ok",
  },
  {
    delay: 1800,
    text: "[!] Active CTF event: Operation Shadow Grid",
    type: "warn",
  },
  { delay: 2100, text: "$ Platform ready. Begin the hunt.", type: "cmd" },
];
