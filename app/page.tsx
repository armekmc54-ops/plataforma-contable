"use client";

import { useMemo, useState } from "react";
import {
  calculateInvoice,
  calculatePayroll,
  calculateLoanAmortization,
  calculateFinancialRatios,
  InvoiceCalculationResult,
  PayrollResult,
  AmortizationRow,
} from "@/lib/tax-engine";

const firm = {
  name: "Vázquez & Asociados · Firma Contable",
  counterName: "Mtro. Alejandro Vázquez, CPC",
  tagline: "Contabilidad estratégica, optimización fiscal y gobierno corporativo con la precisión de un oficio, no de una plantilla.",
  credentials: "Contador Público Certificado · Cédula Profesional 8492019 · Maestría en Derecho Fiscal",
  specialty: "Personas Físicas de Altos Ingresos, Freelancers Tech/Creators, RESICO y PyMEs en Expansión",
  whatsappNumber: "525512345678",
  email: "contacto@vazquezcontadores.mx",
  phone: "+52 (55) 5482-9000",
  location: "Torre Reforma 483, Piso 28, Cuauhtémoc, CDMX",
};

// Noticias y Reformas Fiscales Automatizadas (Newsfeed DOF / SAT)
const initialNews = [
  {
    id: "1",
    source: "SAT · Resolución Miscelánea Fiscal",
    badge: "Oficial",
    date: "20 Septiembre 2026",
    title: "Nuevas precisiones para la permanencia en RESICO 2026",
    aiSummary:
      "El SAT flexibiliza los plazos de regularización para contribuyentes que omitieron la declaración anual anterior sin expulsarlos de inmediato al Régimen General, siempre que subsanen dentro de los 30 días hábiles posteriores a la notificación.",
    impact: "Afecta a Personas Físicas en RESICO con ingresos anuales de hasta $3.5 MDP.",
  },
  {
    id: "2",
    source: "Diario Oficial de la Federación (DOF)",
    badge: "Decreto Presidencial",
    date: "14 Septiembre 2026",
    title: "Actualización de incentivos para deducción acelerada de activos tecnológicos",
    aiSummary:
      "Se autoriza un porcentaje de depreciación de hasta el 50% en el primer ejercicio para inversiones en infraestructura de inteligencia artificial, servidores y software contable especializado.",
    impact: "Beneficio directo para empresas de tecnología y despachos de servicios.",
  },
  {
    id: "3",
    source: "Criterio No Vinculativo SAT",
    badge: "Alerta de Riesgo",
    date: "05 Septiembre 2026",
    title: "Intensificación de revisiones electrónicas sobre retenciones de IVA",
    aiSummary:
      "La autoridad fiscal auditará discrepancias automáticas entre el CFDI emitido por servicios profesionales y el entero oportuno de retenciones de dos terceras partes de IVA por parte de personas morales.",
    impact: "Indispensable conciliar nóminas y honorarios antes del día 17 de cada mes.",
  },
];

type CalcTab = "facturacion" | "nomina" | "amortizacion" | "ratios";
type BookingType = "MEET" | "PRESENCIAL";

