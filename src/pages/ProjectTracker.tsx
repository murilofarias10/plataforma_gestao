import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { TimelineChart } from "@/components/dashboard/TimelineChart";
import { StatusBarChart } from "@/components/dashboard/StatusBarChart";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { DataGrid } from "@/components/grid/DataGrid";
import { useProjectStore } from "@/stores/projectStore";
import { Button } from "@/components/ui/button";
import { Database, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ProjectTracker = () => {
  const { documents, loadSampleData } = useProjectStore();
  const navigate = useNavigate();

  // Load sample data on first visit
  useEffect(() => {
    if (documents.length === 0) {
      const hasLoadedBefore = localStorage.getItem('project-tracker-storage');
      if (!hasLoadedBefore) {
        loadSampleData();
      }
    }
  }, [documents.length, loadSampleData]);

  const handleSave = () => {
    // Data is automatically saved to localStorage, but we can show confirmation
    toast.success("Dados salvos com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-6 space-y-8">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Menu
          </Button>
        </div>

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