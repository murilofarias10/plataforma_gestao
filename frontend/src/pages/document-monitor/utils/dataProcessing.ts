import { ExcelDocument } from "@/services/sharepointService";
import { format, startOfMonth, parseISO, isBefore, isAfter, isEqual } from "date-fns";

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

export const processKpiData = (data: ExcelDocument[]): KpiData => {
  if (!data.length) return { emitidosPercentage: 0, aprovadosPercentage: 0 };

  const total = data.length;
  const emitidos = data.filter(d => 
    d.Status?.toLowerCase() === 'emitido' || 
    d.Status?.toLowerCase() === 'aprovado'
  ).length;
  
  const aprovados = data.filter(d => d.Status?.toLowerCase() === 'aprovado').length;

  return {
    emitidosPercentage: Math.round((emitidos / total) * 100),
    aprovadosPercentage: emitidos > 0 ? Math.round((aprovados / emitidos) * 100) : 0
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

  const months: Record<string, SCurvePoint> = {};
  
  // Find date range
  const allDates = data.flatMap(d => [
    d.Data_baseline,
    d.Data_projetado,
    d.Data_avancado
  ]).filter(d => d instanceof Date) as Date[];

  if (allDates.length === 0) return [];

  const minDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
  const maxDate = startOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));

  // Initialize months
  let current = minDate;
  while (isBefore(current, maxDate) || isEqual(current, maxDate)) {
    const monthStr = format(current, "MMM-yy").toLowerCase();
    months[monthStr] = { time: monthStr, projetado: 0, baseline: 0, avancado: 0 };
    current = startOfMonth(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  // Helper to get month string
  const getMonthStr = (date: any) => {
    if (!(date instanceof Date)) return null;
    return format(date, "MMM-yy").toLowerCase();
  };

  // Cumulative counts
  const monthKeys = Object.keys(months);
  
  monthKeys.forEach(monthKey => {
    const monthDate = parseISO(`01-${monthKey.replace('-', ' 20')}`); // simplified parse
    // Actually, let's use the date objects we have
  });

  // Re-implementing more robustly
  const result: SCurvePoint[] = [];
  current = minDate;
  
  let cumulativeBaseline = 0;
  let cumulativeProjetado = 0;
  let cumulativeAvancado = 0;

  while (isBefore(current, maxDate) || isEqual(current, maxDate)) {
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const monthStr = format(current, "MMM-yy").toLowerCase();

    // Count for THIS month
    const baselineInMonth = data.filter(d => d.Data_baseline instanceof Date && isBefore(d.Data_baseline, monthEnd) && isAfter(d.Data_baseline, current)).length;
    // Actually, we want cumulative up to end of month
    cumulativeBaseline = data.filter(d => d.Data_baseline instanceof Date && isBefore(d.Data_baseline, monthEnd)).length;
    cumulativeProjetado = data.filter(d => d.Data_projetado instanceof Date && isBefore(d.Data_projetado, monthEnd)).length;
    cumulativeAvancado = data.filter(d => d.Data_avancado instanceof Date && isBefore(d.Data_avancado, monthEnd)).length;

    result.push({
      time: monthStr,
      baseline: cumulativeBaseline,
      projetado: cumulativeProjetado,
      avancado: cumulativeAvancado
    });

    current = startOfMonth(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  return result;
};

