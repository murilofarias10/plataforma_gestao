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
          type={type === 'date' ? 'date' : 'text'}
          value={type === 'date' && localValue ? 
            (() => {
              const [dd, mm, yyyy] = localValue.split('/');
              if (dd && mm && yyyy) {
                return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
              }
              return '';
            })() : 
            localValue
          }
          onChange={(e) => {
            if (type === 'date') {
              const iso = e.target.value;
              if (iso) {
                const [yyyy, mm, dd] = iso.split('-');
                const br = `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
                setLocalValue(br);
              } else {
                setLocalValue('');
              }
            } else {
              setLocalValue(e.target.value);
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary"
          placeholder={type === 'date' ? 'dd/mm/aaaa' : ''}
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
            {type === 'date' ? 'dd/mm/aaaa' : 'Clique para editar'}
          </span>
        )}
      </span>
    </div>
  );
}