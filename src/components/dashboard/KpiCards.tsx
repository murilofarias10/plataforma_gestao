import { FileText, Clock, CheckCircle } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";

export function KpiCards() {
  const getKpiData = useProjectStore((state) => state.getKpiData);
  const kpiData = getKpiData();

  const total = kpiData.aIniciar + kpiData.emAndamento + kpiData.finalizado;
  const finalizadosPercent = total > 0 ? Math.round((kpiData.finalizado / total) * 100) : 0;
  const emAndamentoPercent = total > 0 ? Math.round((kpiData.emAndamento / total) * 100) : 0;
  const aIniciarPercent = total > 0 ? Math.round((kpiData.aIniciar / total) * 100) : 0;

  const cards = [
    {
      title: "Total de Documentos",
      value: total,
      subtitle: "",
      icon: FileText,
      color: "text-foreground",
      bgColor: "bg-muted/30",
    },
    {
      title: "Finalizados",
      value: kpiData.finalizado,
      subtitle: `(${finalizadosPercent}%)`,
      icon: CheckCircle,
      color: "text-status-done",
      bgColor: "bg-status-done/10",
    },
    {
      title: "Em andamento",
      value: kpiData.emAndamento,
      subtitle: `(${emAndamentoPercent}%)`,
      icon: Clock,
      color: "text-status-doing",
      bgColor: "bg-status-doing/10",
    },
    {
      title: "A iniciar",
      value: kpiData.aIniciar,
      subtitle: `(${aIniciarPercent}%)`,
      icon: FileText,
      color: "text-status-todo",
      bgColor: "bg-status-todo/10",
    },
    {
      title: "Progresso Geral",
      value: `${finalizadosPercent}%`,
      subtitle: "concluído",
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="kpi-card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-sm text-muted-foreground">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <div className={`p-2 rounded-xl ${card.bgColor} transition-transform group-hover:scale-110`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}