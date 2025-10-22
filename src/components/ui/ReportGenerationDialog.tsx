import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download } from "lucide-react";

interface ReportGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<void>;
}

export const ReportGenerationDialog = ({ isOpen, onClose, onGenerate }: ReportGenerationDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const steps = [
    "Coletando dados do Project Tracker...",
    "Processando indicadores de performance...",
    "Analisando timeline de documentos...",
    "Compilando distribuição por status...",
    "Coletando anexos do projeto...",
    "Coletando dados do Monitor de Documentos...",
    "Processando curva S...",
    "Analisando status dos documentos...",
    "Gerando relatório PDF...",
    "Baixando arquivos anexados...",
    "Criando arquivo ZIP...",
    "Finalizando..."
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setProgress((i / steps.length) * 100);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      await onGenerate();
      setProgress(100);
      setCurrentStep("Arquivo ZIP gerado com sucesso!");
      
      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
        setIsGenerating(false);
        setProgress(0);
        setCurrentStep("");
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setCurrentStep("Erro ao gerar relatório. Tente novamente.");
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Gerar Relatório Completo (ZIP)
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Este relatório incluirá dados completos, 
              incluindo todos os filtros aplicados no momento, além de todos os arquivos anexados 
              organizados em uma pasta ZIP.
            </p>
          </div>

          {isGenerating && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
              
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{currentStep}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
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
                  Gerar Relatório ZIP
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
