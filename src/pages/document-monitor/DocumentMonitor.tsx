import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectStore } from "@/stores/projectStore";
import KpiCards from "./components/KpiCards";
import FiltersBar from "./components/FiltersBar";
import SCurveChart from "./components/SCurveChart";
import DocumentStatusTable from "./components/DocumentStatusTable";

const DocumentMonitor = () => {
  const { getSelectedProject } = useProjectStore();
  const selectedProject = getSelectedProject();
  const [dateRange, setDateRange] = useState({
    start: "09/01/2025",
    end: "09/09/2025"
  });
  const [selectedDiscipline, setSelectedDiscipline] = useState("All");

  const handleGenerateReport = () => {
    // TODO: Implement report generation
    console.log("Generating report with filters:", { dateRange, selectedDiscipline });
  };

  return (
    <div className="h-full bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            Monitor de Documentos
            {selectedProject && (
              <span className="text-lg font-normal text-muted-foreground ml-2">
                - {selectedProject.name}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">Monitoramento de status de documentos técnicos</p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <KpiCards />
        </div>

        {/* Filters and Generate Report */}
        <div className="mb-8">
          <FiltersBar 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedDiscipline={selectedDiscipline}
            onDisciplineChange={setSelectedDiscipline}
            onGenerateReport={handleGenerateReport}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* S-Curve Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Curva "S"</CardTitle>
            </CardHeader>
            <CardContent>
              <SCurveChart />
            </CardContent>
          </Card>
        </div>

        {/* Document Status Table */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentStatusTable />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DocumentMonitor;
