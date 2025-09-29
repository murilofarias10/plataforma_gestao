import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useProjectStore } from "@/stores/projectStore";

export function StatusBarChart() {
  // Get a stable reference to the selector function, then call it
  const getStatusDistribution = useProjectStore((state) => state.getStatusDistribution);
  const statusData = getStatusDistribution();

  const getBarColor = (status: string) => {
    switch (status) {
      case "A iniciar":
        return "hsl(var(--status-todo))";
      case "Em andamento":
        return "hsl(var(--status-doing))";
      case "Finalizado":
        return "hsl(var(--status-done))";
      default:
        return "hsl(var(--primary))";
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          <p className="text-sm text-foreground">
            {payload[0].value} documentos ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="kpi-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Distribuição por Status
        </h3>
        <p className="text-sm text-muted-foreground">
          Percentual de documentos por status atual
        </p>
      </div>
      
      {statusData.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="status" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {statusData.map((entry, index) => (
                <Bar 
                  key={`cell-${index}`}
                  dataKey="count" 
                  fill={getBarColor(entry.status)}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </div>
      )}
    </div>
  );
}