/**
 * Motor de Cálculo Contable y Fiscal de Alta Precisión (FinTech Engine)
 * Diseñado para personas físicas, asalariados, freelancers (RESICO / Honorarios) y personas morales.
 */

export interface TaxBracket {
  lowerLimit: number;
  fixedFee: number;
  percentageOverExcess: number; // En porcentaje, ej. 6.40% -> 6.40
}

// Tablas de ISR Mensuales oficiales de referencia
export const ISR_MONTHLY_TABLE: TaxBracket[] = [
  { lowerLimit: 0.01, fixedFee: 0.0, percentageOverExcess: 1.92 },
  { lowerLimit: 746.05, fixedFee: 14.32, percentageOverExcess: 6.40 },
  { lowerLimit: 6332.06, fixedFee: 371.83, percentageOverExcess: 10.88 },
  { lowerLimit: 11128.02, fixedFee: 893.63, percentageOverExcess: 16.00 },
  { lowerLimit: 12935.83, fixedFee: 1182.88, percentageOverExcess: 17.92 },
  { lowerLimit: 15487.72, fixedFee: 1640.18, percentageOverExcess: 21.36 },
  { lowerLimit: 31236.50, fixedFee: 5004.12, percentageOverExcess: 23.52 },
  { lowerLimit: 49233.01, fixedFee: 9236.89, percentageOverExcess: 30.00 },
  { lowerLimit: 93993.91, fixedFee: 22665.17, percentageOverExcess: 32.00 },
  { lowerLimit: 125325.21, fixedFee: 32691.18, percentageOverExcess: 34.00 },
  { lowerLimit: 375975.62, fixedFee: 117912.32, percentageOverExcess: 35.00 },
];

// Tasas RESICO Mensual
export const RESICO_RATES = [
  { max: 25000, rate: 0.01 },
  { max: 50000, rate: 0.011 },
  { max: 83333.33, rate: 0.015 },
  { max: 208333.33, rate: 0.02 },
  { max: 291666.67, rate: 0.025 },
];

export interface InvoiceCalculationInput {
  subtotal: number;
  clientType: "PERSONA_FISICA" | "PERSONA_MORAL";
  regime: "RESICO" | "HONORARIOS_GENERAL";
  ivaRate?: number; // Default 0.16
}

export interface InvoiceCalculationResult {
  subtotal: number;
  iva: number;
  grossTotal: number;
  retainedIsr: number;
  retainedIva: number;
  netToReceive: number;
  directEstimatedIsr: number;
}

/**
 * Calcula el desglose fiscal para emisión de recibo de honorarios / factura
 */
export function calculateInvoice(input: InvoiceCalculationInput): InvoiceCalculationResult {
  const { subtotal, clientType, regime, ivaRate = 0.16 } = input;
  const iva = Number((subtotal * ivaRate).toFixed(2));
  const grossTotal = Number((subtotal + iva).toFixed(2));

  let retainedIsr = 0;
  let retainedIva = 0;
  let directEstimatedIsr = 0;

  if (regime === "RESICO") {
    // Si le factura a una Persona Moral, se retiene el 1.25% de ISR
    if (clientType === "PERSONA_MORAL") {
      retainedIsr = Number((subtotal * 0.0125).toFixed(2));
      retainedIva = Number((subtotal * (ivaRate * (2 / 3))).toFixed(2));
    }
    // Tasa directa RESICO
    const tier = RESICO_RATES.find((r) => subtotal <= r.max) || RESICO_RATES[RESICO_RATES.length - 1];
    directEstimatedIsr = Number((subtotal * tier.rate).toFixed(2));
  } else {
    // Régimen General de Servicios Profesionales / Honorarios
    if (clientType === "PERSONA_MORAL") {
      retainedIsr = Number((subtotal * 0.10).toFixed(2));
      retainedIva = Number((subtotal * (ivaRate * (2 / 3))).toFixed(2));
    }
    // Estimación con tabla marginal
    directEstimatedIsr = calculateMarginalISR(subtotal);
  }

  const netToReceive = Number((grossTotal - retainedIsr - retainedIva).toFixed(2));

  return {
    subtotal,
    iva,
    grossTotal,
    retainedIsr,
    retainedIva,
    netToReceive,
    directEstimatedIsr,
  };
}

