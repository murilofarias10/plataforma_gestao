import { useState, useRef, useEffect } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Filter, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
    return ['responsavel', 'dataInicio', 'dataFim', 'documento'].includes(columnKey);
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
            <Filter className="h-3 w-3 text-primary" />
          )}
        </div>
      );
    }

    // Render active filter input
    switch (column.key) {
      case 'responsavel':
        return (
          <div className="relative -m-1" onClick={(e) => e.stopPropagation()}>
            <User className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar responsável..."
              value={filters.responsavelSearch || ""}
              onChange={(e) => setFilters({ responsavelSearch: e.target.value })}
              className="pl-7 pr-2 w-full text-xs h-7"
              autoFocus
            />
          </div>
        );
      
      case 'dataInicio':
        return (
          <div className="relative -m-1" onClick={(e) => e.stopPropagation()}>
            <Calendar className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
              className="pl-7 pr-2 w-full text-xs h-7"
              maxLength={10}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
          </div>
        );
      
      case 'dataFim':
        return (
          <div className="relative -m-1" onClick={(e) => e.stopPropagation()}>
            <Calendar className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
              className="pl-7 pr-2 w-full text-xs h-7"
              maxLength={10}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
          </div>
        );
      
      case 'documento':
        return (
          <div className="relative -m-1" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              className="pl-7 pr-2 w-full text-xs h-7"
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
                "p-2 text-xs font-medium border-r border-border last:border-r-0 min-h-[44px] flex items-center relative",
                hasFilter && "cursor-pointer hover:bg-primary/5 bg-blue-50/50 dark:bg-blue-950/20",
                isActive && "bg-primary/10 z-[1001]",
                filterIsActive && !isActive && "bg-green-50/50 dark:bg-green-950/20"
              )}
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