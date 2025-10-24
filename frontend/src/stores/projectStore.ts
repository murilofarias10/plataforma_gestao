import { create } from 'zustand';
import { Project, ProjectDocument, ProjectFilters, KpiData, TimelineDataPoint, StatusDistribution } from '@/types/project';
import { parseBRDateLocal } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://localhost:3001/api';

// API functions
const apiCall = async (url: string, options: RequestInit = {}) => {
  try {
    console.log('apiCall: Making request to:', url, 'with options:', options);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log('apiCall: Response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('apiCall: Response data:', data);
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

const projectsApi = {
  getAll: () => {
    console.log('projectsApi.getAll: Making API call to:', `${API_BASE_URL}/projects`);
    return apiCall(`${API_BASE_URL}/projects`);
  },
  create: (data: { name: string; description?: string }) => 
    apiCall(`${API_BASE_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; description?: string }) =>
    apiCall(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiCall(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    }),
};

const documentsApi = {
  getByProject: (projectId: string) => {
    console.log('documentsApi.getByProject: Making API call to:', `${API_BASE_URL}/projects/${projectId}/documents`);
    return apiCall(`${API_BASE_URL}/projects/${projectId}/documents`);
  },
  create: (projectId: string, data: any) =>
    apiCall(`${API_BASE_URL}/projects/${projectId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiCall(`${API_BASE_URL}/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiCall(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
    }),
};

interface ProjectStore {
  projects: Project[];
  documents: ProjectDocument[];
  selectedProjectId: string | null;
  filters: ProjectFilters;
  isLoading: boolean;
  isInitialized: boolean;
  
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
  
  // Data loading
  loadData: () => Promise<void>;
  loadDocumentsForProject: (projectId: string) => Promise<void>;
  loadSampleData: () => Promise<void>;
  initializeDefaultProject: () => Promise<void>;
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

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  projects: [],
  documents: [],
  selectedProjectId: null,
  filters: defaultFilters,
  isLoading: false,
  isInitialized: false,

  // Project management
  addProject: async (project) => {
    try {
      set({ isLoading: true });
      const response = await projectsApi.create(project);
      
      if (response.success) {
        const newProject = {
          ...response.project,
          createdAt: new Date(response.project.createdAt),
          updatedAt: new Date(response.project.updatedAt),
        };
        
        set((state) => ({
          projects: [...state.projects, newProject],
          selectedProjectId: state.selectedProjectId || newProject.id,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error adding project:', error);
      set({ isLoading: false });
      toast({
        title: 'Erro',
        description: 'Erro ao criar projeto',
        variant: 'destructive',
      });
    }
  },

  updateProject: async (id, updates) => {
    try {
      set({ isLoading: true });
      const response = await projectsApi.update(id, updates);
      
      if (response.success) {
        const updatedProject = {
          ...response.project,
          createdAt: new Date(response.project.createdAt),
          updatedAt: new Date(response.project.updatedAt),
        };
        
        set((state) => ({
          projects: state.projects.map((project) => 
            project.id === id ? updatedProject : project
          ),
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error updating project:', error);
      set({ isLoading: false });
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar projeto',
        variant: 'destructive',
      });
    }
  },

  deleteProject: async (id) => {
    try {
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

      set({ isLoading: true });
      const response = await projectsApi.delete(id);
      
      if (response.success) {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          documents: state.documents.filter((doc) => doc.projectId !== id),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      set({ isLoading: false });
      toast({
        title: 'Erro',
        description: 'Erro ao excluir projeto',
        variant: 'destructive',
      });
    }
  },

  setSelectedProject: async (projectId) => {
    set({ selectedProjectId: projectId });
    // Load documents for the selected project
    await get().loadDocumentsForProject(projectId);
  },

  getSelectedProject: () => {
    const { projects, selectedProjectId } = get();
    return projects.find((project) => project.id === selectedProjectId) || null;
  },

  loadDocumentsForProject: async (projectId: string) => {
    try {
      console.log('loadDocumentsForProject: Loading documents for project:', projectId);
      set({ isLoading: true });
      const response = await documentsApi.getByProject(projectId);
      console.log('loadDocumentsForProject: Documents response:', response);
      
      if (response.success) {
        const documents = response.documents.map((doc: any, index: number) => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
          numeroItem: doc.numeroItem || index + 1, // Assign sequential number if missing
        }));
        
        console.log('loadDocumentsForProject: Processed documents:', documents);
        set({ documents, isLoading: false });
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      set({ isLoading: false });
    }
  },

  addDocument: async (document) => {
    const { selectedProjectId } = get();
    if (!selectedProjectId) {
      toast({
        title: 'Erro',
        description: 'Nenhum projeto selecionado',
      });
      return;
    }

    try {
      set({ isLoading: true });
      const response = await documentsApi.create(selectedProjectId, document);
      
      if (response.success) {
        const newDocument: ProjectDocument = {
          ...response.document,
          createdAt: new Date(response.document.createdAt),
          updatedAt: new Date(response.document.updatedAt),
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
          documents: [...state.documents, newDocument],
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error adding document:', error);
      set({ isLoading: false });
      toast({
        title: 'Erro',
        description: 'Erro ao criar documento',
        variant: 'destructive',
      });
    }
  },

  updateDocument: async (id, updates) => {
    try {
      set({ isLoading: true });
      const response = await documentsApi.update(id, updates);
      
      if (response.success) {
        const updatedDocument = {
          ...response.document,
          createdAt: new Date(response.document.createdAt),
          updatedAt: new Date(response.document.updatedAt),
        };
        
        set((state) => ({
          documents: state.documents.map((doc) => 
            doc.id === id ? updatedDocument : doc
          ),
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error updating document:', error);
      set({ isLoading: false });
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar documento',
        variant: 'destructive',
      });
    }
  },

  deleteDocument: async (id) => {
    try {
      set({ isLoading: true });
      const response = await documentsApi.delete(id);
      
      if (response.success) {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      set({ isLoading: false });
      toast({
        title: 'Erro',
        description: 'Erro ao excluir documento',
        variant: 'destructive',
      });
    }
  },

  duplicateDocument: async (id) => {
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
      const duplicateData = {
        projectId: selectedProjectId,
        dataInicio: docToDuplicate.dataInicio,
        dataFim: '',
        documento: docToDuplicate.documento,
        detalhe: '',
        revisao: '',
        responsavel: docToDuplicate.responsavel,
        status: 'A iniciar' as const,
        area: '',
        numeroItem: Math.max(...get().documents.map(d => d.numeroItem || 0)) + 1,
      };
      
      await get().addDocument(duplicateData);
    }
  },

  clearDocument: async (id) => {
    const clearData = {
      dataInicio: '',
      dataFim: '',
      documento: '',
      detalhe: '',
      revisao: '',
      responsavel: '',
      status: 'A iniciar' as const,
      area: '',
      numeroItem: Math.max(...get().documents.map(d => d.numeroItem || 0)) + 1,
      isCleared: true,
    };
    
    await get().updateDocument(id, clearData);
  },

  bulkUpdateDocuments: async (ids, updates) => {
    try {
      set({ isLoading: true });
      
      // Update each document individually
      for (const id of ids) {
        await documentsApi.update(id, updates);
      }
      
      // Reload documents for the current project
      const { selectedProjectId } = get();
      if (selectedProjectId) {
        await get().loadDocumentsForProject(selectedProjectId);
      }
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error bulk updating documents:', error);
      set({ isLoading: false });
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar documentos',
        variant: 'destructive',
      });
    }
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


  loadData: async () => {
    try {
      console.log('loadData: Starting to load data from backend...');
      set({ isLoading: true });
      
      // Load projects
      console.log('loadData: Calling projectsApi.getAll()...');
      const projectsResponse = await projectsApi.getAll();
      console.log('loadData: Projects response:', projectsResponse);
      if (projectsResponse.success) {
        const projects = projectsResponse.projects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
        }));
        
        set((state) => ({
          projects,
          selectedProjectId: state.selectedProjectId || projects[0]?.id || null,
          isLoading: false,
          isInitialized: true,
        }));
        
        // Load documents for the selected project
        const { selectedProjectId } = get();
        console.log('loadData: Selected project ID:', selectedProjectId);
        if (selectedProjectId) {
          console.log('loadData: Loading documents for project:', selectedProjectId);
          await get().loadDocumentsForProject(selectedProjectId);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      set({ isLoading: false, isInitialized: true });
      // If API fails, load sample data
      await get().loadSampleData();
    }
  },

  loadSampleData: async () => {
        // First create a sample project
        const sampleProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
          name: 'RUMO 12',
          description: 'Projeto de infraestrutura ferroviária',
        };
        
        await get().addProject(sampleProject);
        
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
            numeroItem: 1
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
            numeroItem: 2
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
            numeroItem: 3
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
            numeroItem: 4
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
            numeroItem: 5
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
            numeroItem: 6
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
            numeroItem: 7
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
            numeroItem: 8
          }
        ];

        // Add sample documents
        for (const doc of sampleDocuments) {
          await get().addDocument(doc);
        }
      },

  initializeDefaultProject: async () => {
        const { projects } = get();
        if (projects.length === 0) {
          const defaultProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
            name: 'RUMO 12',
            description: 'Projeto de infraestrutura ferroviária',
          };
          await get().addProject(defaultProject);
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
}));