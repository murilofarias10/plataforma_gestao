import React, { useState, useCallback } from 'react';
import { ProjectDocument } from '@/types/project';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { GridRow } from './GridRow';
import { formatTimestamp, formatFieldChange } from '@/lib/changeTracking';

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
}

interface ExpandableGridRowProps {
  document: ProjectDocument;
  columns: Column[];
  editingCell: { id: string; field: string } | null;
  onCellEdit: (id: string, field: string, value: any) => void;
  onStartEdit: (field: string) => void;
  onStopEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent, id: string, field: string) => void;
  isEven: boolean;
}

export function ExpandableGridRow({
  document,
  columns,
  editingCell,
  onCellEdit,
  onStartEdit,
  onStopEdit,
  onKeyDown,
  isEven,
}: ExpandableGridRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleHistory = useCallback(() => {
    setIsHistoryExpanded((prev) => !prev);
  }, []);

  return (
    <div 
      id={`document-item-${document.numeroItem}`}
      className="scroll-mt-4 transition-all duration-300"
    >
      {/* Main Row with Expand Button */}
      <div className="flex">
        <button
          onClick={toggleExpanded}
          className="w-[40px] p-2 hover:bg-muted/50 border-r border-b border-border flex items-center justify-center flex-shrink-0"
          title={isExpanded ? 'Recolher' : 'Expandir'}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1">
          <GridRow
            document={document}
            columns={columns}
            editingCell={editingCell}
            onCellEdit={onCellEdit}
            onStartEdit={onStartEdit}
            onStopEdit={onStopEdit}
            onKeyDown={onKeyDown}
            isEven={isEven}
          />
        </div>
      </div>

      {/* Expanded Detail Panel - History Only */}
      {isExpanded && (
        <div className="border-b border-border bg-muted/5">
          <div className="p-3 pl-12">
            <div className="space-y-2">
              <button
                onClick={toggleHistory}
                className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary w-full"
              >
                {isHistoryExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <Clock className="w-3 h-3" />
                Histórico de Alterações
                {document.history && document.history.length > 0 && (
                  <span className="text-muted-foreground">({document.history.length})</span>
                )}
              </button>

              {/* History List - Expandable */}
              {isHistoryExpanded && document.history && document.history.length > 0 && (
                <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                  {document.history.slice().reverse().map((change) => {
                    // Only show changes where BOTH old and new values exist
                    // Exception: attachment changes are shown if newValue exists (contains change details)
                    const meaningfulChanges = change.changes.filter(
                      (fc) => {
                        if (fc.field === 'attachments') {
                          // For attachments, show if newValue exists (contains change details)
                          return fc.newValue !== null;
                        }
                        return fc.oldValue !== null && fc.newValue !== null;
                      }
                    );

                    if (meaningfulChanges.length === 0) return null;

                    return (
                      <div
                        key={change.id}
                        className="text-xs bg-background rounded p-2 border border-border"
                      >
                        <div className="text-[11px] text-muted-foreground mb-1">
                          {formatTimestamp(change.timestamp)}
                        </div>
                        <div className="space-y-0.5 text-[11px] text-foreground">
                          {meaningfulChanges.map((fieldChange, idx) => (
                            <div key={idx} className="leading-tight">
                              • {formatFieldChange(fieldChange)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(!document.history || document.history.length === 0) && isHistoryExpanded && (
                <div className="text-xs text-muted-foreground italic">
                  Nenhuma alteração registrada
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
