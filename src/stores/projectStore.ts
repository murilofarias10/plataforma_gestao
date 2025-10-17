import { create } from 'zustand';
import { Project, ProjectDocument, ProjectFilters, KpiData, TimelineDataPoint, StatusDistribution } from '@/types/project';
import { persist } from 'zustand/middleware';
import { parseBRDateLocal } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ProjectStore {
  projects: Project[];
  documents: ProjectDocument[];
  selectedProjectId: string | null;
  filters: ProjectFilters;
  
  // Project management
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setSelectedProject: (projectId: string) => void;
  
  // Document management
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
  getSelectedProject: () => Project | null;
  getFilteredDocuments: () => ProjectDocument[];
  getTableDocuments: () => ProjectDocument[];
  getKpiData: () => KpiData;
  getTimelineData: () => TimelineDataPoint[];
  getStatusDistribution: () => StatusDistribution[];
  getUniqueAreas: () => string[];
  getUniqueResponsaveis: () => string[];
  
  // Sample data
  loadSampleData: () => void;
  initializeDefaultProject: () => void;
  clearAllData: () => void;
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
      projects: [],
      documents: [],
      selectedProjectId: null,
      filters: defaultFilters,

      // Project management
      addProject: (project) => {
        const newProject: Project = {
          ...project,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          projects: [...state.projects, newProject],
          selectedProjectId: state.selectedProjectId || newProject.id, // Set as selected if none selected
        }));
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((project) => 
            project.id === id 
              ? { ...project, ...updates, updatedAt: new Date() }
              : project
          )
        }));
      },

      deleteProject: (id) => {
        const { projects } = get();
        
        // Prevent deleting the last project
        if (projects.length <= 1) {
          toast({
            title: 'Não é possível excluir',
            description: 'Deve haver pelo menos um projeto. Crie outro projeto antes de excluir este.',
            variant: 'destructive',
          });
          return;
        }
        
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          documents: state.documents.filter((doc) => doc.projectId !== id),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
        }));
      },

      setSelectedProject: (projectId) => {
        set({ selectedProjectId: projectId });
      },

      getSelectedProject: () => {
        const { projects, selectedProjectId } = get();
        return projects.find((project) => project.id === selectedProjectId) || null;
      },

      addDocument: (document) => {
        const { selectedProjectId } = get();
        if (!selectedProjectId) {
          toast({
            title: 'Erro',
            description: 'Nenhum projeto selecionado',
          });
          return;
        }

        const newDocument: ProjectDocument = {
          ...document,
          projectId: selectedProjectId,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isCleared: false,
        };
        
        // Auto rules on create
        // If status is Finalizado and dataFim is empty -> set today
        if (newDocument.status === 'Finalizado' && !newDocument.dataFim) {
          newDocument.dataFim = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        }
        // If dataFim is provided -> force status Finalizado
        if (newDocument.dataFim && newDocument.status !== 'Finalizado') {
          newDocument.status = 'Finalizado';
        }
        // Validation: dataFim cannot be earlier than dataInicio
        if (newDocument.dataInicio && newDocument.dataFim) {
          const startDate = parseBRDateLocal(newDocument.dataInicio);
          const endDate = parseBRDateLocal(newDocument.dataFim);
          if (startDate && endDate && endDate < startDate) {
            toast({
              title: 'Validação de datas',
              description: 'Data Fim não pode ser anterior à Data Início',
            });
            // Revert dataFim on invalid input for new doc
            newDocument.dataFim = '' as any;
            // And ensure status is not forced by invalid dataFim
            if (newDocument.status === 'Finalizado') {
              newDocument.status = 'A iniciar';
            }
          }
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
              
              // Validation: prevent dataFim < dataInicio
              if (typeof updates.dataFim !== 'undefined') {
                if (updates.dataFim) {
                  const startDate = parseBRDateLocal(updatedDoc.dataInicio);
                  const endDate = parseBRDateLocal(updates.dataFim);
                  if (startDate && endDate && endDate < startDate) {
                    toast({
                      title: 'Validação de datas',
                      description: 'Data Fim não pode ser anterior à Data Início',
                    });
                    return doc; // revert to previous
                  }
                }
              }
              if (typeof updates.dataInicio !== 'undefined') {
                if (updatedDoc.dataFim) {
                  const startDate = parseBRDateLocal(updates.dataInicio ?? updatedDoc.dataInicio);
                  const endDate = parseBRDateLocal(updatedDoc.dataFim);
                  if (startDate && endDate && endDate < startDate) {
                    toast({
                      title: 'Validação de datas',
                      description: 'Data Fim não pode ser anterior à Data Início',
                    });
                    return doc; // revert to previous
                  }
                }
              }

              // Auto rules
              // If status was changed
              if (typeof updates.status !== 'undefined') {
                const previousStatus = doc.status;
                if (updates.status === 'Finalizado') {
                  // Allow transition only from A iniciar or Em andamento (or already Finalizado)
                  const allowedPrev = previousStatus === 'A iniciar' || previousStatus === 'Em andamento' || previousStatus === 'Finalizado';
                  if (!allowedPrev) {
                    return doc; // reject invalid transition
                  }
                  if (!updatedDoc.dataFim) {
                    updatedDoc.dataFim = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
                  }
                } else {
                  // If moving away from Finalizado, clear dataFim
                  updatedDoc.dataFim = '' as any;
                }
              }

              // If dataFim provided (not empty) -> force status Finalizado
              if (typeof updates.dataFim !== 'undefined' && updates.dataFim) {
                updatedDoc.status = 'Finalizado';
              }

              // If this doc had been cleared, restore visibility once mandatory fields are filled
              const mandatoryFilled = !!updatedDoc.dataInicio && !!updatedDoc.documento && !!updatedDoc.responsavel && !!updatedDoc.status;
              if (updatedDoc.isCleared && mandatoryFilled) {
                (updatedDoc as ProjectDocument).isCleared = false;
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
        const { documents, selectedProjectId } = get();
        if (!selectedProjectId) {
          toast({
            title: 'Erro',
            description: 'Nenhum projeto selecionado',
          });
          return;
        }

        const docToDuplicate = documents.find((doc) => doc.id === id);
        if (docToDuplicate) {
          const newDocument: ProjectDocument = {
            id: crypto.randomUUID(),
            projectId: selectedProjectId,
            dataInicio: docToDuplicate.dataInicio, // Copy Data Inicio
            dataFim: '', // Set to blank
            documento: docToDuplicate.documento, // Copy Tópico (documento)
            detalhe: '', // Set to blank
            revisao: '', // Set to blank
            responsavel: docToDuplicate.responsavel, // Copy Responsável
            status: 'A iniciar' as const, // Set to default status
            area: '', // Set to blank
            participantes: docToDuplicate.participantes, // Copy Participantes
            createdAt: new Date(),
            updatedAt: new Date(),
            isCleared: false,
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
                  isCleared: true,
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
        const { documents, filters, selectedProjectId } = get();
        
        if (!selectedProjectId) return [];
        
        // Filter by selected project first
        const projectDocuments = documents.filter((doc) => doc.projectId === selectedProjectId);
        
        // Exclude cleared rows and rows missing mandatory fields
        const mandatoryFilled = (doc: ProjectDocument) =>
          !!doc.dataInicio && !!doc.documento && !!doc.responsavel && !!doc.status;

        const filtered = projectDocuments.filter((doc) => {
          if (doc.isCleared) return false;
          if (!mandatoryFilled(doc)) return false;
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
            const docStartDate = parseBRDateLocal(doc.dataInicio);
            const docEndDate = parseBRDateLocal(doc.dataFim);
            
            // If both start and end filters are provided, check if document is completely within the range
            if (filters.dateRange.start && filters.dateRange.end) {
              const filterStartDate = parseBRDateLocal(filters.dateRange.start);
              const filterEndDate = parseBRDateLocal(filters.dateRange.end);
              
              if (!filterStartDate || !filterEndDate) return false;
              
              // Document must be completely within the filter range:
              // 1. Document start date >= filter start date
              // 2. Document end date <= filter end date
              if (!docStartDate || docStartDate < filterStartDate) return false;
              if (!docEndDate || docEndDate > filterEndDate) return false;
            } else {
              // Only start date filter: document must start on or after this date
              if (filters.dateRange.start) {
                const filterStartDate = parseBRDateLocal(filters.dateRange.start);
                if (!docStartDate || !filterStartDate || docStartDate < filterStartDate) return false;
              }
              
              // Only end date filter: document must end on or before this date
              if (filters.dateRange.end) {
                const filterEndDate = parseBRDateLocal(filters.dateRange.end);
                if (!docEndDate || !filterEndDate || docEndDate > filterEndDate) return false;
              }
            }
          }
          
          return true;
        });
        
        return filtered;
      },

      getTableDocuments: () => {
        const { documents, filters, selectedProjectId } = get();
        
        if (!selectedProjectId) return [];
        
        // Filter by selected project first
        const projectDocuments = documents.filter((doc) => doc.projectId === selectedProjectId);
        
        // For table: show all rows (including cleared/incomplete) but apply filters
        return projectDocuments.filter((doc) => {
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
            const docStartDate = parseBRDateLocal(doc.dataInicio);
            const docEndDate = parseBRDateLocal(doc.dataFim);
            
            // If both start and end filters are provided, check if document is completely within the range
            if (filters.dateRange.start && filters.dateRange.end) {
              const filterStartDate = parseBRDateLocal(filters.dateRange.start);
              const filterEndDate = parseBRDateLocal(filters.dateRange.end);
              
              if (!filterStartDate || !filterEndDate) return false;
              
              // Document must be completely within the filter range:
              // 1. Document start date >= filter start date
              // 2. Document end date <= filter end date
              if (!docStartDate || docStartDate < filterStartDate) return false;
              if (!docEndDate || docEndDate > filterEndDate) return false;
            } else {
              // Only start date filter: document must start on or after this date
              if (filters.dateRange.start) {
                const filterStartDate = parseBRDateLocal(filters.dateRange.start);
                if (!docStartDate || !filterStartDate || docStartDate < filterStartDate) return false;
              }
              
              // Only end date filter: document must end on or before this date
              if (filters.dateRange.end) {
                const filterEndDate = parseBRDateLocal(filters.dateRange.end);
                if (!docEndDate || !filterEndDate || docEndDate > filterEndDate) return false;
              }
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
            const startDate = parseBRDateLocal(doc.dataInicio);
            if (!startDate) return;
            const startMonthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[startMonthKey]) {
              monthlyData[startMonthKey] = { created: 0, finished: 0 };
            }
            monthlyData[startMonthKey].created++;
          }
          
          // Count finalizados based solely on presence of dataFim
          if (doc.dataFim) {
            const endDate = parseBRDateLocal(doc.dataFim);
            if (!endDate) return;
            const endMonthKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[endMonthKey]) {
              monthlyData[endMonthKey] = { created: 0, finished: 0 };
            }
            monthlyData[endMonthKey].finished++;
          }
        });
        
        // Sort months using the YYYY-MM key to ensure chronological order
        const sortedMonthKeys = Object.keys(monthlyData).sort();
        return sortedMonthKeys.map((monthKey) => {
          const [yyyyStr, mmStr] = monthKey.split('-');
          const yyyy = parseInt(yyyyStr, 10);
          const mm = parseInt(mmStr, 10);
          const labelDate = new Date(yyyy, (mm || 1) - 1, 1);
          return {
            month: labelDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
            ...monthlyData[monthKey]
          };
        });
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
        const { documents, selectedProjectId } = get();
        if (!selectedProjectId) return [];
        const projectDocuments = documents.filter((doc) => doc.projectId === selectedProjectId);
        return [...new Set(projectDocuments.map(doc => doc.area).filter(Boolean))];
      },

      getUniqueResponsaveis: () => {
        const { documents, selectedProjectId } = get();
        if (!selectedProjectId) return [];
        const projectDocuments = documents.filter((doc) => doc.projectId === selectedProjectId);
        return [...new Set(projectDocuments.map(doc => doc.responsavel).filter(Boolean))];
      },


      loadSampleData: () => {
        // First create a sample project
        const sampleProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
          name: 'RUMO 12',
          description: 'Projeto de infraestrutura ferroviária',
        };
        
        const { addProject } = get();
        addProject(sampleProject);
        
        // Get the created project ID
        const { projects, selectedProjectId } = get();
        const projectId = selectedProjectId || projects[0]?.id;
        
        if (!projectId) return;
        
        const sampleDocuments: Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>[] = [
          {
            projectId: projectId,
            dataInicio: '15-01-2024',
            dataFim: '28-02-2024',
            documento: 'Projeto Estrutural Edifício Alpha',
            detalhe: 'Cálculo estrutural completo para edifício comercial de 15 andares',
            revisao: 'R2',
            responsavel: 'João Silva',
            status: 'Finalizado',
            area: 'Estrutural',
            participantes: 'João Silva; Maria Santos; Pedro Costa'
          },
          {
            projectId: projectId,
            dataInicio: '03-02-2024',
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
            projectId: projectId,
            dataInicio: '10-03-2024',
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
            projectId: projectId,
            dataInicio: '20-03-2024',
            dataFim: '15-05-2024',
            documento: 'Memorial de Cálculo Ponte Delta',
            detalhe: 'Dimensionamento estrutural de ponte rodoviária em concreto armado',
            revisao: 'R3',
            responsavel: 'Ana Oliveira',
            status: 'Finalizado',
            area: 'Estrutural',
            participantes: 'Ana Oliveira; João Silva; Rafael Torres'
          },
          {
            projectId: projectId,
            dataInicio: '05-04-2024',
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
            projectId: projectId,
            dataInicio: '12-05-2024',
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
            projectId: projectId,
            dataInicio: '25-05-2024',
            dataFim: '10-07-2024',
            documento: 'Relatório de Impacto Ambiental',
            detalhe: 'RIA para aprovação de projeto industrial em área de preservação',
            revisao: 'R2',
            responsavel: 'Rafael Torres',
            status: 'Finalizado',
            area: 'Ambiental',
            participantes: 'Rafael Torres; Fernanda Rocha; Ana Oliveira'
          },
          {
            projectId: projectId,
            dataInicio: '15-06-2024',
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

        // Add sample documents
        sampleDocuments.forEach(doc => {
          get().addDocument(doc);
        });
      },

      initializeDefaultProject: () => {
        const { projects } = get();
        if (projects.length === 0) {
          const defaultProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
            name: 'RUMO 12',
            description: 'Projeto de infraestrutura ferroviária',
          };
          get().addProject(defaultProject);
        }
      },

      clearAllData: () => {
        set({
          projects: [],
          documents: [],
          selectedProjectId: null,
          filters: defaultFilters,
        });
      },
    }),
    {
      name: 'project-tracker-storage',
      version: 5,
      migrate: (persistedState: any) => {
        try {
          const prev = persistedState?.state ?? {};
          const docs: ProjectDocument[] = Array.isArray(prev.documents) ? prev.documents : [];
          
          // Migrate date format from dd/mm/yyyy to dd-mm-aaaa and add isCleared field
          const normalized = docs.map((doc) => {
            let migratedDoc = { ...doc };
            
            // Convert date format from dd/mm/yyyy to dd-mm-aaaa
            if (migratedDoc.dataInicio && migratedDoc.dataInicio.includes('/')) {
              migratedDoc.dataInicio = migratedDoc.dataInicio.replace(/\//g, '-');
            }
            if (migratedDoc.dataFim && migratedDoc.dataFim.includes('/')) {
              migratedDoc.dataFim = migratedDoc.dataFim.replace(/\//g, '-');
            }
            
            // Add isCleared field if missing
            if (migratedDoc.isCleared === undefined) {
              migratedDoc.isCleared = false;
            }
            
            // Add projectId if missing (migrate existing documents to default project)
            if (!migratedDoc.projectId) {
              migratedDoc.projectId = 'default-project-id';
            }
            
            // Ensure status consistency
            if (migratedDoc.dataFim && migratedDoc.status !== 'Finalizado') {
              migratedDoc.status = 'Finalizado';
            }
            
            return migratedDoc as ProjectDocument;
          });
          
          // Create default project for migrated documents
          const defaultProject: Project = {
            id: 'default-project-id',
            name: 'RUMO 12',
            description: 'Projeto de infraestrutura ferroviária',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          return {
            state: {
              projects: [defaultProject],
              documents: normalized,
              selectedProjectId: 'default-project-id',
              filters: prev.filters ?? defaultFilters,
            }
          } as any;
        } catch {
          // If migration fails, return empty state and let loadSampleData handle it
          return {
            state: {
              projects: [],
              documents: [],
              selectedProjectId: null,
              filters: defaultFilters,
            }
          } as any;
        }
      },
    }
  )
);