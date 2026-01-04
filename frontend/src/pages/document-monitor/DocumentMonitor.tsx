import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectStore } from "@/stores/projectStore";
import KpiCards from "./components/KpiCards";
import FiltersBar from "./components/FiltersBar";
import SCurveChart from "./components/SCurveChart";
import DocumentStatusTable from "./components/DocumentStatusTable";
import { fetchSharePointExcel, ExcelDocument } from "@/services/sharepointService";
import { 
  processKpiData, 
  processStatusTableData, 
  processSCurveData,
  KpiData,
  SCurvePoint,
  StatusTableRow 
} from "./utils/dataProcessing";
import { Loader2 } from "lucide-react";

const SHAREPOINT_EXCEL_URL = "https://kubikeng-my.sharepoint.com/:x:/g/personal/mf_murilo_farias_kubik_eng_br/IQBEnhVPPIJjT7BfFK2A5gO2AZQA2Xpb3vRnBvIn3FkLf4E?rtime=gKfKhdhL3kg";

const DocumentMonitor = () => {
  const { getSelectedProject } = useProjectStore();
  const selectedProject = getSelectedProject();
  const [dateRange, setDateRange] = useState({
    start: "09/01/2025",
    end: "09/09/2025"
  });
  const [selectedDiscipline, setSelectedDiscipline] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<ExcelDocument[]>([]);
  
  const [kpiData, setKpiData] = useState<KpiData>({ emitidosPercentage: 0, aprovadosPercentage: 0 });
  const [sCurveData, setSCurveData] = useState<SCurvePoint[]>([]);
  const [statusTableData, setStatusTableData] = useState<StatusTableRow[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchSharePointExcel(SHAREPOINT_EXCEL_URL);
        setRawData(data);
        
        // Initial processing
        setKpiData(processKpiData(data));
        setSCurveData(processSCurveData(data));
        setStatusTableData(processStatusTableData(data));
        setError(null);
      } catch (err) {
        console.error("Failed to load SharePoint data:", err);
        setError("Não foi possível carregar os dados do SharePoint. Verifique a conexão e o link.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Set up auto-refresh every 5 minutes (optional, but requested "automatically update")
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update filtered data when discipline changes
  useEffect(() => {
    let filtered = rawData;
    if (selectedDiscipline !== "All") {
      filtered = rawData.filter(d => d.Disciplina === selectedDiscipline);
    }
    
    setKpiData(processKpiData(filtered));
    setSCurveData(processSCurveData(filtered));
    setStatusTableData(processStatusTableData(filtered));
  }, [selectedDiscipline, rawData]);

  if (loading && rawData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Carregando dados do SharePoint...</span>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Monitor de Documentos
                {selectedProject && (
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    - {selectedProject.name}
                  </span>
                )}
              </h2>
              <p className="text-muted-foreground">Monitoramento de status de documentos técnicos (Sincronizado com SharePoint)</p>
            </div>
            {/* KUBIK Logo - Prominent company branding */}
            <div className="bg-card border border-border rounded-lg p-2 shadow-sm">
              <img 
                src="/kubik-logo_2.png" 
                alt="KUBIK" 
                className="h-16 w-auto"
              />
            </div>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <KpiCards 
            emitidosPercentage={kpiData.emitidosPercentage} 
            aprovadosPercentage={kpiData.aprovadosPercentage} 
          />
        </div>

        {/* Filters */}
        <div className="mb-8">
          <FiltersBar 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedDiscipline={selectedDiscipline}
            onDisciplineChange={setSelectedDiscipline}
            disciplines={["All", ...Array.from(new Set(rawData.map(d => d.Disciplina).filter(Boolean)))]}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* S-Curve Chart */}
          <Card data-chart-section="scurve">
            <CardHeader>
              <CardTitle>Curva "S"</CardTitle>
            </CardHeader>
            <CardContent>
              <SCurveChart data={sCurveData} />
            </CardContent>
          </Card>
        </div>

        {/* Document Status Table */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentStatusTable data={statusTableData} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DocumentMonitor;
