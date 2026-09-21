import Link from "next/link";

export default function AccountantDashboardPage() {
  const accountantName = "Mtro. Alejandro Vázquez, CPC";
  const appointmentsCount = 0;
  const clientsCount = 2;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-zinc-300">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <span className="text-xs text-zinc-500 uppercase tracking-widest">
              Panel del Contador Titular
            </span>
            <h1 className="mt-1 text-2xl font-normal text-zinc-100">{accountantName}</h1>
          </div>
          <Link
            href="/"
            className="self-start rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ← Volver al Portal Público
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6">
            <h2 className="text-xs uppercase tracking-wider text-[#C5A880] mb-3">Próxima cita</h2>
            {appointmentsCount === 0 ? (
              <p className="text-xs text-zinc-500">No tienes citas programadas para hoy.</p>
            ) : (
              <p className="text-xs text-zinc-200">Tienes citas agendadas.</p>
            )}
          </section>

          <section className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6 md:col-span-2">
            <h2 className="text-xs uppercase tracking-wider text-zinc-400 mb-3">
              Actividad Semanal
            </h2>
            <p className="text-xs text-zinc-500">
              Calendario despejado. Todas las declaraciones provisionales del periodo se encuentran
              al corriente.
            </p>
          </section>

          <section className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6 md:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-wider text-zinc-400">
                Clientes Asignados ({clientsCount})
              </h2>
              <span className="text-xs text-zinc-500">Monitoreo SAT Activo</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/[0.06] bg-zinc-950/60 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200">
                      InnovaTech Software S.A. de C.V.
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                      RFC: ITS210408KT9 · Persona Moral
                    </p>
                  </div>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
                    32-D Positiva
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-zinc-950/60 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200">
                      Ing. Sofía Carranza Valdés
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                      RFC: CAVS920311N78 · RESICO
                    </p>
                  </div>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
                    Al Corriente
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
