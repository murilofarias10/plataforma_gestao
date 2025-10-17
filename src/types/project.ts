export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDocument {
  id: string;
  projectId: string; // Reference to the project this document belongs to
  dataInicio: string; // dd/mm/yyyy
  dataFim: string; // dd/mm/yyyy
  documento: string;
  detalhe: string;
  revisao: string; // R0, R1, etc.
  responsavel: string;
  status: "A iniciar" | "Em andamento" | "Finalizado";
  area: string;
  participantes: string; // semicolon separated
  createdAt: Date;
  updatedAt: Date;
  // When true, this row was cleared by the user and should be ignored by dashboards
  isCleared?: boolean;
}

export interface ProjectFilters {
  searchQuery: string;
  statusFilter: string[];
  areaFilter: string[];
  responsavelFilter: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

export interface KpiData {
  aIniciar: number;
  emAndamento: number;
  finalizado: number;
}

export interface TimelineDataPoint {
  month: string;
  created: number;
  finished: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}