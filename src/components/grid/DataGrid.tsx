import React, { useState, useCallback, useRef, useEffect } from "react";
import { ProjectDocument } from "@/types/project";
import { useProjectStore } from "@/stores/projectStore";
import { GridHeader } from "./GridHeader";
import { GridRow } from "./GridRow";
import { EmptyState } from "./EmptyState";
import { parseBRDateLocal } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function DataGrid() {
  const { 
    getTableDocuments,
    addDocument, 
    updateDocument, 
    deleteDocument,
    duplicateDocument,
    clearDocument,
    selectedProjectId
  } = useProjectStore();
  
  // Use table documents (includes cleared/incomplete rows for editing)
  const documents = getTableDocuments();
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [blankRow, setBlankRow] = useState<Partial<ProjectDocument>>({
    projectId: selectedProjectId || '',
    dataInicio: new Date().toLocaleDateString('pt-BR').replace(/\//g, '-'),
    dataFim: '',
    documento: '',
    detalhe: '',
    revisao: '',
    responsavel: '',
    status: 'A iniciar',
    area: '',
    participantes: '',
    attachments: [],
  });

  const gridRef = useRef<HTMLDivElement>(null);

  // Update blankRow projectId when selectedProjectId changes
  useEffect(() => {
    setBlankRow(prev => ({
      ...prev,
      projectId: selectedProjectId || ''
    }));
  }, [selectedProjectId]);

  const columns = [
    { key: 'dataInicio', label: 'Data Início*', type: 'date', width: '1fr' },
    { key: 'dataFim', label: 'Data Fim', type: 'date', width: '1fr' },
    { key: 'documento', label: 'Tópico*', type: 'text', width: '2fr' },
    { key: 'detalhe', label: 'Detalhe', type: 'text', width: '2fr' },
    { key: 'responsavel', label: 'Responsável*', type: 'text', width: '1.2fr' },
    { key: 'status', label: 'Status*', type: 'select', width: '1.2fr' },
    { key: 'area', label: 'Disciplina', type: 'text', width: '1fr' },
    { key: 'participantes', label: 'Participantes', type: 'text', width: '1.5fr' },
    { key: 'revisao', label: 'Anexo', type: 'file', width: '0.8fr' },
  ];

  const handleCellEdit = useCallback((id: string, field: string, value: any) => {
    if (id === 'blank-row') {
      setBlankRow(prev => {
        // Build tentative update with auto rules + validation
        let next: Partial<ProjectDocument> = { ...prev, [field]: value };

        // Auto: status selection impacts dataFim
        if (field === 'status') {
          if (value === 'Finalizado') {
            next = { ...next, dataFim: new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') };
          } else {
            next = { ...next, dataFim: '' };
          }
        }

        // Auto: dataFim filled forces status Finalizado
        if (field === 'dataFim' && value) {
          next = { ...next, status: 'Finalizado' };
        }

        // Validation: dataFim cannot be earlier than dataInicio
        const start = parseBRDateLocal((field === 'dataInicio' ? value : next.dataInicio) as string || '');
        const end = parseBRDateLocal((field === 'dataFim' ? value : next.dataFim) as string || '');
        if (start && end && end < start) {
          toast({
            title: 'Validação de datas',
            description: 'Data Fim não pode ser anterior à Data Início',
          });
          return prev; // revert
        }

        return next;
      });
    } else {
      updateDocument(id, { [field]: value });
    }
  }, [updateDocument]);

  const handleBlankRowSave = useCallback(() => {
    // Check if blank row has required data
    if (blankRow.dataInicio && blankRow.documento && blankRow.responsavel && blankRow.status) {
      addDocument(blankRow as Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>);
      
      // Reset blank row
      setBlankRow({
        projectId: selectedProjectId || '',
        dataInicio: new Date().toLocaleDateString('pt-BR').replace(/\//g, '-'),
        dataFim: '',
        documento: '',
        detalhe: '',
        revisao: '',
        responsavel: '',
        status: 'A iniciar',
        area: '',
        participantes: '',
        attachments: [],
      });
    } else {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha Data Início, Documento, Responsável e Status.',
      });
    }
  }, [blankRow, addDocument, selectedProjectId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (id === 'blank-row') {
        handleBlankRowSave();
      }
      setEditingCell(null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  }, [handleBlankRowSave]);


  if (documents.length === 0 && !Object.values(blankRow).some(v => v)) {
    return <EmptyState onAddFirst={() => setEditingCell({ id: 'blank-row', field: 'documento' })} />;
  }

  return (
    <div className="space-y-4">
      <div className="spreadsheet-grid" ref={gridRef}>
        <GridHeader 
          columns={columns} 
          totalCount={documents.length}
        />
        
        <div className="max-h-[600px] overflow-auto">
          {/* Existing documents */}
          {documents.map((document, index) => (
            <GridRow
              key={document.id}
              document={document}
              columns={columns}
              editingCell={editingCell}
              onCellEdit={handleCellEdit}
              onStartEdit={(field) => setEditingCell({ id: document.id, field })}
              onStopEdit={() => setEditingCell(null)}
              onKeyDown={handleKeyDown}
              onDelete={() => deleteDocument(document.id)}
              onDuplicate={() => duplicateDocument(document.id)}
              onClear={() => clearDocument(document.id)}
              isEven={index % 2 === 0}
            />
          ))}

          {/* Always-present blank row */}
          <GridRow
            document={{ id: 'blank-row', ...blankRow } as ProjectDocument}
            columns={columns}
            editingCell={editingCell}
            onCellEdit={handleCellEdit}
            onStartEdit={(field) => setEditingCell({ id: 'blank-row', field })}
            onStopEdit={() => setEditingCell(null)}
            onKeyDown={handleKeyDown}
            onDelete={() => {}}
            onDuplicate={() => {}}
            onClear={() => setBlankRow({
              dataInicio: new Date().toLocaleDateString('pt-BR').replace(/\//g, '-'),
              dataFim: '',
              documento: '',
              detalhe: '',
              revisao: '',
              responsavel: '',
              status: 'A iniciar',
              area: '',
              participantes: '',
              attachments: [],
            })}
            onAdd={handleBlankRowSave}
            isBlankRow={true}
            isEven={documents.length % 2 === 0}
          />
        </div>
      </div>
    </div>
  );
}