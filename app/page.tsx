"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  calculateInvoice,
  calculatePayroll,
  calculateLoanAmortization,
  calculateFinancialRatios,
  InvoiceCalculationResult,
  PayrollResult,
  AmortizationRow,
} from "@/lib/tax-engine";
import { parseCFDIXml, ParsedCFDI } from "@/lib/cfdi-parser";

const firm = {
  name: "Vázquez & Asociados",
  subname: "Firma Contable & Fiscal",
  counterName: "Mtro. Alejandro Vázquez, CPC",
  credentials: "CPC · Cédula Profesional 8492019 · Maestría en Derecho Fiscal",
  whatsappNumber: "525512345678",
  email: "contacto@vazquezcontadores.mx",
  phone: "+52 (55) 5482-9000",
  location: "Torre Reforma 483, CDMX",
};

const initialNews = [
  {
    id: "1",
    source: "SAT · Resolución Miscelánea",
    date: "Septiembre 2026",
    title: "Precisiones de permanencia en RESICO",
    summary:
      "Nuevos plazos de 30 días hábiles para regularizar omisiones sin expulsión automática al Régimen General.",
    impact: "Personas físicas con ingresos hasta $3.5 MDP.",
  },
  {
    id: "2",
    source: "Diario Oficial de la Federación",
    date: "Septiembre 2026",
    title: "Deducción de infraestructura tecnológica",
    summary:
      "Porcentaje de depreciación acelerada hasta del 50% en el primer ejercicio para software e infraestructura digital.",
    impact: "PyMEs y empresas de servicios profesionales.",
  },
  {
    id: "3",
    source: "Criterio No Vinculativo SAT",
    date: "Septiembre 2026",
    title: "Conciliación mensual de retenciones de IVA",
    summary:
      "Auditorías automáticas sobre retenciones de dos terceras partes entre CFDI emitidos y declaraciones presentadas.",
    impact: "Personas morales que contratan profesionistas.",
  },
];

type CalcTab = "facturacion" | "nomina" | "amortizacion" | "ratios";

// Datos de demostración de facturas para la Bóveda / Parser
const initialInvoices: ParsedCFDI[] = [
  {
    uuid: "4A8B2C10-9E3F-4D21-884A-91C0DE21034A",
    serie: "A",
    folio: "1082",
    fecha: "2026-09-18T14:32:00",
    emisorRfc: "VAZ840912K89",
    emisorNombre: "Vázquez Consultoría Fiscal S.C.",
    receptorRfc: "TEC190820NA3",
    receptorNombre: "Tecnología y Sistemas México S.A. de C.V.",
    tipoDeComprobante: "Ingreso",
    subtotal: 45000,
    ivaTrasladado: 7200,
    ivaRetenido: 4800,
    total: 47400,
    moneda: "MXN",
    conceptosCount: 1,
  },
  {
    uuid: "9F1E2A3B-8C7D-4F5E-90AB-123456789ABC",
    serie: "F",
    folio: "450",
    fecha: "2026-09-12T10:15:00",
    emisorRfc: "DIG180315PL2",
    emisorNombre: "Digital Cloud Services S. de R.L.",
    receptorRfc: "VAZ840912K89",
    receptorNombre: "Vázquez Consultoría Fiscal S.C.",
    tipoDeComprobante: "Ingreso",
    subtotal: 12500,
    ivaTrasladado: 2000,
    total: 14500,
    moneda: "MXN",
    conceptosCount: 2,
  },
];

