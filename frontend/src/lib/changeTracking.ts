import { ProjectDocument, FieldChange, DocumentChange } from '@/types/project';
import { v4 as uuidv4 } from 'uuid';

/**
 * Field-level diffing utility
 * Compares two document states and generates granular field changes
 */
export function generateFieldChanges(
  oldDoc: Partial<ProjectDocument>,
  newDoc: Partial<ProjectDocument>
): FieldChange[] {
  const changes: FieldChange[] = [];
  
  // Fields to track
  const trackableFields: (keyof ProjectDocument)[] = [
    'dataInicio',
    'dataFim',
    'documento',
    'detalhe',
    'revisao',
    'responsavel',
    'status',
    'area',
  ];

  for (const field of trackableFields) {
    const oldValue = oldDoc[field];
    const newValue = newDoc[field];
    
    // Normalize values for comparison (treat empty strings and undefined as equal)
    const normalizedOld = oldValue === '' ? null : oldValue ?? null;
    const normalizedNew = newValue === '' ? null : newValue ?? null;
    
    if (normalizedOld !== normalizedNew) {
      changes.push({
        field: field as string,
        oldValue: normalizedOld as string | number | null,
        newValue: normalizedNew as string | number | null,
      });
    }
  }

  return changes;
}

/**
 * Creates a new change log entry
 */
export function createChangeLogEntry(
  changes: FieldChange[],
  meetingContext?: {
    meetingId: string;
    meetingData: string;
    meetingNumber: string;
  }
): DocumentChange {
  const changeEntry: DocumentChange = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    changes,
    isQuickEdit: !meetingContext,
  };

  if (meetingContext) {
    changeEntry.meetingId = meetingContext.meetingId;
    changeEntry.meetingData = meetingContext.meetingData;
    changeEntry.meetingNumber = meetingContext.meetingNumber;
  }

  return changeEntry;
}

/**
 * Formats a field change for display
 */
export function formatFieldChange(change: FieldChange): string {
  const fieldLabels: Record<string, string> = {
    dataInicio: 'Data Início',
    dataFim: 'Data Fim',
    documento: 'Tópico',
    detalhe: 'Detalhe',
    revisao: 'Revisão',
    responsavel: 'Responsável',
    status: 'Status',
    area: 'Área',
  };

  const fieldName = fieldLabels[change.field] || change.field;
  const oldVal = change.oldValue ? `"${change.oldValue}"` : '';
  const newVal = change.newValue ? `"${change.newValue}"` : '';
  
  if (oldVal && newVal) {
    return `${fieldName}: ${oldVal} → ${newVal}`;
  } else if (newVal) {
    return `${fieldName}: ${newVal}`;
  } else if (oldVal) {
    return `${fieldName}: ${oldVal} (removido)`;
  }
  
  return `${fieldName}`;
}

/**
 * Formats a timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Debounce utility for autosave
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
