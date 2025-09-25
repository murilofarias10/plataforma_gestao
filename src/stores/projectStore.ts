import { create } from 'zustand';
import { ProjectDocument, ProjectFilters, KpiData, TimelineDataPoint, StatusDistribution } from '@/types/project';
import { persist } from 'zustand/middleware';

interface ProjectStore {
  documents: ProjectDocument[];
  filters: ProjectFilters;
  
  // Actions
  addDocument: (document: Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, updates: Partial<ProjectDocument>) => void;
  deleteDocument: (id: string) => void;
  duplicateDocument: (id: string) => void;
  clearDocument: (id: string) => void;
  bulkUpdateDocuments: (ids: string[], updates: Partial<ProjectDocument>) => void;
  
  // Filters
  setFilters: (filters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
  
  // Computed
  getFilteredDocuments: () => ProjectDocument[];
  getKpiData: () => KpiData;
  getTimelineData: () => TimelineDataPoint[];
  getStatusDistribution: () => StatusDistribution[];
  getUniqueAreas: () => string[];
  getUniqueResponsaveis: () => string[];
  
  // Import/Export
  importFromCsv: (csvData: string) => void;
  exportToCsv: () => string;
  
  // Sample data
  loadSampleData: () => void;
}

const defaultFilters: ProjectFilters = {
  searchQuery: '',
  statusFilter: [],
  areaFilter: [],
  responsavelFilter: [],
  dateRange: {
    start: '',
    end: ''
  }
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      documents: [],
      filters: defaultFilters,

      addDocument: (document) => {
        const newDocument: ProjectDocument = {
          ...document,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Auto-fill dataFim if status is Finalizado
        if (newDocument.status === 'Finalizado' && !newDocument.dataFim) {
          newDocument.dataFim = new Date().toLocaleDateString('pt-BR');
        }
        
        set((state) => ({
          documents: [...state.documents, newDocument]
        }));
      },

      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((doc) => {
            if (doc.id === id) {
              const updatedDoc = {
                ...doc,
                ...updates,
                updatedAt: new Date(),
              };
              
              // Auto-fill dataFim if status changed to Finalizado
              if (updates.status === 'Finalizado' && !updatedDoc.dataFim) {
                updatedDoc.dataFim = new Date().toLocaleDateString('pt-BR');
              }
              
              return updatedDoc;
            }
            return doc;
          })
        }));
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id)
        }));
      },

      duplicateDocument: (id) => {
        const { documents } = get();
        const docToDuplicate = documents.find((doc) => doc.id === id);
        if (docToDuplicate) {
          const newDocument: ProjectDocument = {
            ...docToDuplicate,
            id: crypto.randomUUID(),
            documento: `${docToDuplicate.documento} (Cópia)`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({
            documents: [...state.documents, newDocument]
          }));
        }
      },

      clearDocument: (id) => {
        set((state) => ({
          documents: state.documents.map((doc) => 
            doc.id === id 
              ? {
                  ...doc,
                  dataInicio: '',
                  dataFim: '',
                  documento: '',
                  detalhe: '',
                  revisao: '',
                  responsavel: '',
                  status: 'A iniciar' as const,
                  area: '',
                  participantes: '',
                  updatedAt: new Date(),
                }
              : doc
          )
        }));
      },

      bulkUpdateDocuments: (ids, updates) => {
        set((state) => ({
          documents: state.documents.map((doc) => 
            ids.includes(doc.id) 
              ? { ...doc, ...updates, updatedAt: new Date() }
              : doc
          )
        }));
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },

      resetFilters: () => {
        set({ filters: defaultFilters });
      },

      getFilteredDocuments: () => {
        const { documents, filters } = get();
        
        return documents.filter((doc) => {
          // Search filter
          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            if (
              !doc.documento.toLowerCase().includes(query) &&
              !doc.detalhe.toLowerCase().includes(query)
            ) {
              return false;
            }
          }
          
          // Status filter
          if (filters.statusFilter.length > 0 && !filters.statusFilter.includes(doc.status)) {
            return false;
          }
          
          // Area filter
          if (filters.areaFilter.length > 0 && !filters.areaFilter.includes(doc.area)) {
            return false;
          }
          
          // Responsavel filter
          if (filters.responsavelFilter.length > 0 && !filters.responsavelFilter.includes(doc.responsavel)) {
            return false;
          }
          
          // Date range filter
          if (filters.dateRange.start || filters.dateRange.end) {
            const docDate = new Date(doc.dataInicio.split('/').reverse().join('-'));
            
            if (filters.dateRange.start) {
              const startDate = new Date(filters.dateRange.start);
              if (docDate < startDate) return false;
            }
            
            if (filters.dateRange.end) {
              const endDate = new Date(filters.dateRange.end);
              if (docDate > endDate) return false;
            }
          }
          
          return true;
        });
      },

      getKpiData: () => {
        const filteredDocs = get().getFilteredDocuments();
        
        return {
          aIniciar: filteredDocs.filter(doc => doc.status === 'A iniciar').length,
          emAndamento: filteredDocs.filter(doc => doc.status === 'Em andamento').length,
          finalizado: filteredDocs.filter(doc => doc.status === 'Finalizado').length,
        };
      },

      getTimelineData: () => {
        const filteredDocs = get().getFilteredDocuments();
        const monthlyData: Record<string, { created: number; finished: number }> = {};
        
        filteredDocs.forEach((doc) => {
          if (doc.dataInicio) {
            const startDate = new Date(doc.dataInicio.split('/').reverse().join('-'));
            const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { created: 0, finished: 0 };
            }
            monthlyData[monthKey].created++;
          }
          
          if (doc.dataFim && doc.status === 'Finalizado') {
            const endDate = new Date(doc.dataFim.split('/').reverse().join('-'));
            const monthKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { created: 0, finished: 0 };
            }
            monthlyData[monthKey].finished++;
          }
        });
        
        return Object.entries(monthlyData)
          .map(([month, data]) => ({
            month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
            ...data
          }))
          .sort((a, b) => a.month.localeCompare(b.month));
      },

      getStatusDistribution: () => {
        const filteredDocs = get().getFilteredDocuments();
        const total = filteredDocs.length;
        
        if (total === 0) return [];
        
        const statusCounts = {
          'A iniciar': filteredDocs.filter(doc => doc.status === 'A iniciar').length,
          'Em andamento': filteredDocs.filter(doc => doc.status === 'Em andamento').length,
          'Finalizado': filteredDocs.filter(doc => doc.status === 'Finalizado').length,
        };
        
        return Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          percentage: Math.round((count / total) * 100)
        }));
      },

      getUniqueAreas: () => {
        const { documents } = get();
        return [...new Set(documents.map(doc => doc.area).filter(Boolean))];
      },

      getUniqueResponsaveis: () => {
        const { documents } = get();
        return [...new Set(documents.map(doc => doc.responsavel).filter(Boolean))];
      },

      importFromCsv: (csvData) => {
        // Basic CSV parsing implementation
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const newDocuments: ProjectDocument[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length === headers.length) {
            const document: any = {};
            headers.forEach((header, index) => {
              document[header] = values[index];
            });
            
            newDocuments.push({
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
              ...document
            });
          }
        }
        
        set((state) => ({
          documents: [...state.documents, ...newDocuments]
        }));
      },

      exportToCsv: () => {
        const { documents } = get();
        const headers = ['dataInicio', 'dataFim', 'documento', 'detalhe', 'revisao', 'responsavel', 'status', 'area', 'participantes'];
        
        const csvContent = [
          headers.join(','),
          ...documents.map(doc => 
            headers.map(header => doc[header as keyof ProjectDocument] || '').join(',')
          )
        ].join('\n');
        
        return csvContent;
      },

      loadSampleData: () => {
        const sampleDocuments: Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>[] = [
          {
            dataInicio: '15/01/2024',
            dataFim: '28/02/2024',
            documento: 'Projeto Estrutural Edifício Alpha',
            detalhe: 'Cálculo estrutural completo para edifício comercial de 15 andares',
            revisao: 'R2',
            responsavel: 'João Silva',
            status: 'Finalizado',
            area: 'Estrutural',
            participantes: 'João Silva; Maria Santos; Pedro Costa'
          },
          {
            dataInicio: '03/02/2024',
            dataFim: '',
            documento: 'Instalações Hidráulicas Residencial Beta',
            detalhe: 'Projeto de instalações hidráulicas e sanitárias para condomínio residencial',
            revisao: 'R1',
            responsavel: 'Maria Santos',
            status: 'Em andamento',
            area: 'Hidráulica',
            participantes: 'Maria Santos; Ana Oliveira'
          },
          {
            dataInicio: '10/03/2024',
            dataFim: '',
            documento: 'Análise Geotécnica Terreno Gamma',
            detalhe: 'Estudo de solo e fundações para complexo industrial',
            revisao: 'R0',
            responsavel: 'Pedro Costa',
            status: 'A iniciar',
            area: 'Geotécnica',
            participantes: 'Pedro Costa; Carlos Lima'
          },
          {
            dataInicio: '20/03/2024',
            dataFim: '15/05/2024',
            documento: 'Memorial de Cálculo Ponte Delta',
            detalhe: 'Dimensionamento estrutural de ponte rodoviária em concreto armado',
            revisao: 'R3',
            responsavel: 'Ana Oliveira',
            status: 'Finalizado',
            area: 'Estrutural',
            participantes: 'Ana Oliveira; João Silva; Rafael Torres'
          },
          {
            dataInicio: '05/04/2024',
            dataFim: '',
            documento: 'Projeto Elétrico Centro Comercial',
            detalhe: 'Sistema elétrico completo para centro comercial de 3 pavimentos',
            revisao: 'R1',
            responsavel: 'Carlos Lima',
            status: 'Em andamento',
            area: 'Elétrica',
            participantes: 'Carlos Lima; Fernanda Rocha'
          },
          {
            dataInicio: '12/05/2024',
            dataFim: '',
            documento: 'Estudo de Viabilidade Solar',
            detalhe: 'Análise de implementação de sistema fotovoltaico em indústria',
            revisao: 'R0',
            responsavel: 'Fernanda Rocha',
            status: 'A iniciar',
            area: 'Sustentabilidade',
            participantes: 'Fernanda Rocha; Carlos Lima'
          },
          {
            dataInicio: '25/05/2024',
            dataFim: '10/07/2024',
            documento: 'Relatório de Impacto Ambiental',
            detalhe: 'RIA para aprovação de projeto industrial em área de preservação',
            revisao: 'R2',
            responsavel: 'Rafael Torres',
            status: 'Finalizado',
            area: 'Ambiental',
            participantes: 'Rafael Torres; Fernanda Rocha; Ana Oliveira'
          },
          {
            dataInicio: '15/06/2024',
            dataFim: '',
            documento: 'Projeto Arquitetônico Hospital',
            detalhe: 'Anteprojeto arquitetônico para hospital público de médio porte',
            revisao: 'R1',
            responsavel: 'Marina Campos',
            status: 'Em andamento',
            area: 'Arquitetura',
            participantes: 'Marina Campos; João Silva; Ana Oliveira'
          }
        ];

        // Clear existing documents and add sample data
        set({ documents: [] });
        sampleDocuments.forEach(doc => {
          get().addDocument(doc);
        });
      },
    }),
    {
      name: 'project-tracker-storage',
      version: 1,
    }
  )
);