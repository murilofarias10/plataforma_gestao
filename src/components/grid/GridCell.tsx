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

interface GridCellProps {
  value: any;
  type: string;
  isEditing: boolean;
  onEdit: (value: any) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function GridCell({
  value,
  type,
  isEditing,
  onEdit,
  onStartEdit,
  onStopEdit,
  onKeyDown,
}: GridCellProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      if (type === 'text' && value && value.length > 50) {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }
  }, [isEditing, type, value]);

  const handleSave = () => {
    onEdit(localValue);
    onStopEdit();
  };

  const handleBlur = () => {
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
    if (type === 'select') {
      return (
        <div className="p-1">
          <Select
            value={localValue}
            onValueChange={(value) => {
              setLocalValue(value);
              onEdit(value);
              onStopEdit();
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A iniciar">A iniciar</SelectItem>
              <SelectItem value="Em andamento">Em andamento</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (type === 'text' && value && value.length > 50) {
      return (
        <div className="p-1">
          <Textarea
            ref={textareaRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none"
            rows={3}
          />
        </div>
      );
    }

    return (
      <div className="p-1">
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
          className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary"
          placeholder={type === 'date' ? 'dd-mm-aaaa' : ''}
          maxLength={type === 'date' ? 10 : undefined}
          inputMode={type === 'date' ? 'numeric' : undefined}
          autoComplete={type === 'date' ? 'off' : undefined}
          spellCheck={type === 'date' ? false : undefined}
        />
      </div>
    );
  }

  return (
    <div
      className="grid-cell p-2 cursor-pointer min-h-[40px] flex items-center"
      onClick={onStartEdit}
    >
      <span className="text-sm text-foreground truncate">
        {formatDisplayValue(value) || (
          <span className="text-muted-foreground italic">
            {type === 'date' ? 'dd-mm-aaaa' : 'Clique para editar'}
          </span>
        )}
      </span>
    </div>
  );
}