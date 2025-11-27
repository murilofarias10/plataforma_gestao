import React from "react";
import { ProjectDocument } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GridCell } from "./GridCell";
import { usePermissions } from "@/hooks/usePermissions";

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
  isBlankRow = false,
  isEven = false,
}: GridRowProps) {
  const { canCreate } = usePermissions();
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "A iniciar":
        return "todo";
      case "Em andamento":
        return "doing";
      case "Finalizado":
        return "done";
      case "Info":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div 
      className="flex items-center border-b border-border transition-colors hover:opacity-90"
      style={{ 
        display: 'grid', 
        gridTemplateColumns: columns.map(col => col.width).join(' '),
        backgroundColor: isEven ? '#ffffff' : '#6BDDA9'
      }}
    >

      {columns.map((column) => {
        const isEditing = editingCell?.id === document.id && editingCell?.field === column.key;
        const value = document[column.key as keyof ProjectDocument];

        return (
          <div key={column.key} className="border-r border-border last:border-r-0 min-w-0 min-h-[44px] flex items-center w-full">
            {column.key === 'numeroItem' ? (
              <div className="p-2 w-full text-center text-xs font-medium text-muted-foreground">
                {value as number}
              </div>
            ) : column.key === 'status' && !isEditing ? (
              <div className="p-2 w-full flex items-center justify-center">
                <button
                  type="button"
                  className={`${canCreate ? 'hover:bg-muted/40 cursor-pointer' : 'cursor-default'}`}
                  onClick={canCreate ? () => onStartEdit(column.key) : undefined}
                  aria-label={canCreate ? "Editar status" : "Status (somente leitura)"}
                >
                  <Badge variant={getStatusBadgeVariant(value as string)} className="text-xs">
                    {value as string}
                  </Badge>
                </button>
              </div>
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