import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";

import { ProjectDocument } from "@/types/project";
import { useProjectStore } from "@/stores/projectStore";
import { useMeetingContextStore } from "@/stores/meetingContextStore";
import { usePermissions } from "@/hooks/usePermissions";
import { GridHeader } from "./GridHeader";
import { GridRow } from "./GridRow";
import { ExpandableGridRow } from "./ExpandableGridRow";
import { EmptyState } from "./EmptyState";
import { parseBRDateLocal } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function DataGrid() {
  const { 
    getTableDocuments,
    addDocument, 
    updateDocument,
    duplicateDocument,
    deleteDocument,
    selectedProjectId
  } = useProjectStore();
  const { canCreate } = usePermissions();
  const { relatedItemNumbers, addRelatedItem, removeRelatedItem, hasActiveMeeting } = useMeetingContextStore();
  const showMeetingCheckboxes = hasActiveMeeting();
  
  // Use table documents (includes cleared/incomplete rows for editing)
  const documents = getTableDocuments();

  // Compute next sequential numeroItem as the smallest missing positive integer
  const nextNumeroItem = useMemo(() => {
    const used = new Set<number>();
    for (const d of documents) {
      const n = typeof d.numeroItem === 'number' ? d.numeroItem : parseInt(String(d.numeroItem || 0), 10);
      if (Number.isFinite(n) && n > 0) used.add(n);
    }
    let candidate = 1;
    while (used.has(candidate)) candidate++;
    return candidate;
  }, [documents]);

  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [blankRow, setBlankRow] = useState<Partial<ProjectDocument>>({
    projectId: selectedProjectId || '',
    numeroItem: nextNumeroItem,
    dataInicio: new Date().toLocaleDateString('pt-BR').replace(/\//g, '-'),
    dataFim: '',
    documento: '',
    detalhe: '',
    revisao: '',
    responsavel: '',
    status: 'A iniciar',
    area: '',
    attachments: [],
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef<number | null>(null);

  // Restore scroll position after any render if it was saved
  useEffect(() => {
    if (savedScrollPosition.current !== null) {
      const scrollContainer = gridRef.current?.querySelector('.overflow-auto');
      if (scrollContainer instanceof HTMLElement) {
        // Use double requestAnimationFrame to ensure DOM is fully updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollContainer.scrollTop = savedScrollPosition.current!;
            savedScrollPosition.current = null; // Clear after restoration
          });
        });
      }
    }
  });

  // Update blankRow projectId/numeroItem when selection or documents change
  useEffect(() => {
    setBlankRow(prev => ({
      ...prev,
      projectId: selectedProjectId || '',
      numeroItem: nextNumeroItem
    }));
  }, [selectedProjectId, nextNumeroItem]);

  const columns = [
    { key: 'numeroItem', label: 'Nº Item', type: 'number', width: '0.8fr' },
    { key: 'dataInicio', label: 'Data Início*', type: 'date', width: '1fr' },
    { key: 'dataFim', label: 'Data Fim', type: 'date', width: '1fr' },
    { key: 'documento', label: 'Tópico*', type: 'text', width: '2fr' },
    { key: 'detalhe', label: 'Detalhe', type: 'text', width: '2fr' },
    { key: 'responsavel', label: 'Responsável*', type: 'text', width: '1.2fr' },
    { key: 'status', label: 'Status*', type: 'select', width: '1.2fr' },
    { key: 'attachments', label: 'Anexo', type: 'file', width: '0.8fr' },
  ];

  const handleCellEdit = useCallback(async (id: string, field: string, value: any) => {
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
      // Apply same validation and auto-rules for existing documents
      const document = documents.find(doc => doc.id === id);
      if (!document) return;

      // Store scroll position before updating
      const scrollContainer = gridRef.current?.querySelector('.overflow-auto');
      
      if (scrollContainer instanceof HTMLElement) {
        savedScrollPosition.current = scrollContainer.scrollTop;
      }

      // Build tentative update with auto rules + validation
      let updates: Partial<ProjectDocument> = { [field]: value };

      // Auto: status selection impacts dataFim
      if (field === 'status') {
        if (value === 'Finalizado') {
          updates.dataFim = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        } else {
          updates.dataFim = '';
        }
      }

      // Auto: dataFim filled forces status Finalizado
      if (field === 'dataFim' && value) {
        updates.status = 'Finalizado';
      }

      // Get the updated values for validation
      // For dataInicio: use new value if that's what changed, otherwise use current document value
      const updatedDataInicio = field === 'dataInicio' ? value : document.dataInicio;
      // For dataFim: use new value if that's what changed, otherwise check if auto-rule updated it, otherwise use current document value
      const updatedDataFim = field === 'dataFim' ? value : (updates.dataFim !== undefined ? updates.dataFim : document.dataFim);

      // Validation: dataFim cannot be earlier than dataInicio
      const start = parseBRDateLocal(updatedDataInicio || '');
      const end = parseBRDateLocal(updatedDataFim || '');
      if (start && end && end < start) {
        toast({
          title: 'Validação de datas',
          description: 'Data Fim não pode ser anterior à Data Início',
        });
        return; // Don't update if validation fails
      }

      await updateDocument(id, updates);
    }
  }, [updateDocument, documents]);

  const handleBlankRowSave = useCallback(async () => {
    // Check if blank row has required data
    if (blankRow.dataInicio && blankRow.documento && blankRow.responsavel && blankRow.status) {
      // Store scroll position before saving
      const scrollContainer = gridRef.current?.querySelector('.overflow-auto');
      
      if (scrollContainer instanceof HTMLElement) {
        savedScrollPosition.current = scrollContainer.scrollTop;
      }
      
      await addDocument(blankRow as Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>);
      
      // Reset blank row with freshly computed nextNumeroItem
      setBlankRow({
        projectId: selectedProjectId || '',
        numeroItem: nextNumeroItem + 1,
        dataInicio: new Date().toLocaleDateString('pt-BR').replace(/\//g, '-'),
        dataFim: '',
        documento: '',
        detalhe: '',
        revisao: '',
        responsavel: '',
        status: 'A iniciar',
        area: '',
        attachments: [],
      });
    } else {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha Data Início, Documento, Responsável e Status.',
      });
    }
  }, [blankRow, addDocument, selectedProjectId, nextNumeroItem]);

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

  const handleSelectionChange = useCallback((id: string, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleDuplicate = useCallback(async (id: string) => {
    await duplicateDocument(id);
  }, [duplicateDocument]);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      await deleteDocument(id);
    }
  }, [deleteDocument]);

  const handleToggleMeetingLink = useCallback((numeroItem: number) => {
    if (relatedItemNumbers.has(numeroItem)) {
      removeRelatedItem(numeroItem);
    } else {
      addRelatedItem(numeroItem);
    }
  }, [relatedItemNumbers, addRelatedItem, removeRelatedItem]);


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
          {/* Existing documents with expandable rows */}
          {documents.map((document, index) => (
            <ExpandableGridRow
              key={document.id}
              document={document}
              columns={columns}
              editingCell={editingCell}
              onCellEdit={handleCellEdit}
              onStartEdit={(field) => setEditingCell({ id: document.id, field })}
              onStopEdit={() => setEditingCell(null)}
              onKeyDown={handleKeyDown}
              isEven={index % 2 === 0}
              showMeetingCheckbox={showMeetingCheckboxes}
              isLinkedToMeeting={relatedItemNumbers.has(document.numeroItem)}
              onToggleMeetingLink={() => handleToggleMeetingLink(document.numeroItem)}
            />
          ))}

          {/* Blank row for adding new documents - only show for users with create permission */}
          {canCreate && (
            <div className="border-t-2 border-gray-300 bg-gray-50/50 flex">
              <div className="w-[40px] border-r border-border"></div>
              <div className="flex-1">
                <GridRow
                  document={{ id: 'blank-row', ...blankRow } as ProjectDocument}
                  columns={columns}
                  editingCell={editingCell}
                  onCellEdit={handleCellEdit}
                  onStartEdit={(field) => setEditingCell({ id: 'blank-row', field })}
                  onStopEdit={() => setEditingCell(null)}
                  onKeyDown={handleKeyDown}
                  onAdd={handleBlankRowSave}
                  isBlankRow={true}
                  isEven={documents.length % 2 === 0}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}