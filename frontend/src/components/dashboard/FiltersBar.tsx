import { X, Filter, RotateCcw, Search, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/stores/projectStore";
import { MultiSelect } from "@/components/ui/multi-select";
import { Input } from "@/components/ui/input";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { parseBRDateLocal } from "@/lib/utils";
import { ptBR } from "date-fns/locale";

export function FiltersBar(): React.ReactElement {
  const { 
    filters, 
    setFilters, 
    resetFilters, 
    getUniqueResponsaveis,
    getTableDocuments 
  } = useProjectStore();
  
  const responsaveis = getUniqueResponsaveis();
  const filteredCount = getTableDocuments().length;

  const responsavelOptions = responsaveis.map(resp => ({ value: resp, label: resp }));

  const activeFiltersCount = 
    filters.statusFilter.length +
    filters.responsavelFilter.length +
    filters.areaFilter.length +
    (filters.searchQuery ? 1 : 0) +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0);

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
          options={responsavelOptions}
          value={filters.responsavelFilter}
          onChange={(values) => setFilters({ responsavelFilter: values })}
          placeholder="Responsável"
          className="w-32 min-w-[128px] flex-shrink-0"
        />

        {/* Data início */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Data Início:</span>
          <div className="relative flex items-center gap-1">
            <div className="relative">
              <CalendarIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 hover:bg-muted"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="end">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.start ? parseBRDateLocal(filters.dateRange.start) || undefined : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      const formattedDate = `${day}-${month}-${year}`;
                      setFilters({ dateRange: { ...filters.dateRange, start: formattedDate } });
                    } else {
                      setFilters({ dateRange: { ...filters.dateRange, start: '' } });
                    }
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Data fim */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Data Fim:</span>
          <div className="relative flex items-center gap-1">
            <div className="relative">
              <CalendarIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 hover:bg-muted"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="end">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.end ? parseBRDateLocal(filters.dateRange.end) || undefined : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      const formattedDate = `${day}-${month}-${year}`;
                      setFilters({ dateRange: { ...filters.dateRange, end: formattedDate } });
                    } else {
                      setFilters({ dateRange: { ...filters.dateRange, end: '' } });
                    }
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Buscar tópicos */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tópicos..."
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

    </div>
  );
}