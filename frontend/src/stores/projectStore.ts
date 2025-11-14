import { create } from 'zustand';
import { Project, ProjectDocument, ProjectFilters, KpiData, TimelineDataPoint, StatusDistribution } from '@/types/project';
import { parseBRDateLocal } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { generateFieldChanges, createChangeLogEntry, debounce } from '@/lib/changeTracking';
import { useMeetingContextStore } from './meetingContextStore';

const API_BASE_URL = 'http://localhost:3001/api';

// API functions
const apiCall = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(options.headers || {}),
      },
      ...options,
      cache: 'no-store', // Prevent caching
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API call to ${url} failed:`, error);
    throw error;
  }
};

const projectsApi = {
  getAll: () => apiCall(`${API_BASE_URL}/projects`),
  create: (data: { name: string; description?: string }) => 
    apiCall(`${API_BASE_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; description?: string; meetings?: any[] }) => 
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
  getByProject: (projectId: string) => 
    apiCall(`${API_BASE_URL}/projects/${projectId}/documents`),
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
  renumber: (projectId: string) =>
    apiCall(`${API_BASE_URL}/projects/${projectId}/renumber`, {
      method: 'POST',
    }),
};

interface ProjectStore {
  projects: Project[];
  documents: ProjectDocument[];
  selectedProjectId: string | null;
  filters: ProjectFilters;
  isLoading: boolean;
  isInitialized: boolean;
  lastUpdated: string | null;
  
  // Project management
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setSelectedProject: (projectId: string) => void;
  
  // Document management
  addDocument: (document: Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, updates: Partial<ProjectDocument>, skipChangeTracking?: boolean) => void;
  updateDocumentWithChangeTracking: (id: string, updates: Partial<ProjectDocument>, meetingContext?: { meetingId: string; meetingData: string; meetingNumber: string }) => Promise<boolean>;
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
  initializeDefaultProject: () => Promise<void>;
  clearAllData: () => void;
  renumberCurrentProject: () => Promise<void>;
  renumberAllProjects: () => Promise<void>;
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
  lastUpdated: null,

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
          meetings: Array.isArray(response.project.meetings) ? response.project.meetings : [],
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
      console.log('[updateProject] Sending update:', { id, updates });
      const response = await projectsApi.update(id, updates);
      console.log('[updateProject] Response received:', response);
      
