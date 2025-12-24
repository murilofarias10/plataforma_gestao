import { useState, useRef, useEffect } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { Input } from "@/components/ui/input";
import { Search, Calendar as CalendarIcon, Filter, User } from "lucide-react";
import { cn, parseBRDateLocal } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ptBR } from "date-fns/locale";

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
}

interface GridHeaderProps {
  columns: Column[];
  totalCount: number;
}

export function GridHeader({ columns, totalCount }: GridHeaderProps) {
  const { 
    filters, 
    setFilters
  } = useProjectStore();
  
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Close active filter when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveFilter(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveFilter(null);
      }
    };

    if (activeFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [activeFilter]);

  const hasFilterForColumn = (columnKey: string) => {
    return ['responsavel', 'dataInicio', 'dataFim', 'documento', 'detalhe'].includes(columnKey);
  };

  const isFilterActive = (columnKey: string) => {
    switch (columnKey) {
      case 'responsavel':
        return !!filters.responsavelSearch;
      case 'dataInicio':
        return !!filters.dateRange.start;
      case 'dataFim':
        return !!filters.dateRange.end;
      case 'documento':
        return !!filters.searchQuery;
      case 'detalhe':
        return !!filters.detalhesSearch;
      default:
        return false;
    }
  };

  const renderColumnContent = (column: Column) => {
    const isActive = activeFilter === column.key;
    const hasFilter = hasFilterForColumn(column.key);
    const filterIsActive = isFilterActive(column.key);

    if (!hasFilter) {
      return <span>{column.label}</span>;
    }

    if (!isActive) {
      return (
        <div className="flex items-center justify-between gap-1">
          <span>{column.label}</span>
          {filterIsActive && (
            <Filter className="h-3 w-3 text-white" />
          )}
        </div>
      );
    }

    // Render active filter input
    switch (column.key) {
      case 'responsavel':
        return (
          <div className="relative -m-1" onClick={(e) => e.stopPropagation()}>
            <User className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <Input
              placeholder="Buscar resp..."
              value={filters.responsavelSearch || ""}
              onChange={(e) => setFilters({ responsavelSearch: e.target.value })}
              className="pl-7 pr-2 w-full text-[11px] h-7 bg-white text-foreground placeholder:text-gray-400"
              autoFocus
            />
          </div>
        );
      
      case 'dataInicio':
        return (
          <div className="relative -m-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <Input
                type="text"
                value={filters.dateRange.start || ""}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/[^0-9-]/g, '');
                  if (value.length <= 2) {
                    value = value;
                  } else if (value.length <= 5) {
                    value = value.replace(/^(\d{2})(\d)/, '$1-$2');
                  } else if (value.length <= 10) {
                    value = value.replace(/^(\d{2})-(\d{2})(\d)/, '$1-$2-$3');
                  } else {
                    value = value.substring(0, 10);
                  }
                  setFilters({ dateRange: { ...filters.dateRange, start: value } });
                }}
                placeholder="dd-mm-aaaa"
                className="pl-7 pr-2 w-full text-[11px] h-7 bg-white text-foreground placeholder:text-gray-400"
                maxLength={10}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 hover:bg-white/20 text-white p-0"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[1100]" align="end">
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
        );
      
      case 'dataFim':
        return (
          <div className="relative -m-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <Input
                type="text"
                value={filters.dateRange.end || ""}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/[^0-9-]/g, '');
                  if (value.length <= 2) {
                    value = value;
                  } else if (value.length <= 5) {
                    value = value.replace(/^(\d{2})(\d)/, '$1-$2');
                  } else if (value.length <= 10) {
                    value = value.replace(/^(\d{2})-(\d{2})(\d)/, '$1-$2-$3');
                  } else {
                    value = value.substring(0, 10);
                  }
                  setFilters({ dateRange: { ...filters.dateRange, end: value } });
                }}
                placeholder="dd-mm-aaaa"
                className="pl-7 pr-2 w-full text-[11px] h-7 bg-white text-foreground placeholder:text-gray-400"
                maxLength={10}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 hover:bg-white/20 text-white p-0"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[1100]" align="end">
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
        );
      
      case 'documento':
        return (
          <div className="relative -m-1" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <Input
              placeholder="Buscar..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              className="pl-7 pr-2 w-full text-[11px] h-7 bg-white text-foreground placeholder:text-gray-400"
              autoFocus
            />
          </div>
        );
      
      case 'detalhe':
        return (
          <div className="relative -m-1" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <Input
              placeholder="Buscar..."
              value={filters.detalhesSearch || ""}
              onChange={(e) => setFilters({ detalhesSearch: e.target.value })}
              className="pl-7 pr-2 w-full text-[11px] h-7 bg-white text-foreground placeholder:text-gray-400"
              autoFocus
            />
          </div>
        );
      
      default:
        return <span>{column.label}</span>;
    }
  };

  return (
    <div className="grid-header flex relative" ref={headerRef} style={{ zIndex: 100 }}>
      {/* Space for expand button */}
      <div className="w-[40px] border-r border-border bg-muted/20"></div>
      
      <div className="flex-1 flex items-center" style={{ display: 'grid', gridTemplateColumns: columns.map(col => col.width).join(' ') }}>
        {columns.map((column) => {
          const hasFilter = hasFilterForColumn(column.key);
          const isActive = activeFilter === column.key;
          const filterIsActive = isFilterActive(column.key);
          
          return (
            <div
              key={column.key}
              className={cn(
                "p-2 text-xs font-medium border-r border-border last:border-r-0 min-h-[44px] flex items-center justify-center relative transition-all uppercase",
                hasFilter && "cursor-pointer hover:opacity-90 text-white",
                isActive && "z-[1001] ring-2 ring-inset ring-white/50"
              )}
              style={{
                backgroundColor: hasFilter 
                  ? (isActive ? '#0ea89a' : (filterIsActive ? '#0c8c80' : '#0d9488'))
                  : undefined
              }}
              onClick={() => {
                if (hasFilter) {
                  setActiveFilter(isActive ? null : column.key);
                }
              }}
            >
              {renderColumnContent(column)}
            </div>
          );
        })}
      </div>
    </div>
  );
}