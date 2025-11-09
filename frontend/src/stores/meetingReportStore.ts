import { create } from 'zustand';
import type { MeetingMetadata } from '@/types/project';

interface MeetingReportStore {
  // Modal state
  isDialogOpen: boolean;
  dialogMeeting: MeetingMetadata | null;
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  
  // Actions
  openMeetingDialog: (meeting: MeetingMetadata) => void;
  closeDialog: () => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setProgress: (progress: number) => void;
  setCurrentStep: (step: string) => void;
}

export const useMeetingReportStore = create<MeetingReportStore>((set, get) => ({
  // Initial state
  isDialogOpen: false,
  dialogMeeting: null,
  isGenerating: false,
  progress: 0,
  currentStep: '',
  
  // Actions
  openMeetingDialog: (meeting) => {
    set({
      dialogMeeting: meeting,
      isDialogOpen: true,
      progress: 0,
      currentStep: '',
    });
  },
  
  closeDialog: () => {
    const { isGenerating } = get();
    if (isGenerating) return;
    
    set({
      isDialogOpen: false,
      dialogMeeting: null,
      progress: 0,
      currentStep: '',
    });
  },
  
  setIsGenerating: (isGenerating) => {
    set({ isGenerating });
  },
  
  setProgress: (progress) => {
    set({ progress });
  },
  
  setCurrentStep: (step) => {
    set({ currentStep: step });
  },
}));

