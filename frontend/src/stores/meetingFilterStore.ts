import { create } from 'zustand';
import type { MeetingMetadata } from '@/types/project';

interface MeetingFilters {
  data: string;
  numeroAta: string;
  participante: string;
  fornecedor: string;
  disciplina: string;
}

interface MeetingFilterStore {
  filters: MeetingFilters;
  filteredMeetings: MeetingMetadata[];
  
  setFilters: (filters: Partial<MeetingFilters>) => void;
  setFilteredMeetings: (meetings: MeetingMetadata[]) => void;
  resetFilters: () => void;
}

const defaultFilters: MeetingFilters = {
  data: '',
  numeroAta: '',
  participante: '',
  fornecedor: '',
  disciplina: ''
};

export const useMeetingFilterStore = create<MeetingFilterStore>((set) => ({
  filters: defaultFilters,
  filteredMeetings: [],
  
  setFilters: (newFilters) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...newFilters,
      },
    }));
  },
  
  setFilteredMeetings: (meetings) => {
    set({ filteredMeetings: meetings });
  },
  
  resetFilters: () => {
    set({ filters: defaultFilters });
  },
}));

