"use client";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, quickEnter } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void quickEnter("Captain Lal Aman");
    }
  }, [isAuthenticated, isLoading, quickEnter]);

  if (isLoading && !isAuthenticated) {
    return <main className="session-check">Launching ORCA Command Center…</main>;
  }

  return <>{children}</>;
}