      if (response.success) {
        const updatedProject = {
          ...response.project,
          createdAt: new Date(response.project.createdAt),
          updatedAt: new Date(response.project.updatedAt),
          meetings: Array.isArray(response.project.meetings) ? [...response.project.meetings] : [],
        };
        
        console.log('[updateProject] Updated project with meetings:', updatedProject.meetings);
        console.log('[updateProject] Meetings count:', updatedProject.meetings.length);
        
        set((state) => {
          const newProjects = state.projects.map((project) => 
            project.id === id ? { ...updatedProject } : project
          );
          console.log('[updateProject] New projects array:', newProjects);
          console.log('[updateProject] Updated project in array:', newProjects.find(p => p.id === id));
          return {
            projects: [...newProjects], // Force new array reference
            isLoading: false,
          };
        });
        
        // Verify the state was updated
        setTimeout(() => {
          const currentState = get();
          const project = currentState.projects.find(p => p.id === id);
          console.log('[updateProject] State after update:', {
            projectId: id,
            projectFound: !!project,
            meetings: project?.meetings,
            meetingsCount: project?.meetings?.length
          });
        }, 100);
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
          // Convert numeroItem to number if it exists, otherwise use index + 1
          numeroItem: typeof doc.numeroItem === 'number' ? doc.numeroItem : (typeof doc.numeroItem === 'string' ? parseInt(doc.numeroItem, 10) : index + 1),
          // Ensure change tracking arrays are initialized
          participants: Array.isArray(doc.participants) ? doc.participants : [],
          history: Array.isArray(doc.history) ? doc.history : [],
          meetings: Array.isArray(doc.meetings) ? doc.meetings : [],
        }));
        
        console.log('loadDocumentsForProject: Processed documents:', documents);
        set({ documents, isLoading: false, lastUpdated: new Date().toISOString() });
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
          
          if (!startDate || !endDate) return;
          
          // Document must be completely within the filter range:
          // 1. Document start date >= filter start date
          // 2. Document end date <= filter end date
          if (endDate < startDate) {
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
          lastUpdated: new Date().toISOString()
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

  updateDocument: async (id, updates, skipChangeTracking = false) => {
    if (!skipChangeTracking) {
      // Use change tracking version for regular updates
      return await get().updateDocumentWithChangeTracking(id, updates);
    }
    
    try {
      set({ isLoading: true });
      
      // Get current state
      const currentDocs = [...get().documents];
      const docIndex = currentDocs.findIndex(doc => doc.id === id);
      
      if (docIndex === -1) {
        throw new Error('Documento não encontrado');
      }
      
      // Create optimistic update
      const originalDoc = currentDocs[docIndex];
      const optimisticUpdate = { ...originalDoc, ...updates };
      
      // Update UI immediately
      set({
        documents: currentDocs.map(doc => 
          doc.id === id ? optimisticUpdate : doc
        ),
        lastUpdated: new Date().toISOString()
      });
      
      // Make API call
      const response = await documentsApi.update(id, updates);
      
      if (response.success) {
        // Refresh data from server to ensure consistency
        const { selectedProjectId } = get();
        if (selectedProjectId) {
          await get().loadDocumentsForProject(selectedProjectId);
        }
        
        toast({
          title: 'Sucesso',
          description: 'Documento atualizado com sucesso',
          variant: 'default',
        });
        
        return true;
      } else {
        // Revert optimistic update if API call fails
        set({
          documents: currentDocs,
          lastUpdated: new Date().toISOString()
        });
        
        throw new Error(response.error || 'Falha ao atualizar o documento');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar documento',
        variant: 'destructive',
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateDocumentWithChangeTracking: async (id, updates, meetingContext) => {
    try {
      set({ isLoading: true });
      
      // Get current state
      const currentDocs = [...get().documents];
      const docIndex = currentDocs.findIndex(doc => doc.id === id);
      
      if (docIndex === -1) {
        throw new Error('Documento não encontrado');
      }
      
      const originalDoc = currentDocs[docIndex];
      
      // Generate field-level changes
      const fieldChanges = generateFieldChanges(originalDoc, updates);
      
      // Only create change log if there are actual field changes
      let updatedHistory = originalDoc.history || [];
      if (fieldChanges.length > 0) {
        const changeLogEntry = createChangeLogEntry(fieldChanges, meetingContext);
        updatedHistory = [...updatedHistory, changeLogEntry];
      }
      
      // Merge updates with history
      const finalUpdates = {
        ...updates,
        history: updatedHistory,
      };
      
      // Create optimistic update
      const optimisticUpdate = { ...originalDoc, ...finalUpdates };
      
      // Update UI immediately
      set({
        documents: currentDocs.map(doc => 
          doc.id === id ? optimisticUpdate : doc
        ),
        lastUpdated: new Date().toISOString()
      });
      
      // Make API call
      const response = await documentsApi.update(id, finalUpdates);
      
      if (response.success) {
        // Refresh data from server to ensure consistency
        const { selectedProjectId } = get();
        if (selectedProjectId) {
          await get().loadDocumentsForProject(selectedProjectId);
        }
        
        return true;
      } else {
        // Revert optimistic update if API call fails
        set({
          documents: currentDocs,
          lastUpdated: new Date().toISOString()
        });
        
        throw new Error(response.error || 'Falha ao atualizar o documento');
      }
    } catch (error) {
      console.error('Error updating document with change tracking:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar documento',
        variant: 'destructive',
      });
      return false;
    } finally {
      set({ isLoading: false });
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
          lastUpdated: new Date().toISOString(),
        }));
        toast({ title: 'Sucesso', description: 'Documento excluído', variant: 'default' });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      set({ isLoading: false });
      toast({ title: 'Erro', description: 'Erro ao excluir documento', variant: 'destructive' });
    }
  },

  duplicateDocument: async (id) => {
    const { documents, selectedProjectId } = get();
    if (!selectedProjectId) return;
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    // Smallest missing positive integer within the project
    const used = new Set<number>(
      documents
        .filter((d) => d.projectId === selectedProjectId)
        .map((d) => (typeof d.numeroItem === 'number' ? d.numeroItem : parseInt(String(d.numeroItem || 0), 10)))
        .filter((n) => Number.isFinite(n) && n > 0) as number[]
    );
    let nextNumero = 1;
    while (used.has(nextNumero)) nextNumero++;

    const clone: Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      projectId: selectedProjectId,
      numeroItem: nextNumero,
      dataInicio: doc.dataInicio || '',
      dataFim: doc.dataFim || '',
      documento: doc.documento,
      detalhe: doc.detalhe,
      revisao: doc.revisao,
      responsavel: doc.responsavel,
      status: doc.status,
      area: doc.area,
      attachments: doc.attachments,
      isCleared: doc.isCleared,
      // Don't copy change tracking data to duplicates
      participants: [],
      history: [],
      meetings: [],
    } as any;

    await get().addDocument(clone);
  },

  clearDocument: async (id) => {
    // Skip change tracking for clearing operations
    await get().updateDocument(id, { isCleared: true } as Partial<ProjectDocument>, true);
  },

  bulkUpdateDocuments: (ids, updates) => {
    ids.forEach((docId) => {
      void get().updateDocument(docId, updates);
    });
  },

  renumberCurrentProject: async () => {
    try {
      const { selectedProjectId } = get();
      if (!selectedProjectId) return;
      set({ isLoading: true });
      const response = await documentsApi.renumber(selectedProjectId);
      if (response.success) {
        const documents = response.documents.map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        }));
        set({ documents, isLoading: false, lastUpdated: new Date().toISOString() });
        toast({ title: 'Sucesso', description: 'Números reorganizados', variant: 'default' });
      }
    } catch (error) {
      console.error('Error renumbering documents:', error);
      set({ isLoading: false });
      toast({ title: 'Erro', description: 'Erro ao reorganizar números', variant: 'destructive' });
    }
  },

  renumberAllProjects: async () => {
    const { projects } = get();
    for (const p of projects) {
      try {
        await documentsApi.renumber(p.id);
      } catch (e) {
        console.error('Renumber project failed:', p.id, e);
      }
    }
    const { selectedProjectId } = get();
    if (selectedProjectId) await get().loadDocumentsForProject(selectedProjectId);
  },
  getUniqueResponsaveis: () => {
    const { documents, selectedProjectId } = get();
    if (!selectedProjectId) return [];
    const projectDocuments = documents.filter((doc) => doc.projectId === selectedProjectId);
    return Array.from(new Set(projectDocuments
      .map(doc => doc.responsavel)
      .filter((responsavel): responsavel is string => Boolean(responsavel))
    ));
  },

  getUniqueAreas: () => {
    const { documents, selectedProjectId } = get();
    if (!selectedProjectId) return [];
    const projectDocuments = documents.filter((doc) => doc.projectId === selectedProjectId);
    return Array.from(new Set(projectDocuments
      .map(doc => doc.area)
      .filter((area): area is string => Boolean(area))
    ));
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
        dateRange: {
          ...state.filters.dateRange,
          ...(filters.dateRange || {}),
        },
      },
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  getFilteredDocuments: () => {
    const { documents, selectedProjectId, filters } = get();
    if (!selectedProjectId) return [];
    const { searchQuery, statusFilter, areaFilter, responsavelFilter, dateRange } = filters;

    const q = (searchQuery || '').toLowerCase().trim();
    const start = dateRange.start ? parseBRDateLocal(dateRange.start) : null;
    const end = dateRange.end ? parseBRDateLocal(dateRange.end) : null;

    return documents
      .filter((d) => d.projectId === selectedProjectId && !d.isCleared)
      .filter((d) => {
        if (q) {
          const hay = `${d.documento} ${d.detalhe}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (statusFilter && statusFilter.length && !statusFilter.includes(d.status)) return false;
        if (areaFilter && areaFilter.length && !areaFilter.includes(d.area)) return false;
        if (responsavelFilter && responsavelFilter.length && !responsavelFilter.includes(d.responsavel)) return false;

        if (start) {
          const di = d.dataInicio ? parseBRDateLocal(d.dataInicio) : null;
          if (!di || di < start) return false;
        }
        if (end) {
          const df = d.dataFim ? parseBRDateLocal(d.dataFim) : null;
          if (!df || df > end) return false;
        }
        return true;
      });
  },

  getTableDocuments: () => {
    const { selectedProjectId, projects } = get();
    
    // Check if we're in edit mode
    const { isEditMode, editingMeetingId } = useMeetingContextStore.getState();
    
    // Get all item numbers that are already assigned to meetings
    const assignedItemNumbers = new Set<number>();
    let editingMeetingItemNumbers = new Set<number>();
    
    if (selectedProjectId) {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      if (selectedProject?.meetings) {
        selectedProject.meetings.forEach(meeting => {
          if (meeting.relatedItems) {
            // If this is the meeting being edited, save its items separately
            if (isEditMode && meeting.id === editingMeetingId) {
              meeting.relatedItems.forEach(itemNum => editingMeetingItemNumbers.add(itemNum));
            } else {
              // Otherwise, mark these items as assigned
              meeting.relatedItems.forEach(itemNum => assignedItemNumbers.add(itemNum));
            }
          }
        });
      }
    }
    
    const allFilteredDocs = get().getFilteredDocuments();
    console.log('All filtered documents:', allFilteredDocs.length);
    console.log('Assigned item numbers:', Array.from(assignedItemNumbers));
    
    // Filter: show unassigned documents OR documents from the meeting being edited
    const visibleDocs = allFilteredDocs
      .filter(doc => !assignedItemNumbers.has(doc.numeroItem) || editingMeetingItemNumbers.has(doc.numeroItem))
      .slice()
      .sort((a, b) => (a.numeroItem || 0) - (b.numeroItem || 0));
    
    console.log('Visible documents in table:', visibleDocs.length, visibleDocs.map(d => d.numeroItem));
    
    return visibleDocs;
  },

  getKpiData: () => {
    const docs = get().getFilteredDocuments();
    const kpi: KpiData = { aIniciar: 0, emAndamento: 0, finalizado: 0, info: 0 };
    docs.forEach((d) => {
      if (d.status === 'A iniciar') kpi.aIniciar += 1;
      else if (d.status === 'Em andamento') kpi.emAndamento += 1;
      else if (d.status === 'Finalizado') kpi.finalizado += 1;
      else if (d.status === 'Info') kpi.info += 1;
    });
    return kpi;
  },

  getTimelineData: () => {
    const docs = get().getFilteredDocuments();
    const map = new Map<string, { created: number; finished: number }>();

    const add = (dateStr: string | undefined, key: 'created' | 'finished') => {
      if (!dateStr) return;
      const d = parseBRDateLocal(dateStr);
      if (!d) return;
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = map.get(label) || { created: 0, finished: 0 };
      cur[key] += 1;
      map.set(label, cur);
    };

    docs.forEach((d) => {
      add(d.dataInicio, 'created');
      if (d.dataFim) add(d.dataFim, 'finished');
    });

    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([month, { created, finished }]) => ({ month, created, finished })) as TimelineDataPoint[];
  },

  getStatusDistribution: () => {
    const docs = get().getFilteredDocuments();
    const total = docs.length || 1;
    const counts = new Map<string, number>();
    docs.forEach((d) => counts.set(d.status, (counts.get(d.status) || 0) + 1));
    return Array.from(counts.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / total) * 100),
    })) as StatusDistribution[];
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
          meetings: Array.isArray(project.meetings) ? project.meetings : [],
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