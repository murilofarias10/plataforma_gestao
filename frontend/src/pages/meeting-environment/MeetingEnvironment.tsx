import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
import { ChevronDown, ChevronRight, CalendarDays, ListPlus, Trash2, Download, AlertTriangle } from "lucide-react";
import type { MeetingMetadata } from "@/types/project";

const MeetingEnvironment = () => {
  const navigate = useNavigate();
  const projects = useProjectStore((state) => state.projects);
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

  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingMetadata | null>(null);
  const { openMeetingDialog } = useMeetingReportStore();

  const toggleMeetingExpansion = useCallback((meetingId: string) => {
    setExpandedMeetings((prev) => {
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
    
    const project = projects.find((p) => p.id === selectedProjectId);
    const currentMeetings = project?.meetings ?? [];
    const updatedMeetings = currentMeetings.filter((meeting) => meeting.id !== meetingToDelete.id);
    await updateProject(selectedProjectId, { meetings: updatedMeetings });
    
    handleCloseDeleteDialog();
  }, [projects, selectedProjectId, updateProject, meetingToDelete, handleCloseDeleteDialog]);

  const handleNavigateToRegistration = useCallback(() => {
    navigate("/project-tracker", { state: { focus: "meetings" } });
  }, [navigate]);

  return (
    <div className="h-full bg-background">
      <main className="container mx-auto px-6 py-6 space-y-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-4">
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
                <Button
                  variant="outline"
                  onClick={handleNavigateToRegistration}
                  className="flex items-center gap-2"
                >
                  <ListPlus className="h-4 w-4" />
                  Registrar nova reunião
                </Button>
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
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg">Reuniões do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {meetings.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma reunião registrada até o momento.
                  </div>
                ) : (
                  <ScrollArea className="max-h-[65vh]">
                    <div className="space-y-3 p-4">
                      {meetings
                        .slice()
                        .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
                        .map((meeting) => {
                          const isExpanded = expandedMeetings.has(meeting.id);
                          const hasDetails = Boolean(meeting.detalhes);

                          return (
                            <div
                              key={meeting.id}
                              className="bg-card rounded border border-border"
                            >
                              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {meeting.data}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {meeting.numeroAta}
                                  </Badge>
                                  {meeting.participants.map((participant, index) => (
                                    <Badge key={`${meeting.id}-participant-${index}`} variant="secondary" className="text-xs">
                                      {participant}
                                    </Badge>
                                  ))}
                                  {hasDetails && (
                                    <button
                                      onClick={() => toggleMeetingExpansion(meeting.id)}
                                      className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openMeetingDialog(meeting)}
                                    className="h-9 w-9 rounded-full border border-border bg-muted hover:bg-muted/80"
                                    aria-label="Gerar relatório da reunião"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDeleteDialog(meeting)}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {isExpanded && hasDetails && (
                                <div className="border-t border-border p-4 text-sm text-foreground">
                                  {meeting.detalhes}
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

