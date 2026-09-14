"use client";

import Link from "next/link";
import { Anchor, ArrowRight, Compass, LoaderCircle, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { quickEnter, isLoading, user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState(user?.full_name || "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredName = name.trim() || "Captain Lal Aman";
    await quickEnter(enteredName);
    const next = params.get("next");
    router.replace(next && /^\/(?![\/\\])/.test(next) ? next : "/dashboard");
  };

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <Link className="brand" href="/">
          <span className="brand-mark" style={{ overflow: "hidden", background: "transparent" }}>
            <img src="/icon-192.png" alt="ORCA" width={30} height={30} style={{ objectFit: "contain" }} />
          </span>
          ORCA
        </Link>
        <div>
          <p className="eyebrow">MARINE INTELLIGENCE</p>
          <h1>Safer decisions begin with clearer intelligence.</h1>
          <p>Access ORCA’s evidence-aware command center for marine operations.</p>
        </div>
      </section>
      <section className="auth-card-wrap">
        <form className="auth-card" onSubmit={submit}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Compass size={20} style={{ color: "#38bdf8" }} />
            <p className="eyebrow" style={{ margin: 0 }}>COMMAND CENTER ACCESS</p>
          </div>
          <h2>Welcome to ORCA</h2>
          <p className="auth-subtitle">Enter your name or callsign to launch the dashboard.</p>

          <label>
            Full Name / Callsign
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Captain Lal Aman Singh"
              autoComplete="name"
            />
          </label>

          <button className="button auth-submit" type="submit" disabled={isLoading} style={{ marginTop: "1rem" }}>
            {isLoading ? (
              <>
                <LoaderCircle className="spin" size={16} />
                Launching Command Center…
              </>
            ) : (
              <>
                Enter Command Center
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.85rem", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Sparkles size={14} style={{ color: "#38bdf8" }} />
            <span>Instant Access · No password required</span>
          </div>
        </form>
      </section>
    </main>
  );
}

