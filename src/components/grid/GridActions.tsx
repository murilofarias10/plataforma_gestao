import { Download, Upload, Users, Tag, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/projectStore";
import { BulkEditDialog } from "./BulkEditDialog";
import { useState } from "react";

interface GridActionsProps {
  selectedRows: string[];
  onClearSelection: () => void;
}

export function GridActions({ selectedRows, onClearSelection }: GridActionsProps) {
  const { exportToCsv, importFromCsv } = useProjectStore();
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const handleExport = () => {
    const csvContent = exportToCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `project-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const csvContent = event.target?.result as string;
          importFromCsv(csvContent);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
        </div>

        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedRows.length} linha(s) selecionada(s)
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkEdit(true)}
              className="flex items-center gap-2"
            >
              <Tag className="h-4 w-4" />
              Editar em lote
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              Limpar seleção
            </Button>
          </div>
        )}
      </div>

      <BulkEditDialog
        open={showBulkEdit}
        onOpenChange={setShowBulkEdit}
        selectedIds={selectedRows}
        onComplete={() => {
          setShowBulkEdit(false);
          onClearSelection();
        }}
      />
    </div>
  );
}