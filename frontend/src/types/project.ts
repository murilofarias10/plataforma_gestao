export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  meetings?: MeetingMetadata[]; // Project-level meetings
}

export interface ProjectDocument {
  id: string;
  projectId: string; // Reference to the project this document belongs to
  numeroItem: number; // Sequential item number
  dataInicio: string; // dd/mm/yyyy
  dataFim: string; // dd/mm/yyyy
  documento: string;
  detalhe: string;
  revisao: string; // R0, R1, etc.
  responsavel: string;
  status: "A iniciar" | "Em andamento" | "Finalizado" | "Info";
  area: string;
  createdAt: Date;
  updatedAt: Date;
  // When true, this row was cleared by the user and should be ignored by dashboards
  isCleared?: boolean;
  // File attachment support
  attachments?: ProjectAttachment[];
  // Change tracking and audit trail
  participants?: string[]; // Array of participant names (tag-based)
  history?: DocumentChange[]; // Immutable audit trail
  meetings?: MeetingMetadata[]; // Meeting metadata for this document
}

export interface ProjectAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  filePath: string; // Path within the project's folder structure
}

export interface FieldChange {
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

export interface DocumentChange {
  id: string;
  timestamp: string;
  meetingId?: string; // Reference to meeting if change occurred during meeting
  meetingData?: string; // Date of meeting in dd-mm-yyyy format
  meetingNumber?: string; // Number of the meeting minutes (Numero da Ata)
  isQuickEdit?: boolean; // true if edited directly without meeting context
  changes: FieldChange[];
  modifiedBy?: string; // Who made the change (optional for future auth)
}

export interface MeetingMetadata {
  id: string;
  data: string; // dd-mm-yyyy format
  numeroAta: string;
  detalhes?: string; // Meeting details/notes
  participants: string[]; // Array of participant names
  createdAt: string;
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
  info: number;
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