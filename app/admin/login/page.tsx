"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("from") ?? "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error ?? "Login failed");
      } else {
        router.replace(next);
        router.refresh();
      }
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-96 flex-1 items-center px-4 py-10">
      <div className="w-full">
        <Link href="/" className="gf-link text-sm">
          ← Back to form
        </Link>

        <form onSubmit={onSubmit} className="gf-card gf-stripe-top mt-4 flex flex-col gap-4">
          <div>
            <h1 className="text-[22px] font-normal leading-tight">Admin sign in</h1>
            <p className="mt-1 gf-helper">Submissions table ကို ဝင်ဖို့ login လုပ်ပါ။</p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="gf-label">Username</span>
            <input
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="gf-input"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="gf-label">Password</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="gf-input"
            />
          </label>

          {err && (
            <div className="rounded-md border border-l-4 border-border bg-red-50 px-3 py-2 text-sm text-(--gf-required)" style={{ borderLeftColor: "var(--gf-required)" }}>
              {err}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <button type="submit" disabled={busy} className="gf-btn-primary">
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <span className="text-xs text-muted">admin / admin123</span>
          </div>
        </form>
      </div>
    </main>
  );
}
