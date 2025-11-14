import { create } from 'zustand';
import { MeetingMetadata } from '@/types/project';

interface MeetingContextStore {
  // Current meeting being worked on (registration or edit mode)
  currentMeeting: MeetingMetadata | null;
  // Items associated with current meeting (item numbers)
  relatedItemNumbers: Set<number>;
  // Is editing existing meeting
  isEditMode: boolean;
  // Original meeting ID when editing
  editingMeetingId: string | null;

  // Actions
  startMeeting: (meeting?: Partial<MeetingMetadata>) => void;
  endMeeting: () => void;
  updateMeetingData: (data: Partial<MeetingMetadata>) => void;
  addRelatedItem: (itemNumber: number) => void;
  removeRelatedItem: (itemNumber: number) => void;
  setRelatedItems: (itemNumbers: number[]) => void;
  startEditMeeting: (meeting: MeetingMetadata) => void;
  clearMeetingContext: () => void;
  hasActiveMeeting: () => boolean;
}

export const useMeetingContextStore = create<MeetingContextStore>((set, get) => ({
  currentMeeting: null,
  relatedItemNumbers: new Set<number>(),
  isEditMode: false,
  editingMeetingId: null,

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
      relatedItemNumbers: new Set<number>(meeting?.relatedItems || []),
      isEditMode: false,
      editingMeetingId: null,
    });
  },

  endMeeting: () => {
    set({
      currentMeeting: null,
      relatedItemNumbers: new Set<number>(),
      isEditMode: false,
      editingMeetingId: null,
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

  addRelatedItem: (itemNumber) => {
    const newSet = new Set(get().relatedItemNumbers);
    newSet.add(itemNumber);
    set({ relatedItemNumbers: newSet });
  },

  removeRelatedItem: (itemNumber) => {
    const newSet = new Set(get().relatedItemNumbers);
    newSet.delete(itemNumber);
    set({ relatedItemNumbers: newSet });
  },

  setRelatedItems: (itemNumbers) => {
    set({ relatedItemNumbers: new Set(itemNumbers) });
  },

  startEditMeeting: (meeting) => {
    set({
      currentMeeting: meeting,
      relatedItemNumbers: new Set<number>(meeting.relatedItems || []),
      isEditMode: true,
      editingMeetingId: meeting.id,
    });
  },

  clearMeetingContext: () => {
    set({
      currentMeeting: null,
      relatedItemNumbers: new Set<number>(),
      isEditMode: false,
      editingMeetingId: null,
    });
  },

  hasActiveMeeting: () => {
    const current = get().currentMeeting;
    return current !== null && (current.data !== '' || current.numeroAta !== '');
  },
}));

