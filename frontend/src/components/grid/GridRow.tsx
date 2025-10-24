import React from "react";
import { ProjectDocument } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GridCell } from "./GridCell";

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
}

interface GridRowProps {
  document: ProjectDocument;
  columns: Column[];
  editingCell: { id: string; field: string } | null;
  onCellEdit: (id: string, field: string, value: any) => void;
  onStartEdit: (field: string) => void;
  onStopEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent, id: string, field: string) => void;
  onAdd?: () => void;
  isBlankRow?: boolean;
  isEven?: boolean;
}

export function GridRow({
  document,
  columns,
  editingCell,
  onCellEdit,
  onStartEdit,
  onStopEdit,
  onKeyDown,
  onAdd,
  isBlankRow = false,
  isEven = false,
}: GridRowProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "A iniciar":
        return "todo";
      case "Em andamento":
        return "doing";
      case "Finalizado":
        return "done";
      default:
        return "secondary";
    }
  };

  return (
    <div 
      className={`flex items-center border-b border-border transition-colors hover:bg-muted/30 ${
        isEven ? 'bg-muted/10' : 'bg-background'
      }`}
      style={{ display: 'grid', gridTemplateColumns: columns.map(col => col.width).join(' ') }}
    >

      {columns.map((column, index) => {
        const isEditing = editingCell?.id === document.id && editingCell?.field === column.key;
        const value = document[column.key as keyof ProjectDocument];
        const isLastColumn = index === columns.length - 1;

        return (
          <div key={column.key} className="border-r border-border last:border-r-0 min-w-0">
            {isBlankRow && isLastColumn ? (
              <div className="p-1 flex items-center justify-center h-full">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onAdd} title="Adicionar linha">
                  <span className="text-sm leading-none">+</span>
                </Button>
              </div>
            ) : column.key === 'status' && !isEditing ? (
              <button
                type="button"
                className="p-1 w-full text-left hover:bg-muted/40"
                onClick={() => onStartEdit(column.key)}
                aria-label="Editar status"
              >
                <Badge variant={getStatusBadgeVariant(value as string)} className="text-xs">
                  {value as string}
                </Badge>
              </button>
            ) : (
              <GridCell
                value={value}
                type={column.type}
                isEditing={isEditing}
                onEdit={(newValue) => onCellEdit(document.id, column.key, newValue)}
                onStartEdit={() => onStartEdit(column.key)}
                onStopEdit={onStopEdit}
                onKeyDown={(e) => onKeyDown(e, document.id, column.key)}
                projectId={document.projectId}
                documentId={document.id}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}