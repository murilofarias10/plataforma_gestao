import { X, Filter, RotateCcw, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/stores/projectStore";
import { MultiSelect } from "@/components/ui/multi-select";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

export function FiltersBar() {
  const { 
    filters, 
    setFilters, 
    resetFilters, 
    getUniqueAreas, 
    getUniqueResponsaveis,
    getTableDocuments 
  } = useProjectStore();
  
  const areas = getUniqueAreas();
  const responsaveis = getUniqueResponsaveis();
  const filteredCount = getTableDocuments().length;
  
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
      {/* All Filters in One Line - Optimized for single row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground whitespace-nowrap">Filtros:</span>
        </div>

        <MultiSelect
          options={statusOptions}
          value={filters.statusFilter}
          onChange={(values) => setFilters({ statusFilter: values })}
          placeholder="Status"
          className="w-28 min-w-[112px] flex-shrink-0"
        />

        <MultiSelect
          options={areaOptions}
          value={filters.areaFilter}
          onChange={(values) => setFilters({ areaFilter: values })}
          placeholder="Área"
          className="w-28 min-w-[112px] flex-shrink-0"
        />

        <MultiSelect
          options={responsavelOptions}
          value={filters.responsavelFilter}
          onChange={(values) => setFilters({ responsavelFilter: values })}
          placeholder="Responsável"
          className="w-32 min-w-[128px] flex-shrink-0"
        />

        {/* Data início */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Data Início:</span>
          <div className="relative">
            <Calendar className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={filters.dateRange.start || ""}
              onChange={(e) => {
                let value = e.target.value;
                // Remove non-numeric characters except dashes
                value = value.replace(/[^0-9-]/g, '');
                
                // Auto-format as user types (dd-mm-aaaa)
                if (value.length <= 2) {
                  // Just day
                  value = value;
                } else if (value.length <= 5) {
                  // Day and month
                  value = value.replace(/^(\d{2})(\d)/, '$1-$2');
                } else if (value.length <= 10) {
                  // Day, month, and year
                  value = value.replace(/^(\d{2})-(\d{2})(\d)/, '$1-$2-$3');
                } else {
                  // Limit to 10 characters (dd-mm-aaaa)
                  value = value.substring(0, 10);
                }
                
                setFilters({ dateRange: { ...filters.dateRange, start: value } });
              }}
              placeholder="dd-mm-aaaa"
              className="pl-8 w-36 min-w-[144px]"
              maxLength={10}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Data fim */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Data Fim:</span>
          <div className="relative">
            <Calendar className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={filters.dateRange.end || ""}
              onChange={(e) => {
                let value = e.target.value;
                // Remove non-numeric characters except dashes
                value = value.replace(/[^0-9-]/g, '');
                
                // Auto-format as user types (dd-mm-aaaa)
                if (value.length <= 2) {
                  // Just day
                  value = value;
                } else if (value.length <= 5) {
                  // Day and month
                  value = value.replace(/^(\d{2})(\d)/, '$1-$2');
                } else if (value.length <= 10) {
                  // Day, month, and year
                  value = value.replace(/^(\d{2})-(\d{2})(\d)/, '$1-$2-$3');
                } else {
                  // Limit to 10 characters (dd-mm-aaaa)
                  value = value.substring(0, 10);
                }
                
                setFilters({ dateRange: { ...filters.dateRange, end: value } });
              }}
              placeholder="dd-mm-aaaa"
              className="pl-8 w-36 min-w-[144px]"
              maxLength={10}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Buscar documentos */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            className="pl-10 w-44 min-w-[176px]"
          />
        </div>

        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Limpar filtros</span>
            <span className="sm:hidden">Limpar</span>
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