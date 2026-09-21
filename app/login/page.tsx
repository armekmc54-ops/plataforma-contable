"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("contador@vazquezcontadores.mx");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/accountant");
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C10] px-4 py-12 text-zinc-300 selection:bg-[#C5A880]/20 selection:text-zinc-100">
      <div className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-zinc-900/40 p-8 shadow-sm">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded border border-[#C5A880]/40 bg-[#C5A880]/10 font-mono text-xs font-semibold text-[#C5A880]">
              VA
            </span>
          </Link>
          <h1 className="text-xl font-normal text-zinc-100">Acceso a la Plataforma</h1>
          <p className="mt-1 text-xs text-zinc-500">Vázquez & Asociados · Panel Interno</p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-[#C5A880] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-[#C5A880] focus:outline-none"
            />
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-zinc-950/60 p-3 text-[11px] text-zinc-500">
            <span className="text-zinc-300 font-medium">Demo:</span> contador@vazquezcontadores.mx
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-100 py-2.5 text-xs font-medium text-zinc-950 hover:bg-white transition-all disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
