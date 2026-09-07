import { AuthProvider } from "@/components/auth-provider";
import { AuthForm } from "@/components/auth-form";
import { Suspense } from "react";
export default function RegisterPage(){return <AuthProvider><Suspense fallback={<main className="session-check">Loading…</main>}><AuthForm mode="register"/></Suspense></AuthProvider>}
