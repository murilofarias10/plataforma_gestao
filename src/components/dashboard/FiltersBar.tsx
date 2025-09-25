import { X, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/stores/projectStore";
import { MultiSelect } from "@/components/ui/multi-select";

export function FiltersBar() {
  const { 
    filters, 
    setFilters, 
    resetFilters, 
    getUniqueAreas, 
    getUniqueResponsaveis,
    getFilteredDocuments 
  } = useProjectStore();
  
  const areas = getUniqueAreas();
  const responsaveis = getUniqueResponsaveis();
  const filteredCount = getFilteredDocuments().length;
  
  const statusOptions = [
    { value: "A iniciar", label: "A iniciar" },
    { value: "Em andamento", label: "Em andamento" },
    { value: "Finalizado", label: "Finalizado" },
  ];

  const areaOptions = areas.map(area => ({ value: area, label: area }));
  const responsavelOptions = responsaveis.map(resp => ({ value: resp, label: resp }));

  const activeFiltersCount = 
    filters.statusFilter.length + 
    filters.areaFilter.length + 
    filters.responsavelFilter.length +
    (filters.searchQuery ? 1 : 0) +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0);

  const removeStatusFilter = (status: string) => {
    setFilters({
      statusFilter: filters.statusFilter.filter(s => s !== status)
    });
  };

  const removeAreaFilter = (area: string) => {
    setFilters({
      areaFilter: filters.areaFilter.filter(a => a !== area)
    });
  };

  const removeResponsavelFilter = (responsavel: string) => {
    setFilters({
      responsavelFilter: filters.responsavelFilter.filter(r => r !== responsavel)
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros:</span>
        </div>

        <MultiSelect
          options={statusOptions}
          value={filters.statusFilter}
          onChange={(values) => setFilters({ statusFilter: values })}
          placeholder="Status"
          className="w-48"
        />

        <MultiSelect
          options={areaOptions}
          value={filters.areaFilter}
          onChange={(values) => setFilters({ areaFilter: values })}
          placeholder="Área"
          className="w-48"
        />

        <MultiSelect
          options={responsavelOptions}
          value={filters.responsavelFilter}
          onChange={(values) => setFilters({ responsavelFilter: values })}
          placeholder="Responsável"
          className="w-48"
        />

        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Filtros ativos ({activeFiltersCount}):
          </span>
          
          {filters.statusFilter.map((status) => (
            <Badge key={status} variant="secondary" className="filter-chip active">
              {status}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-2"
                onClick={() => removeStatusFilter(status)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {filters.areaFilter.map((area) => (
            <Badge key={area} variant="secondary" className="filter-chip active">
              {area}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-2"
                onClick={() => removeAreaFilter(area)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {filters.responsavelFilter.map((responsavel) => (
            <Badge key={responsavel} variant="secondary" className="filter-chip active">
              {responsavel}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-2"
                onClick={() => removeResponsavelFilter(responsavel)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {filters.searchQuery && (
            <Badge variant="secondary" className="filter-chip active">
              Busca: "{filters.searchQuery}"
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-2"
                onClick={() => setFilters({ searchQuery: "" })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {(filters.dateRange.start || filters.dateRange.end) && (
            <Badge variant="secondary" className="filter-chip active">
              Período: {filters.dateRange.start || "..."} - {filters.dateRange.end || "..."}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-2"
                onClick={() => setFilters({ dateRange: { start: "", end: "" } })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredCount} documentos
      </div>
    </div>
  );
}