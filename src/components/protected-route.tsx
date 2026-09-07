"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
export function ProtectedRoute({children}:{children:ReactNode}){const {isAuthenticated,isLoading}=useAuth();const router=useRouter();const pathname=usePathname();useEffect(()=>{if(!isLoading&&!isAuthenticated)router.replace(`/login?next=${encodeURIComponent(pathname)}`);},[isAuthenticated,isLoading,pathname,router]);if(isLoading)return <main className="session-check">Checking session…</main>;if(!isAuthenticated)return null;return <>{children}</>}
