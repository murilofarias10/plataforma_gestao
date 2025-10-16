import { useEffect } from "react";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { TimelineChart } from "@/components/dashboard/TimelineChart";
import { StatusBarChart } from "@/components/dashboard/StatusBarChart";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { DataGrid } from "@/components/grid/DataGrid";
import { useProjectStore } from "@/stores/projectStore";
import { Button } from "@/components/ui/button";
import { Database, Save } from "lucide-react";
import { toast } from "sonner";

const ProjectTracker = () => {
  const { documents, loadSampleData } = useProjectStore();

  // Load sample data when there's no persisted documents
  useEffect(() => {
    if (documents.length === 0) {
      try {
        const stored = localStorage.getItem('project-tracker-storage');
        const parsed = stored ? JSON.parse(stored) : null;
        const persistedCount = parsed?.state?.documents?.length ?? 0;
        if (persistedCount === 0) {
          loadSampleData();
        }
      } catch {
        loadSampleData();
      }
    }
  }, [documents.length, loadSampleData]);

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

  return (
    <div className="h-full bg-background">
      <main className="container mx-auto px-6 py-6 space-y-8">

        {/* Dashboard Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <p className="text-muted-foreground">Visão geral dos projetos em andamento</p>
            </div>
            
            {documents.length === 0 && (
              <Button 
                onClick={loadSampleData}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Carregar dados de exemplo
              </Button>
            )}
          </div>

          {/* KPI Cards */}
          <KpiCards />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimelineChart />
            <StatusBarChart />
          </div>

          {/* Filters */}
          <FiltersBar />
        </section>

        {/* Spreadsheet Section */}
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
      </main>
    </div>
  );
};

export default ProjectTracker;
