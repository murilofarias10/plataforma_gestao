import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";

export function KpiCards() {
  const getKpiData = useProjectStore((state) => state.getKpiData);
  const { filters, setFilters } = useProjectStore();
  const kpiData = getKpiData();

  const total = kpiData.aIniciar + kpiData.emAndamento + kpiData.finalizado + kpiData.info;
  const finalizadosPercent = total > 0 ? Math.round((kpiData.finalizado / total) * 100) : 0;
  const emAndamentoPercent = total > 0 ? Math.round((kpiData.emAndamento / total) * 100) : 0;
  const aIniciarPercent = total > 0 ? Math.round((kpiData.aIniciar / total) * 100) : 0;
  const infoPercent = total > 0 ? Math.round((kpiData.info / total) * 100) : 0;

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
      title: "Total Itens",
      value: total,
      subtitle: "",
      bgColor: "bg-muted/30",
      textColor: "text-foreground",
      clickable: false,
    },
    {
      title: "A iniciar",
      value: kpiData.aIniciar,
      subtitle: `(${aIniciarPercent}%)`,
      bgColor: "bg-status-todo",
      textColor: "text-status-todo-foreground",
      filterStatus: "A iniciar",
      clickable: true,
    },
    {
      title: "Em andamento",
      value: kpiData.emAndamento,
      subtitle: `(${emAndamentoPercent}%)`,
      bgColor: "bg-status-doing",
      textColor: "text-status-doing-foreground",
      filterStatus: "Em andamento",
      clickable: true,
    },
    {
      title: "Finalizados",
      value: kpiData.finalizado,
      subtitle: `(${finalizadosPercent}%)`,
      bgColor: "bg-status-done",
      textColor: "text-status-done-foreground",
      filterStatus: "Finalizado",
      clickable: true,
    },
    {
      title: "Info",
      value: kpiData.info,
      subtitle: `(${infoPercent}%)`,
      bgColor: "bg-secondary",
      textColor: "text-secondary-foreground",
      filterStatus: "Info",
      clickable: true,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2" data-report-section="kpi-cards">
      {cards.map((card) => {
        const isFiltered = card.clickable && card.filterStatus && filters.statusFilter.includes(card.filterStatus);
        
        return (
          <div 
            key={card.title} 
            className={cn(
              "group transition-all duration-200 relative border border-border rounded-lg p-2 w-[160px]",
              card.bgColor,
              card.clickable && "cursor-pointer hover:scale-[1.02]",
              isFiltered && "ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.02]"
            )}
            style={{ 
              boxShadow: 'var(--shadow-elegant)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (card.clickable) {
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(36, 143, 132, 0.3), 0 0 1px rgba(36, 143, 132, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (card.clickable) {
                e.currentTarget.style.boxShadow = 'var(--shadow-elegant)';
              }
            }}
            onClick={card.clickable && card.filterStatus ? () => handleKpiClick(card.filterStatus!) : undefined}
          >
            <div>
              <p className={cn("text-xs font-medium mb-0.5", card.textColor, "opacity-80")}>
                {card.title}
              </p>
              <p className={cn("text-xl font-bold", card.textColor)}>
                {card.value}
              </p>
              {card.subtitle && (
                <p className={cn("text-xs", card.textColor, "opacity-70")}>
                  {card.subtitle}
                </p>
              )}
            </div>
            {isFiltered && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}