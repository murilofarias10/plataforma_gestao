import { ExcelDocument } from "@/services/sharepointService";
import { format, startOfMonth, endOfMonth, isBefore, isAfter, isEqual, parseISO } from "date-fns";

export interface KpiData {
  emitidosPercentage: number;
  aprovadosPercentage: number;
}

export interface SCurvePoint {
  time: string;
  projetado: number;
  baseline: number;
  avancado: number;
}

export interface StatusTableRow {
  status: string;
  qtde: number;
  inicio: number | null;
  fim: number | null;
}

const ensureDate = (date: any): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return isNaN(date.getTime()) ? null : date;
  
  // Handle Excel serial dates (numbers)
  if (typeof date === 'number') {
    // Excel base date is Dec 30, 1899
    return new Date((date - 25569) * 86400 * 1000);
  }

  // Handle strings
  if (typeof date === 'string') {
    // Try DD/MM/YYYY format
    const parts = date.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const year = parseInt(parts[2], 10);
      
      // Handle 2-digit years
      const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
      
      const d = new Date(fullYear, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const parsed = new Date(date);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
};

export const processKpiData = (data: ExcelDocument[]): KpiData => {
  if (!data.length) return { emitidosPercentage: 0, aprovadosPercentage: 0 };

  const countAprovado = data.filter(d => d.Status?.toLowerCase() === 'aprovado').length;
  const countEmitido = data.filter(d => d.Status?.toLowerCase() === 'emitido').length;
  const countParaEmissao = data.filter(d => 
    d.Status?.toLowerCase() === 'para emissão' || 
    d.Status?.toLowerCase() === 'para emissao'
  ).length;

  const totalPlanned = countAprovado + countEmitido + countParaEmissao;


  // KPI Emitidos: (Aprovado + Emitido / Aprovados + Emitido + Para Emissão) * 100
  const emitidosPercentage = totalPlanned > 0 ? Math.round(((countEmitido + countAprovado) / (countAprovado + countEmitido + countParaEmissao)) * 100) : 0;


  
  // KPI Aprovados: (Aprovado / (Aprovado + Emitido)) * 100
  const totalIssued = countAprovado + countEmitido;
  const aprovadosPercentage = totalIssued > 0 ? Math.round((countAprovado / totalIssued) * 100) : 0;

  return {
    emitidosPercentage,
    aprovadosPercentage
  };
};

export const processStatusTableData = (data: ExcelDocument[]): StatusTableRow[] => {
  const statusGroups: Record<string, { qtde: number; inicio: number; fim: number }> = {};

  data.forEach(d => {
    const status = d.Status || 'Unknown';
    if (!statusGroups[status]) {
      statusGroups[status] = { qtde: 0, inicio: 0, fim: 0 };
    }
    
    statusGroups[status].qtde++;
    if (d.Data_projetado) statusGroups[status].inicio++;
    if (d.Data_avancado) statusGroups[status].fim++;
  });

  return Object.entries(statusGroups).map(([status, counts]) => ({
    status,
    qtde: counts.qtde,
    inicio: counts.inicio || null,
    fim: counts.fim || null
  }));
};

export const processSCurveData = (data: ExcelDocument[]): SCurvePoint[] => {
  if (!data.length) return [];

  // Normalize dates in the dataset
  const normalizedData = data.map(d => ({
    ...d,
    Data_baseline: ensureDate(d.Data_baseline),
    Data_projetado: ensureDate(d.Data_projetado),
    Data_avancado: ensureDate(d.Data_avancado),
  }));

  // Find date range
  const allDates = normalizedData.flatMap(d => [
    d.Data_baseline,
    d.Data_projetado,
    d.Data_avancado
  ]).filter(d => d !== null) as Date[];

  if (allDates.length === 0) return [];

  const minDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
  const maxDate = startOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));

  const result: SCurvePoint[] = [];
  let current = minDate;
  
  while (isBefore(current, maxDate) || isEqual(current, maxDate)) {
    const monthEnd = endOfMonth(current);
    const monthStr = format(current, "MMM-yy").toLowerCase();

    // Cumulative counts: all items with date <= monthEnd
    const cumulativeBaseline = normalizedData.filter(d => 
      d.Data_baseline && (isBefore(d.Data_baseline, monthEnd) || isEqual(d.Data_baseline, monthEnd))
    ).length;

    const cumulativeProjetado = normalizedData.filter(d => 
      d.Data_projetado && (isBefore(d.Data_projetado, monthEnd) || isEqual(d.Data_projetado, monthEnd))
    ).length;

    const cumulativeAvancado = normalizedData.filter(d => 
      d.Data_avancado && (isBefore(d.Data_avancado, monthEnd) || isEqual(d.Data_avancado, monthEnd))
    ).length;

    result.push({
      time: monthStr,
      baseline: cumulativeBaseline,
      projetado: cumulativeProjetado,
      avancado: cumulativeAvancado
    });

    // Move to next month
    current = startOfMonth(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  return result;
};

