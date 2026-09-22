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

const platformInfo = {
  name: "Vázquez & Asociados",
  softwareBrand: "Plataforma Contable Digital · SAT Sync Edition",
  subname: "Ecosistema Fiscal & Contable Automatizado",
  agencyName: "MA Digital Artisans",
  counterName: "Mtro. Alejandro Vázquez, CPC",
  credentials: "CPC · Cédula Profesional 8492019 · Especialista en Estrategia Fiscal",
  whatsappNumber: "524443211123", // WhatsApp oficial MA Digital Artisans
  displayPhone: "+52 (444) 321-1123",
  email: "madigitalartisans@gmail.com",
  social: {
    facebook: "https://www.facebook.com/share/1ErnvLwkj8/?mibextid=wwXIfr",
    instagram: "https://www.instagram.com/ma_digital_artisans?stkn=M2hwcTFndHV4YXE1&utm_source=qr",
    tiktok: "https://www.tiktok.com/@ma_digital_artisans?_r=1&_t=ZS-99xKbPOTGjt",
  },
  location: "San Luis Potosí / CDMX, México",
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

  // Módulo de Facturas CFDI
  const [invoices, setInvoices] = useState<ParsedCFDI[]>(initialInvoices);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Simulador de Conexión SAT en Vivo
  const [satTab, setSatTab] = useState<"conexion" | "boveda" | "auditoria">("conexion");
  const [satSyncing, setSatSyncing] = useState(false);
  const [satSyncSuccess, setSatSyncSuccess] = useState(false);

  // Asistente Virtual
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "bot" | "user"; text: string; action?: string }>
  >([
    {
      sender: "bot",
      text: "Bienvenido al ecosistema fiscal inteligente. ¿Deseas probar la extracción de facturas del SAT, consultar un régimen o conocer la arquitectura del software?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

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

    if (lower.includes("sat") || lower.includes("firma") || lower.includes("xml") || lower.includes("jalar") || lower.includes("descarga")) {
      reply =
        "Esta plataforma se integra directamente con el Web Service oficial de Descarga Masiva del SAT (mediante e.firma .key + .cer cifrada con AES-256) y con parser local de CFDI 4.0. Permite extraer hasta 200,000 registros y automatizar la contabilidad mensual sin intervención manual.";
      actionBtn = "Probar Conexión SAT";
    } else if (lower.includes("comprar") || lower.includes("inversion") || lower.includes("precio") || lower.includes("adquirir") || lower.includes("vender") || lower.includes("contacto") || lower.includes("redes") || lower.includes("whatsapp")) {
      reply =
        "Esta plataforma es desarrollada y comercializada por MA Digital Artisans. Para adquirir el código fuente, cotizaciones de marca blanca o demostraciones personalizadas, puedes escribirnos por WhatsApp al +52 444 321 1123, por correo a madigitalartisans@gmail.com o seguirnos en Instagram y TikTok (@ma_digital_artisans).";
      actionBtn = "Contactar por WhatsApp";
    } else if (lower.includes("resico") || lower.includes("freelance") || lower.includes("honorarios")) {
      reply =
        "Para personas físicas y freelancers en RESICO, la plataforma calcula automáticamente las tasas de ISR reducidas (1% al 2.5%) y concilia las retenciones de 1.25% aplicadas por personas morales.";
      actionBtn = "Ver Simulador Fiscal";
    } else {
      reply =
        "La plataforma está diseñada con tecnología de punta para optimizar la carga contable y fiscal. Puede probar las herramientas en vivo o solicitar una demostración privada.";
      actionBtn = "Solicitar Demostración";
    }

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { sender: "bot" as const, text: reply, action: actionBtn }]);
    }, 300);
  };

  // Simulación de conexión con el SAT
  const runSatSyncSimulation = () => {
    setSatSyncing(true);
    setSatSyncSuccess(false);
    setTimeout(() => {
      setSatSyncing(false);
      setSatSyncSuccess(true);
      // Añadir una factura simulada traída del SAT
      const newSatInvoice: ParsedCFDI = {
        uuid: "E7C4A190-2B3D-48E1-992C-87F9B1E0381C",
        serie: "SAT",
        folio: "2026-09",
        fecha: new Date().toISOString(),
        emisorRfc: "SAT970701NN3",
        emisorNombre: "Servicio de Administración Tributaria",
        receptorRfc: "VAZ840912K89",
        receptorNombre: "Vázquez Consultoría Fiscal S.C.",
        tipoDeComprobante: "Ingreso",
        subtotal: 18500,
        ivaTrasladado: 2960,
        total: 21460,
        moneda: "MXN",
        conceptosCount: 1,
      };
      setInvoices((prev) => [newSatInvoice, ...prev.filter((i) => i.uuid !== newSatInvoice.uuid)]);
    }, 1800);
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
            setUploadStatus(`Se extrajeron ${parsedCount} factura(s) XML en tiempo real.`);
            setTimeout(() => setUploadStatus(null), 5000);
          } catch {
            setUploadStatus("Error al interpretar el archivo XML.");
          }
        }
      };
      reader.readAsText(file);
    });
  };

  const whatsappInversionUrl = `https://wa.me/${platformInfo.whatsappNumber}?text=${encodeURIComponent(
    "Hola MA Digital Artisans, me interesa conocer más sobre la plataforma contable con extracción del SAT para adquirirla o solicitar una demo."
  )}`;

  const emailInversionUrl = `mailto:${platformInfo.email}?subject=${encodeURIComponent(
    "Interés en adquirir la Plataforma Contable (SAT Sync Edition)"
  )}&body=${encodeURIComponent(
    "Hola equipo de MA Digital Artisans,\n\nMe interesa conocer los detalles y costos para adquirir o implementar la plataforma contable con conexión al SAT.\n\nNombre:\nTeléfono:\nEmpresa / Despacho:\n"
  )}`;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-zinc-300 antialiased selection:bg-[#C5A880]/20 selection:text-zinc-100">
      {/* Top Banner de Alto Valor / Oportunidad de Inversión */}
      <div className="border-b border-white/[0.06] bg-zinc-950/90 px-4 py-2 text-center text-[11px] text-zinc-400">
        <span className="font-medium text-[#C5A880]">Solución Tecnológica Llave en Mano:</span> Conexión
        oficial con SAT (e.firma), boveda CFDI 4.0 y portal de clientes para despachos contables.{" "}
        <a
          href={whatsappInversionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-200 underline hover:text-white ml-1 font-medium"
        >
          Consultar Adquisición →
        </a>
      </div>

      {/* Barra de navegación minimalista */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0C10]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded border border-[#C5A880]/40 bg-[#C5A880]/10 font-mono text-xs font-semibold text-[#C5A880]">
              VA
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-100">{platformInfo.name}</span>
              <span className="text-[10px] text-zinc-500 tracking-wider uppercase">
                {platformInfo.subname}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400">
            <a href="#sat-sync" className="transition-colors hover:text-zinc-100 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Conexión SAT</span>
            </a>
            <a href="#por-que-invertir" className="transition-colors hover:text-zinc-100">
              Valor & Retorno
            </a>
            <a href="#calculadoras" className="transition-colors hover:text-zinc-100">
              Simuladores
            </a>
            <a href="#asistente" className="transition-colors hover:text-zinc-100">
              Asistente IA
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
              Acceso Demo
            </Link>
            <a
              href={whatsappInversionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#C5A880]/40 bg-[#C5A880]/10 px-3.5 py-1.5 text-xs font-medium text-[#C5A880] transition-all hover:bg-[#C5A880]/20 hover:text-zinc-100"
            >
              Adquirir Plataforma
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section: Enfoque de Alto Valor e Inversión */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Automatización Fiscal · Conexión Directa con el SAT 2026</span>
          </div>

          <h1 className="mt-3 text-4xl font-normal tracking-tight text-zinc-100 sm:text-5xl md:text-6xl leading-tight">
            La plataforma contable que{" "}
            <span className="text-[#C5A880] underline decoration-white/20 underline-offset-8">
              extrae los datos del SAT
            </span>{" "}
            de forma automática.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 leading-relaxed sm:text-lg">
            Sincronización masiva de facturas CFDI 4.0 mediante e.firma, conciliación de impuestos en tiempo
            real y portal autoservicio para clientes. La solución tecnológica que reemplaza cientos de horas de trabajo manual.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#sat-sync"
              className="rounded-full bg-zinc-100 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-white hover:shadow-sm"
            >
              Ver Demostración SAT en Vivo
            </a>
            <a
              href="#por-que-invertir"
              className="rounded-full border border-white/[0.12] bg-zinc-900/80 px-5 py-2.5 text-xs font-medium text-zinc-300 transition-all hover:border-white/[0.25] hover:text-white"
            >
              ¿Por qué es una Gran Inversión?
            </a>
            <a
              href={whatsappInversionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-5 py-2.5 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/10"
            >
              Hablar con el Creador (WhatsApp)
            </a>
          </div>

          {/* Métricas clave de Alto Retorno (ROI) */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-10 sm:grid-cols-4 text-left">
            <div className="rounded-lg border border-white/[0.04] bg-zinc-900/20 p-4">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Ahorro de Tiempo</div>
              <div className="mt-1 text-xl font-normal text-zinc-100 font-mono">-85%</div>
              <div className="text-xs text-zinc-500 mt-0.5">En descargas y conciliaciones manuales</div>
            </div>
            <div className="rounded-lg border border-white/[0.04] bg-zinc-900/20 p-4">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Web Service SAT</div>
              <div className="mt-1 text-xl font-normal text-zinc-100 font-mono">200k CFDI</div>
              <div className="text-xs text-zinc-500 mt-0.5">Capacidad de descarga masiva por paquete</div>
            </div>
            <div className="rounded-lg border border-white/[0.04] bg-zinc-900/20 p-4">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Modelo Operativo</div>
              <div className="mt-1 text-xl font-normal text-[#C5A880] font-mono">Marca Blanca</div>
              <div className="text-xs text-zinc-500 mt-0.5">Listo para operar como despacho o SaaS</div>
            </div>
            <div className="rounded-lg border border-white/[0.04] bg-zinc-900/20 p-4">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Código & Arquitectura</div>
              <div className="mt-1 text-xl font-normal text-zinc-100 font-mono">Next.js 14</div>
              <div className="text-xs text-zinc-500 mt-0.5">TypeScript, Prisma ORM, Zero-deuda técnica</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN ESTRELLA: DEMOSTRACIÓN DE CONEXIÓN SAT EN VIVO */}
      <section id="sat-sync" className="border-t border-white/[0.06] py-16 md:py-24 bg-zinc-950/40">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#C5A880]">
                Funcionalidad Clave · Demostración Interactiva
              </span>
              <h2 className="mt-1 text-2xl font-normal text-zinc-100 sm:text-3xl">
                Extracción Automatizada del SAT
              </h2>
              <p className="mt-2 text-xs text-zinc-400 max-w-2xl leading-relaxed">
                Olvídate de ingresar al portal del SAT todos los días con captchas molestos. La plataforma se comunica
                con el servicio oficial de Descarga Masiva del SAT para jalar facturas emitidas y recibidas al instante.
              </p>
            </div>

            {/* Pestañas del módulo SAT */}
            <div className="inline-flex rounded-lg border border-white/[0.08] bg-zinc-900/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setSatTab("conexion")}
                className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                  satTab === "conexion"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                1. Conexión e.firma / SAT
              </button>
              <button
                type="button"
                onClick={() => setSatTab("boveda")}
                className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                  satTab === "boveda"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                2. Lector CFDI XML
              </button>
              <button
                type="button"
                onClick={() => setSatTab("auditoria")}
                className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                  satTab === "auditoria"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                3. Auditoría & 32-D
              </button>
            </div>
          </div>

          {/* TAB 1: Conexión e.firma / SAT */}
          {satTab === "conexion" && (
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-[11px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Protocolo Web Service Oficial (SOAP / WSDL)</span>
                  </div>

                  <h3 className="text-lg font-medium text-zinc-100">
                    ¿Cómo jala los datos del SAT con la e.firma?
                  </h3>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    La plataforma utiliza el estándar criptográfico <strong>XMLDSig con RSA-SHA256</strong>.
                    Con el certificado (<code className="text-zinc-300">.cer</code>) y la llave privada (<code className="text-zinc-300">.key</code>) de la e.firma,
                    el sistema solicita un token de autenticación directo al servidor del SAT y descarga en lotes todos los comprobantes timbrados.
                  </p>

                  <div className="space-y-2.5 text-xs text-zinc-400 pt-2">
                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-mono font-bold">01</span>
                      <span><strong>Autenticación Segura:</strong> Cifrado AES-256-GCM para llaves privadas. Cero riesgo de filtración.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-mono font-bold">02</span>
                      <span><strong>Descarga Masiva Desatendida:</strong> Hasta 2,000 XMLs y 200,000 registros de metadatos por solicitud.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-mono font-bold">03</span>
                      <span><strong>Conciliación Automática:</strong> Detección instantánea de facturas vigentes vs. canceladas en el padrón del SAT.</span>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={satSyncing}
                      onClick={runSatSyncSimulation}
                      className="rounded-lg bg-zinc-100 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {satSyncing ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Conectando con servidores del SAT...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Probar Simulación de Sincronización SAT</span>
                        </>
                      )}
                    </button>

                    {satSyncSuccess && (
                      <span className="text-xs text-emerald-400 animate-fade-in">
                        ✓ ¡Sincronizado! Se descargó nuevo paquete XML con éxito.
                      </span>
                    )}
                  </div>
                </div>

                {/* Tarjeta Visual de Estado SAT */}
                <div className="md:col-span-5 rounded-xl border border-white/[0.08] bg-zinc-950/80 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <span className="text-xs font-mono text-zinc-400">SAT_NODE_SERVICE</span>
                    <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 border border-emerald-500/20 font-mono">
                      ONLINE
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Endpoint SAT:</span>
                      <span className="font-mono text-zinc-200">Autenticacion.svc</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Método de Firma:</span>
                      <span className="font-mono text-zinc-200">XMLDSig RSA-SHA256</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Soporte de Credenciales:</span>
                      <span className="font-mono text-zinc-200">e.firma (.key/.cer) & CIEC</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Formato de Salida:</span>
                      <span className="font-mono text-[#C5A880]">CFDI 4.0 (XML + JSON)</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/[0.04] bg-zinc-900/60 p-3 text-[11px] text-zinc-400">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-300 font-medium">Estado de la Cola:</span>
                      <span className="text-emerald-400">Activo (Cron 24/7)</span>
                    </div>
                    <p className="text-zinc-500 text-[10px]">
                      Monitorea las peticiones asíncronas en segundo plano para procesar miles de facturas sin bloquear el sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Lector CFDI XML (Drag & Drop) */}
          {satTab === "boveda" && (
            <div className="space-y-6">
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
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-900 text-zinc-400">
                  📄
                </div>
                <h3 className="mt-3 text-sm font-medium text-zinc-200">
                  Arrastra aquí facturas XML reales del SAT
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  El parser extrae RFC, emisor, receptor, impuestos y montos al instante en tu navegador.
                </p>

                <label className="mt-3 inline-block cursor-pointer rounded-lg border border-white/[0.1] bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800">
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
                  <div className="mt-3 text-xs font-medium text-emerald-400">
                    {uploadStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Auditoría & 32-D */}
          {satTab === "auditoria" && (
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-lg border border-white/[0.06] bg-zinc-950/60 p-4">
                <div className="text-[11px] text-zinc-500">Opinión de Cumplimiento (Art. 32-D)</div>
                <div className="mt-1 text-lg font-medium text-emerald-400">Positiva ✓</div>
                <p className="mt-1 text-zinc-500 text-[11px]">
                  Sin créditos fiscales firmes ni omisiones de declaraciones mensuales.
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-zinc-950/60 p-4">
                <div className="text-[11px] text-zinc-500">Lista Negra SAT (Art. 69-B EFOS)</div>
                <div className="mt-1 text-lg font-medium text-emerald-400">0 Proveedores de Riesgo</div>
                <p className="mt-1 text-zinc-500 text-[11px]">
                  Cruce automático contra el catálogo de empresas facturadoras de operaciones simuladas.
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-zinc-950/60 p-4">
                <div className="text-[11px] text-zinc-500">Conciliación IVA vs. Banco</div>
                <div className="mt-1 text-lg font-medium text-zinc-100">100% Cuadrado</div>
                <p className="mt-1 text-zinc-500 text-[11px]">
                  Previene requerimientos automáticos por discrepancia de retenciones.
                </p>
              </div>
            </div>
          )}

          {/* Tabla de Facturas Procesadas / Sincronizadas */}
          <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/40">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <span className="text-xs font-medium text-zinc-300">
                Facturas Sincronizadas ({invoices.length})
              </span>
              <span className="text-[11px] text-zinc-500">
                Total en Bóveda:{" "}
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

      {/* SECCIÓN PITCH DE INVERSIÓN: ¿POR QUÉ ES UNA GRAN INVERSIÓN? */}
      <section id="por-que-invertir" className="border-t border-white/[0.06] py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-[#C5A880]">
              Tesis de Negocio & Retorno
            </span>
            <h2 className="mt-2 text-3xl font-normal text-zinc-100 sm:text-4xl">
              ¿Por qué esta plataforma es una inversión de alto valor?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              La digitalización fiscal en México no es una opción, es una obligación legal. Esta plataforma resuelve los 4
              mayores cuellos de botella para contadores y empresarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/30 p-6 flex flex-col justify-between">
              <div>
                <span className="text-2xl font-mono text-[#C5A880]">01</span>
                <h3 className="mt-3 text-base font-medium text-zinc-100">Mercado Masivo en México</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Más de 5 millones de PyMEs y 1 millón de profesionistas obligados a timbrar y conciliar CFDI 4.0 mes a mes ante el SAT.
                </p>
              </div>
              <div className="mt-6 text-[11px] text-zinc-500 border-t border-white/[0.04] pt-3">
                Potencial de mercado &gt; $500M USD
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/30 p-6 flex flex-col justify-between">
              <div>
                <span className="text-2xl font-mono text-emerald-400">02</span>
                <h3 className="mt-3 text-base font-medium text-zinc-100">Automatización Real SAT</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Elimina el trabajo manual de descargar facturas una por una. La conexión SOAP con e.firma jala miles de facturas en segundo plano.
                </p>
              </div>
              <div className="mt-6 text-[11px] text-zinc-500 border-t border-white/[0.04] pt-3">
                Ahorra 35+ horas hombre al mes
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/30 p-6 flex flex-col justify-between">
              <div>
                <span className="text-2xl font-mono text-zinc-100">03</span>
                <h3 className="mt-3 text-base font-medium text-zinc-100">Modelo SaaS o Despacho</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Permite a un despacho cobrar un 40% más por iguala contable al ofrecer portal web, o comercializarse como software bajo suscripción (MRR).
                </p>
              </div>
              <div className="mt-6 text-[11px] text-zinc-500 border-t border-white/[0.04] pt-3">
                Ingresos recurrentes predecibles
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/30 p-6 flex flex-col justify-between">
              <div>
                <span className="text-2xl font-mono text-zinc-400">04</span>
                <h3 className="mt-3 text-base font-medium text-zinc-100">Código Propio & Escalable</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Construido con el stack más demandado del mundo: Next.js 14, TypeScript, Tailwind y Prisma ORM. Cero dependencias propietarias que te aten.
                </p>
              </div>
              <div className="mt-6 text-[11px] text-zinc-500 border-t border-white/[0.04] pt-3">
                100% Transferible y Auditable
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN: SIMULADOR FISCAL MINIMALISTA */}
      <section id="calculadoras" className="border-t border-white/[0.06] py-16 md:py-24 bg-zinc-950/20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest text-[#C5A880]">
              Motor de Cálculo Incorporado
            </span>
            <h2 className="mt-1 text-2xl font-normal text-zinc-100 sm:text-3xl">
              Simuladores Fiscales & Financieros
            </h2>
            <p className="mt-2 text-xs text-zinc-400">
              Algoritmos fiscales de precisión según la LISR, LIVA y tarifas progresivas 2026.
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
                    Consultar Implementación de Motor Fiscal
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
              Inteligencia Artificial Fiscal
            </span>
            <h2 className="mt-1 text-2xl font-normal text-zinc-100">
              Asistente de Diagnóstico Fiscal
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Respuestas inmediatas sobre regímenes, CFDI y automatización contable.
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
                          href={msg.action.includes("Adquisición") ? whatsappInversionUrl : "#sat-sync"}
                          className="text-[11px] text-[#C5A880] hover:underline font-medium"
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
                onClick={() => handleUserChat("¿Cómo se pueden jalar datos del SAT con la e.firma?")}
                className="rounded border border-white/[0.06] bg-zinc-900 px-2 py-0.5 text-zinc-300 hover:text-white"
              >
                Extracción SAT con e.firma
              </button>
              <button
                type="button"
                onClick={() => handleUserChat("¿Cuánto cuesta adquirir o implementar esta plataforma?")}
                className="rounded border border-white/[0.06] bg-zinc-900 px-2 py-0.5 text-zinc-300 hover:text-white"
              >
                Adquirir / Invertir en el Software
              </button>
              <button
                type="button"
                onClick={() => handleUserChat("Soy freelancer y quiero tributar en RESICO")}
                className="rounded border border-white/[0.06] bg-zinc-900 px-2 py-0.5 text-zinc-400 hover:text-zinc-200"
              >
                Freelance / RESICO
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
                placeholder="Escribe tu consulta sobre la plataforma o el SAT..."
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
      <section id="noticias" className="border-t border-white/[0.06] py-16 md:py-24 bg-zinc-950/40">
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

      {/* SECCIÓN CALL TO ACTION FINAL: VENTA / ADQUISICIÓN / CONTACTO MA DIGITAL ARTISANS */}
      <section id="agendamiento" className="border-t border-white/[0.06] py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-2xl border border-[#C5A880]/30 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-8 md:p-12 text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A880]/40 bg-[#C5A880]/10 px-3 py-1 text-xs text-[#C5A880] mb-4">
              <span>Desarrollado & Comercializado por {platformInfo.agencyName}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-normal text-zinc-100 tracking-tight">
              ¿Deseas adquirir esta plataforma o implementarla en tu despacho?
            </h2>

            <p className="mt-4 text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Adquiere el código fuente completo, derechos marca blanca para comercializarla con tus propios clientes
              o la integración del sistema de extracción del SAT en tus operaciones. Contáctanos directamente por cualquiera de nuestros canales oficiales:
            </p>

            {/* Opciones directas de contacto */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
              {/* WhatsApp Card */}
              <a
                href={whatsappInversionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 transition-all hover:border-emerald-400 hover:bg-emerald-500/10 flex items-center justify-between"
              >
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-medium">WhatsApp Oficial</div>
                  <div className="text-sm font-semibold text-zinc-100 mt-0.5">{platformInfo.displayPhone}</div>
                  <div className="text-[11px] text-zinc-400">Atención inmediata para compra / demos</div>
                </div>
                <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
              </a>

              {/* Email Card */}
              <a
                href={emailInversionUrl}
                className="group rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4 transition-all hover:border-white/20 hover:bg-zinc-900 flex items-center justify-between"
              >
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#C5A880] font-medium">Correo Electrónico</div>
                  <div className="text-xs font-semibold text-zinc-100 mt-0.5 truncate max-w-[170px]">{platformInfo.email}</div>
                  <div className="text-[11px] text-zinc-400">Propuestas y contratos formales</div>
                </div>
                <span className="text-xl group-hover:scale-110 transition-transform">✉️</span>
              </a>
            </div>

            {/* Redes Sociales Oficiales */}
            <div className="mt-8 pt-6 border-t border-white/[0.06]">
              <div className="text-xs text-zinc-400 mb-3">
                Canales oficiales de <strong className="text-zinc-200">{platformInfo.agencyName}</strong>:
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={platformInfo.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:border-pink-500/50 hover:text-white hover:bg-pink-500/10 transition-all shadow-sm"
                >
                  <span>📷 Instagram</span>
                  <span className="text-[11px] text-zinc-500">@ma_digital_artisans</span>
                </a>
                <a
                  href={platformInfo.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:border-cyan-500/50 hover:text-white hover:bg-cyan-500/10 transition-all shadow-sm"
                >
                  <span>🎵 TikTok</span>
                  <span className="text-[11px] text-zinc-500">@ma_digital_artisans</span>
                </a>
                <a
                  href={platformInfo.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:border-blue-500/50 hover:text-white hover:bg-blue-500/10 transition-all shadow-sm"
                >
                  <span>🌐 Facebook</span>
                  <span className="text-[11px] text-zinc-500">MA Digital Artisans</span>
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-wrap justify-center gap-6 text-[11px] text-zinc-500">
              <span>✓ Transferencia inmediata del código fuente</span>
              <span>✓ Soporte para base de datos SQLite / PostgreSQL</span>
              <span>✓ Despliegue en producción en la nube (Vercel)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="border-t border-white/[0.06] py-10 text-xs text-zinc-500">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-medium text-zinc-300">{platformInfo.agencyName}</span>
            <span className="hidden sm:inline">·</span>
            <span>{platformInfo.softwareBrand}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <a
              href={whatsappInversionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-medium"
            >
              WhatsApp (+52 444 321 1123)
            </a>
            <a
              href={emailInversionUrl}
              className="hover:text-zinc-300"
            >
              {platformInfo.email}
            </a>
            <a
              href={platformInfo.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300"
            >
              Instagram
            </a>
            <a
              href={platformInfo.social.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300"
            >
              TikTok
            </a>
            <a
              href={platformInfo.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300"
            >
              Facebook
            </a>
            <Link href="/login" className="text-[#C5A880] hover:underline">
              Portal Interno
            </Link>
          </div>
        </div>
      </footer>

      {/* Botón Flotante de Compra / WhatsApp */}
      <aside aria-label="Contacto de Compra" className="fixed bottom-6 right-6 z-50 flex items-center">
        <a
          href={whatsappInversionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-zinc-950/90 px-4 py-2.5 text-xs font-medium text-zinc-200 shadow-2xl backdrop-blur-md transition-all hover:scale-105 hover:border-emerald-400 hover:bg-emerald-950/40 hover:text-white"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-400">Comprar Plataforma</span>
          <span className="text-zinc-400 group-hover:text-zinc-200">· WhatsApp</span>
        </a>
      </aside>
    </div>
  );
}
