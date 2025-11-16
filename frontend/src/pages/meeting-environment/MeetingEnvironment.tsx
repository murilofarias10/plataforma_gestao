import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { usePermissions } from "@/hooks/usePermissions";
import { CalendarDays, ListPlus, Trash2, Download, AlertTriangle, Edit, ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { MeetingMetadata, ProjectDocument } from "@/types/project";

const MeetingEnvironment = () => {
  const navigate = useNavigate();
  const projects = useProjectStore((state) => state.projects);
  const documents = useProjectStore((state) => state.documents);
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const updateProject = useProjectStore((state) => state.updateProject);
  const getSelectedProject = useProjectStore((state) => state.getSelectedProject);

  const selectedProject = getSelectedProject();

  const meetings = useMemo(() => {
    if (!selectedProjectId) {
      return [];
    }
    const project = projects.find((p) => p.id === selectedProjectId);
    return project?.meetings ?? [];
  }, [projects, selectedProjectId]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingMetadata | null>(null);
  const [expandedMeetingItems, setExpandedMeetingItems] = useState<Set<string>>(new Set());
  const { openMeetingDialog } = useMeetingReportStore();
  const { canCreate, canDelete } = usePermissions();
  const { startEditMeeting } = useMeetingContextStore();

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
    
    console.log('[MeetingEnvironment] Deleting meeting:', meetingToDelete.id);
    console.log('[MeetingEnvironment] Freeing document IDs:', meetingToDelete.relatedDocumentIds);
    console.log('[MeetingEnvironment] Legacy item numbers:', meetingToDelete.relatedItems);
    
    const project = projects.find((p) => p.id === selectedProjectId);
    const currentMeetings = project?.meetings ?? [];
    const updatedMeetings = currentMeetings.filter((meeting) => meeting.id !== meetingToDelete.id);
    
    console.log('[MeetingEnvironment] Meetings before delete:', currentMeetings.length);
    console.log('[MeetingEnvironment] Meetings after delete:', updatedMeetings.length);
    
    await updateProject(selectedProjectId, { meetings: updatedMeetings });
    
    console.log('[MeetingEnvironment] ✓ Meeting deleted - documents are now unassigned and will reappear in table');
    
    handleCloseDeleteDialog();
  }, [projects, selectedProjectId, updateProject, meetingToDelete, handleCloseDeleteDialog]);

  const handleNavigateToRegistration = useCallback(() => {
    navigate("/project-tracker", { state: { focus: "meetings" } });
  }, [navigate]);

  const handleEditMeeting = useCallback((meeting: MeetingMetadata) => {
    console.log('[MeetingEnvironment] Starting edit for meeting:', meeting.id);
    console.log('[MeetingEnvironment] Meeting document IDs:', meeting.relatedDocumentIds);
    console.log('[MeetingEnvironment] Meeting item numbers (legacy):', meeting.relatedItems);
    startEditMeeting(meeting);
    navigate("/project-tracker", { state: { focus: "meetings", editMode: true } });
  }, [navigate, startEditMeeting]);

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

  return (
    <div className="h-full bg-background overflow-hidden">
      <main className="container mx-auto px-6 py-6 space-y-6 h-full flex flex-col">
        <section className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex flex-col gap-4 flex-shrink-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Ambiente de Reuniões</h2>
                {selectedProject && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProject.name}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:mt-0">
                {canCreate && (
                  <Button
                    variant="outline"
                    onClick={handleNavigateToRegistration}
                    className="flex items-center gap-2"
                  >
                    <ListPlus className="h-4 w-4" />
                    Registrar nova reunião
                  </Button>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {meetings.length} reuniões registradas
                </div>
              </div>
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
              <CardHeader className="border-b border-border flex-shrink-0">
                <CardTitle className="text-lg">Reuniões do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                {meetings.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma reunião registrada até o momento.
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="divide-y divide-border">
                      {meetings
                        .slice()
                        .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
                        .map((meeting) => {
                          const relatedDocuments = getMeetingRelatedDocuments(meeting);
                          const hasRelatedItems = relatedDocuments.length > 0;
                          const isItemsExpanded = expandedMeetingItems.has(meeting.id);
                          
                          return (
                            <div key={meeting.id} className="border-b border-border last:border-b-0">
                              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_auto] gap-4 p-4 hover:bg-muted/30 transition-colors">
                                {/* First Column: Date, Numero Ata, Participants, Fornecedor, Disciplina */}
                                <div className="space-y-1">
                                  <div className="text-xs">
                                    <span className="font-semibold text-foreground">Data:</span>{' '}
                                    <span className="text-muted-foreground">{meeting.data}</span>
                                  </div>
                                  <div className="text-xs">
                                    <span className="font-semibold text-foreground">Número da Ata:</span>{' '}
                                    <span className="text-muted-foreground">{meeting.numeroAta}</span>
                                  </div>
                                  {meeting.participants.length > 0 && (
                                    <div className="text-xs">
                                      <span className="font-semibold text-foreground">Participantes:</span>{' '}
                                      <span className="text-muted-foreground">{meeting.participants.join(', ')}</span>
                                    </div>
                                  )}
                                  {meeting.fornecedor && (
                                    <div className="text-xs">
                                      <span className="font-semibold text-foreground">Fornecedor:</span>{' '}
                                      <span className="text-muted-foreground">{meeting.fornecedor}</span>
                                    </div>
                                  )}
                                  {meeting.disciplina && (
                                    <div className="text-xs">
                                      <span className="font-semibold text-foreground">Disciplina:</span>{' '}
                                      <span className="text-muted-foreground">{meeting.disciplina}</span>
                                    </div>
                                  )}
                                  {hasRelatedItems && (
                                    <button
                                      onClick={() => toggleMeetingItems(meeting.id)}
                                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-2"
                                    >
                                      {isItemsExpanded ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                      <FileText className="h-3 w-3" />
                                      <span>{relatedDocuments.length} {relatedDocuments.length === 1 ? 'item' : 'itens'}</span>
                                    </button>
                                  )}
                                </div>

                                {/* Second Column: Detalhes */}
                                <div className="flex items-start">
                                  <div className="text-sm text-muted-foreground">
                                    {meeting.detalhes ? (
                                      <p className="line-clamp-4">{meeting.detalhes}</p>
                                    ) : (
                                      <p className="italic text-muted-foreground/60">Sem detalhes</p>
                                    )}
                                  </div>
                                </div>

                                {/* Third Column: Resumo */}
                                <div className="flex items-start">
                                  <div className="text-sm text-muted-foreground">
                                    {meeting.resumo ? (
                                      <p className="line-clamp-4">{meeting.resumo}</p>
                                    ) : (
                                      <p className="italic text-muted-foreground/60">Sem resumo</p>
                                    )}
                                  </div>
                                </div>

                                {/* Fourth Column: Action Buttons */}
                                <div className="flex items-start gap-2 lg:justify-end flex-wrap">
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
                                    <Download className="h-4 w-4" />
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

                              {/* Expandable Related Items - Table View */}
                              {hasRelatedItems && isItemsExpanded && (
                                <div className="border-t border-border bg-muted/20">
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
            <DialogDescription>
              Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {meetingToDelete && (
            <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Data:</span>
                <span className="text-muted-foreground">{meetingToDelete.data || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Número da Ata:</span>
                <span className="text-muted-foreground">{meetingToDelete.numeroAta || "-"}</span>
              </div>
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
    </div>
  );
};

export default MeetingEnvironment;

