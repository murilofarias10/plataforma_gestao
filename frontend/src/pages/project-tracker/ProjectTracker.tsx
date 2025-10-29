import { useEffect, useState } from "react";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { TimelineChart } from "@/components/dashboard/TimelineChart";
import { StatusBarChart } from "@/components/dashboard/StatusBarChart";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { DataGrid } from "@/components/grid/DataGrid";
import { useProjectStore } from "@/stores/projectStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Save, ChevronDown, ChevronUp, BarChart3, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MeetingRegistrationSection } from "@/components/project/MeetingRegistrationSection";

const ProjectTracker = () => {
  const { documents, projects, loadData, loadSampleData, getSelectedProject, initializeDefaultProject, isLoading, isInitialized } = useProjectStore();
  const selectedProject = getSelectedProject();
  const [isChartsExpanded, setIsChartsExpanded] = useState(false);
  const [isMeetingsExpanded, setIsMeetingsExpanded] = useState(false);

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


  const handleSave = () => {
    // Data is automatically saved to backend, but we can show confirmation
    toast.success("Dados salvos com sucesso!");
  };

  const handleReloadData = async () => {
    await loadData();
    toast.success("Dados recarregados com sucesso!");
  };

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
                Project Tracker
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
                  onClick={loadSampleData}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Carregar dados de exemplo
                </Button>
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

          {/* KPI Cards - Always Visible */}
          <KpiCards />

          {/* Filters - Always Visible */}
          <div className="mt-6">
            <FiltersBar onSave={handleSave} />
          </div>
        </section>

        {/* Collapsible Meeting Registration Section */}
        <section className="space-y-4">
          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsMeetingsExpanded(!isMeetingsExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Registrar Reunião</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Registro de reuniões do projeto
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isMeetingsExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isMeetingsExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <CardContent className="pt-0">
                <MeetingRegistrationSection />
              </CardContent>
            </div>
          </Card>
        </section>

        {/* Main Data Grid Section - Primary Focus */}
        <section className="space-y-6">
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Controle de Documentos</h2>
              </div>
            </div>

            <DataGrid />
          </div>
        </section>

        {/* Collapsible Charts Section */}
        <section className="space-y-4">
          <Card className="border-2 border-dashed border-muted-foreground/25" data-charts-section>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsChartsExpanded(!isChartsExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Visualizações de Dados</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Timeline de documentos e distribuição por status
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isChartsExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isChartsExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TimelineChart />
                  <StatusBarChart />
                </div>
              </CardContent>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default ProjectTracker;
