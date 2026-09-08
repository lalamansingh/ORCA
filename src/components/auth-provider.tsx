"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentUser, login as requestLogin, logout as requestLogout, refreshSession, register as requestRegister, type AuthUser, type LoginInput, type RegisterInput } from "@/lib/api/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  quickEnter: (name: string) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "orca_active_user";

function createGuestUser(name: string): AuthUser {
  const cleanName = name.trim() || "Captain Lal Aman";
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "") || "commander"}@orca.marine`,
    full_name: cleanName,
    preferred_language: "en",
    preferred_units: "metric",
    default_latitude: 13.08,
    default_longitude: 80.27,
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved) as AuthUser;
      } catch {
        // ignore parse error
      }
    }
    return null;
  });
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restoreSession = async () => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setUser(JSON.parse(saved) as AuthUser);
          return;
        }
      } catch {
        // ignore
      }
    }
    try {
      const serverUser = await getCurrentUser();
      setUser(serverUser);
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser));
    } catch {
      try {
        const refreshedUser = await refreshSession();
        setUser(refreshedUser);
        if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshedUser));
      } catch {
        // fallback to null
      }
    }
  };

  useEffect(() => {
    let active = true;
    const restore = async () => {
      await restoreSession();
      if (active) setLoading(false);
    };
    void restore();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      error,
      quickEnter: async (name: string) => {
        setError(null);
        setLoading(true);
        try {
          const guest = createGuestUser(name);
          setUser(guest);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guest));
          }
        } finally {
          setLoading(false);
        }
      },
      refreshUser: async () => {
        setLoading(true);
        await restoreSession();
        setLoading(false);
      },
      login: async (input: LoginInput) => {
        setError(null);
        setLoading(true);
        try {
          const loggedUser = await requestLogin(input);
          setUser(loggedUser);
          if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
        } catch {
          const fallbackUser = createGuestUser(input.email.split("@")[0]);
          setUser(fallbackUser);
          if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
        } finally {
          setLoading(false);
        }
      },
      register: async (input: RegisterInput) => {
        setError(null);
        setLoading(true);
        try {
          const regUser = await requestRegister(input);
          setUser(regUser);
          if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(regUser));
        } catch {
          const fallbackUser = createGuestUser(input.full_name || input.email.split("@")[0]);
          setUser(fallbackUser);
          if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
        } finally {
          setLoading(false);
        }
      },
      logout: async () => {
        setLoading(true);
        try {
          await requestLogout().catch(() => {});
        } finally {
          if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setLoading(false);
        }
      },
    }),
    [user, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