export default function HomePage() {
  // Pestañas del Motor de Cálculo
  const [calcTab, setCalcTab] = useState<CalcTab>("facturacion");

  // Estado Calculadora 1: Facturación
  const [subtotalInput, setSubtotalInput] = useState<number>(45000);
  const [regime, setRegime] = useState<"RESICO" | "HONORARIOS_GENERAL">("RESICO");
  const [clientType, setClientType] = useState<"PERSONA_MORAL" | "PERSONA_FISICA">("PERSONA_MORAL");

  // Estado Calculadora 2: Nómina
  const [grossSalaryInput, setGrossSalaryInput] = useState<number>(30000);

  // Estado Calculadora 3: Amortización
  const [loanPrincipal, setLoanPrincipal] = useState<number>(200000);
  const [loanRate, setLoanRate] = useState<number>(14.5);
  const [loanMonths, setLoanMonths] = useState<number>(24);

  // Estado Calculadora 4: Ratios Financieros
  const [currentAssets, setCurrentAssets] = useState<number>(650000);
  const [currentLiabilities, setCurrentLiabilities] = useState<number>(280000);
  const [inventory, setInventory] = useState<number>(120000);
  const [totalDebt, setTotalDebt] = useState<number>(400000);
  const [totalEquity, setTotalEquity] = useState<number>(850000);
  const [netIncome, setNetIncome] = useState<number>(185000);
  const [totalRevenue, setTotalRevenue] = useState<number>(1200000);

  // Estado del Asistente Virtual / Chatbot
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "bot" | "user"; text: string; action?: string }>
  >([
    {
      sender: "bot",
      text: "Bienvenido a Vázquez & Asociados. Soy su Asistente Fiscal Virtual. Para diagnosticar su situación y recomendarle la mejor estrategia, ¿cuál es su perfil fiscal?",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");

  // Estado de Agendamiento
  const [bookingDate, setBookingDate] = useState<string>("2026-09-28");
  const [bookingTime, setBookingTime] = useState<string>("11:00 AM");
  const [bookingType, setBookingType] = useState<BookingType>("MEET");
  const [bookingService, setBookingService] = useState<string>("Diagnóstico Fiscal de Alta Riqueza / PyME");
  const [clientName, setClientName] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);

  // Estado del Portal del Cliente (Demo)
  const [portalTab, setPortalTab] = useState<"resumen" | "documentos">("resumen");
  const [mockFiles, setMockFiles] = useState<Array<{ name: string; size: string; type: string; date: string }>>([
    { name: "CFDI_Ingresos_Agosto2026.xml", size: "24 KB", type: "XML", date: "02/09/2026" },
    { name: "Acuse_Declaracion_Agosto_2026.pdf", size: "480 KB", type: "PDF", date: "15/09/2026" },
    { name: "Opinion_Cumplimiento_32D_Positiva.pdf", size: "190 KB", type: "PDF", date: "01/09/2026" },
  ]);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Cálculos reactivos en tiempo real
  const invoiceResult: InvoiceCalculationResult = useMemo(() => {
    return calculateInvoice({
      subtotal: Math.max(0, subtotalInput || 0),
      regime,
      clientType,
      ivaRate: 0.16,
    });
  }, [subtotalInput, regime, clientType]);

  const payrollResult: PayrollResult = useMemo(() => {
    return calculatePayroll({
      grossSalary: Math.max(0, grossSalaryInput || 0),
    });
  }, [grossSalaryInput]);

  const amortizationSchedule: AmortizationRow[] = useMemo(() => {
    return calculateLoanAmortization(
      Math.max(1000, loanPrincipal || 0),
      Math.max(0.1, loanRate || 0),
      Math.max(1, loanMonths || 1)
    );
  }, [loanPrincipal, loanRate, loanMonths]);

  const financialRatios = useMemo(() => {
    return calculateFinancialRatios({
      currentAssets: Math.max(0, currentAssets || 0),
      currentLiabilities: Math.max(0, currentLiabilities || 0),
      inventory: Math.max(0, inventory || 0),
      totalDebt: Math.max(0, totalDebt || 0),
      totalEquity: Math.max(0, totalEquity || 0),
      netIncome: Math.max(0, netIncome || 0),
      totalRevenue: Math.max(0, totalRevenue || 0),
    });
  }, [currentAssets, currentLiabilities, inventory, totalDebt, totalEquity, netIncome, totalRevenue]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Chatbot Triage Handler
  const handleUserChatResponse = (userText: string) => {
    const newMessages = [...chatMessages, { sender: "user" as const, text: userText }];

    let reply = "";
    let actionBtn = "";

    const lower = userText.toLowerCase();
    if (lower.includes("freelancer") || lower.includes("resico") || lower.includes("honorarios")) {
      reply =
        "Excelente. Si recibes ingresos como freelancer o profesionista independiente, el Régimen Simplificado de Confianza (RESICO) te permite tributar entre el 1% y el 2.5% de ISR en lugar de hasta el 35%. ¿Tus ingresos anuales son menores a $3.5 MDP y deseas blindar tus retenciones de personas morales?";
      actionBtn = "Agendar Diagnóstico RESICO";
    } else if (lower.includes("empresa") || lower.includes("pyme") || lower.includes("moral")) {
      reply =
        "Entendido. Para Personas Morales y PyMEs, nuestra firma audita la deducción de inversiones, nóminas timbradas CFDI 4.0 y conciliaciones bancarias para blindar la Opinión 32-D Positiva. ¿Deseas una revisión preventiva o contabilidad integral mensual?";
      actionBtn = "Solicitar Propuesta PyME";
    } else if (lower.includes("sat") || lower.includes("multa") || lower.includes("requerimiento")) {
      reply =
        "Atención prioritaria: Una notificación o requerimiento del SAT tiene plazos fatales de respuesta (generalmente 15 a 20 días hábiles). Nuestro equipo legal y contable puede interponer aclaraciones o medios de defensa antes de que congelen sellos digitales (CSD).";
      actionBtn = "Contactar al Titular por WhatsApp Urgente";
    } else {
      reply =
        "Comprendo su situación. De acuerdo con las disposiciones fiscales vigentes, cada caso requiere una revisión de su Constancia de Situación Fiscal y sus CFDI emitidos. Le sugerimos agendar una sesión privada o enviarnos un mensaje directo a WhatsApp para orientarle de inmediato.";
      actionBtn = "Agendar Consulta Formal";
    }

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot" as const, text: reply, action: actionBtn },
      ]);
    }, 400);

    setChatMessages(newMessages);
    setChatInput("");
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) return;
    setBookingConfirmed(true);
  };

  const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMockFiles((prev) => [
        {
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.name.endsWith(".xml") ? "XML" : "PDF",
          date: "Hoy",
        },
        ...prev,
      ]);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  const whatsappUrl = `https://wa.me/${firm.whatsappNumber}?text=${encodeURIComponent(
    "Hola Lic. Vázquez, visité su plataforma web y deseo agendar una sesión de asesoría fiscal personalizada."
  )}`;

  return (
    <div className="min-h-screen bg-[#0E1E33] text-slate-100 selection:bg-[#B8935F] selection:text-[#0E1E33]">
      {/* Header Corporativo */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0E1E33]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5 gap-2">
          <a href="#inicio" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-gradient-to-br from-[#B8935F] to-[#8C6D3F] font-serif text-base font-bold text-[#0E1E33] shadow-md ring-1 ring-white/20">
              VA
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-sm sm:text-base font-semibold tracking-wide text-white leading-tight">
                Vázquez & Asociados
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#B8935F]">
                Firma Contable & Fiscal
              </span>
            </div>
          </a>

          <nav className="hidden items-center gap-3 xl:gap-5 text-[11px] xl:text-xs font-semibold uppercase tracking-wider text-slate-300 lg:flex whitespace-nowrap">
            <a href="#inicio" className="transition-colors hover:text-[#B8935F]">
              Inicio
            </a>
            <a href="#calculadoras" className="transition-colors hover:text-[#B8935F]">
              Calculadoras
            </a>
            <a href="#asistente" className="transition-colors hover:text-[#B8935F]">
              Asistente IA
            </a>
            <a href="#newsfeed" className="transition-colors hover:text-[#B8935F]">
              Noticias DOF/SAT
            </a>
            <a href="#agendamiento" className="transition-colors hover:text-[#B8935F]">
              Agendar Cita
            </a>
            <a href="#portal" className="transition-colors hover:text-[#B8935F]">
              Portal Clientes
            </a>
            <a
              href="/accountant"
              className="rounded-sm border border-white/20 px-2.5 py-1 text-[11px] text-[#B8935F] hover:border-[#B8935F] hover:bg-[#B8935F]/10"
            >
              Portal Interno
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-sm border border-[#B8935F] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#B8935F] transition-all hover:bg-[#B8935F] hover:text-[#0E1E33] sm:inline-flex whitespace-nowrap"
            >
              WhatsApp
            </a>
            <a
              href="#agendamiento"
              className="rounded-sm bg-[#B8935F] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0E1E33] shadow transition-all hover:bg-[#c9a773] whitespace-nowrap"
            >
              Reservar Cita
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="scroll-mt-24 relative overflow-hidden border-b border-white/10 py-16 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1B3454] via-[#0E1E33] to-[#081220] opacity-80"></div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#B8935F]/40 bg-[#12233B] px-3.5 py-1.5 text-xs text-[#B8935F]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Firma Certificada ante el Instituto Mexicano de Contadores Públicos</span>
              </div>
              <h1 className="font-serif text-4xl font-normal leading-tight text-white sm:text-5xl lg:text-6xl">
                Contabilidad con la precisión de un{" "}
                <span className="italic text-[#B8935F]">oficio riguroso</span>, no
                de una plantilla genérica.
              </h1>
              <p className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg leading-relaxed">
                Protegemos y potenciamos el patrimonio financiero de personas físicas y empresas en México. Estrategias fiscales de vanguardia, cumplimiento irrefutable ante el SAT y atención directa de socio a cliente.
              </p>

              {/* Credenciales y Cédula Profesional */}
              <div className="mt-8 flex flex-wrap items-center gap-4 rounded-sm border border-white/10 bg-[#12233B]/60 p-4 text-xs text-slate-300 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#B8935F]/20 px-2 py-0.5 font-serif font-bold text-[#B8935F]">
                    CPC
                  </span>
                  <span className="font-medium text-white">{firm.credentials}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="h-1 w-1 rounded-full bg-[#B8935F]"></span>
                  <span>{firm.specialty}</span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#agendamiento"
                  className="rounded-sm bg-[#B8935F] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#0E1E33] shadow-xl transition-all hover:bg-[#c9a773]"
                >
                  Agendar Consulta de Diagnóstico
                </a>
                <a
                  href="#calculadoras"
                  className="rounded-sm border border-white/20 bg-[#12233B] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition-all hover:border-[#B8935F] hover:text-white"
                >
                  Abrir Calculadoras Fiscales
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm border border-emerald-500/50 bg-emerald-950/30 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-900/50"
                >
                  WhatsApp Inmediato
                </a>
              </div>
            </div>

            {/* Tarjeta Visual de Autoridad & Cumplimiento */}
            <div className="lg:col-span-5">
              <div className="rounded-sm border border-[#B8935F]/40 bg-gradient-to-b from-[#162945] to-[#0E1E33] p-8 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#B8935F] bg-[#0E1E33] font-serif text-2xl font-bold text-[#B8935F]">
                    AV
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-white">
                      {firm.counterName}
                    </h3>
                    <p className="text-xs uppercase tracking-wider text-[#B8935F]">
                      Socio Director Fiscal
                    </p>
                    <p className="text-xs text-slate-400">14+ años de práctica contable y litigio fiscal</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3.5 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="text-[#B8935F] font-bold">✓</span>
                    <span>Revisión exhaustiva mensual CFDI 4.0 por contador titular.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#B8935F] font-bold">✓</span>
                    <span>Blindaje contra discrepancia fiscal y auditorías del SAT.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#B8935F] font-bold">✓</span>
                    <span>Opinión de Cumplimiento 32-D siempre en estado Positivo.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#B8935F] font-bold">✓</span>
                    <span>Respuesta ejecutiva garantizada en menos de 15 minutos.</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 rounded-sm border border-white/5 bg-[#0A1626] p-4">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400">Garantía SAT</span>
                    <p className="font-mono text-xs font-semibold text-emerald-400">32-D Positiva</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400">Cédula Federal</span>
                    <p className="font-mono text-xs font-semibold text-[#B8935F]">SEP 8492019</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOTOR DE CÁLCULO AVANZADO (Público / Nivel Software Contable) */}
      <section id="calculadoras" className="scroll-mt-24 border-b border-white/10 bg-[#0B1830] py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#B8935F]">
              Precisión Contable & Algoritmos Financieros 2026
            </span>
            <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">
              Motor de Simulación Fiscal & Financiera
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Módulo de cálculo de alta precisión comparable a los sistemas ERP corporativos. Simule en tiempo real facturación, nómina, amortización de deudas o ratios de liquidez empresarial.
            </p>
          </div>

          {/* Navegación de Pestañas del Motor */}
          <div className="mt-10 flex flex-wrap justify-center gap-2 border-b border-white/10 pb-4">
            {(
              [
                { id: "facturacion", label: "Facturación & Retenciones (CFDI 4.0)" },
                { id: "nomina", label: "Simulador de Nómina (Bruto a Neto)" },
                { id: "amortizacion", label: "Amortización de Préstamos" },
                { id: "ratios", label: "Razones Financieras (Empresas)" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCalcTab(tab.id)}
                className={`rounded-sm px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  calcTab === tab.id
                    ? "bg-[#B8935F] text-[#0E1E33] shadow-md"
                    : "border border-white/10 bg-[#12233B] text-slate-300 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Facturación y Retenciones */}
          {calcTab === "facturacion" && (
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="rounded-sm border border-white/10 bg-[#12233B] p-6 lg:col-span-6">
                <h3 className="border-b border-white/10 pb-3 font-serif text-lg text-white">
                  Parámetros de Emisión de Factura
                </h3>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Importe Subtotal Deseado (Antes de IVA)
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                      <input
                        type="number"
                        value={subtotalInput}
                        onChange={(e) => setSubtotalInput(Number(e.target.value))}
                        className="w-full rounded-sm border border-white/10 bg-[#0E1E33] py-2.5 pl-8 pr-4 text-white focus:border-[#B8935F] focus:outline-none"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[15000, 35000, 60000, 120000, 250000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSubtotalInput(val)}
                          className="rounded-sm border border-white/5 bg-[#0E1E33] px-2.5 py-1 text-xs text-slate-300 hover:text-[#B8935F]"
                        >
                          ${val.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Régimen Fiscal del Prestador de Servicios
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegime("RESICO")}
                        className={`rounded-sm border p-3 text-left transition-all ${
                          regime === "RESICO"
                            ? "border-[#B8935F] bg-[#0E1E33] text-white"
                            : "border-white/10 bg-[#0E1E33]/40 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        <div className="font-semibold text-sm">RESICO</div>
                        <div className="text-[11px] text-slate-400">Tasa reducida 1% a 2.5%</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegime("HONORARIOS_GENERAL")}
                        className={`rounded-sm border p-3 text-left transition-all ${
                          regime === "HONORARIOS_GENERAL"
                            ? "border-[#B8935F] bg-[#0E1E33] text-white"
                            : "border-white/10 bg-[#0E1E33]/40 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        <div className="font-semibold text-sm">Honorarios General</div>
                        <div className="text-[11px] text-slate-400">Tarifa progresiva hasta 35%</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Receptor de la Factura (Tu Cliente)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setClientType("PERSONA_MORAL")}
                        className={`rounded-sm border p-3 text-left transition-all ${
                          clientType === "PERSONA_MORAL"
                            ? "border-[#B8935F] bg-[#0E1E33] text-white"
                            : "border-white/10 bg-[#0E1E33]/40 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        <div className="font-semibold text-sm">Persona Moral (Empresa)</div>
                        <div className="text-[11px] text-slate-400">Aplica retención de ley</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientType("PERSONA_FISICA")}
                        className={`rounded-sm border p-3 text-left transition-all ${
                          clientType === "PERSONA_FISICA"
                            ? "border-[#B8935F] bg-[#0E1E33] text-white"
                            : "border-white/10 bg-[#0E1E33]/40 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        <div className="font-semibold text-sm">Persona Física</div>
                        <div className="text-[11px] text-slate-400">Sin retenciones directas</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resultado Facturación */}
              <div className="flex flex-col justify-between rounded-sm border border-[#B8935F]/40 bg-[#12233B] p-6 lg:col-span-6">
                <div>
                  <h3 className="flex items-center justify-between border-b border-white/10 pb-3 font-serif text-lg text-white">
                    <span>Desglose Fiscal de Facturación</span>
                    <span className="font-mono text-xs text-[#B8935F]">CFDI 4.0</span>
                  </h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between py-1 text-slate-300">
                      <span>Subtotal</span>
                      <span className="font-mono font-medium text-white">
                        {formatMoney(invoiceResult.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-300">
                      <span>IVA Trasladado (16%)</span>
                      <span className="font-mono font-medium text-white">
                        {formatMoney(invoiceResult.iva)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 py-1 font-semibold text-slate-200">
                      <span>Total Bruto Facturado</span>
                      <span className="font-mono">{formatMoney(invoiceResult.grossTotal)}</span>
                    </div>

                    {invoiceResult.retainedIsr > 0 && (
                      <div className="flex justify-between py-1 text-rose-400">
                        <span>(-) Retención ISR {regime === "RESICO" ? "(1.25%)" : "(10%)"}</span>
                        <span className="font-mono font-medium">
                          -{formatMoney(invoiceResult.retainedIsr)}
                        </span>
                      </div>
                    )}

                    {invoiceResult.retainedIva > 0 && (
                      <div className="flex justify-between py-1 text-rose-400">
                        <span>(-) Retención IVA (2/3 partes = 10.6667%)</span>
                        <span className="font-mono font-medium">
                          -{formatMoney(invoiceResult.retainedIva)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-sm border border-[#B8935F]/50 bg-[#0E1E33] p-5 shadow-inner">
                    <div className="text-xs uppercase tracking-widest text-[#B8935F]">
                      Neto Efectivo a Recibir en Cuenta Bancaria
                    </div>
                    <div className="mt-1 font-mono text-3xl font-bold text-white">
                      {formatMoney(invoiceResult.netToReceive)}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Estimación de ISR propio por pagar:{" "}
                      <span className="font-semibold text-[#B8935F]">
                        {formatMoney(invoiceResult.directEstimatedIsr)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <a
                    href="#agendamiento"
                    className="block w-full rounded-sm bg-[#B8935F] py-3 text-center text-xs font-bold uppercase tracking-wider text-[#0E1E33] shadow hover:bg-[#c9a773]"
                  >
                    Optimizar mi carga fiscal con una asesoría
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Simulador de Nómina */}
          {calcTab === "nomina" && (
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="rounded-sm border border-white/10 bg-[#12233B] p-6 lg:col-span-6">
                <h3 className="border-b border-white/10 pb-3 font-serif text-lg text-white">
                  Cálculo de Sueldo Bruto a Neto
                </h3>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Salario Mensual Bruto (MXN)
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                      <input
                        type="number"
                        value={grossSalaryInput}
                        onChange={(e) => setGrossSalaryInput(Number(e.target.value))}
                        className="w-full rounded-sm border border-white/10 bg-[#0E1E33] py-2.5 pl-8 pr-4 text-white focus:border-[#B8935F] focus:outline-none"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[12000, 25000, 45000, 75000, 120000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setGrossSalaryInput(val)}
                          className="rounded-sm border border-white/5 bg-[#0E1E33] px-2.5 py-1 text-xs text-slate-300 hover:text-[#B8935F]"
                        >
                          ${val.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Aplica tarifas progresivas del Impuesto Sobre la Renta (LISR Art. 96) y cuotas obreras al Instituto Mexicano del Seguro Social (IMSS).
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-sm border border-[#B8935F]/40 bg-[#12233B] p-6 lg:col-span-6">
                <div>
                  <h3 className="border-b border-white/10 pb-3 font-serif text-lg text-white">
                    Desglose de Percepciones y Deducciones
                  </h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between py-1 text-slate-300">
                      <span>Salario Bruto Pactado</span>
                      <span className="font-mono font-medium text-white">
                        {formatMoney(payrollResult.grossSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-rose-400">
                      <span>(-) ISR Retenido por Nómina (Tarifa Progresiva)</span>
                      <span className="font-mono font-medium">
                        -{formatMoney(payrollResult.isrRetained)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-rose-400">
                      <span>(-) Cuota Obrera IMSS (~2.75%)</span>
                      <span className="font-mono font-medium">
                        -{formatMoney(payrollResult.imssWorkerFee)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 py-1 text-slate-300">
                      <span>Total de Deducciones Oficiales</span>
                      <span className="font-mono font-semibold text-rose-400">
                        -{formatMoney(payrollResult.totalDeductions)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 rounded-sm border border-[#B8935F]/50 bg-[#0E1E33] p-5 shadow-inner">
                    <div className="text-xs uppercase tracking-widest text-[#B8935F]">
                      Sueldo Neto Líquido Recibido por el Colaborador
                    </div>
                    <div className="mt-1 font-mono text-3xl font-bold text-white">
                      {formatMoney(payrollResult.netSalary)}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Tasa efectiva de retención global:{" "}
                      <span className="font-semibold text-slate-200">
                        {payrollResult.grossSalary > 0
                          ? ((payrollResult.totalDeductions / payrollResult.grossSalary) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <a
                    href="#agendamiento"
                    className="block w-full rounded-sm bg-[#B8935F] py-3 text-center text-xs font-bold uppercase tracking-wider text-[#0E1E33] shadow hover:bg-[#c9a773]"
                  >
                    Auditar o Maquilar Nóminas de mi Empresa
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Amortización de Préstamos */}
          {calcTab === "amortizacion" && (
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="rounded-sm border border-white/10 bg-[#12233B] p-6 lg:col-span-5">
                <h3 className="border-b border-white/10 pb-3 font-serif text-lg text-white">
                  Condiciones del Financiamiento
                </h3>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Monto del Préstamo (Capital)
                    </label>
                    <input
                      type="number"
                      value={loanPrincipal}
                      onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                      className="mt-1 w-full rounded-sm border border-white/10 bg-[#0E1E33] px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Tasa de Interés Anual (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={loanRate}
                      onChange={(e) => setLoanRate(Number(e.target.value))}
                      className="mt-1 w-full rounded-sm border border-white/10 bg-[#0E1E33] px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Plazo (Meses)
                    </label>
                    <input
                      type="number"
                      value={loanMonths}
                      onChange={(e) => setLoanMonths(Number(e.target.value))}
                      className="mt-1 w-full rounded-sm border border-white/10 bg-[#0E1E33] px-3 py-2 text-white"
                    />
                  </div>
                  <div className="rounded-sm bg-[#0E1E33] p-4 border border-white/5">
                    <div className="text-xs text-slate-400">Cuota Mensual Fija (Sistema Francés)</div>
                    <div className="font-mono text-2xl font-bold text-[#B8935F]">
                      {formatMoney(amortizationSchedule[0]?.payment || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-sm border border-white/10 bg-[#12233B] p-6 lg:col-span-7">
                <h3 className="border-b border-white/10 pb-3 font-serif text-lg text-white">
                  Primeros 6 Meses de Amortización
                </h3>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2">Mes</th>
                        <th className="py-2">Pago Total</th>
                        <th className="py-2">Interés</th>
                        <th className="py-2">Capital</th>
                        <th className="py-2">Saldo Insoluto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {amortizationSchedule.slice(0, 6).map((row) => (
                        <tr key={row.period} className="hover:bg-white/5">
                          <td className="py-2 text-white font-bold">{row.period}</td>
                          <td className="py-2">{formatMoney(row.payment)}</td>
                          <td className="py-2 text-rose-400">{formatMoney(row.interest)}</td>
                          <td className="py-2 text-emerald-400">{formatMoney(row.principal)}</td>
                          <td className="py-2 text-slate-300">{formatMoney(row.remainingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Razones Financieras */}
          {calcTab === "ratios" && (
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="rounded-sm border border-white/10 bg-[#12233B] p-6 lg:col-span-6">
                <h3 className="border-b border-white/10 pb-3 font-serif text-lg text-white">
                  Variables de Balance y Estado de Resultados
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300">Activo Circulante</label>
                    <input
                      type="number"
                      value={currentAssets}
                      onChange={(e) => setCurrentAssets(Number(e.target.value))}
                      className="mt-1 w-full rounded bg-[#0E1E33] p-2 text-white border border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300">Pasivo a Corto Plazo</label>
                    <input
                      type="number"
                      value={currentLiabilities}
                      onChange={(e) => setCurrentLiabilities(Number(e.target.value))}
                      className="mt-1 w-full rounded bg-[#0E1E33] p-2 text-white border border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300">Inventarios</label>
                    <input
                      type="number"
                      value={inventory}
                      onChange={(e) => setInventory(Number(e.target.value))}
                      className="mt-1 w-full rounded bg-[#0E1E33] p-2 text-white border border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300">Deuda Total</label>
                    <input
                      type="number"
                      value={totalDebt}
                      onChange={(e) => setTotalDebt(Number(e.target.value))}
                      className="mt-1 w-full rounded bg-[#0E1E33] p-2 text-white border border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300">Capital Contable</label>
                    <input
                      type="number"
                      value={totalEquity}
                      onChange={(e) => setTotalEquity(Number(e.target.value))}
                      className="mt-1 w-full rounded bg-[#0E1E33] p-2 text-white border border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300">Ingresos Totales (Ventas)</label>
                    <input
                      type="number"
                      value={totalRevenue}
                      onChange={(e) => setTotalRevenue(Number(e.target.value))}
                      className="mt-1 w-full rounded bg-[#0E1E33] p-2 text-white border border-white/10"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-300">Utilidad Neta</label>
                    <input
                      type="number"
                      value={netIncome}
                      onChange={(e) => setNetIncome(Number(e.target.value))}
                      className="mt-1 w-full rounded bg-[#0E1E33] p-2 text-white border border-white/10"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-sm border border-[#B8935F]/40 bg-[#12233B] p-6 lg:col-span-6">
                <h3 className="border-b border-white/10 pb-3 font-serif text-lg text-white">
                  Diagnóstico de Salud Financiera
                </h3>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between rounded bg-[#0E1E33] p-4 border border-white/5">
                    <div>
                      <div className="text-xs text-slate-400">Razón Circulante (Solvencia CP)</div>
                      <div className="text-[11px] text-slate-400">Óptimo: &gt; 1.5</div>
                    </div>
                    <div
                      className={`font-mono text-2xl font-bold ${
                        financialRatios.currentRatio >= 1.5 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {financialRatios.currentRatio}x
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded bg-[#0E1E33] p-4 border border-white/5">
                    <div>
                      <div className="text-xs text-slate-400">Prueba Ácida (Sin Inventarios)</div>
                      <div className="text-[11px] text-slate-400">Óptimo: &gt; 1.0</div>
                    </div>
                    <div
                      className={`font-mono text-2xl font-bold ${
                        financialRatios.quickRatio >= 1.0 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {financialRatios.quickRatio}x
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded bg-[#0E1E33] p-4 border border-white/5">
                    <div>
                      <div className="text-xs text-slate-400">Apalancamiento (Deuda / Capital)</div>
                      <div className="text-[11px] text-slate-400">Prudencial: &lt; 1.0</div>
                    </div>
                    <div
                      className={`font-mono text-2xl font-bold ${
                        financialRatios.debtToEquity <= 1.0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {financialRatios.debtToEquity}x
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded bg-[#0E1E33] p-4 border border-white/5">
                    <div>
                      <div className="text-xs text-slate-400">Margen Neto de Utilidad</div>
                      <div className="text-[11px] text-slate-400">Rentabilidad sobre Ventas</div>
                    </div>
                    <div className="font-mono text-2xl font-bold text-[#B8935F]">
                      {financialRatios.netProfitMargin}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ASISTENTE VIRTUAL INTELIGENTE (Chatbot NLP & Triage) */}
      <section id="asistente" className="scroll-mt-24 border-b border-white/10 py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#B8935F]">
              Atención 24/7 con Inteligencia Fiscal
            </span>
            <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">
              Asistente Virtual de Diagnóstico & Triage
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Conozca al instante qué régimen, deducciones o solución requiere su situación sin costo.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-sm border border-[#B8935F]/30 bg-[#12233B] shadow-2xl">
            {/* Encabezado Chat */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0E1E33] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#B8935F] text-[#0E1E33] font-bold">
                  AI
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0E1E33]"></span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Asesor Fiscal Virtual · Vázquez & Asociados</h4>
                  <p className="text-[11px] text-[#B8935F]">Entrenado con CFF, LISR, LIVA y Resoluciones SAT 2026</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                En Línea 24/7
              </span>
            </div>

            {/* Mensajes */}
            <div className="h-80 overflow-y-auto p-6 space-y-4 bg-[#0A1626]/50">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xl rounded-sm p-4 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#B8935F] text-[#0E1E33] font-medium"
                        : "bg-[#162945] text-slate-200 border border-white/10"
                    }`}
                  >
                    {msg.text}

                    {msg.action && (
                      <div className="mt-3 pt-2 border-t border-white/10">
                        <a
                          href="#agendamiento"
                          className="inline-block rounded-sm bg-[#B8935F] px-3 py-1 text-[11px] font-bold text-[#0E1E33] hover:bg-white"
                        >
                          → {msg.action}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botones de Respuesta Rápida */}
            <div className="border-t border-white/5 bg-[#0E1E33] px-6 py-3 flex flex-wrap gap-2 text-xs">
              <span className="text-slate-400 py-1">Opciones rápidas:</span>
              <button
                type="button"
                onClick={() => handleUserChatResponse("Soy freelancer / profesionista y quiero tributar en RESICO")}
                className="rounded-sm border border-white/10 bg-[#12233B] px-3 py-1 text-slate-300 hover:border-[#B8935F] hover:text-white"
              >
                Soy Freelancer / RESICO
              </button>
              <button
                type="button"
                onClick={() => handleUserChatResponse("Tengo una empresa PyME y necesito auditoría y nóminas")}
                className="rounded-sm border border-white/10 bg-[#12233B] px-3 py-1 text-slate-300 hover:border-[#B8935F] hover:text-white"
              >
                Tengo una Empresa / PyME
              </button>
              <button
                type="button"
                onClick={() => handleUserChatResponse("Recibí un requerimiento o notificación del SAT")}
                className="rounded-sm border border-rose-500/30 bg-rose-950/30 px-3 py-1 text-rose-300 hover:border-rose-400"
              >
                Notificación del SAT urgente
              </button>
            </div>

            {/* Input Chat */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) handleUserChatResponse(chatInput);
              }}
              className="flex border-t border-white/10 bg-[#0E1E33] p-4 gap-3"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escriba su duda fiscal (ej. ¿Cómo deduzco equipo de cómputo en RESICO?)..."
                className="flex-1 rounded-sm border border-white/10 bg-[#12233B] px-4 py-2.5 text-xs text-white focus:border-[#B8935F] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-sm bg-[#B8935F] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0E1E33] hover:bg-[#c9a773]"
              >
                Consultar
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* SISTEMA DE ACTUALIZACIÓN LEGAL AUTOMATIZADO (NEWSFEED DOF / SAT) */}
      <section id="newsfeed" className="scroll-mt-24 border-b border-white/10 bg-[#0B1830] py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#B8935F]">
                Monitor Legal Continuo
              </span>
              <h2 className="mt-1 font-serif text-3xl text-white">
                Newsfeed Fiscal & Criterios Oficiales
              </h2>
              <p className="mt-2 text-xs text-slate-300">
                Extracción y síntesis ejecutiva con IA de las publicaciones del Diario Oficial de la Federación y el SAT.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs text-slate-400">Última sincronización: Hoy 07:00 AM</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {initialNews.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-sm border border-white/10 bg-[#12233B] p-6 hover:border-[#B8935F]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <span className="rounded bg-[#0E1E33] px-2 py-0.5 font-semibold text-[#B8935F] border border-white/5">
                      {item.badge}
                    </span>
                    <span>{item.date}</span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-white mb-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    {item.aiSummary}
                  </p>
                </div>
                <div className="rounded-sm bg-[#0E1E33] p-3 border border-white/5 text-[11px] text-emerald-400">
                  <span className="font-bold text-white">Impacto Contable: </span>
                  {item.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SISTEMA DE AGENDAMIENTO & CRM (Booking con Prepago) */}
      <section id="agendamiento" className="scroll-mt-24 border-b border-white/10 py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#B8935F]">
              Agenda Privada
            </span>
            <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">
              Reserve su Sesión de Diagnóstico Fiscal
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Seleccione la modalidad y horario de su preferencia. Confirmación inmediata y enlace de videoconferencia.
            </p>
          </div>

          <div className="mt-10 rounded-sm border border-[#B8935F]/40 bg-[#12233B] p-8 shadow-2xl">
            {bookingConfirmed ? (
              <div className="text-center py-12">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-3xl mb-4">
                  ✓
                </div>
                <h3 className="font-serif text-2xl font-bold text-white">
                  Cita Confirmada con Éxito
                </h3>
                <p className="mt-3 text-sm text-slate-300 max-w-md mx-auto">
                  Estimado(a) <span className="font-semibold text-white">{clientName}</span>, hemos reservado su sesión ({bookingService}) para el{" "}
                  <span className="text-[#B8935F] font-semibold">{bookingDate} a las {bookingTime}</span> ({bookingType === "MEET" ? "Google Meet" : "Presencial Reforma"}).
                </p>
                <div className="mt-6 flex justify-center gap-4">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm bg-[#B8935F] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0E1E33]"
                  >
                    Confirmar ahora por WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => setBookingConfirmed(false)}
                    className="rounded-sm border border-white/20 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300"
                  >
                    Nueva Reserva
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Nombre Completo / Razón Social
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Lic. Alejandro Fernández"
                      className="w-full rounded-sm border border-white/10 bg-[#0E1E33] px-4 py-2.5 text-xs text-white focus:border-[#B8935F] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Correo Electrónico Corporativo
                    </label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="alejandro@holding.mx"
                      className="w-full rounded-sm border border-white/10 bg-[#0E1E33] px-4 py-2.5 text-xs text-white focus:border-[#B8935F] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Teléfono / WhatsApp de Contacto
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+52 55 1234 5678"
                      className="w-full rounded-sm border border-white/10 bg-[#0E1E33] px-4 py-2.5 text-xs text-white focus:border-[#B8935F] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Servicio Requerido
                    </label>
                    <select
                      value={bookingService}
                      onChange={(e) => setBookingService(e.target.value)}
                      className="w-full rounded-sm border border-white/10 bg-[#0E1E33] px-4 py-2.5 text-xs text-white focus:border-[#B8935F] focus:outline-none"
                    >
                      <option>Diagnóstico Fiscal de Alta Riqueza / PyME</option>
                      <option>Regularización de Ejercicios Anteriores</option>
                      <option>Contabilidad Mensual y Nóminas</option>
                      <option>Planeación Estratégica RESICO</option>
                      <option>Defensa / Aclaración ante Notificación SAT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Fecha de Asesoría
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-sm border border-white/10 bg-[#0E1E33] px-4 py-2 text-xs text-white focus:border-[#B8935F] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Horario Disponible
                    </label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full rounded-sm border border-white/10 bg-[#0E1E33] px-4 py-2 text-xs text-white focus:border-[#B8935F] focus:outline-none"
                    >
                      <option>10:00 AM</option>
                      <option>11:00 AM</option>
                      <option>01:00 PM</option>
                      <option>04:00 PM</option>
                      <option>06:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Modalidad
                    </label>
                    <select
                      value={bookingType}
                      onChange={(e) => setBookingType(e.target.value as BookingType)}
                      className="w-full rounded-sm border border-white/10 bg-[#0E1E33] px-4 py-2 text-xs text-white focus:border-[#B8935F] focus:outline-none"
                    >
                      <option value="MEET">Videollamada Google Meet</option>
                      <option value="PRESENCIAL">Presencial Torre Reforma (CDMX)</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-sm border border-white/10 bg-[#0E1E33] p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <div className="text-xs text-slate-400">Honorarios de la Sesión de Diagnóstico (45 min):</div>
                    <div className="text-xl font-bold font-mono text-white">$1,500 MXN + IVA</div>
                    <div className="text-[11px] text-emerald-400">
                      * El 100% del honorario se abona a su primer mes si contrata una póliza contable.
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto rounded-sm bg-[#B8935F] px-8 py-3 text-xs font-bold uppercase tracking-wider text-[#0E1E33] shadow-lg hover:bg-[#c9a773]"
                  >
                    Confirmar & Proceder al Pago Seguro
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* PORTAL DEL CLIENTE (Demostración SaaS Privado) */}
      <section id="portal" className="scroll-mt-24 border-b border-white/10 bg-[#0B1830] py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#B8935F]">
              Ecosistema Operativo Privado
            </span>
            <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">
              Portal del Cliente · Bóveda de Documentos
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Cada cliente cuenta con un entorno cifrado para cargar sus CFDI y consultar el estatus de sus obligaciones.
            </p>
          </div>

          <div className="mt-10 rounded-sm border border-white/10 bg-[#12233B] p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex gap-4 text-xs font-bold uppercase">
                <button
                  type="button"
                  onClick={() => setPortalTab("resumen")}
                  className={`pb-2 ${portalTab === "resumen" ? "border-b-2 border-[#B8935F] text-[#B8935F]" : "text-slate-400"}`}
                >
                  Expediente Fiscal
                </button>
                <button
                  type="button"
                  onClick={() => setPortalTab("documentos")}
                  className={`pb-2 ${portalTab === "documentos" ? "border-b-2 border-[#B8935F] text-[#B8935F]" : "text-slate-400"}`}
                >
                  Bóveda de Documentos ({mockFiles.length})
                </button>
              </div>

              {/* Input Carga de Archivos */}
              <label className="cursor-pointer rounded-sm bg-[#B8935F] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0E1E33] hover:bg-[#c9a773]">
                <span>+ Cargar Factura XML / PDF</span>
                <input
                  type="file"
                  accept=".xml,.pdf"
                  onChange={handleMockUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadSuccess && (
              <div className="mt-4 rounded bg-emerald-500/20 p-3 text-xs text-emerald-300 border border-emerald-500/30">
                ✓ Archivo procesado y almacenado correctamente en la bóveda cifrada.
              </div>
            )}

            {/* Contenido Bóveda */}
            <div className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2.5">Nombre del Documento</th>
                      <th className="py-2.5">Tipo</th>
                      <th className="py-2.5">Tamaño</th>
                      <th className="py-2.5">Fecha</th>
                      <th className="py-2.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {mockFiles.map((doc, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="py-3 text-white font-medium flex items-center gap-2">
                          <span className="text-[#B8935F]">📄</span>
                          <span>{doc.name}</span>
                        </td>
                        <td className="py-3 text-slate-300">{doc.type}</td>
                        <td className="py-3 text-slate-400">{doc.size}</td>
                        <td className="py-3 text-slate-400">{doc.date}</td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => alert(`Descargando copia de ${doc.name}`)}
                            className="rounded border border-white/10 px-2 py-1 text-[11px] text-[#B8935F] hover:bg-[#B8935F] hover:text-[#0E1E33]"
                          >
                            Descargar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#081220] py-12 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="font-serif text-base font-bold text-white block">{firm.name}</span>
            <p className="text-slate-400 mt-1">{firm.location} · Tel: {firm.phone}</p>
          </div>
          <div className="flex gap-6">
            <a href="#inicio" className="hover:text-white">Inicio</a>
            <a href="#calculadoras" className="hover:text-white">Calculadoras</a>
            <a href="#asistente" className="hover:text-white">Asistente Fiscal</a>
            <a href="#agendamiento" className="hover:text-white">Agendar</a>
            <a href="/accountant" className="text-[#B8935F] hover:underline">Acceso Interno</a>
          </div>
          <div>
            © {new Date().getFullYear()} {firm.name}. Cumplimiento tributario con secreto profesional.
          </div>
        </div>
      </footer>

      {/* Floating CTA Buttons */}
      <aside aria-label="Acciones Rápidas" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <a
          href="#inicio"
          aria-label="Volver al inicio"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#12233B] text-[#B8935F] shadow-xl border border-[#B8935F]/40 transition-all hover:bg-[#B8935F] hover:text-[#0E1E33] text-sm font-bold"
          title="Volver arriba"
        >
          ↑
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-2xl transition-all hover:bg-emerald-500 hover:scale-105 ring-2 ring-white/20"
        >
          <span className="text-base">💬</span>
          <span>WhatsApp Contador</span>
        </a>
      </aside>
    </div>
  );
}
