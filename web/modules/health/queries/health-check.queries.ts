import { ValidService } from "../types/health-check.types";

export const healthKeys = {
  all: ["health"] as const,
  ping: () => [...healthKeys.all, "ping"] as const,
  full: () => [...healthKeys.all, "full"] as const,
  service: (name: ValidService) =>
    [...healthKeys.all, "service", name] as const,
} as const;
