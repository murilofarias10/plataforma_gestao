import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddFirst: () => void;
}

export function EmptyState({ onAddFirst }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <FileText className="w-12 h-12 text-primary" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Comece seu primeiro projeto
          </h3>
          <p className="text-muted-foreground">
            Adicione documentos para começar a controlar o progresso dos seus projetos de engenharia.
          </p>
        </div>

        {/* Action */}
        <Button onClick={onAddFirst} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Comece adicionando seu primeiro documento
        </Button>

        {/* Features list */}
        <div className="text-left space-y-2 text-sm text-muted-foreground">
          <p>✓ Controle de status e prazos</p>
          <p>✓ Dashboard com métricas em tempo real</p>
          <p>✓ Filtros avançados e busca</p>
        </div>
      </div>
    </div>
  );
}