import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import KpiCards from "./components/KpiCards";
import FiltersBar from "./components/FiltersBar";
import SCurveChart from "./components/SCurveChart";
import StatusBarChart from "./components/StatusBarChart";
import DocumentStatusTable from "./components/DocumentStatusTable";

const DocumentMonitor = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/kubik-logo.png" 
                alt="KUBIK ENG" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">KUBIK</h1>
                <p className="text-sm text-muted-foreground">ENGINEERING</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Menu
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* S-Curve Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Curva "S"</CardTitle>
            </CardHeader>
            <CardContent>
              <SCurveChart />
            </CardContent>
          </Card>

          {/* Status Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Count of Nome do Arquivo by Status Emissão</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBarChart />
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
