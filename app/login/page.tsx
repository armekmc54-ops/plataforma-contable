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
    // Simulación de acceso inmediato al dashboard del contador
    setTimeout(() => {
      router.push("/accountant");
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E1E33] px-4 py-12 selection:bg-[#B8935F] selection:text-[#0E1E33]">
      <div className="w-full max-w-md rounded-sm border border-[#B8935F]/30 bg-[#12233B] p-8 shadow-2xl">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-[#B8935F] font-serif font-bold text-[#0E1E33]">
              VA
            </div>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-white">Acceso a la Plataforma</h1>
          <p className="mt-1 text-xs uppercase tracking-wider text-[#B8935F]">
            Vázquez & Asociados · Firma Contable
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-white/10 bg-[#0E1E33] px-4 py-2.5 text-xs text-white focus:border-[#B8935F] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-white/10 bg-[#0E1E33] px-4 py-2.5 text-xs text-white focus:border-[#B8935F] focus:outline-none"
            />
          </div>

          <div className="rounded bg-[#0E1E33] p-3 text-[11px] text-slate-400 border border-white/5">
            <span className="text-[#B8935F] font-semibold">Credenciales de Demo:</span>
            <br />
            Usuario: <code className="text-slate-200">contador@vazquezcontadores.mx</code>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-[#B8935F] py-3 text-xs font-bold uppercase tracking-wider text-[#0E1E33] shadow hover:bg-[#c9a773] transition-all disabled:opacity-50"
          >
            {loading ? "Iniciando sesión..." : "Ingresar al Panel"}
          </button>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Volver a la página principal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
