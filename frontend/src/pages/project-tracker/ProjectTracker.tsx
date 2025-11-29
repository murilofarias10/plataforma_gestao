import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { DataGrid } from "@/components/grid/DataGrid";
import { useProjectStore } from "@/stores/projectStore";
import { useMeetingContextStore } from "@/stores/meetingContextStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Database, Calendar, ArrowUp, RotateCcw, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MeetingRegistrationSection, MeetingRegistrationHandle } from "@/components/project/MeetingRegistrationSection";

const ProjectTracker = () => {
  const { documents, projects, loadData, getSelectedProject, initializeDefaultProject, isLoading, isInitialized, filters, resetFilters } = useProjectStore();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedProject = getSelectedProject();
  const [isMeetingsExpanded, setIsMeetingsExpanded] = useState(false);
  const meetingRef = useRef<MeetingRegistrationHandle>(null);
  const isEditMode = useMeetingContextStore((state) => state.isEditMode);
  const [canSaveMeeting, setCanSaveMeeting] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [pendingMeetingToEdit, setPendingMeetingToEdit] = useState<any>(null);
  const shouldAutoSaveRef = useRef(false);
  
  const activeFiltersCount = 
    filters.statusFilter.length +
    filters.responsavelFilter.length +
    filters.areaFilter.length +
    (filters.searchQuery ? 1 : 0) +
    (filters.responsavelSearch ? 1 : 0) +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0);
  useEffect(() => {
    if (location.state && typeof location.state === "object") {
      const state = location.state as any;
      if (state.focus === "meetings") {
        setIsMeetingsExpanded(true);
      }
      if (state.pendingMeetingToEdit) {
        setPendingMeetingToEdit(state.pendingMeetingToEdit);
      }
      // If autoSave flag is set, mark that we should auto-save
      if (state.autoSave && state.pendingMeetingToEdit) {
        console.log('[ProjectTracker] Auto-save flag received from meeting-environment');
        shouldAutoSaveRef.current = true;
      }
    }
  }, [location.state]);

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load data from backend on component mount
  useEffect(() => {
    const initializeData = async () => {
      if (!isInitialized) {
        console.log('ProjectTracker: Loading data from backend...');
        try {
          await loadData();
        } catch (error) {
          console.error('ProjectTracker: Error loading data:', error);
        }
      }
    };
    
    initializeData();
  }, [isInitialized, loadData]);

  // Initialize default project if none exists after loading
  useEffect(() => {
    const initializeDefault = async () => {
      if (isInitialized && projects.length === 0) {
        console.log('No projects found, initializing default project...');
        await initializeDefaultProject();
      }
    };
    
    initializeDefault();
  }, [isInitialized, projects.length, initializeDefaultProject]);

  // Scroll to top handler
  const scrollToTop = useCallback(() => {
    // Find the scrollable main container (from MainLayout)
    const scrollableContainer = document.querySelector('main.overflow-auto');
    if (scrollableContainer) {
      scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Fallback to window scroll if container not found
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Listen to scroll events to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Find the scrollable main container (from MainLayout)
      const scrollableContainer = document.querySelector('main.overflow-auto');
      
      if (scrollableContainer) {
        // Show button when user has scrolled down past 300px
        const scrollThreshold = 300;
        setShowScrollTop(scrollableContainer.scrollTop > scrollThreshold);
      } else {
        // Fallback to window scroll if container not found
        const scrollThreshold = 300;
        setShowScrollTop(window.scrollY > scrollThreshold);
      }
    };

    // Find the scrollable container
    const scrollableContainer = document.querySelector('main.overflow-auto');
    
    if (scrollableContainer) {
      // Listen to scroll events on the container
      scrollableContainer.addEventListener('scroll', handleScroll, { passive: true });
      // Check initial scroll position
      handleScroll();
      
      return () => {
        scrollableContainer.removeEventListener('scroll', handleScroll);
      };
    } else {
      // Fallback to window scroll listener
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const handleReloadData = async () => {
    await loadData();
    toast.success("Dados recarregados com sucesso!");
  };

  const handleSaveClick = () => {
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = useCallback(async () => {
    setShowSaveConfirmation(false);
    
    try {
      // Save the current meeting
      await meetingRef.current?.handleAddMeeting();
      
      // Check if there's a pending meeting to edit after save
      if (pendingMeetingToEdit) {
        console.log('[ProjectTracker] Saved current meeting, now opening pending meeting:', pendingMeetingToEdit.id);
        
        // Wait a bit for save to complete and state to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Navigate back to meeting-environment to open the pending meeting
        console.log('[ProjectTracker] Navigating back to meeting-environment with pending meeting');
        navigate("/meeting-environment", { 
          state: { 
            openMeetingToEdit: pendingMeetingToEdit 
          } 
        });
        setPendingMeetingToEdit(null);
      }
    } catch (error) {
      console.error('[ProjectTracker] Error saving meeting:', error);
    }
  }, [pendingMeetingToEdit, navigate]);

  // Auto-save effect - triggered when coming from meeting-environment with autoSave flag
  useEffect(() => {
    const performAutoSave = async () => {
      if (shouldAutoSaveRef.current && canSaveMeeting && isEditMode) {
        console.log('[ProjectTracker] Triggering auto-save...');
        shouldAutoSaveRef.current = false;
        await handleConfirmSave();
      }
    };
    
    performAutoSave();
  }, [canSaveMeeting, isEditMode, handleConfirmSave]);

  if (isLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <main className="container mx-auto px-6 py-6 space-y-6">

        {/* Header Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Módulo ATA
                {selectedProject && (
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    - {selectedProject.name}
                  </span>
                )}
              </h2>
            </div>
            
            {projects.length === 0 && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleReloadData}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Recarregar dados
                </Button>
              </div>
            )}
          </div>

          {/* Collapsible Meeting Registration Section */}
          <div className="mb-8">
            <Card className="border-2 border-dashed border-muted-foreground/25">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsMeetingsExpanded(!isMeetingsExpanded)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <NotebookPen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Cabeçalho</CardTitle>
                  </div>
                  {isMeetingsExpanded && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        className="h-8 text-xs px-3"
                        onClick={handleSaveClick}
                        disabled={!canSaveMeeting}
                        type="button"
                      >
                        Salvar
                      </Button>
                      {isEditMode && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs px-3"
                          onClick={() => meetingRef.current?.cancelEdit()}
                          type="button"
                        >
                          Cancelar Edição
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isMeetingsExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
              )}>
                <CardContent className="pt-0">
                  <MeetingRegistrationSection 
                    ref={meetingRef}
                    onValidityChange={setCanSaveMeeting}
                  />
                </CardContent>
              </div>
            </Card>
          </div>

          {/* KPI Cards - Always Visible */}
          <KpiCards />

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Limpar filtros ({activeFiltersCount})
              </Button>
            </div>
          )}
        </section>

        {/* Main Data Grid Section - Primary Focus */}
        <section id="controle-documentos-section" className="space-y-6">
          <DataGrid />
        </section>
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-all hover:scale-110 z-50"
          title="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Save Confirmation Modal */}
      <AlertDialog open={showSaveConfirmation} onOpenChange={setShowSaveConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEditMode ? 'Confirmar criação de nova reunião' : 'Confirmar salvamento'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEditMode 
                ? 'Você está prestes a criar uma nova reunião baseada nos dados editados. Deseja continuar?'
                : 'Tem certeza que deseja salvar esta reunião?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              {isEditMode ? 'Criar Nova Reunião' : 'Salvar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectTracker;
