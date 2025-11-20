import { create } from 'zustand';
import { MeetingMetadata } from '@/types/project';

interface MeetingContextStore {
  // Current meeting being worked on (registration or edit mode)
  currentMeeting: MeetingMetadata | null;
  // Is editing existing meeting
  isEditMode: boolean;
  // Original meeting ID when editing
  editingMeetingId: string | null;
  // Original document IDs from the meeting being edited (before duplication)
  originalDocumentIds: string[];
  // Temporary duplicate document IDs created for editing (to be cleaned up)
  tempDuplicateIds: string[];

  // Actions
  startMeeting: (meeting?: Partial<MeetingMetadata>) => void;
  endMeeting: () => void;
  updateMeetingData: (data: Partial<MeetingMetadata>) => void;
  startEditMeeting: (meeting: MeetingMetadata, originalDocIds: string[], tempDuplicateIds: string[]) => void;
  clearMeetingContext: () => void;
  hasActiveMeeting: () => boolean;
}

export const useMeetingContextStore = create<MeetingContextStore>((set, get) => ({
  currentMeeting: null,
  isEditMode: false,
  editingMeetingId: null,
  originalDocumentIds: [],
  tempDuplicateIds: [],

  startMeeting: (meeting) => {
    set({
      currentMeeting: meeting ? {
        id: meeting.id || '',
        data: meeting.data || '',
        numeroAta: meeting.numeroAta || '',
        detalhes: meeting.detalhes,
        fornecedor: meeting.fornecedor,
        disciplina: meeting.disciplina,
        resumo: meeting.resumo,
        participants: meeting.participants || [],
        relatedItems: meeting.relatedItems || [],
        createdAt: meeting.createdAt || new Date().toISOString(),
      } : null,
      isEditMode: false,
      editingMeetingId: null,
      originalDocumentIds: [],
      tempDuplicateIds: [],
    });
  },

  endMeeting: () => {
    set({
      currentMeeting: null,
      isEditMode: false,
      editingMeetingId: null,
      originalDocumentIds: [],
      tempDuplicateIds: [],
    });
  },

  updateMeetingData: (data) => {
    const current = get().currentMeeting;
    if (current) {
      set({
        currentMeeting: {
          ...current,
          ...data,
        },
      });
    }
  },

  startEditMeeting: (meeting, originalDocIds, tempDuplicateIds) => {
    set({
      currentMeeting: meeting,
      isEditMode: true,
      editingMeetingId: meeting.id,
      originalDocumentIds: originalDocIds,
      tempDuplicateIds: tempDuplicateIds,
    });
  },

  clearMeetingContext: () => {
    console.log('[meetingContextStore] Clearing meeting context');
    set({
      currentMeeting: null,
      isEditMode: false,
      editingMeetingId: null,
      originalDocumentIds: [],
      tempDuplicateIds: [],
    });
    console.log('[meetingContextStore] Context cleared - isEditMode: false, editingMeetingId: null');
  },

  hasActiveMeeting: () => {
    const current = get().currentMeeting;
    return current !== null && (current.data !== '' || current.numeroAta !== '');
  },
}));

