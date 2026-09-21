export interface ParsedCFDI {
  uuid: string;
  serie?: string;
  folio?: string;
  fecha: string;
  emisorRfc: string;
  emisorNombre: string;
  receptorRfc: string;
  receptorNombre: string;
  tipoDeComprobante: string;
  subtotal: number;
  descuento?: number;
  total: number;
  ivaTrasladado?: number;
  isrRetenido?: number;
  ivaRetenido?: number;
  moneda: string;
  formaPago?: string;
  metodoPago?: string;
  conceptosCount: number;
}

export function parseCFDIXml(xmlContent: string): ParsedCFDI {
  // Parser robusto basado en expresiones regulares para funcionar tanto en cliente como en servidor
  const getAttr = (tagRegex: RegExp, attrName: string): string => {
    const tagMatch = xmlContent.match(tagRegex);
    if (!tagMatch) return "";
    const tagStr = tagMatch[0];
    const attrRegex = new RegExp(`${attrName}=["']([^"']*)["']`, "i");
    const match = tagStr.match(attrRegex);
    return match ? match[1] : "";
  };

  const comprobanteTag = /<[a-z0-9]+:Comprobante\b[^>]*>/i;
  const emisorTag = /<[a-z0-9]+:Emisor\b[^>]*>/i;
  const receptorTag = /<[a-z0-9]+:Receptor\b[^>]*>/i;
  const timbreTag = /<[a-z0-9]+:TimbreFiscalDigital\b[^>]*>/i;
  const impuestosTag = /<[a-z0-9]+:Impuestos\b[^>]*>/i;

  const uuid =
    getAttr(timbreTag, "UUID") ||
    getAttr(comprobanteTag, "UUID") ||
    "CFDI-" + Math.random().toString(36).substring(2, 10).toUpperCase();

  const fecha = getAttr(comprobanteTag, "Fecha") || new Date().toISOString();
  const serie = getAttr(comprobanteTag, "Serie") || "";
  const folio = getAttr(comprobanteTag, "Folio") || "";
  const tipo = getAttr(comprobanteTag, "TipoDeComprobante") || "I";
  const moneda = getAttr(comprobanteTag, "Moneda") || "MXN";
  const subtotal = parseFloat(getAttr(comprobanteTag, "SubTotal") || "0");
  const total = parseFloat(getAttr(comprobanteTag, "Total") || "0");
  const descuento = parseFloat(getAttr(comprobanteTag, "Descuento") || "0");

  const emisorRfc = getAttr(emisorTag, "Rfc") || "RFC NO ENCONTRADO";
  const emisorNombre = getAttr(emisorTag, "Nombre") || emisorRfc;

  const receptorRfc = getAttr(receptorTag, "Rfc") || "RFC NO ENCONTRADO";
  const receptorNombre = getAttr(receptorTag, "Nombre") || receptorRfc;

  const ivaTrasladado = parseFloat(getAttr(impuestosTag, "TotalImpuestosTrasladados") || "0");
  const ivaRetenido = parseFloat(getAttr(impuestosTag, "TotalImpuestosRetenidos") || "0");

  // Contar conceptos
  const conceptosMatches = xmlContent.match(/<[a-z0-9]+:Concepto\b/gi);
  const conceptosCount = conceptosMatches ? conceptosMatches.length : 1;

  return {
    uuid,
    serie,
    folio,
    fecha,
    emisorRfc,
    emisorNombre,
    receptorRfc,
    receptorNombre,
    tipoDeComprobante: tipo === "I" ? "Ingreso" : tipo === "E" ? "Egreso (Nota Crédito)" : tipo === "P" ? "Pago" : tipo === "N" ? "Nómina" : tipo,
    subtotal,
    descuento,
    total,
    ivaTrasladado: ivaTrasladado || (total > subtotal ? total - subtotal : 0),
    ivaRetenido,
    moneda,
    formaPago: getAttr(comprobanteTag, "FormaPago"),
    metodoPago: getAttr(comprobanteTag, "MetodoPago"),
    conceptosCount,
  };
}
