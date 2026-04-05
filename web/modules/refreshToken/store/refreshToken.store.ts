import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { SessionUIState } from "../types/refreshToken.types";

export const useSessionStore = create<SessionUIState>()(
  devtools(
    (set) => ({
      revokingSessionId: null,
      isRevokingAll: false,

      setRevokingSessionId: (id) =>
        set({ revokingSessionId: id }, false, "setRevokingSessionId"),

      setRevokingAll: (v) =>
        set({ isRevokingAll: v }, false, "setRevokingAll"),
    }),
    { name: "SessionStore" }
  )
);