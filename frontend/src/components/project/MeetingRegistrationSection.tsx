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
  const addDocument = useProjectStore((state) => state.addDocument);
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

  // Handler to update meeting data
  const handleMeetingDataChange = useCallback((value: string) => {
    setMeetingData(value);
  }, []);

  // Handler to update meeting number
  const handleMeetingNumeroChange = useCallback((value: string) => {
    setMeetingNumero(value);
  }, []);
  
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
    } else if (!isEditMode && !currentMeeting) {
      // When exiting edit mode (context cleared), clear the form
      console.log('[MeetingRegistration] Exiting edit mode - clearing form');
      setMeetingData('');
      setMeetingNumero('');
      setMeetingDetalhes('');
      setMeetingFornecedor('');
      setMeetingDisciplina('');
      setMeetingResumo('');
      setNewParticipant('');
      setTempParticipants([]);
    }
  }, [isEditMode, currentMeeting]);

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
      const allDocuments = useProjectStore.getState().documents;

      console.log('[MeetingRegistration] Visible documents:', visibleDocuments.length);
      console.log('[MeetingRegistration] Current meetings count:', currentMeetings.length);

      // ALWAYS CREATE NEW MEETING (even when editing from meeting-environment)
      // This keeps the original meeting intact in meeting-environment
      const newMeetingId = uuidv4();
      console.log('[MeetingRegistration] Creating NEW meeting:', newMeetingId);
      
      let finalDocumentIds: string[] = [];
      let finalDocumentItemNumbers: number[] = [];
      
      if (actualIsEditMode && actualEditingMeetingId) {
        // EDIT MODE: Duplicate the temporary edited documents for the new meeting
        console.log('[MeetingRegistration] EDIT MODE - Creating new meeting from edited documents');
        
        // Get the temp duplicate IDs from the context store
        const contextState = useMeetingContextStore.getState();
        const tempDuplicateIds = new Set(contextState.tempDuplicateIds || []);
        
        console.log('[MeetingRegistration] Temp duplicate IDs:', Array.from(tempDuplicateIds));
        
        // For each visible document, duplicate it for the new meeting
        for (const doc of visibleDocuments) {
          if (tempDuplicateIds.has(doc.id)) {
            // This is a temp duplicate that was edited - duplicate it for the new meeting
            console.log('[MeetingRegistration] Creating final copy of edited document:', doc.id, '(item', doc.numeroItem, ')');
            
            // Create a new document with the edited data
            const newDocData = {
              projectId: selectedProjectId,
              numeroItem: doc.numeroItem,
              dataInicio: doc.dataInicio,
              dataFim: doc.dataFim,
              documento: doc.documento,
              detalhe: doc.detalhe,
              revisao: doc.revisao,
              responsavel: doc.responsavel,
              status: doc.status, // This will have the edited status!
              area: doc.area,
              isCleared: doc.isCleared,
              attachments: doc.attachments ? [...doc.attachments] : undefined,
              participants: doc.participants ? [...doc.participants] : undefined,
              history: doc.history ? [...doc.history] : undefined,
            };
            
            // Add the final document for the new meeting
            await addDocument(newDocData);
            
            // Get the newly created document ID
            await new Promise(resolve => setTimeout(resolve, 50));
            const updatedDocuments = useProjectStore.getState().documents;
            const newDoc = updatedDocuments[updatedDocuments.length - 1];
            
            finalDocumentIds.push(newDoc.id);
            finalDocumentItemNumbers.push(newDoc.numeroItem);
            console.log('[MeetingRegistration] Created final document with ID:', newDoc.id);
          } else {
            // This is a newly added document (not from temp duplicates) - use as is
            console.log('[MeetingRegistration] New document added during edit:', doc.id, '(item', doc.numeroItem, ')');
            finalDocumentIds.push(doc.id);
            finalDocumentItemNumbers.push(doc.numeroItem);
          }
        }
        
        console.log('[MeetingRegistration] Final document IDs for new meeting:', finalDocumentIds);
        
        // CLEANUP: Delete the temporary duplicate documents
        console.log('[MeetingRegistration] Cleaning up temporary duplicates...');
        const deleteDocument = useProjectStore.getState().deleteDocument;
        for (const tempId of tempDuplicateIds) {
          console.log('[MeetingRegistration] Deleting temp duplicate:', tempId);
          await deleteDocument(tempId);
        }
        console.log('[MeetingRegistration] ✓ Temporary duplicates cleaned up');
      } else {
        // CREATE MODE: Use visible documents as is
        finalDocumentIds = visibleDocuments.map(doc => doc.id);
        finalDocumentItemNumbers = visibleDocuments.map(doc => doc.numeroItem);
        console.log('[MeetingRegistration] CREATE mode - using document IDs:', finalDocumentIds);
      }
      
      const newMeeting: MeetingMetadata = {
        id: newMeetingId,
        data: meetingData,
        numeroAta: meetingNumero,
        detalhes: meetingDetalhes.trim() || undefined,
        fornecedor: meetingFornecedor.trim() || undefined,
        disciplina: meetingDisciplina.trim() || undefined,
        resumo: meetingResumo.trim() || undefined,
        participants: tempParticipants,
        relatedDocumentIds: finalDocumentIds, // Use document IDs for filtering
        relatedItems: finalDocumentItemNumbers, // Keep numbers for display
        createdAt: new Date().toISOString(),
      };

      const updatedMeetings = [...currentMeetings, newMeeting];
      await updateProject(selectedProjectId, { meetings: updatedMeetings });
      console.log('[MeetingRegistration] New meeting created successfully, total meetings now:', updatedMeetings.length);
      
      toast.success(actualIsEditMode ? 'Nova reunião criada com sucesso!' : 'Reunião adicionada com sucesso!');
      
      // IMPORTANT: Clear meeting context FIRST to trigger table refresh
      console.log('[MeetingRegistration] Clearing meeting context...');
      clearMeetingContext();
      
      // Then reset all form fields - CLEAR EVERYTHING
      console.log('[MeetingRegistration] Clearing all form fields...');
      setMeetingData('');
      setMeetingNumero('');
      setMeetingDetalhes('');
      setMeetingFornecedor('');
      setMeetingDisciplina('');
      setMeetingResumo('');
      setNewParticipant('');
      setTempParticipants([]);
      
      // Verify the context is actually cleared
      const contextCheck = useMeetingContextStore.getState();
      console.log('[MeetingRegistration] ✓ Form cleared, ready for next meeting');
      console.log('[MeetingRegistration] ✓ Context verification - isEditMode:', contextCheck.isEditMode, 'editingMeetingId:', contextCheck.editingMeetingId);
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast.error('Erro ao salvar reunião. Tente novamente.');
    }
  }, [meetingData, meetingNumero, meetingDetalhes, meetingFornecedor, meetingDisciplina, meetingResumo, tempParticipants, projects, selectedProjectId, updateProject, addDocument, clearMeetingContext]);

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
            onClick={async () => {
              console.log('[MeetingRegistration] Canceling edit mode');
              
              // CLEANUP: Delete temporary duplicate documents
              const contextState = useMeetingContextStore.getState();
              const tempDuplicateIds = contextState.tempDuplicateIds || [];
              
              if (tempDuplicateIds.length > 0) {
                console.log('[MeetingRegistration] Cleaning up', tempDuplicateIds.length, 'temporary duplicates...');
                const deleteDocument = useProjectStore.getState().deleteDocument;
                for (const tempId of tempDuplicateIds) {
                  console.log('[MeetingRegistration] Deleting temp duplicate:', tempId);
                  await deleteDocument(tempId);
                }
                console.log('[MeetingRegistration] ✓ Temporary duplicates cleaned up');
              }
              
              // Clear context first to trigger table refresh
              clearMeetingContext();
              // Then clear ALL form fields
              setMeetingData('');
              setMeetingNumero('');
              setMeetingDetalhes('');
              setMeetingFornecedor('');
              setMeetingDisciplina('');
              setMeetingResumo('');
              setNewParticipant('');
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
                
                handleMeetingDataChange(value);
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
              onChange={(e) => handleMeetingNumeroChange(e.target.value)}
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

