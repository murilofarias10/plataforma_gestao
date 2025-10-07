import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const SCurveChart = () => {
  // Sample data for the S-Curve chart
  const data = [
    { time: '01-ene', projetado: 0, baseline: 0, avancado: 0 },
    { time: '01-feb', projetado: 200, baseline: 150, avancado: 100 },
    { time: '01-mar', projetado: 500, baseline: 400, avancado: 250 },
    { time: '01-abr', projetado: 800, baseline: 700, avancado: 400 },
    { time: '01-may', projetado: 1200, baseline: 1100, avancado: 600 },
    { time: '01-jun', projetado: 1600, baseline: 1500, avancado: 800 },
    { time: '01-jul', projetado: 2000, baseline: 1900, avancado: 1000 },
    { time: '01-ago', projetado: 2400, baseline: 2300, avancado: 1200 },
    { time: '01-sep', projetado: 2800, baseline: 2700, avancado: 1400 },
    { time: '01-oct', projetado: 3000, baseline: 2900, avancado: 1600 },
    { time: '01-nov', projetado: 3000, baseline: 3000, avancado: 1800 },
  ];

  return (
    <div className="w-full h-80">
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
            label={{ value: 'Información Acumulada (HH, Costos, etc)', angle: -90, position: 'insideLeft' }}
            domain={[0, 3000]}
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
          />
          <Line 
            type="monotone" 
            dataKey="baseline" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="baseline"
          />
          <Line 
            type="monotone" 
            dataKey="avancado" 
            stroke="#10b981" 
            strokeWidth={2}
            name="avançado"
          />
          <ReferenceLine 
            x="01-may" 
            stroke="#eab308" 
            strokeDasharray="5 5" 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SCurveChart;