/**
 * Cálculo marginal progresivo de ISR con tabla mensual
 */
export function calculateMarginalISR(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  let bracket = ISR_MONTHLY_TABLE[0];
  for (let i = ISR_MONTHLY_TABLE.length - 1; i >= 0; i--) {
    if (taxableIncome >= ISR_MONTHLY_TABLE[i].lowerLimit) {
      bracket = ISR_MONTHLY_TABLE[i];
      break;
    }
  }

  const excess = taxableIncome - bracket.lowerLimit;
  const marginalTax = excess * (bracket.percentageOverExcess / 100);
  const totalTax = bracket.fixedFee + marginalTax;

  return Number(totalTax.toFixed(2));
}

/**
 * Simulador de Nómina (Salario Bruto a Neto)
 */
export interface PayrollInput {
  grossSalary: number;
  periodDays?: number; // 30 por defecto
}

export interface PayrollResult {
  grossSalary: number;
  imssWorkerFee: number; // Cuotas obreras aprox ~2.375% - 2.8%
  isrRetained: number;
  totalDeductions: number;
  netSalary: number;
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const { grossSalary } = input;
  const isr = calculateMarginalISR(grossSalary);
  const imssWorkerFee = Number((grossSalary * 0.0275).toFixed(2)); // Factor promedio ponderado IMSS obrero
  const totalDeductions = Number((isr + imssWorkerFee).toFixed(2));
  const netSalary = Number((grossSalary - totalDeductions).toFixed(2));

  return {
    grossSalary,
    imssWorkerFee,
    isrRetained: isr,
    totalDeductions,
    netSalary,
  };
}

/**
 * Tabla de amortización de préstamos (Sistema Francés - Cuota Constante)
 */
export interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
}

export function calculateLoanAmortization(
  principal: number,
  annualRatePct: number,
  termMonths: number
): AmortizationRow[] {
  const monthlyRate = annualRatePct / 100 / 12;
  const payment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

  let balance = principal;
  const schedule: AmortizationRow[] = [];

  for (let m = 1; m <= termMonths; m++) {
    const interest = balance * monthlyRate;
    const principalPaid = payment - interest;
    balance = Math.max(0, balance - principalPaid);

    schedule.push({
      period: m,
      payment: Number(payment.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      principal: Number(principalPaid.toFixed(2)),
      remainingBalance: Number(balance.toFixed(2)),
    });
  }

  return schedule;
}

/**
 * Análisis de Razones Financieras Básicas
 */
export function calculateFinancialRatios(data: {
  currentAssets: number;
  currentLiabilities: number;
  inventory: number;
  totalDebt: number;
  totalEquity: number;
  netIncome: number;
  totalRevenue: number;
}) {
  const currentRatio = data.currentLiabilities > 0 ? data.currentAssets / data.currentLiabilities : 0;
  const quickRatio = data.currentLiabilities > 0 ? (data.currentAssets - data.inventory) / data.currentLiabilities : 0;
  const debtToEquity = data.totalEquity > 0 ? data.totalDebt / data.totalEquity : 0;
  const netProfitMargin = data.totalRevenue > 0 ? (data.netIncome / data.totalRevenue) * 100 : 0;

  return {
    currentRatio: Number(currentRatio.toFixed(2)), // Razón circulante (> 1.5 saludable)
    quickRatio: Number(quickRatio.toFixed(2)),       // Prueba ácida (> 1.0 saludable)
    debtToEquity: Number(debtToEquity.toFixed(2)), // Apalancamiento (< 1.0 saludable)
    netProfitMargin: Number(netProfitMargin.toFixed(2)), // Margen neto en %
  };
}
