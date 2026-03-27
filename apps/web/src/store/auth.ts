import { create } from "zustand";
import { getAccessToken, parseJwt } from "@/lib/auth";

type AuthState = {
  token: string | null;
  hydrated: boolean;
  roles: string[];
  setToken: (token: string | null) => void;
  initialize: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  hydrated: false,
  roles: [],
  setToken: (token) => {
    if (token) {
      localStorage.setItem("livinova_access_token", token);
    } else {
      localStorage.removeItem("livinova_access_token");
    }
    const roles = token ? (parseJwt(token)?.roles ?? []) : [];
    set({ token, roles });
  },
  initialize: () => {
    if (get().hydrated) return;
    try {
      const token = getAccessToken();
      const roles = token ? (parseJwt(token)?.roles ?? []) : [];
      set({ token, roles, hydrated: true });
    } catch (err) {
      set({ hydrated: true });
    }
  },
}));
