import { useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2 } from "lucide-react";
import { useMeetingReportStore } from "@/stores/meetingReportStore";
import { generateMeetingReportForMeeting } from "@/services/pdfReportGenerator";
import { toast } from "@/hooks/use-toast";

const MeetingReportModal = () => {
  const {
    isDialogOpen,
    dialogMeeting,
    isGenerating,
    progress,
    currentStep,
    closeDialog,
    setIsGenerating,
    setProgress,
    setCurrentStep,
  } = useMeetingReportStore();

  const meetingSteps = useMemo(() => [
    "Preparando dados do Project Tracker...",
    "Aplicando filtros ativos...",
    "Coletando anexos relacionados...",
    "Montando visão do Monitor de Documentos...",
    "Formatando resumo da reunião...",
    "Gerando relatório PDF...",
    "Finalizando..."
  ], []);

  const handleConfirmGenerate = useCallback(async () => {
    if (!dialogMeeting) return;
    
    setIsGenerating(true);
    setProgress(0);
    
    try {
      for (let i = 0; i < meetingSteps.length; i++) {
        setCurrentStep(meetingSteps[i]);
        setProgress(Math.round((i / meetingSteps.length) * 100));
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      await generateMeetingReportForMeeting(dialogMeeting);

      setProgress(100);
      setCurrentStep("Relatório gerado com sucesso!");
      toast({
        title: "Relatório disponível",
        description: "O download do relatório da reunião foi iniciado.",
      });

      setTimeout(() => {
        setIsGenerating(false);
        closeDialog();
      }, 1200);
    } catch (error) {
      console.error("Erro ao gerar relatório da reunião:", error);
      setIsGenerating(false);
      setCurrentStep("Erro ao gerar relatório. Tente novamente.");
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório da reunião. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [dialogMeeting, meetingSteps, closeDialog, setIsGenerating, setProgress, setCurrentStep]);

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-md backdrop-blur-md bg-background/95 border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Gerar Relatório da Reunião
          </DialogTitle>
          <DialogDescription>
            Confirme a geração do relatório PDF para a reunião selecionada.
          </DialogDescription>
        </DialogHeader>

        {dialogMeeting && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-2">
              <p><span className="font-semibold">Data:</span> {dialogMeeting.data || "-"}</p>
              <p><span className="font-semibold">Número da Ata:</span> {dialogMeeting.numeroAta || "-"}</p>
              <p>
                <span className="font-semibold">Participantes:</span>{" "}
                {dialogMeeting.participants?.length ? dialogMeeting.participants.join(", ") : "-"}
              </p>
            </div>

            {dialogMeeting.detalhes && (
              <div>
                <p className="font-semibold mb-1">Detalhes</p>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {dialogMeeting.detalhes}
                </p>
              </div>
            )}
          </div>
        )}

        {isGenerating && (
          <div className="space-y-4 rounded-md border border-border/60 bg-muted/30 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{currentStep}</span>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-end">
          <Button
            variant="outline"
            onClick={closeDialog}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmGenerate}
            disabled={!dialogMeeting || isGenerating}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Confirmar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingReportModal;

