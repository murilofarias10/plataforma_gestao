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
      {/* All Filters in One Line */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros:</span>
        </div>

        <MultiSelect
          options={statusOptions}
          value={filters.statusFilter}
          onChange={(values) => setFilters({ statusFilter: values })}
          placeholder="Status"
          className="w-32"
        />

        <MultiSelect
          options={areaOptions}
          value={filters.areaFilter}
          onChange={(values) => setFilters({ areaFilter: values })}
          placeholder="Área"
          className="w-32"
        />

        <MultiSelect
          options={responsavelOptions}
          value={filters.responsavelFilter}
          onChange={(values) => setFilters({ responsavelFilter: values })}
          placeholder="Responsável"
          className="w-36"
        />

        {/* Data início */}
        <div className="relative">
          <Calendar className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={filters.dateRange.start ? (() => { const [dd, mm, yyyy] = filters.dateRange.start.split('/'); return yyyy && mm && dd ? `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}` : ""; })() : ""}
            onChange={(e) => {
              const iso = e.target.value;
              let br = "";
              if (iso) {
                const [yyyy, mm, dd] = iso.split('-');
                br = `${dd.padStart(2,'0')}/${mm.padStart(2,'0')}/${yyyy}`;
              }
              setFilters({ dateRange: { ...filters.dateRange, start: br } });
            }}
            placeholder="Data início"
            className="pl-8 w-40"
          />
        </div>

        {/* Data fim */}
        <div className="relative">
          <Calendar className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={filters.dateRange.end ? (() => { const [dd, mm, yyyy] = filters.dateRange.end.split('/'); return yyyy && mm && dd ? `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}` : ""; })() : ""}
            onChange={(e) => {
              const iso = e.target.value;
              let br = "";
              if (iso) {
                const [yyyy, mm, dd] = iso.split('-');
                br = `${dd.padStart(2,'0')}/${mm.padStart(2,'0')}/${yyyy}`;
              }
              setFilters({ dateRange: { ...filters.dateRange, end: br } });
            }}
            placeholder="Data fim"
            className="pl-8 w-40"
          />
        </div>

        {/* Buscar documentos */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            className="pl-10 w-48"
          />
        </div>

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