import { ProjectDocument, FieldChange, DocumentChange, ProjectAttachment } from '@/types/project';
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

  // Track attachment changes separately
  const oldAttachments = oldDoc.attachments || [];
  const newAttachments = newDoc.attachments || [];
  
  // Compare attachments by their IDs
  const oldAttachmentIds = new Set(oldAttachments.map(att => att.id));
  const newAttachmentIds = new Set(newAttachments.map(att => att.id));
  
  // Find added and removed attachments
  const addedAttachments = newAttachments.filter(att => !oldAttachmentIds.has(att.id));
  const removedAttachments = oldAttachments.filter(att => !newAttachmentIds.has(att.id));
  
  // Only create a change entry if there are actual changes
  if (addedAttachments.length > 0 || removedAttachments.length > 0) {
    const oldValueStr = oldAttachments.length === 0 
      ? null 
      : `${oldAttachments.length} arquivo${oldAttachments.length !== 1 ? 's' : ''}`;
    
    // Create a detailed description of what changed
    const changeDetails: string[] = [];
    if (addedAttachments.length > 0) {
      const fileNames = addedAttachments.map(att => att.fileName).join(', ');
      changeDetails.push(`Adicionado${addedAttachments.length > 1 ? 's' : ''}: ${fileNames}`);
    }
    if (removedAttachments.length > 0) {
      const fileNames = removedAttachments.map(att => att.fileName).join(', ');
      changeDetails.push(`Removido${removedAttachments.length > 1 ? 's' : ''}: ${fileNames}`);
    }
    
    changes.push({
      field: 'attachments',
      oldValue: oldValueStr,
      newValue: changeDetails.join(' | '),
    });
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
    attachments: 'Anexo',
  };

  const fieldName = fieldLabels[change.field] || change.field;
  
  // Special handling for attachments
  if (change.field === 'attachments') {
    // For attachments, newValue contains the change details (Added/Removed info)
    if (change.newValue) {
      return `${fieldName}: ${change.newValue}`;
    }
    return `${fieldName}`;
  }
  
  // Standard formatting for other fields
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
