import { Search, Calendar, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/projectStore";
import { DatePicker } from "@/components/ui/date-picker";

export function Header() {
  const { filters, setFilters } = useProjectStore();

  const handleLogoUpload = () => {
    // Placeholder for logo upload functionality
    console.log("Logo upload clicked");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-gradient-to-r from-background to-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-4">
            {/* Logo placeholder with upload functionality */}
            <img 
              src="/kubik-logo.png" 
              alt="KUBIK ENG" 
              className="h-16 w-auto"
            />
            
            <div>
              <h1 className="text-3xl font-bold text-foreground">Project Tracker</h1>
              <p className="text-sm text-muted-foreground">Controle de Documentos</p>
            </div>
          </div>

          {/* Right side - Date picker and Search */}
          <div className="flex items-center gap-4">
            {/* Date Range Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <DatePicker
                  value={filters.dateRange.start}
                  onChange={(date) => setFilters({ 
                    dateRange: { ...filters.dateRange, start: date } 
                  })}
                  placeholder="Data início"
                />
                <span className="text-muted-foreground">-</span>
                <DatePicker
                  value={filters.dateRange.end}
                  onChange={(date) => setFilters({ 
                    dateRange: { ...filters.dateRange, end: date } 
                  })}
                  placeholder="Data fim"
                />
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ searchQuery: e.target.value })}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}