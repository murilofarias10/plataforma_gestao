import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useProjectStore } from "@/stores/projectStore";

export function TimelineChart() {
  const getTimelineData = useProjectStore((state) => state.getTimelineData);
  const timelineData = getTimelineData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="kpi-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Timeline de Documentos
        </h3>
        <p className="text-sm text-muted-foreground">
          Documentos criados e finalizados por mês
        </p>
      </div>
      
      {timelineData.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="created"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                name="Criados"
              />
              <Line
                type="monotone"
                dataKey="finished"
                stroke="hsl(var(--status-done))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--status-done))", strokeWidth: 2, r: 4 }}
                name="Finalizados"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
        </div>
      )}
    </div>
  );
}