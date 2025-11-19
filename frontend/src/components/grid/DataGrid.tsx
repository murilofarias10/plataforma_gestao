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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function DataGrid() {
  const { 
    getTableDocuments,
    addDocument, 
    updateDocument,
    duplicateDocument,
    deleteDocument,
    selectedProjectId,
    documents: allDocuments
  } = useProjectStore();
  const { canCreate } = usePermissions();
  
  // Use table documents for display (only unassigned docs)
  const documents = getTableDocuments();

  // Compute next sequential numeroItem based on VISIBLE documents only
  // This allows each meeting to have its own numbering starting from 1
  const nextNumeroItem = useMemo(() => {
    const used = new Set<number>();
    // Only check visible documents (unassigned + editing meeting's docs)
    for (const d of documents) {
      const n = typeof d.numeroItem === 'number' ? d.numeroItem : parseInt(String(d.numeroItem || 0), 10);
      if (Number.isFinite(n) && n > 0) used.add(n);
    }
    // Find smallest available number starting from 1
    let candidate = 1;
    while (used.has(candidate)) candidate++;
    console.log('[DataGrid] Next item number:', candidate, '(visible docs:', documents.length, ')');
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
    console.log('[DataGrid] Adding new document row...', blankRow);
    
    // Store scroll position before saving
    const scrollContainer = gridRef.current?.querySelector('.overflow-auto');
    
    if (scrollContainer instanceof HTMLElement) {
      savedScrollPosition.current = scrollContainer.scrollTop;
    }
    
    try {
      // Add document even if it's empty (user will fill it later)
      await addDocument(blankRow as Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>);
      console.log('[DataGrid] Document added successfully');
      
      // Calculate next number based on VISIBLE documents only
      const visibleDocs = useProjectStore.getState().getTableDocuments();
      const used = new Set<number>();
      for (const d of visibleDocs) {
        const n = typeof d.numeroItem === 'number' ? d.numeroItem : parseInt(String(d.numeroItem || 0), 10);
        if (Number.isFinite(n) && n > 0) used.add(n);
      }
      let nextNumber = 1;
      while (used.has(nextNumber)) nextNumber++;
      
      console.log('[DataGrid] Next blank row will be:', nextNumber);
      
      // Reset blank row with the correct next number
      setBlankRow({
        projectId: selectedProjectId || '',
        numeroItem: nextNumber,
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
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar linha',
        variant: 'destructive',
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
            />
          ))}

          {/* Blank row for adding new documents - only show for users with create permission */}
          {canCreate && (
            <div className="border-t-2 border-gray-300 flex">
              <div className="w-[40px] border-r border-border" style={{ backgroundColor: documents.length % 2 === 0 ? '#ffffff' : '#6BDDA9' }}></div>
              <div className="flex-1">
                <GridRow
                  document={{ id: 'blank-row', ...blankRow } as ProjectDocument}
                  columns={columns}
                  editingCell={editingCell}
                  onCellEdit={handleCellEdit}
                  onStartEdit={(field) => setEditingCell({ id: 'blank-row', field })}
                  onStopEdit={() => setEditingCell(null)}
                  onKeyDown={handleKeyDown}
                  isBlankRow={true}
                  isEven={documents.length % 2 === 0}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Row Button - only show for users with create permission */}
      {canCreate && (
        <div className="flex justify-end">
          <Button 
            onClick={handleBlankRowSave}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar nova linha
          </Button>
        </div>
      )}
    </div>
  );
}