import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadCell } from "./FileUploadCell";
import { ProjectAttachment } from "@/types/project";
import { Upload } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface GridCellProps {
  value: any;
  type: string;
  isEditing: boolean;
  onEdit: (value: any) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  projectId?: string;
  documentId?: string;
  readOnly?: boolean;
}

export function GridCell({
  value,
  type,
  isEditing,
  onEdit,
  onStartEdit,
  onStopEdit,
  onKeyDown,
  projectId,
  documentId,
  readOnly = false,
}: GridCellProps) {
  const { canCreate } = usePermissions();
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Determine if cell should be read-only (visitor or explicitly read-only)
  const isReadOnly = readOnly || !canCreate;

  useEffect(() => {
    // Update localValue from prop when value changes
    // Only update when not editing to prevent clearing user input when switching between cells
    if (!isEditing) {
      setLocalValue(value || '');
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing) {
      // Initialize localValue when starting to edit this cell
      setLocalValue(value || '');
      
      if (type === 'text' && value && value.length > 50) {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }
  }, [isEditing]);

  const handleSave = () => {
    onEdit(localValue);
    onStopEdit();
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setLocalValue(value || '');
      onStopEdit();
    }
    onKeyDown(e);
  };

  const formatDisplayValue = (val: any) => {
    if (!val) return '';
    
    if (type === 'date' && val) {
      // Ensure date is in dd/mm/yyyy format
      return val;
    }
    
    return val.toString();
  };

  if (isEditing) {
    if (type === 'file') {
      return (
        <FileUploadCell
          attachments={value as ProjectAttachment[] || []}
          onAttachmentsChange={(attachments) => onEdit(attachments)}
          projectId={projectId || ''}
          documentId={documentId || ''}
          onModalClose={onStopEdit}
          autoOpen={true}
        />
      );
    }

    if (type === 'select') {
      return (
        <div className="p-2 w-full min-h-[44px] flex items-center">
          <Select
            value={localValue}
            onValueChange={(value) => {
              setLocalValue(value);
              onEdit(value);
              onStopEdit();
            }}
          >
            <SelectTrigger className="w-full text-xs h-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="!z-[1002]" position="popper">
              <SelectItem value="A iniciar">A iniciar</SelectItem>
              <SelectItem value="Em andamento">Em andamento</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
              <SelectItem value="Info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (type === 'text' && value && value.length > 50) {
      return (
        <div className="p-2 w-full min-h-[44px] flex items-start">
          <Textarea
            ref={textareaRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none text-xs w-full"
            rows={3}
          />
        </div>
      );
    }

    return (
      <div className="p-2 w-full min-h-[44px] flex items-center">
        <Input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => {
            if (type === 'date') {
              let value = e.target.value;
              // Remove non-numeric characters except dashes
              value = value.replace(/[^0-9-]/g, '');
              
              // Auto-format as user types (dd-mm-aaaa)
              if (value.length <= 2) {
                // Just day
                value = value;
              } else if (value.length <= 5) {
                // Day and month
                value = value.replace(/^(\d{2})(\d)/, '$1-$2');
              } else if (value.length <= 10) {
                // Day, month, and year
                value = value.replace(/^(\d{2})-(\d{2})(\d)/, '$1-$2-$3');
              } else {
                // Limit to 10 characters (dd-mm-aaaa)
                value = value.substring(0, 10);
              }
              
              setLocalValue(value);
            } else {
              setLocalValue(e.target.value);
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary text-xs h-auto w-full"
          placeholder={type === 'date' ? 'dd-mm-aaaa' : ''}
          maxLength={type === 'date' ? 10 : undefined}
          inputMode={type === 'date' ? 'numeric' : undefined}
          autoComplete={type === 'date' ? 'off' : undefined}
          spellCheck={type === 'date' ? false : undefined}
        />
      </div>
    );
  }

  // Handle file type display
  if (type === 'file') {
    const attachments = value as ProjectAttachment[] || [];
    // Allow visitors to view/download files, but not upload new ones
    const hasFiles = attachments.length > 0;
    const canInteract = hasFiles || canCreate;
    
    return (
      <div
        className={`grid-cell p-2 min-h-[44px] w-full flex items-center ${canInteract ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={canInteract ? onStartEdit : undefined}
        title={hasFiles ? (canCreate ? 'Gerenciar anexos' : 'Visualizar anexos') : (canCreate ? 'Anexar arquivo' : 'Sem anexos')}
      >
        {attachments.length > 0 ? (
          <div className="flex items-center gap-1 text-xs w-full">
            <span className="text-primary">{attachments.length}</span>
            <span className="text-muted-foreground">
              {attachments.length === 1 ? 'arquivo' : 'arquivos'}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <Upload className={`h-6 w-6 ${isReadOnly ? 'text-muted-foreground/30' : 'text-muted-foreground'}`} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`grid-cell p-2 min-h-[44px] w-full flex items-center ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={isReadOnly ? undefined : onStartEdit}
    >
      <span className="text-xs text-foreground truncate w-full">
        {formatDisplayValue(value) || (
          <span className="text-muted-foreground italic">
            {type === 'date' ? 'dd-mm-aaaa' : (isReadOnly ? '-' : 'Clique para editar')}
          </span>
        )}
      </span>
    </div>
  );
}