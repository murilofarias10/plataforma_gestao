import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatusBarChart = () => {
  // Sample data for the status bar chart
  const data = [
    { status: 'Em Branco', count: 105 },
    { status: 'Aprovado', count: 58 },
    { status: 'Aprov. Com Comentário', count: 8 },
    { status: 'Sem Comentário', count: 2 },
    { status: 'Reprovado', count: 7 },
    { status: 'Enviado Cliente', count: 7 },
  ];

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="status" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            label={{ value: 'Count of Nome do Arquivo', angle: -90, position: 'insideLeft' }}
            domain={[0, 120]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusBarChart;
