import React, { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MeetingMetadata } from '@/types/project';
import { Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { v4 as uuidv4 } from 'uuid';
import { useProjectStore } from '@/stores/projectStore';
import { useMeetingContextStore } from '@/stores/meetingContextStore';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { parseBRDateLocal } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

export interface MeetingRegistrationHandle {
  handleAddMeeting: () => Promise<void>;
  canAddMeeting: boolean;
  isEditMode: boolean;
  cancelEdit: () => Promise<void>;
  hasItemsInGrid: () => boolean;
}

interface MeetingRegistrationProps {
  onValidityChange?: (isValid: boolean) => void;
}

export const MeetingRegistrationSection = forwardRef<MeetingRegistrationHandle, MeetingRegistrationProps>(({ onValidityChange }, ref) => {
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
  const updateMeetingData = useMeetingContextStore((state) => state.updateMeetingData);
  
  const selectedProject = getSelectedProject();
  
  const [meetingData, setMeetingData] = useState('');
  const [meetingNumero, setMeetingNumero] = useState('');
  const [meetingDetalhes, setMeetingDetalhes] = useState('');
  const [meetingFornecedor, setMeetingFornecedor] = useState('');
  const [meetingDisciplina, setMeetingDisciplina] = useState('');
  const [meetingResumo, setMeetingResumo] = useState('');
  const [newParticipant, setNewParticipant] = useState('');
  const [tempParticipants, setTempParticipants] = useState<string[]>([]);

  // Handler to update meeting data - saves to store in real-time
  const handleMeetingDataChange = useCallback((value: string) => {
    setMeetingData(value);
    // Save to store in real-time
    updateMeetingData({ data: value });
  }, [updateMeetingData]);

  // Handler to update meeting number - saves to store in real-time
  const handleMeetingNumeroChange = useCallback((value: string) => {
    setMeetingNumero(value);
    // Save to store in real-time
    updateMeetingData({ numeroAta: value });
  }, [updateMeetingData]);
  
  // Sync form with currentMeeting from store (both edit mode and create mode)
  // This restores form data when currentMeeting changes (e.g., after adding a row)
  // Use a ref to track the last currentMeeting to avoid unnecessary updates
  const lastMeetingRef = useRef<MeetingMetadata | null>(null);
  
  useEffect(() => {
    // Only restore if currentMeeting actually changed (different reference or different id)
    const meetingChanged = 
      !lastMeetingRef.current || 
      !currentMeeting || 
      lastMeetingRef.current.id !== currentMeeting.id ||
      lastMeetingRef.current.data !== currentMeeting.data ||
      lastMeetingRef.current.numeroAta !== currentMeeting.numeroAta ||
      lastMeetingRef.current.detalhes !== currentMeeting.detalhes ||
      lastMeetingRef.current.fornecedor !== currentMeeting.fornecedor ||
      lastMeetingRef.current.disciplina !== currentMeeting.disciplina ||
      lastMeetingRef.current.resumo !== currentMeeting.resumo ||
      JSON.stringify(lastMeetingRef.current.participants) !== JSON.stringify(currentMeeting.participants);
    
    if (currentMeeting && meetingChanged) {
      // Restore form from store
      setMeetingData(currentMeeting.data || '');
      setMeetingNumero(currentMeeting.numeroAta || '');
      setMeetingDetalhes(currentMeeting.detalhes || '');
      setMeetingFornecedor(currentMeeting.fornecedor || '');
      setMeetingDisciplina(currentMeeting.disciplina || '');
      setMeetingResumo(currentMeeting.resumo || '');
      setTempParticipants(currentMeeting.participants || []);
      lastMeetingRef.current = currentMeeting;
    } else if (!currentMeeting && lastMeetingRef.current) {
      // When context is cleared, clear the form
      const contextState = useMeetingContextStore.getState();
      if (!contextState.isEditMode && !contextState.currentMeeting) {
        // Only clear if there's truly no meeting context
        setMeetingData('');
        setMeetingNumero('');
        setMeetingDetalhes('');
        setMeetingFornecedor('');
        setMeetingDisciplina('');
        setMeetingResumo('');
        setNewParticipant('');
        setTempParticipants([]);
        lastMeetingRef.current = null;
      }
    }
  }, [currentMeeting]);

  // Log current mode for debugging
  useEffect(() => {
    console.log('[MeetingRegistration] Current mode:', isEditMode ? `EDIT mode (${editingMeetingId})` : 'CREATE mode (new meeting)');
  }, [isEditMode, editingMeetingId]);

  const handleAddParticipant = useCallback(() => {
    if (newParticipant.trim()) {
      const updatedParticipants = [...tempParticipants, newParticipant.trim()];
      setTempParticipants(updatedParticipants);
      setNewParticipant('');
      // Save to store in real-time
      updateMeetingData({ participants: updatedParticipants });
    }
  }, [newParticipant, tempParticipants, updateMeetingData]);

  const handleRemoveParticipant = useCallback((index: number) => {
    const updatedParticipants = tempParticipants.filter((_, i) => i !== index);
    setTempParticipants(updatedParticipants);
    // Save to store in real-time
    updateMeetingData({ participants: updatedParticipants });
  }, [tempParticipants, updateMeetingData]);


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
              // Deep copy attachments to preserve all fields including fileName
              attachments: doc.attachments ? doc.attachments.map(att => ({
                id: att.id,
                fileName: att.fileName,
                fileSize: att.fileSize,
                fileType: att.fileType,
                uploadedAt: att.uploadedAt,
                filePath: att.filePath
              })) : undefined,
              participants: doc.participants ? [...doc.participants] : undefined,
              history: doc.history ? [...doc.history] : undefined,
            };
            
            // Add the final document for the new meeting
            await addDocument(newDocData);
            
            // Get the newly created document ID
            await new Promise(resolve => setTimeout(resolve, 50));
            const updatedDocuments = useProjectStore.getState().documents;
            const newDoc = updatedDocuments[updatedDocuments.length - 1];
            
            console.log('[MeetingRegistration] Created final document with ID:', newDoc.id);
            
            // CRITICAL: Copy physical files for this new meeting's document
            if (doc.attachments && doc.attachments.length > 0) {
              console.log('[MeetingRegistration] ============================================');
              console.log('[MeetingRegistration] COPYING FILES FOR NEW MEETING');
              console.log('[MeetingRegistration] Source doc:', doc.id, '→ Target doc:', newDoc.id);
              console.log('[MeetingRegistration] Files to copy:', doc.attachments.length);
              console.log('[MeetingRegistration] Files:', doc.attachments.map(a => ({
                fileName: a.fileName,
                filePath: a.filePath
              })));
              console.log('[MeetingRegistration] ============================================');
              
              const copiedAttachments = [];
              for (const attachment of doc.attachments) {
                try {
                  // Extract source location from attachment filePath
                  const pathParts = attachment.filePath.split('/').filter(p => p);
                  if (pathParts.length < 4) {
                    console.warn('[MeetingRegistration] Invalid filePath:', attachment.filePath);
                    continue;
                  }
                  
                  const sourceProjectId = pathParts[1];
                  const sourceDocumentId = pathParts[2];
                  const filename = pathParts[3];
                  
                  console.log('[MeetingRegistration] Copying file:', {
                    from: `${sourceProjectId}/${sourceDocumentId}/${filename}`,
                    to: `${selectedProjectId}/${newDoc.id}/${filename}`,
                    fileName: attachment.fileName
                  });
                  
                  // Copy file via backend API
                  const apiBase = import.meta.env.DEV ? 'http://localhost:3001' : '';
                  const response = await fetch(`${apiBase}/api/files/copy`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sourceProjectId,
                      sourceDocumentId,
                      targetProjectId: selectedProjectId,
                      targetDocumentId: newDoc.id,
                      filename,
                      originalFileName: attachment.fileName
                    })
                  });
                  
                  if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[MeetingRegistration] HTTP error copying file:', response.status, errorText);
                    continue;
                  }
                  
                  const result = await response.json();
                  
                  if (result.success) {
                    // Create new attachment with updated file path
                    copiedAttachments.push({
                      id: attachment.id,
                      fileName: attachment.fileName,
                      fileSize: attachment.fileSize,
                      fileType: attachment.fileType,
                      uploadedAt: attachment.uploadedAt,
                      filePath: result.filePath // New path pointing to copied file
                    });
                    console.log('[MeetingRegistration] ✓ File copied successfully:', result.filePath);
                  } else {
                    console.error('[MeetingRegistration] ✗ Backend reported failure:', result.error);
                  }
                } catch (error) {
                  console.error('[MeetingRegistration] Error copying file:', error);
                }
              }
              
              // Update the document with the new attachment paths
              // IMPORTANT: If some files failed to copy, keep original paths for those
              const finalAttachments = copiedAttachments.length === doc.attachments.length 
                ? copiedAttachments // All files copied successfully
                : doc.attachments; // Some failed, keep original paths
              
              if (finalAttachments.length > 0) {
                const { updateDocument } = useProjectStore.getState();
                await updateDocument(newDoc.id, { attachments: finalAttachments });
                
                if (copiedAttachments.length === doc.attachments.length) {
                  console.log('[MeetingRegistration] ✓ All', copiedAttachments.length, 'files copied successfully - meetings are independent');
                } else {
                  console.warn('[MeetingRegistration] ⚠️ Only', copiedAttachments.length, 'of', doc.attachments.length, 'files copied - using original paths for failed files');
                  toast.warning(`Aviso: Alguns arquivos não puderam ser copiados. As reuniões podem compartilhar alguns arquivos.`);
                }
              }
            }
            
            finalDocumentIds.push(newDoc.id);
            finalDocumentItemNumbers.push(newDoc.numeroItem);
            console.log('[MeetingRegistration] Document ready with independent file copies');
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

  const canAddMeeting = Boolean(meetingData.trim() && meetingNumero.trim());

  const cancelEdit = useCallback(async () => {
    console.log('[MeetingRegistration] Canceling edit mode');
    
    // CLEANUP: Delete temporary duplicate documents
    const contextState = useMeetingContextStore.getState();
    const tempDuplicateIds = contextState.tempDuplicateIds || [];
    const newlyAddedDocumentIds = contextState.newlyAddedDocumentIds || [];
    
    const deleteDocument = useProjectStore.getState().deleteDocument;
    
    // Delete temporary duplicate documents
    if (tempDuplicateIds.length > 0) {
      console.log('[MeetingRegistration] Cleaning up', tempDuplicateIds.length, 'temporary duplicates...');
      for (const tempId of tempDuplicateIds) {
        console.log('[MeetingRegistration] Deleting temp duplicate:', tempId);
        await deleteDocument(tempId);
      }
      console.log('[MeetingRegistration] ✓ Temporary duplicates cleaned up');
    }
    
    // Delete newly added documents during edit mode
    if (newlyAddedDocumentIds.length > 0) {
      console.log('[MeetingRegistration] Cleaning up', newlyAddedDocumentIds.length, 'newly added documents...');
      for (const newDocId of newlyAddedDocumentIds) {
        console.log('[MeetingRegistration] Deleting newly added document:', newDocId);
        await deleteDocument(newDocId);
      }
      console.log('[MeetingRegistration] ✓ Newly added documents cleaned up');
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
  }, [clearMeetingContext]);

  // Check if there are items in the grid
  const hasItemsInGrid = useCallback(() => {
    const visibleDocuments = useProjectStore.getState().getTableDocuments();
    return visibleDocuments.length > 0;
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleAddMeeting,
    canAddMeeting,
    isEditMode,
    cancelEdit,
    hasItemsInGrid
  }), [handleAddMeeting, canAddMeeting, isEditMode, cancelEdit, hasItemsInGrid]);

  // Notify parent when validity changes
  useEffect(() => {
    onValidityChange?.(canAddMeeting);
  }, [canAddMeeting, onValidityChange]);

  if (!selectedProject) {
    return null;
  }

  // Hide entire section for visitors (no create permission)
  if (!canCreate) {
    return null;
  }

  return (
    <div className="space-y-4">
      
      <div className="space-y-3">
        {/* First Row */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Data da Reunião
            </label>
            <div className="relative flex gap-1">
              <Input
                type="text"
                placeholder="dd-mm-aaaa"
                className="h-8 text-sm flex-1"
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    type="button"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 z-[100]" 
                  align="start" 
                  side="top" 
                  sideOffset={8}
                  collisionPadding={24}
                  avoidCollisions={true}
                >
                  <Calendar
                    mode="single"
                    selected={meetingData ? parseBRDateLocal(meetingData) || undefined : undefined}
                    onSelect={(date) => {
                      if (date) {
                        // Format date as dd-mm-aaaa
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        const formattedDate = `${day}-${month}-${year}`;
                        handleMeetingDataChange(formattedDate);
                      }
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
              onChange={(e) => {
                const value = e.target.value;
                setMeetingFornecedor(value);
                // Save to store in real-time
                updateMeetingData({ fornecedor: value });
              }}
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
              onChange={(e) => {
                const value = e.target.value;
                setMeetingDisciplina(value);
                // Save to store in real-time
                updateMeetingData({ disciplina: value });
              }}
            />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Detalhes
            </label>
            <Input
              type="text"
              placeholder="Detalhes da reunião"
              className="h-8 text-sm w-full"
              value={meetingDetalhes}
              onChange={(e) => {
                const value = e.target.value;
                setMeetingDetalhes(value);
                // Save to store in real-time
                updateMeetingData({ detalhes: value });
              }}
            />
          </div>
          {/* Resumo field hidden from user input - kept in backend for future use and auto-filled via API in meeting-environment */}
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
});

MeetingRegistrationSection.displayName = 'MeetingRegistrationSection';
