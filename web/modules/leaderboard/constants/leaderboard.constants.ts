export const STALE = {
  BOARD: 1000 * 30,
  MY_RANK: 1000 * 60,     
} as const;

export const REFETCH_INTERVALS = {
  ACTIVE_EVENT: 1000 * 30, 
  GLOBAL: 1000 * 60,      
} as const;