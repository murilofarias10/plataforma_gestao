import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjectStore } from "@/stores/projectStore";
import { useMeetingReportStore } from "@/stores/meetingReportStore";
import { useMeetingContextStore } from "@/stores/meetingContextStore";
import { useMeetingFilterStore } from "@/stores/meetingFilterStore";
import { usePermissions } from "@/hooks/usePermissions";
import { CalendarDays, Trash2, Download, AlertTriangle, Edit, ChevronDown, ChevronRight, FileText, X, Circle, Eye } from "lucide-react";
import type { MeetingMetadata, ProjectDocument } from "@/types/project";

const MeetingEnvironment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projects = useProjectStore((state) => state.projects);
  const documents = useProjectStore((state) => state.documents);
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const updateProject = useProjectStore((state) => state.updateProject);
  const deleteDocument = useProjectStore((state) => state.deleteDocument);
  const getSelectedProject = useProjectStore((state) => state.getSelectedProject);
  const loadDocumentsForProject = useProjectStore((state) => state.loadDocumentsForProject);
  const loadData = useProjectStore((state) => state.loadData);

  const selectedProject = getSelectedProject();

  // Meeting filters - use store instead of local state
  const filters = useMeetingFilterStore((state) => state.filters);
  const setFilters = useMeetingFilterStore((state) => state.setFilters);
  const setFilteredMeetings = useMeetingFilterStore((state) => state.setFilteredMeetings);

  const meetings = useMemo(() => {
    if (!selectedProjectId) {
      return [];
    }
    const project = projects.find((p) => p.id === selectedProjectId);
    return project?.meetings ?? [];
  }, [projects, selectedProjectId]);

  // Filtered meetings based on filter criteria
  const filteredMeetings = useMemo(() => {
    const filtered = meetings.filter((meeting) => {
      // Filter by data
      if (filters.data && !meeting.data?.toLowerCase().includes(filters.data.toLowerCase())) {
        return false;
      }
      // Filter by numero ata
      if (filters.numeroAta && !meeting.numeroAta?.toLowerCase().includes(filters.numeroAta.toLowerCase())) {
        return false;
      }
      // Filter by participante
      if (filters.participante) {
        const hasParticipant = meeting.participants?.some(p => 
          p.toLowerCase().includes(filters.participante.toLowerCase())
        );
        if (!hasParticipant) return false;
      }
      // Filter by fornecedor
      if (filters.fornecedor && !meeting.fornecedor?.toLowerCase().includes(filters.fornecedor.toLowerCase())) {
        return false;
      }
      // Filter by disciplina
      if (filters.disciplina && !meeting.disciplina?.toLowerCase().includes(filters.disciplina.toLowerCase())) {
        return false;
      }
      return true;
    });
    
    // Update store with filtered meetings so Sidebar can access them
    setFilteredMeetings(filtered);
    
    return filtered;
  }, [meetings, filters, setFilteredMeetings]);

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const resetFilters = useMeetingFilterStore((state) => state.resetFilters);
  
  const clearAllFilters = () => {
    resetFilters();
  };

  // Format date input to Brazilian format (DD-MM-YYYY)
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
    
    // Limit to 8 digits (DDMMYYYY)
    value = value.slice(0, 8);
    
    // Add hyphens automatically
    if (value.length >= 3) {
      value = value.slice(0, 2) + '-' + value.slice(2);
    }
    if (value.length >= 6) {
      value = value.slice(0, 5) + '-' + value.slice(5);
    }
    
    setFilters({ data: value });
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingMetadata | null>(null);
  const [expandedMeetingItems, setExpandedMeetingItems] = useState<Set<string>>(new Set());
  const [editConflictDialogOpen, setEditConflictDialogOpen] = useState(false);
  const [pendingMeetingToEdit, setPendingMeetingToEdit] = useState<MeetingMetadata | null>(null);
  const { openMeetingDialog } = useMeetingReportStore();
  const { canDelete } = usePermissions();
  const { startEditMeeting, isEditMode, clearMeetingContext, editingMeetingId } = useMeetingContextStore();

  const toggleMeetingItems = useCallback((meetingId: string) => {
    setExpandedMeetingItems((prev) => {
      const next = new Set(prev);
      if (next.has(meetingId)) {
        next.delete(meetingId);
      } else {
        next.add(meetingId);
      }
      return next;
    });
  }, []);

  const handleOpenDeleteDialog = useCallback((meeting: MeetingMetadata) => {
    setMeetingToDelete(meeting);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setMeetingToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedProjectId || !meetingToDelete) return;
    
    console.log('[MeetingEnvironment] ==========================================');
    console.log('[MeetingEnvironment] PERMANENTLY DELETING meeting:', meetingToDelete.id);
    console.log('[MeetingEnvironment] Will also delete document IDs:', meetingToDelete.relatedDocumentIds);
    
    // Check if we're deleting the meeting that's currently being edited
    const { isEditMode, editingMeetingId, clearMeetingContext } = useMeetingContextStore.getState();
    if (isEditMode && editingMeetingId === meetingToDelete.id) {
      console.log('[MeetingEnvironment] ⚠️ This meeting is currently being edited - clearing context first');
      clearMeetingContext();
    }
    
    try {
      // Step 1: Delete all documents (items) from this meeting
      // Since each meeting now has its own unique document copies, we can safely delete them all
      const documentIds = meetingToDelete.relatedDocumentIds || [];
      if (documentIds.length > 0) {
        console.log('[MeetingEnvironment] Step 1: Deleting', documentIds.length, 'documents from meeting...');
        
        for (const docId of documentIds) {
          console.log('[MeetingEnvironment] Deleting document:', docId);
          await deleteDocument(docId);
        }
        
        console.log('[MeetingEnvironment] ✓ All documents deleted (including attachments)');
      } else {
        console.log('[MeetingEnvironment] No documents to delete');
      }
      
      // Step 2: Delete the meeting itself
      console.log('[MeetingEnvironment] Step 2: Deleting meeting from project...');
      const project = projects.find((p) => p.id === selectedProjectId);
      const currentMeetings = project?.meetings ?? [];
      const updatedMeetings = currentMeetings.filter((meeting) => meeting.id !== meetingToDelete.id);
      
      await updateProject(selectedProjectId, { meetings: updatedMeetings });
      
      console.log('[MeetingEnvironment] ✓✓✓ MEETING AND ALL ITS ITEMS PERMANENTLY DELETED ✓✓✓');
      console.log('[MeetingEnvironment] Meetings before:', currentMeetings.length, '→ after:', updatedMeetings.length);
      
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('[MeetingEnvironment] Error deleting meeting:', error);
      handleCloseDeleteDialog();
    }
  }, [projects, selectedProjectId, updateProject, deleteDocument, meetingToDelete, handleCloseDeleteDialog]);

  const proceedWithEditMeeting = useCallback(async (meeting: MeetingMetadata) => {
    console.log('[MeetingEnvironment] Proceeding with edit for meeting:', meeting.id);
    console.log('[MeetingEnvironment] Meeting document IDs:', meeting.relatedDocumentIds);
    console.log('[MeetingEnvironment] Meeting item numbers (legacy):', meeting.relatedItems);
    
    // CRITICAL FIX: Duplicate all documents from this meeting BEFORE entering edit mode
    // This ensures edits happen on copies, not the original documents
    const originalDocIds = meeting.relatedDocumentIds || [];
    const duplicateDocIds: string[] = [];
    
    if (originalDocIds.length > 0) {
      console.log('[MeetingEnvironment] Creating temporary duplicates of', originalDocIds.length, 'documents...');
      
      // Get fresh documents from store to ensure we have the latest state
      const { addDocument, documents: freshDocuments } = useProjectStore.getState();
      
      for (const originalDocId of originalDocIds) {
        const originalDoc = freshDocuments.find(d => d.id === originalDocId);
        if (originalDoc) {
          // Create a duplicate for editing (without id, createdAt, updatedAt)
          // IMPORTANT: Preserve history to track modifications across meetings
          const docCopy = {
            projectId: originalDoc.projectId,
            numeroItem: originalDoc.numeroItem,
            dataInicio: originalDoc.dataInicio,
            dataFim: originalDoc.dataFim,
            documento: originalDoc.documento,
            detalhe: originalDoc.detalhe,
            revisao: originalDoc.revisao,
            responsavel: originalDoc.responsavel,
            status: originalDoc.status,
            area: originalDoc.area,
            attachments: originalDoc.attachments ? [...originalDoc.attachments] : [],
            isCleared: originalDoc.isCleared,
            participants: originalDoc.participants ? [...originalDoc.participants] : [],
            history: originalDoc.history ? [...originalDoc.history] : [],
            meetings: originalDoc.meetings ? [...originalDoc.meetings] : [],
          };
          
          await addDocument(docCopy);
          
          // Get the newly created document ID
          await new Promise(resolve => setTimeout(resolve, 50));
          const updatedDocuments = useProjectStore.getState().documents;
          const newDoc = updatedDocuments[updatedDocuments.length - 1];
          duplicateDocIds.push(newDoc.id);
          
          console.log('[MeetingEnvironment] Created duplicate:', originalDocId, '→', newDoc.id);
        }
      }
      
      console.log('[MeetingEnvironment] ✓ All documents duplicated for editing');
      console.log('[MeetingEnvironment] Original IDs:', originalDocIds);
      console.log('[MeetingEnvironment] Duplicate IDs:', duplicateDocIds);
    }
    
    // Start edit mode with duplicated document IDs
    const meetingWithDuplicates = {
      ...meeting,
      relatedDocumentIds: duplicateDocIds.length > 0 ? duplicateDocIds : originalDocIds,
    };
    
    // Pass original IDs and temp duplicate IDs to the context store
    startEditMeeting(meetingWithDuplicates, originalDocIds, duplicateDocIds);
    navigate("/project-tracker", { state: { focus: "meetings", editMode: true } });
  }, [navigate, startEditMeeting]);

  const handleEditMeeting = useCallback(async (meeting: MeetingMetadata) => {
    console.log('[MeetingEnvironment] Starting edit for meeting:', meeting.id);
    
    // CHECK: Is there already an active edit in progress?
    const currentEditState = useMeetingContextStore.getState();
    if (currentEditState.isEditMode) {
      console.log('[MeetingEnvironment] ⚠️ Active edit detected! Meeting:', currentEditState.editingMeetingId);
      console.log('[MeetingEnvironment] User is trying to open another meeting:', meeting.id);
      
      // Store the meeting to edit and show conflict dialog
      setPendingMeetingToEdit(meeting);
      setEditConflictDialogOpen(true);
      return;
    }
    
    // No active edit, proceed with opening the meeting
    await proceedWithEditMeeting(meeting);
  }, [proceedWithEditMeeting]);

  const getMeetingRelatedDocuments = useCallback((meeting: MeetingMetadata): ProjectDocument[] => {
    // Use relatedDocumentIds (new) or fall back to relatedItems (old) for backward compatibility
    if (meeting.relatedDocumentIds && meeting.relatedDocumentIds.length > 0) {
      // New method: filter by document IDs
      return documents.filter(doc => meeting.relatedDocumentIds?.includes(doc.id));
    } else if (meeting.relatedItems && meeting.relatedItems.length > 0) {
      // Old method: filter by item numbers (backward compatibility)
      return documents.filter(doc => meeting.relatedItems?.includes(doc.numeroItem));
    }
    return [];
  }, [documents]);

  // Handle pending meeting to edit after save
  useEffect(() => {
    const handleOpenMeeting = async () => {
      const locationState = location.state as any;
      if (locationState?.openMeetingToEdit) {
        console.log('[MeetingEnvironment] Opening pending meeting after save:', locationState.openMeetingToEdit.id);
        
        // Get the current context state BEFORE clearing
        const contextState = useMeetingContextStore.getState();
        const oldTempIds = contextState.tempDuplicateIds || [];
        
        console.log('[MeetingEnvironment] Old temp duplicate IDs to clean up:', oldTempIds);
        
        // Clear the previous meeting context first
        const { clearMeetingContext } = useMeetingContextStore.getState();
        clearMeetingContext();
        console.log('[MeetingEnvironment] Cleared previous meeting context');
        
        // CRITICAL: Clean up any remaining temporary duplicates from the previous meeting
        if (oldTempIds.length > 0) {
          console.log('[MeetingEnvironment] Cleaning up remaining temp duplicates:', oldTempIds);
          const { deleteDocument } = useProjectStore.getState();
          
          // Delete all temp duplicates and wait for them to complete
          const deletePromises = oldTempIds.map(tempId => {
            console.log('[MeetingEnvironment] Deleting temp duplicate:', tempId);
            return deleteDocument(tempId);
          });
          
          // Wait for all deletions to complete
          await Promise.all(deletePromises);
          console.log('[MeetingEnvironment] ✓ All temp duplicates deleted');
        }
        
        // CRITICAL FIX: Reload data from backend to ensure clean state
        // This ensures that documents from the saved meeting are properly assigned and hidden
        console.log('[MeetingEnvironment] Reloading data from backend to ensure clean state...');
        await loadData();
        console.log('[MeetingEnvironment] ✓ Data reloaded from backend');
        
        // Small delay to ensure state updates after reload
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get fresh meeting data from reloaded projects to ensure we have the latest state
        const { projects: reloadedProjects } = useProjectStore.getState();
        const project = reloadedProjects.find(p => p.id === selectedProjectId);
        const freshMeeting = project?.meetings?.find(m => m.id === locationState.openMeetingToEdit.id);
        
        if (!freshMeeting) {
          console.error('[MeetingEnvironment] Meeting not found after reload:', locationState.openMeetingToEdit.id);
          return;
        }
        
        console.log('[MeetingEnvironment] Now proceeding with edit for new meeting');
        proceedWithEditMeeting(freshMeeting);
      }
    };
    
    handleOpenMeeting();
  }, [location.state, proceedWithEditMeeting, loadData, selectedProjectId]);

  return (
    <div className="h-full bg-background overflow-hidden">
      <main className="container mx-auto px-6 py-6 space-y-6 h-full flex flex-col">
        <section className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-4 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Ambiente de Reuniões
                {selectedProject && (
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    - {selectedProject.name}
                  </span>
                )}
              </h2>
            </div>
            {/* KUBIK Logo - Prominent company branding */}
            <div className="bg-card border border-border rounded-lg p-2 shadow-sm">
              <img 
                src="/kubik-logo_2.png" 
                alt="KUBIK" 
                className="h-16 w-auto"
              />
            </div>
          </div>

          {!selectedProject && (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="py-12 text-center text-muted-foreground">
                Selecione um projeto para visualizar o histórico de reuniões.
              </CardContent>
            </Card>
          )}

          {selectedProject && (
            <Card className="border border-border flex-1 flex flex-col min-h-0">
              <CardHeader className="border-b border-border flex-shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">Reuniões do Projeto</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>{meetings.length} reuniões registradas</span>
                    </div>
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="flex items-center gap-2"
                    >
                      <X className="h-3 w-3" />
                      Limpar filtros ({activeFiltersCount})
                    </Button>
                  )}
                </div>
                
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                  <Input
                    placeholder="Data..."
                    value={filters.data}
                    onChange={handleDateChange}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Número da Ata..."
                    value={filters.numeroAta}
                    onChange={(e) => setFilters({ numeroAta: e.target.value })}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Participante..."
                    value={filters.participante}
                    onChange={(e) => setFilters({ participante: e.target.value })}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Fornecedor..."
                    value={filters.fornecedor}
                    onChange={(e) => setFilters({ fornecedor: e.target.value })}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Disciplina..."
                    value={filters.disciplina}
                    onChange={(e) => setFilters({ disciplina: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                {filteredMeetings.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    {meetings.length === 0 ? 'Nenhuma reunião registrada até o momento.' : 'Nenhuma reunião encontrada com os filtros aplicados.'}
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="divide-y divide-border">
                      {filteredMeetings
                        .slice()
                        .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
                        .map((meeting, index) => {
                          const relatedDocuments = getMeetingRelatedDocuments(meeting);
                          const hasRelatedItems = relatedDocuments.length > 0;
                          const isItemsExpanded = expandedMeetingItems.has(meeting.id);
                          const isCurrentlyOpen = editingMeetingId === meeting.id;
                          
                          return (
                            <div key={meeting.id} className="border-b border-border last:border-b-0 relative">
                              <div 
                                className="p-4 space-y-3 relative"
                                style={{ 
                                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#6BDDA9'
                                }}
                              >
                                {/* First Row: Horizontal fields matching filter layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 items-center">
                                  <div className="text-xs">
                                    <span className="font-semibold text-foreground">Data:</span>{' '}
                                    <span className="text-muted-foreground">{meeting.data}</span>
                                  </div>
                                  <div className="text-xs">
                                    <span className="font-semibold text-foreground">Número da Ata:</span>{' '}
                                    <span className="text-muted-foreground">{meeting.numeroAta}</span>
                                  </div>
                                  {meeting.participants.length > 0 ? (
                                    <div className="text-xs">
                                      <span className="font-semibold text-foreground">Participantes:</span>{' '}
                                      <span className="text-muted-foreground">{meeting.participants.join(', ')}</span>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground/60">-</div>
                                  )}
                                  {meeting.fornecedor ? (
                                    <div className="text-xs">
                                      <span className="font-semibold text-foreground">Fornecedor:</span>{' '}
                                      <span className="text-muted-foreground">{meeting.fornecedor}</span>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground/60">-</div>
                                  )}
                                  {meeting.disciplina ? (
                                    <div className="text-xs">
                                      <span className="font-semibold text-foreground">Disciplina:</span>{' '}
                                      <span className="text-muted-foreground">{meeting.disciplina}</span>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground/60">-</div>
                                  )}
                                </div>

                                {/* Second Row: Description field (full width, no truncation) */}
                                <div>
                                  <div className="text-xs font-semibold text-foreground mb-1">Detalhes</div>
                                  <div className="text-sm text-muted-foreground">
                                    {meeting.detalhes ? (
                                      <p className="whitespace-pre-wrap">{meeting.detalhes}</p>
                                    ) : (
                                      <p className="italic text-muted-foreground/60">Sem detalhes</p>
                                    )}
                                  </div>
                                </div>

                                {/* Third Row: API field with action buttons */}
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
                                  {/* Resumo/API Column */}
                                  <div>
                                    <div className="text-xs font-semibold text-foreground mb-1">Resumo</div>
                                    <div className="text-sm text-muted-foreground">
                                      {meeting.resumo ? (
                                        <p className="line-clamp-4">{meeting.resumo}</p>
                                      ) : (
                                        <p className="italic text-muted-foreground/60">API FROM GPT</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-start gap-2 justify-end flex-wrap">
                                    {isCurrentlyOpen && (
                                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500 text-white text-xs font-medium shadow-sm">
                                        <Circle className="h-2.5 w-2.5 fill-current" />
                                        <span>Aberto</span>
                                      </div>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditMeeting(meeting)}
                                      className="h-9 w-9 rounded-full border border-border bg-muted hover:bg-muted/80"
                                      aria-label="Editar reunião"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openMeetingDialog(meeting)}
                                      className="h-9 w-9 rounded-full border border-border bg-muted hover:bg-muted/80"
                                      aria-label="Gerar relatório da reunião"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {canDelete && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleOpenDeleteDialog(meeting)}
                                        className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        aria-label="Excluir reunião"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Third Row: Expandable items button */}
                                {hasRelatedItems && (
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => toggleMeetingItems(meeting.id)}
                                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                                    >
                                      {isItemsExpanded ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                      <FileText className="h-3 w-3" />
                                      <span>{relatedDocuments.length} {relatedDocuments.length === 1 ? 'item' : 'itens'}</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Expandable Related Items - Table View */}
                              {hasRelatedItems && isItemsExpanded && (
                                <div 
                                  className="border-t border-border"
                                  style={{ backgroundColor: index % 2 === 0 ? '#f8f8f8' : '#5bc699' }}
                                >
                                  <div className="px-4 pt-3 pb-2">
                                    <div className="text-xs font-semibold text-foreground mb-3">Itens da Reunião:</div>
                                    
                                    {/* Table Container with Scroll */}
                                    <div className="bg-background border border-border rounded-lg overflow-hidden">
                                      <div className="max-h-[400px] overflow-auto">
                                        <table className="w-full text-xs">
                                          <thead className="bg-muted/50 sticky top-0 z-10">
                                            <tr className="border-b border-border">
                                              <th className="px-3 py-2 text-left font-semibold text-foreground w-16">Nº Item</th>
                                              <th className="px-3 py-2 text-left font-semibold text-foreground w-24">Data Início</th>
                                              <th className="px-3 py-2 text-left font-semibold text-foreground w-24">Data Fim</th>
                                              <th className="px-3 py-2 text-left font-semibold text-foreground">Tópico</th>
                                              <th className="px-3 py-2 text-left font-semibold text-foreground">Detalhe</th>
                                              <th className="px-3 py-2 text-left font-semibold text-foreground w-28">Responsável</th>
                                              <th className="px-3 py-2 text-left font-semibold text-foreground w-28">Status</th>
                                              <th className="px-3 py-2 text-left font-semibold text-foreground w-20">Anexos</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {relatedDocuments.map((doc, index) => (
                                              <tr 
                                                key={doc.id}
                                                className={`border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${
                                                  index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                                }`}
                                              >
                                                <td className="px-3 py-2 text-center font-medium text-muted-foreground">
                                                  {doc.numeroItem}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                  {doc.dataInicio || '-'}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                  {doc.dataFim || '-'}
                                                </td>
                                                <td className="px-3 py-2 text-foreground">
                                                  <div className="line-clamp-2" title={doc.documento}>
                                                    {doc.documento || '-'}
                                                  </div>
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                  <div className="line-clamp-2" title={doc.detalhe}>
                                                    {doc.detalhe || '-'}
                                                  </div>
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                  {doc.responsavel || '-'}
                                                </td>
                                                <td className="px-3 py-2">
                                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    doc.status === 'Finalizado' ? 'bg-green-100 text-green-800' :
                                                    doc.status === 'Em andamento' ? 'bg-yellow-100 text-yellow-800' :
                                                    doc.status === 'A iniciar' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                  }`}>
                                                    {doc.status}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2 text-center text-muted-foreground">
                                                  {doc.attachments && doc.attachments.length > 0 ? (
                                                    <span className="font-medium">{doc.attachments.length}</span>
                                                  ) : (
                                                    '-'
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                    
                                    {/* Summary */}
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      Total: {relatedDocuments.length} {relatedDocuments.length === 1 ? 'item' : 'itens'}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent className="sm:max-w-md backdrop-blur-md bg-background/95 border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir Reunião
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>Tem certeza que deseja excluir esta reunião?</p>
              <p className="text-destructive font-semibold">
                ⚠️ ATENÇÃO: Todos os itens e anexos desta reunião serão permanentemente excluídos!
              </p>
              <p className="text-xs">Esta ação não pode ser desfeita.</p>
            </DialogDescription>
          </DialogHeader>

          {meetingToDelete && (
            <div className="space-y-2 rounded-md border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Data:</span>
                <span className="text-muted-foreground">{meetingToDelete.data || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Número da Ata:</span>
                <span className="text-muted-foreground">{meetingToDelete.numeroAta || "-"}</span>
              </div>
              {meetingToDelete.relatedDocumentIds && meetingToDelete.relatedDocumentIds.length > 0 && (
                <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t border-destructive/20">
                  <span className="font-semibold text-destructive">Itens que serão excluídos:</span>
                  <span className="text-destructive font-bold">{meetingToDelete.relatedDocumentIds.length}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={handleCloseDeleteDialog}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Conflict Dialog - When user tries to edit another meeting while one is already being edited */}
      <Dialog open={editConflictDialogOpen} onOpenChange={setEditConflictDialogOpen}>
        <DialogContent className="sm:max-w-md backdrop-blur-md bg-background/95 border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Reunião em Edição
            </DialogTitle>
            <DialogDescription className="space-y-3 mt-4">
              <p>Você está editando uma reunião no momento. Deseja salvar como uma nova reunião e abrir a outra?</p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditConflictDialogOpen(false);
                setPendingMeetingToEdit(null);
              }}
            >
              Voltar
            </Button>
            <Button
              onClick={() => {
                console.log('[MeetingEnvironment] User chose to save and open new meeting');
                setEditConflictDialogOpen(false);
                // Navigate to project-tracker to save first, then open the new meeting
                // Pass autoSave flag to trigger save immediately
                navigate("/project-tracker", { state: { focus: "meetings", editMode: true, pendingMeetingToEdit, autoSave: true } });
                setPendingMeetingToEdit(null);
              }}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingEnvironment;

