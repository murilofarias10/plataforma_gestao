import React, { useState, useCallback, useEffect } from 'react';
import { MeetingMetadata } from '@/types/project';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { useProjectStore } from '@/stores/projectStore';
import { useMeetingContextStore } from '@/stores/meetingContextStore';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

export function MeetingRegistrationSection() {
  // Subscribe to projects array directly - Zustand will re-render when this changes
  const projects = useProjectStore((state) => state.projects);
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const updateProject = useProjectStore((state) => state.updateProject);
  const getSelectedProject = useProjectStore((state) => state.getSelectedProject);
  const { canCreate } = usePermissions();
  
  // Meeting context store
  const isEditMode = useMeetingContextStore((state) => state.isEditMode);
  const editingMeetingId = useMeetingContextStore((state) => state.editingMeetingId);
  const currentMeeting = useMeetingContextStore((state) => state.currentMeeting);
  const clearMeetingContext = useMeetingContextStore((state) => state.clearMeetingContext);
  const startMeeting = useMeetingContextStore((state) => state.startMeeting);
  
  const selectedProject = getSelectedProject();
  
  const [meetingData, setMeetingData] = useState('');
  const [meetingNumero, setMeetingNumero] = useState('');
  const [meetingDetalhes, setMeetingDetalhes] = useState('');
  const [meetingFornecedor, setMeetingFornecedor] = useState('');
  const [meetingDisciplina, setMeetingDisciplina] = useState('');
  const [meetingResumo, setMeetingResumo] = useState('');
  const [newParticipant, setNewParticipant] = useState('');
  const [tempParticipants, setTempParticipants] = useState<string[]>([]);

  // Sync form with currentMeeting when in edit mode
  useEffect(() => {
    if (isEditMode && currentMeeting) {
      console.log('[MeetingRegistration] Loading meeting for edit:', currentMeeting.id);
      setMeetingData(currentMeeting.data);
      setMeetingNumero(currentMeeting.numeroAta);
      setMeetingDetalhes(currentMeeting.detalhes || '');
      setMeetingFornecedor(currentMeeting.fornecedor || '');
      setMeetingDisciplina(currentMeeting.disciplina || '');
      setMeetingResumo(currentMeeting.resumo || '');
      setTempParticipants(currentMeeting.participants);
    }
  }, [isEditMode, currentMeeting]);

  // DON'T auto-start meeting context - let items be unassigned until meeting is saved
  // This prevents items from being accidentally added to previous meetings

  // Log current mode for debugging
  useEffect(() => {
    console.log('[MeetingRegistration] Current mode:', isEditMode ? `EDIT mode (${editingMeetingId})` : 'CREATE mode (new meeting)');
  }, [isEditMode, editingMeetingId]);

  const handleAddParticipant = useCallback(() => {
    if (newParticipant.trim()) {
      setTempParticipants([...tempParticipants, newParticipant.trim()]);
      setNewParticipant('');
    }
  }, [newParticipant, tempParticipants]);

  const handleRemoveParticipant = useCallback((index: number) => {
    setTempParticipants(tempParticipants.filter((_, i) => i !== index));
  }, [tempParticipants]);


  const handleAddMeeting = useCallback(async () => {
    if (!meetingData.trim() || !meetingNumero.trim() || !selectedProjectId) {
      toast.error('Por favor, preencha a Data da Reunião e o Número da Ata');
      return;
    }

    // Get fresh state from store to ensure we have current values
    const currentContextState = useMeetingContextStore.getState();
    const actualIsEditMode = currentContextState.isEditMode;
    const actualEditingMeetingId = currentContextState.editingMeetingId;

    console.log('[MeetingRegistration] ==========================================');
    console.log('[MeetingRegistration] Save button clicked');
    console.log('[MeetingRegistration] Component state - isEditMode:', isEditMode, 'editingMeetingId:', editingMeetingId);
    console.log('[MeetingRegistration] Store state - isEditMode:', actualIsEditMode, 'editingMeetingId:', actualEditingMeetingId);

    try {
      // Get current meetings and documents fresh from store
      const currentProject = projects.find(p => p.id === selectedProjectId);
      const currentMeetings = currentProject?.meetings || [];
      
      // Get documents visible in project-tracker (unassigned + editing meeting's docs)
      const visibleDocuments = useProjectStore.getState().getTableDocuments();
      const documentIds = visibleDocuments.map(doc => doc.id);
      const documentItemNumbers = visibleDocuments.map(doc => doc.numeroItem);

      console.log('[MeetingRegistration] Saving meeting with document IDs:', documentIds);
      console.log('[MeetingRegistration] Saving meeting with item numbers:', documentItemNumbers);
      console.log('[MeetingRegistration] Current meetings count:', currentMeetings.length);

      // Use store state (actualIsEditMode) instead of component state (isEditMode)
      if (actualIsEditMode && actualEditingMeetingId) {
        // EDIT MODE: Update existing meeting
        console.log('[MeetingRegistration] MODE: EDIT - UPDATING existing meeting:', actualEditingMeetingId);
        const updatedMeetings = currentMeetings.map(meeting => 
          meeting.id === actualEditingMeetingId ? {
            ...meeting,
            data: meetingData,
            numeroAta: meetingNumero,
            detalhes: meetingDetalhes.trim() || undefined,
            fornecedor: meetingFornecedor.trim() || undefined,
            disciplina: meetingDisciplina.trim() || undefined,
            resumo: meetingResumo.trim() || undefined,
            participants: tempParticipants,
            relatedDocumentIds: documentIds, // Use document IDs for filtering
            relatedItems: documentItemNumbers, // Keep numbers for display
          } : meeting
        );
        
        await updateProject(selectedProjectId, { meetings: updatedMeetings });
        console.log('[MeetingRegistration] Meeting updated successfully');
        toast.success('Reunião atualizada com sucesso!');
      } else {
        // CREATE MODE: Create new meeting with ALL current visible documents
        const newMeetingId = uuidv4();
        console.log('[MeetingRegistration] MODE: CREATE - Creating NEW meeting:', newMeetingId);
        console.log('[MeetingRegistration] This is a BRAND NEW meeting, not an edit!');
        
        const newMeeting: MeetingMetadata = {
          id: newMeetingId,
          data: meetingData,
          numeroAta: meetingNumero,
          detalhes: meetingDetalhes.trim() || undefined,
          fornecedor: meetingFornecedor.trim() || undefined,
          disciplina: meetingDisciplina.trim() || undefined,
          resumo: meetingResumo.trim() || undefined,
          participants: tempParticipants,
          relatedDocumentIds: documentIds, // Use document IDs for filtering
          relatedItems: documentItemNumbers, // Keep numbers for display
          createdAt: new Date().toISOString(),
        };

        const updatedMeetings = [...currentMeetings, newMeeting];
        await updateProject(selectedProjectId, { meetings: updatedMeetings });
        console.log('[MeetingRegistration] New meeting created successfully, total meetings now:', updatedMeetings.length);
        
        toast.success('Reunião adicionada com sucesso!');
      }
      
      // IMPORTANT: Clear meeting context FIRST to trigger table refresh
      console.log('[MeetingRegistration] Clearing meeting context...');
      clearMeetingContext();
      
      // Then reset all form fields
      setMeetingData('');
      setMeetingNumero('');
      setMeetingDetalhes('');
      setMeetingFornecedor('');
      setMeetingDisciplina('');
      setMeetingResumo('');
      setTempParticipants([]);
      
      // Verify the context is actually cleared
      const contextCheck = useMeetingContextStore.getState();
      console.log('[MeetingRegistration] ✓ Form cleared, ready for next meeting');
      console.log('[MeetingRegistration] ✓ Context verification - isEditMode:', contextCheck.isEditMode, 'editingMeetingId:', contextCheck.editingMeetingId);
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast.error('Erro ao salvar reunião. Tente novamente.');
    }
  }, [meetingData, meetingNumero, meetingDetalhes, meetingFornecedor, meetingDisciplina, meetingResumo, tempParticipants, projects, selectedProjectId, updateProject, clearMeetingContext]);

  const canAddMeeting = meetingData.trim() && meetingNumero.trim();

  if (!selectedProject) {
    return null;
  }

  // Hide entire section for visitors (no create permission)
  if (!canCreate) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm font-semibold text-foreground">
          {isEditMode ? 'Editar Reunião' : 'Registrar Reunião'}
        </div>
        <Button 
          size="sm" 
          className="h-8 text-xs px-3"
          onClick={handleAddMeeting}
          disabled={!canAddMeeting}
          type="button"
        >
          {isEditMode ? 'Atualizar Reunião' : 'Adicionar Reunião'}
        </Button>
        {isEditMode && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs px-3"
            onClick={() => {
              console.log('[MeetingRegistration] Canceling edit mode');
              // Clear context first to trigger table refresh
              clearMeetingContext();
              // Then clear form fields
              setMeetingData('');
              setMeetingNumero('');
              setMeetingDetalhes('');
              setMeetingFornecedor('');
              setMeetingDisciplina('');
              setMeetingResumo('');
              setTempParticipants([]);
              console.log('[MeetingRegistration] Edit mode canceled, ready for new meeting');
            }}
            type="button"
          >
            Cancelar Edição
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {/* First Row */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Data da Reunião
            </label>
            <Input
              type="text"
              placeholder="dd-mm-aaaa"
              className="h-8 text-sm w-full"
              value={meetingData}
              onChange={(e) => {
                let value = e.target.value;
                // Remove non-numeric characters except dashes
                value = value.replace(/[^0-9-]/g, '');
                
                // Auto-format as user types (dd-mm-aaaa)
                if (value.length <= 2) {
                  value = value;
                } else if (value.length <= 5) {
                  value = value.replace(/^(\d{2})(\d)/, '$1-$2');
                } else if (value.length <= 10) {
                  value = value.replace(/^(\d{2})-(\d{2})(\d)/, '$1-$2-$3');
                } else {
                  value = value.substring(0, 10);
                }
                
                setMeetingData(value);
              }}
              maxLength={10}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Número da Ata
            </label>
            <Input
              type="text"
              placeholder="Ex: ATA-001"
              className="h-8 text-sm w-full"
              value={meetingNumero}
              onChange={(e) => setMeetingNumero(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Fornecedor
            </label>
            <Input
              type="text"
              placeholder="Nome do fornecedor"
              className="h-8 text-sm w-full"
              value={meetingFornecedor}
              onChange={(e) => setMeetingFornecedor(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Disciplina
            </label>
            <Input
              type="text"
              placeholder="Disciplina"
              className="h-8 text-sm w-full"
              value={meetingDisciplina}
              onChange={(e) => setMeetingDisciplina(e.target.value)}
            />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Detalhes
            </label>
            <Input
              type="text"
              placeholder="Detalhes da reunião"
              className="h-8 text-sm w-full"
              value={meetingDetalhes}
              onChange={(e) => setMeetingDetalhes(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Resumo
            </label>
            <Input
              type="text"
              placeholder="Resumo da reunião"
              className="h-8 text-sm w-full"
              value={meetingResumo}
              onChange={(e) => setMeetingResumo(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Participantes
            </label>
            {/* Add Participant - Input with button */}
            <div className="flex items-center gap-1">
              <Input
                type="text"
                placeholder="Nome do participante"
                className="h-8 text-sm flex-1"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
              />
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 px-2 flex-shrink-0"
                onClick={handleAddParticipant}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        {/* Participant Tags - Display below input */}
        {tempParticipants.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tempParticipants.map((participant, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-0.5 flex items-center gap-1"
              >
                {participant}
                <button
                  onClick={() => handleRemoveParticipant(index)}
                  className="hover:bg-muted rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

