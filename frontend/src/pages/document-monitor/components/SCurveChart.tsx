import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SCurvePoint {
  time: string;
  projetado: number;
  baseline: number;
  avancado: number;
}

interface SCurveChartProps {
  data: SCurvePoint[];
}

const SCurveChart = ({ data }: SCurveChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-muted-foreground">
        Sem dados para exibir na curva S
      </div>
    );
  }

  // Find max value for YAxis domain
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.projetado || 0, d.baseline || 0, d.avancado || 0)),
    100 // minimum domain max
  );

  return (
    <div className="w-full h-80" data-chart="scurve">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            label={{ value: 'Quantidade de Documentos', angle: -90, position: 'insideLeft' }}
            domain={[0, Math.ceil(maxValue * 1.1)]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="projetado" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="projetado"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="baseline" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="baseline"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="avancado" 
            stroke="#10b981" 
            strokeWidth={2}
            name="avançado"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SCurveChart;
