import { FileText, Clock, CheckCircle } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";

export function KpiCards() {
  const getKpiData = useProjectStore((state) => state.getKpiData);
  const { filters, setFilters } = useProjectStore();
  const kpiData = getKpiData();

  const total = kpiData.aIniciar + kpiData.emAndamento + kpiData.finalizado;
  const finalizadosPercent = total > 0 ? Math.round((kpiData.finalizado / total) * 100) : 0;
  const emAndamentoPercent = total > 0 ? Math.round((kpiData.emAndamento / total) * 100) : 0;
  const aIniciarPercent = total > 0 ? Math.round((kpiData.aIniciar / total) * 100) : 0;

  const handleKpiClick = (status: string) => {
    const isCurrentlyFiltered = filters.statusFilter.includes(status);
    
    if (isCurrentlyFiltered) {
      // Remove the filter if it's already active
      setFilters({
        statusFilter: filters.statusFilter.filter(s => s !== status)
      });
    } else {
      // Add the filter
      setFilters({
        statusFilter: [...filters.statusFilter, status]
      });
    }
  };

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
      filterStatus: "Finalizado",
      clickable: true,
    },
    {
      title: "Em andamento",
      value: kpiData.emAndamento,
      subtitle: `(${emAndamentoPercent}%)`,
      icon: Clock,
      color: "text-status-doing",
      bgColor: "bg-status-doing/10",
      filterStatus: "Em andamento",
      clickable: true,
    },
    {
      title: "A iniciar",
      value: kpiData.aIniciar,
      subtitle: `(${aIniciarPercent}%)`,
      icon: FileText,
      color: "text-status-todo",
      bgColor: "bg-status-todo/10",
      filterStatus: "A iniciar",
      clickable: true,
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
        const isFiltered = card.clickable && card.filterStatus && filters.statusFilter.includes(card.filterStatus);
        
        return (
          <div 
            key={card.title} 
            className={cn(
              "kpi-card group transition-all duration-200 relative",
              card.clickable && "cursor-pointer hover:scale-[1.02]",
              card.clickable && card.title !== "Total de Documentos" && card.title !== "Progresso Geral" && "hover:shadow-green-500/20 hover:shadow-lg",
              card.clickable && card.title === "Total de Documentos" && "hover:shadow-md",
              card.clickable && card.title === "Progresso Geral" && "hover:shadow-md",
              isFiltered && "ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.02]"
            )}
            onClick={card.clickable && card.filterStatus ? () => handleKpiClick(card.filterStatus!) : undefined}
          >
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
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200",
                card.bgColor,
                card.clickable && "group-hover:scale-110",
                isFiltered && "scale-110 bg-primary/20"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  card.color,
                  isFiltered && "text-primary"
                )} />
              </div>
            </div>
            {isFiltered && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}