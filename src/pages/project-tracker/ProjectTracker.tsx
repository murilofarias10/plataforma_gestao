import { useEffect, useState } from "react";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { TimelineChart } from "@/components/dashboard/TimelineChart";
import { StatusBarChart } from "@/components/dashboard/StatusBarChart";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { DataGrid } from "@/components/grid/DataGrid";
import { useProjectStore } from "@/stores/projectStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Save, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ProjectTracker = () => {
  const { documents, projects, loadSampleData, getSelectedProject, initializeDefaultProject } = useProjectStore();
  const selectedProject = getSelectedProject();
  const [isChartsExpanded, setIsChartsExpanded] = useState(false);

  // Initialize default project if none exists
  useEffect(() => {
    if (projects.length === 0) {
      initializeDefaultProject();
    }
  }, [projects.length, initializeDefaultProject]);

  // Load sample data when there are no projects
  useEffect(() => {
    if (projects.length === 0) {
      try {
        const stored = localStorage.getItem('project-tracker-storage');
        const parsed = stored ? JSON.parse(stored) : null;
        const persistedProjectsCount = parsed?.state?.projects?.length ?? 0;
        if (persistedProjectsCount === 0) {
          loadSampleData();
        }
      } catch {
        loadSampleData();
      }
    }
  }, [projects.length, loadSampleData]);

  // Clear any persisted store created before version bump or with Dec/2023 anomaly
  useEffect(() => {
    const storedData = localStorage.getItem('project-tracker-storage');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        const hasDec2023 = parsed.state?.documents?.some((doc: any) =>
          doc?.dataInicio?.includes('12/2023')
        );
        const needsMigration = parsed.version === 1;
        if (hasDec2023 || needsMigration) {
          console.log('Found December 2023 data, clearing localStorage');
          localStorage.removeItem('project-tracker-storage');
          loadSampleData();
        }
      } catch (e) {
        console.log('Corrupted localStorage data, clearing');
        localStorage.removeItem('project-tracker-storage');
        loadSampleData();
      }
    }
  }, [loadSampleData]);

  const handleSave = () => {
    // Data is automatically saved to localStorage, but we can show confirmation
    toast.success("Dados salvos com sucesso!");
  };

  const handleReloadData = () => {
    localStorage.removeItem('project-tracker-storage');
    loadSampleData();
    toast.success("Dados recarregados com sucesso!");
  };

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
              <p className="text-muted-foreground">Controle de documentos e acompanhamento de projetos</p>
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
            <FiltersBar />
          </div>
        </section>

        {/* Main Data Grid Section - Primary Focus */}
        <section className="space-y-6">
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Controle de Documentos</h2>
                <p className="text-muted-foreground">
                  Planilha interativa para gerenciamento de documentos do projeto
                </p>
              </div>
              
              <Button 
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar
              </Button>
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
