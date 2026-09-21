// Componente visual de UI para el panel del contador
export default function AccountantDashboardPage() {
  const accountantName = "Mtro. Alejandro Vázquez, CPC";
  const appointmentsCount = 0;
  const clientsCount = 2;

  return (
    <div className="min-h-screen bg-[#0E1E33] text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <header className="mb-10 flex flex-col gap-1 border-b border-white/10 pb-6">
          <span className="text-sm text-[#8B93A3]">Panel del contador titular</span>
          <h1 className="font-serif text-3xl text-white md:text-4xl">
            Hola, {accountantName}
          </h1>
        </header>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="rounded-sm border border-[#B8935F]/40 bg-[#12233B] p-6 md:col-span-1">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#B8935F]">
              Próxima cita
            </h2>
            {appointmentsCount === 0 ? (
              <p className="text-sm text-slate-400">No tienes citas programadas por ahora.</p>
            ) : (
              <p className="text-sm text-white">Tienes citas agendadas.</p>
            )}
          </section>
          <section className="rounded-sm border border-white/10 bg-[#12233B] p-6 md:col-span-2">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8B93A3]">
              Citas próximas
            </h2>
            <p className="text-sm text-slate-400">Tu calendario está despejado esta semana.</p>
          </section>
          <section className="rounded-sm border border-white/10 bg-[#12233B] p-6 md:col-span-3">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8B93A3]">
              Clientes asignados ({clientsCount})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded border border-white/5 bg-[#0E1E33] p-4">
                <span className="text-sm font-semibold text-white">InnovaTech Software S.A. de C.V.</span>
                <p className="text-xs text-slate-400">RFC: ITS210408KT9 · Persona Moral</p>
                <span className="mt-2 inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  Opinión 32-D Positiva
                </span>
              </div>
              <div className="rounded border border-white/5 bg-[#0E1E33] p-4">
                <span className="text-sm font-semibold text-white">Ing. Sofía Carranza Valdés</span>
                <p className="text-xs text-slate-400">RFC: CAVS920311N78 · RESICO</p>
                <span className="mt-2 inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  Al corriente
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
