import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkEditDialog } from "./BulkEditDialog";
import { useState } from "react";

interface GridActionsProps {
  selectedRows: string[];
  onClearSelection: () => void;
}

export function GridActions({ selectedRows, onClearSelection }: GridActionsProps) {
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2" />

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