export default function HomePage() {
  // Calculadora
  const [calcTab, setCalcTab] = useState<CalcTab>("facturacion");
  const [subtotalInput, setSubtotalInput] = useState<number>(50000);
  const [regime, setRegime] = useState<"RESICO" | "HONORARIOS_GENERAL">("RESICO");
  const [clientType, setClientType] = useState<"PERSONA_MORAL" | "PERSONA_FISICA">("PERSONA_MORAL");
  const [grossSalaryInput, setGrossSalaryInput] = useState<number>(32000);
  const [loanPrincipal, setLoanPrincipal] = useState<number>(200000);
  const [loanRate, setLoanRate] = useState<number>(14);
  const [loanMonths, setLoanMonths] = useState<number>(24);
  const [currentAssets, setCurrentAssets] = useState<number>(600000);
  const [currentLiabilities, setCurrentLiabilities] = useState<number>(250000);
  const [inventory, setInventory] = useState<number>(100000);
  const [totalDebt, setTotalDebt] = useState<number>(350000);
  const [totalEquity, setTotalEquity] = useState<number>(800000);
  const [netIncome, setNetIncome] = useState<number>(180000);
  const [totalRevenue, setTotalRevenue] = useState<number>(1100000);

  // Módulo de Facturas CFDI (Fase 1 - Paso a paso)
  const [invoices, setInvoices] = useState<ParsedCFDI[]>(initialInvoices);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Asistente Virtual
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "bot" | "user"; text: string; action?: string }>
  >([
    {
      sender: "bot",
      text: "Bienvenido. ¿Qué perfil tributario desea consultar hoy (RESICO, Persona Moral, o regularización de CFDI)?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Agendamiento
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [bookingDate, setBookingDate] = useState("2026-09-28");
  const [bookingTime, setBookingTime] = useState("11:00 AM");
  const [bookingService, setBookingService] = useState("Diagnóstico Fiscal Estratégico");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Cálculos
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

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(val);

  // Manejador del asistente
  const handleUserChat = (text: string) => {
    const updated = [...chatMessages, { sender: "user" as const, text }];
    setChatMessages(updated);
    setChatInput("");

    let reply = "";
    let actionBtn = "";
    const lower = text.toLowerCase();

    if (lower.includes("resico") || lower.includes("freelance") || lower.includes("honorarios")) {
      reply =
        "En RESICO tributa entre el 1% y el 2.5% de ISR sobre ingresos efectivamente cobrados (hasta $3.5 MDP anuales). Podemos estructurar sus CFDI para optimizar retenciones.";
      actionBtn = "Agendar Diagnóstico";
    } else if (lower.includes("empresa") || lower.includes("moral") || lower.includes("pyme")) {
      reply =
        "Para personas morales nos enfocamos en blindar deducciones, nóminas timbradas CFDI 4.0 y mantener la Opinión 32-D Positiva sin observaciones.";
      actionBtn = "Solicitar Propuesta";
    } else if (lower.includes("sat") || lower.includes("firma") || lower.includes("xml")) {
      reply =
        "Nuestra plataforma soporta la lectura directa de CFDI 4.0 vía XML, y estamos preparando la sincronización con el Web Service del SAT mediante e.firma cifrada.";
      actionBtn = "Ver Módulo CFDI";
    } else {
      reply =
        "Cada caso fiscal requiere una revisión individual de sus CFDI y situación en el padrón. Podemos agendar una consulta privada o atenderle por WhatsApp.";
      actionBtn = "Agendar Asesoría";
    }

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { sender: "bot" as const, text: reply, action: actionBtn }]);
    }, 350);
  };

  // Procesar archivos XML reales subidos
  const processXmlFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const xmlFiles = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".xml"));

    if (xmlFiles.length === 0) {
      setUploadStatus("Por favor sube archivos con extensión .xml (CFDI del SAT).");
      setTimeout(() => setUploadStatus(null), 4000);
      return;
    }

    let parsedCount = 0;
    xmlFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          try {
            const parsed = parseCFDIXml(content);
            setInvoices((prev) => [parsed, ...prev.filter((i) => i.uuid !== parsed.uuid)]);
            parsedCount++;
            setUploadStatus(`Se procesaron ${parsedCount} factura(s) XML con éxito.`);
            setTimeout(() => setUploadStatus(null), 5000);
          } catch {
            setUploadStatus("Error al interpretar el XML. Asegúrate de que sea un CFDI válido.");
          }
        }
      };
      reader.readAsText(file);
    });
  };

  const whatsappUrl = `https://wa.me/${firm.whatsappNumber}?text=${encodeURIComponent(
    "Hola Lic. Vázquez, visité su plataforma y deseo agendar una sesión de asesoría fiscal."
  )}`;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-zinc-300 antialiased selection:bg-[#C5A880]/20 selection:text-zinc-100">
      {/* Barra de navegación minimalista */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0C10]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded border border-[#C5A880]/40 bg-[#C5A880]/10 font-mono text-xs font-semibold text-[#C5A880]">
              VA
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-100">{firm.name}</span>
              <span className="text-[10px] text-zinc-500 tracking-wider uppercase">
                {firm.subname}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400">
            <a href="#facturas-sat" className="transition-colors hover:text-zinc-100">
              Facturas & SAT
            </a>
            <a href="#calculadoras" className="transition-colors hover:text-zinc-100">
              Simuladores
            </a>
            <a href="#asistente" className="transition-colors hover:text-zinc-100">
              Asistente
            </a>
            <a href="#noticias" className="transition-colors hover:text-zinc-100">
              Actualizaciones
            </a>
            <a href="#agendamiento" className="transition-colors hover:text-zinc-100">
              Contacto
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Acceso
            </Link>
            <a
              href="#agendamiento"
              className="rounded-full border border-white/[0.12] bg-zinc-900/90 px-3.5 py-1.5 text-xs font-medium text-zinc-100 transition-all hover:border-[#C5A880]/60 hover:bg-[#C5A880]/10"
            >
              Agendar Cita
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section Minimalista */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Consultoría Fiscal & Contable Certificada</span>
          </div>

          <h1 className="mt-3 text-4xl font-normal tracking-tight text-zinc-100 sm:text-5xl md:text-6xl">
            Precisión contable con criterio humano.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 leading-relaxed sm:text-lg">
            Acompañamiento fiscal estratégico para personas físicas, freelancers y empresas en
            expansión. Simplificamos tus obligaciones ante el SAT con rigor y transparencia.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#facturas-sat"
              className="rounded-full bg-zinc-100 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-white hover:shadow-sm"
            >
              Explorar Módulo CFDI / SAT
            </a>
            <a
              href="#calculadoras"
              className="rounded-full border border-white/[0.12] bg-zinc-900/80 px-5 py-2.5 text-xs font-medium text-zinc-300 transition-all hover:border-white/[0.25] hover:text-white"
            >
              Simulador de Impuestos
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-5 py-2.5 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/10"
            >
              WhatsApp Directo
            </a>
          </div>

          {/* Métricas clave limpias */}
          <div className="mt-16 grid grid-cols-1 gap-6 border-t border-white/[0.06] pt-10 sm:grid-cols-3 text-left">
            <div>
              <div className="text-xs text-zinc-500">Garantía Tributaria</div>
              <div className="mt-1 text-base font-medium text-zinc-200">Opinión 32-D Positiva</div>
              <div className="text-xs text-zinc-500 mt-0.5">Monitoreo continuo de cumplimiento</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Tecnología Fiscal</div>
              <div className="mt-1 text-base font-medium text-zinc-200">CFDI 4.0 & SAT Sync</div>
              <div className="text-xs text-zinc-500 mt-0.5">Lectura de XMLs y conciliaciones</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Socio Titular</div>
              <div className="mt-1 text-base font-medium text-zinc-200">{firm.counterName}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{firm.credentials}</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN: MÓDULO CFDI & CONEXIÓN SAT (Fase 1 - Paso a paso) */}
      <section id="facturas-sat" className="border-t border-white/[0.06] py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#C5A880]">
                Paso a Paso · Fase 1
              </span>
              <h2 className="mt-1 text-2xl font-normal text-zinc-100 sm:text-3xl">
                Bóveda de Facturas & Conexión SAT
              </h2>
              <p className="mt-2 text-xs text-zinc-400 max-w-xl">
                Carga y lectura inmediata de archivos XML (CFDI 4.0/3.3). Sin intermediarios ni riesgo
                para tus contraseñas fiscales.
              </p>
            </div>

            {/* Estado del roadmap SAT */}
            <div className="flex flex-col items-start md:items-end gap-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Fase 1: Lector XML Activo</span>
              </div>
              <span className="text-[11px] text-zinc-500">
                Fase 2: Conexión Web Service e.firma (En desarrollo)
              </span>
            </div>
          </div>

          {/* Zona Drag & Drop para XML */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              processXmlFiles(e.dataTransfer.files);
            }}
            className={`relative rounded-xl border border-dashed p-8 text-center transition-all ${
              dragOver
                ? "border-[#C5A880] bg-[#C5A880]/5"
                : "border-white/[0.12] bg-zinc-900/30 hover:border-white/[0.2] hover:bg-zinc-900/50"
            }`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-900 text-zinc-400">
              📄
            </div>
            <h3 className="mt-4 text-sm font-medium text-zinc-200">
              Arrastra tus facturas XML aquí o selecciónalas
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Admite comprobantes emitidos y recibidos (CFDI 4.0 / 3.3). Los datos se extraen de forma segura en tu navegador.
            </p>

            <label className="mt-4 inline-block cursor-pointer rounded-lg border border-white/[0.1] bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800">
              Seleccionar archivos .XML
              <input
                type="file"
                multiple
                accept=".xml"
                onChange={(e) => processXmlFiles(e.target.files)}
                className="hidden"
              />
            </label>

            {uploadStatus && (
              <div className="mt-4 text-xs font-medium text-emerald-400 animate-fade-in">
                {uploadStatus}
              </div>
            )}
          </div>

          {/* Tabla de Facturas Procesadas */}
          <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/40">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <span className="text-xs font-medium text-zinc-300">
                Facturas Registradas ({invoices.length})
              </span>
              <span className="text-[11px] text-zinc-500">
                Total acumulado:{" "}
                <strong className="text-zinc-200 font-mono">
                  {formatMoney(invoices.reduce((sum, i) => sum + i.total, 0))}
                </strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.04] text-zinc-500 font-normal">
                    <th className="px-5 py-3 font-medium">Emisor / Receptor</th>
                    <th className="px-4 py-3 font-medium">UUID / Folio</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                    <th className="px-4 py-3 text-right font-medium">IVA</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {invoices.map((inv) => (
                    <tr key={inv.uuid} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-zinc-200">{inv.receptorNombre}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          De: {inv.emisorRfc} → A: {inv.receptorRfc}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                        <div>
                          {inv.serie ? `${inv.serie}-` : ""}
                          {inv.folio || "S/F"}
                        </div>
                        <div className="text-[10px] text-zinc-600 truncate max-w-[140px]">
                          {inv.uuid}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-400 whitespace-nowrap">
                        {inv.fecha.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-300">
                          {inv.tipoDeComprobante}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-300">
                        {formatMoney(inv.subtotal)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-400">
                        {formatMoney(inv.ivaTrasladado || 0)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-medium text-zinc-100">
                        {formatMoney(inv.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN: SIMULADOR FISCAL MINIMALISTA */}
      <section id="calculadoras" className="border-t border-white/[0.06] py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest text-[#C5A880]">
              Cálculo en Tiempo Real
            </span>
            <h2 className="mt-1 text-2xl font-normal text-zinc-100 sm:text-3xl">
              Simulador Fiscal & Financiero
            </h2>
            <p className="mt-2 text-xs text-zinc-400">
              Modelado fiscal según la legislación mexicana vigente (LISR, LIVA y CFF 2026).
            </p>

            {/* Pestañas minimalistas */}
            <div className="mt-6 inline-flex rounded-lg border border-white/[0.08] bg-zinc-900/60 p-1">
              {(
                [
                  { id: "facturacion", label: "Facturación (CFDI 4.0)" },
                  { id: "nomina", label: "Nómina (Bruto a Neto)" },
                  { id: "amortizacion", label: "Préstamos" },
                  { id: "ratios", label: "Razones Financieras" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCalcTab(tab.id)}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                    calcTab === tab.id
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: Facturación */}
          {calcTab === "facturacion" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6 space-y-5">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Subtotal del Servicio (MXN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-zinc-500">$</span>
                    <input
                      type="number"
                      value={subtotalInput}
                      onChange={(e) => setSubtotalInput(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 py-2 pl-7 pr-3 text-xs text-zinc-100 focus:border-[#C5A880] focus:outline-none"
                    />
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {[15000, 35000, 60000, 120000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSubtotalInput(val)}
                        className="rounded border border-white/[0.06] bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
                      >
                        ${val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Régimen Fiscal</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegime("RESICO")}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        regime === "RESICO"
                          ? "border-[#C5A880]/60 bg-[#C5A880]/5 text-zinc-100"
                          : "border-white/[0.06] bg-zinc-950/60 text-zinc-400 hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="text-xs font-medium">RESICO</div>
                      <div className="text-[10px] text-zinc-500">Tasa reducida 1% a 2.5%</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegime("HONORARIOS_GENERAL")}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        regime === "HONORARIOS_GENERAL"
                          ? "border-[#C5A880]/60 bg-[#C5A880]/5 text-zinc-100"
                          : "border-white/[0.06] bg-zinc-950/60 text-zinc-400 hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="text-xs font-medium">Régimen General</div>
                      <div className="text-[10px] text-zinc-500">Tarifa progresiva (hasta 35%)</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Tu Cliente</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setClientType("PERSONA_MORAL")}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        clientType === "PERSONA_MORAL"
                          ? "border-[#C5A880]/60 bg-[#C5A880]/5 text-zinc-100"
                          : "border-white/[0.06] bg-zinc-950/60 text-zinc-400 hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="text-xs font-medium">Persona Moral</div>
                      <div className="text-[10px] text-zinc-500">Aplica retenciones de ley</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientType("PERSONA_FISICA")}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        clientType === "PERSONA_FISICA"
                          ? "border-[#C5A880]/60 bg-[#C5A880]/5 text-zinc-100"
                          : "border-white/[0.06] bg-zinc-950/60 text-zinc-400 hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="text-xs font-medium">Persona Física</div>
                      <div className="text-[10px] text-zinc-500">Sin retención directa</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Resumen Facturación */}
              <div className="flex flex-col justify-between rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-zinc-400 border-b border-white/[0.06] pb-3">
                    Desglose Fiscal
                  </h3>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between text-zinc-300">
                      <span>Subtotal</span>
                      <span className="font-mono text-zinc-200">{formatMoney(invoiceResult.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>IVA Trasladado (16%)</span>
                      <span className="font-mono text-zinc-200">{formatMoney(invoiceResult.iva)}</span>
                    </div>

                    {invoiceResult.retainedIsr > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>(-) Retención ISR {regime === "RESICO" ? "(1.25%)" : "(10%)"}</span>
                        <span className="font-mono">-{formatMoney(invoiceResult.retainedIsr)}</span>
                      </div>
                    )}

                    {invoiceResult.retainedIva > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>(-) Retención IVA (10.6667%)</span>
                        <span className="font-mono">-{formatMoney(invoiceResult.retainedIva)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-lg border border-white/[0.08] bg-zinc-950/70 p-4">
                    <div className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      Neto a Cobrar en Banco
                    </div>
                    <div className="mt-1 font-mono text-2xl font-normal text-zinc-100">
                      {formatMoney(invoiceResult.netToReceive)}
                    </div>
                    <div className="mt-2 text-[11px] text-zinc-500">
                      Estimación ISR propio:{" "}
                      <span className="text-[#C5A880]">
                        {formatMoney(invoiceResult.directEstimatedIsr)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <a
                    href="#agendamiento"
                    className="block w-full rounded-lg bg-zinc-100 py-2.5 text-center text-xs font-medium text-zinc-950 hover:bg-white transition-colors"
                  >
                    Consultar Estrategia para mi Caso
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Nómina */}
          {calcTab === "nomina" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6 space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Salario Mensual Bruto (MXN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-zinc-500">$</span>
                    <input
                      type="number"
                      value={grossSalaryInput}
                      onChange={(e) => setGrossSalaryInput(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 py-2 pl-7 pr-3 text-xs text-zinc-100 focus:border-[#C5A880] focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Aplica las tarifas progresivas del Art. 96 LISR y las cuotas obreras al IMSS vigentes.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6 flex flex-col justify-between">
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span>Sueldo Bruto</span>
                    <span className="font-mono text-zinc-200">{formatMoney(payrollResult.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>(-) Retención ISR</span>
                    <span className="font-mono">-{formatMoney(payrollResult.isrRetained)}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>(-) Cuota IMSS Obrero</span>
                    <span className="font-mono">-{formatMoney(payrollResult.imssWorkerFee)}</span>
                  </div>

                  <div className="mt-4 rounded-lg border border-white/[0.08] bg-zinc-950/70 p-4">
                    <div className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      Sueldo Líquido Recibido
                    </div>
                    <div className="mt-1 font-mono text-2xl font-normal text-zinc-100">
                      {formatMoney(payrollResult.netSalary)}
                    </div>
                  </div>
                </div>

                <a
                  href="#agendamiento"
                  className="mt-6 block w-full rounded-lg bg-zinc-100 py-2.5 text-center text-xs font-medium text-zinc-950 hover:bg-white transition-colors"
                >
                  Asesoría en Nóminas y Cargas Patronales
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: Préstamos */}
          {calcTab === "amortizacion" && (
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Monto (Capital)</label>
                  <input
                    type="number"
                    value={loanPrincipal}
                    onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2 text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Tasa Anual (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={loanRate}
                    onChange={(e) => setLoanRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2 text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Plazo (Meses)</label>
                  <input
                    type="number"
                    value={loanMonths}
                    onChange={(e) => setLoanMonths(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2 text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-zinc-500">
                      <th className="py-2">Mes</th>
                      <th className="py-2">Pago Mensual</th>
                      <th className="py-2">Interés</th>
                      <th className="py-2">Capital</th>
                      <th className="py-2">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-mono">
                    {amortizationSchedule.slice(0, 6).map((row) => (
                      <tr key={row.period}>
                        <td className="py-2 text-zinc-300">{row.period}</td>
                        <td className="py-2 text-zinc-200">{formatMoney(row.payment)}</td>
                        <td className="py-2 text-rose-400">{formatMoney(row.interest)}</td>
                        <td className="py-2 text-emerald-400">{formatMoney(row.principal)}</td>
                        <td className="py-2 text-zinc-400">{formatMoney(row.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Razones Financieras */}
          {calcTab === "ratios" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-5 md:col-span-6 space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-zinc-400 border-b border-white/[0.06] pb-2">
                  Variables Financieras
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">Activo Circulante</label>
                    <input
                      type="number"
                      value={currentAssets}
                      onChange={(e) => setCurrentAssets(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">Pasivo a Corto Plazo</label>
                    <input
                      type="number"
                      value={currentLiabilities}
                      onChange={(e) => setCurrentLiabilities(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">Inventarios</label>
                    <input
                      type="number"
                      value={inventory}
                      onChange={(e) => setInventory(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">Deuda Total</label>
                    <input
                      type="number"
                      value={totalDebt}
                      onChange={(e) => setTotalDebt(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">Capital Contable</label>
                    <input
                      type="number"
                      value={totalEquity}
                      onChange={(e) => setTotalEquity(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">Ventas Totales</label>
                    <input
                      type="number"
                      value={totalRevenue}
                      onChange={(e) => setTotalRevenue(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-zinc-400 text-[11px] mb-1">Utilidad Neta</label>
                    <input
                      type="number"
                      value={netIncome}
                      onChange={(e) => setNetIncome(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-6">
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-zinc-500">Solvencia (Circulante)</div>
                    <div className="mt-1 font-mono text-xl text-zinc-100">
                      {financialRatios.currentRatio}x
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-2">Óptimo: &gt; 1.5</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-zinc-500">Prueba Ácida</div>
                    <div className="mt-1 font-mono text-xl text-zinc-100">
                      {financialRatios.quickRatio}x
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-2">Óptimo: &gt; 1.0</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-zinc-500">Apalancamiento</div>
                    <div className="mt-1 font-mono text-xl text-zinc-100">
                      {financialRatios.debtToEquity}x
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-2">Prudencial: &lt; 1.0</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-zinc-500">Margen Neto</div>
                    <div className="mt-1 font-mono text-xl text-[#C5A880]">
                      {financialRatios.netProfitMargin}%
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-2">Rentabilidad s/ ventas</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN: ASISTENTE DE DIAGNÓSTICO */}
      <section id="asistente" className="border-t border-white/[0.06] py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest text-[#C5A880]">
              Orientación Inmediata
            </span>
            <h2 className="mt-1 text-2xl font-normal text-zinc-100">
              Asistente Fiscal de Diagnóstico
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Resuelve dudas comunes sobre tu régimen y obligaciones sin costo.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 overflow-hidden shadow-sm">
            <div className="h-64 overflow-y-auto p-5 space-y-3 bg-zinc-950/40 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md rounded-lg p-3 leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-zinc-100 text-zinc-950 font-medium"
                        : "border border-white/[0.06] bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    {msg.text}
                    {msg.action && (
                      <div className="mt-2 pt-1.5 border-t border-white/[0.08]">
                        <a
                          href="#agendamiento"
                          className="text-[11px] text-[#C5A880] hover:underline"
                        >
                          → {msg.action}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Opciones rápidas */}
            <div className="flex flex-wrap gap-1.5 border-t border-white/[0.04] bg-zinc-900/80 px-4 py-2 text-[11px]">
              <span className="text-zinc-500 py-0.5">Consultar:</span>
              <button
                type="button"
                onClick={() => handleUserChat("Soy freelancer y quiero tributar en RESICO")}
                className="rounded border border-white/[0.06] bg-zinc-900 px-2 py-0.5 text-zinc-400 hover:text-zinc-200"
              >
                Freelance / RESICO
              </button>
              <button
                type="button"
                onClick={() => handleUserChat("Tengo una PyME y necesito auditoría y nóminas")}
                className="rounded border border-white/[0.06] bg-zinc-900 px-2 py-0.5 text-zinc-400 hover:text-zinc-200"
              >
                PyME / Nóminas
              </button>
              <button
                type="button"
                onClick={() => handleUserChat("¿Cómo sincronizar facturas con el SAT?")}
                className="rounded border border-white/[0.06] bg-zinc-900 px-2 py-0.5 text-zinc-400 hover:text-zinc-200"
              >
                Descarga SAT
              </button>
            </div>

            {/* Input de chat */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) handleUserChat(chatInput);
              }}
              className="flex border-t border-white/[0.06] p-3 gap-2 bg-zinc-950"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe tu consulta fiscal..."
                className="flex-1 rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 py-2 text-xs text-zinc-100 focus:border-[#C5A880] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-white"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* SECCIÓN: NOTICIAS & REFORMAS FISCALES */}
      <section id="noticias" className="border-t border-white/[0.06] py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10">
            <span className="text-xs uppercase tracking-widest text-[#C5A880]">
              Monitoreo Normativo
            </span>
            <h2 className="mt-1 text-2xl font-normal text-zinc-100">
              Criterios del SAT & Novedades DOF
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {initialNews.map((news) => (
              <div
                key={news.id}
                className="rounded-xl border border-white/[0.06] bg-zinc-900/30 p-5 flex flex-col justify-between hover:border-white/[0.12] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-2">
                    <span>{news.source}</span>
                    <span>{news.date}</span>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-100 mb-2">{news.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">{news.summary}</p>
                </div>
                <div className="text-[11px] text-zinc-500 border-t border-white/[0.04] pt-3">
                  <span className="text-zinc-400">Alcance:</span> {news.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN: AGENDAMIENTO */}
      <section id="agendamiento" className="border-t border-white/[0.06] py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest text-[#C5A880]">Agenda Privada</span>
            <h2 className="mt-1 text-2xl font-normal text-zinc-100">
              Sesión de Diagnóstico Fiscal
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Atención directa y confidencial por el Mtro. Alejandro Vázquez.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-6 md:p-8">
            {bookingConfirmed ? (
              <div className="text-center py-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xl mb-3">
                  ✓
                </div>
                <h3 className="text-lg font-medium text-zinc-100">Cita Registrada</h3>
                <p className="mt-2 text-xs text-zinc-400 max-w-md mx-auto">
                  Estimado(a) <strong className="text-zinc-200">{clientName}</strong>, se ha
                  programado su sesión para el{" "}
                  <strong className="text-zinc-200">
                    {bookingDate} a las {bookingTime}
                  </strong>
                  . Nos comunicaremos a <span className="text-zinc-200">{clientEmail}</span>.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-white"
                  >
                    Confirmar por WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => setBookingConfirmed(false)}
                    className="rounded-lg border border-white/[0.1] px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Nueva cita
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (clientName && clientEmail) setBookingConfirmed(true);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej. Sofía Carranza"
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-[#C5A880] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="sofia@empresa.mx"
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-[#C5A880] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Servicio</label>
                    <select
                      value={bookingService}
                      onChange={(e) => setBookingService(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-[#C5A880] focus:outline-none"
                    >
                      <option>Diagnóstico Fiscal</option>
                      <option>Regularización de Ejercicios</option>
                      <option>Contabilidad Mensual</option>
                      <option>Estrategia RESICO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-[#C5A880] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Hora</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-[#C5A880] focus:outline-none"
                    >
                      <option>10:00 AM</option>
                      <option>11:00 AM</option>
                      <option>01:00 PM</option>
                      <option>04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-zinc-100 py-3 text-xs font-medium text-zinc-950 hover:bg-white transition-colors"
                  >
                    Confirmar Agendamiento
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="border-t border-white/[0.06] py-10 text-xs text-zinc-500">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-300">{firm.name}</span>
            <span>·</span>
            <span>{firm.location}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="#facturas-sat" className="hover:text-zinc-300">
              CFDI
            </a>
            <a href="#calculadoras" className="hover:text-zinc-300">
              Simuladores
            </a>
            <Link href="/login" className="text-[#C5A880] hover:underline">
              Portal Interno
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
