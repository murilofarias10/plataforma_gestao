import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FiltersBarProps {
  dateRange: {
    start: string;
    end: string;
  };
  onDateRangeChange: (dateRange: { start: string; end: string }) => void;
  selectedDiscipline: string;
  onDisciplineChange: (discipline: string) => void;
  disciplines?: string[];
}

const FiltersBar = ({ 
  dateRange, 
  onDateRangeChange, 
  selectedDiscipline, 
  onDisciplineChange,
  disciplines = ["All"]
}: FiltersBarProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
      {/* Date Filter */}
      <div className="flex-1">
        <Label htmlFor="date-filter" className="text-sm font-medium mb-2 block">
          Data Fim Fluxo
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            id="start-date"
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
            className="w-40"
          />
          <span className="text-muted-foreground">até</span>
          <Input
            id="end-date"
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
            className="w-40"
          />
        </div>
      </div>

      {/* Discipline Filter */}
      <div className="flex-1">
        <Label htmlFor="discipline-filter" className="text-sm font-medium mb-2 block">
          Disciplina
        </Label>
        <Select value={selectedDiscipline} onValueChange={onDisciplineChange}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Selecione uma disciplina" />
          </SelectTrigger>
          <SelectContent>
            {disciplines.map((discipline) => (
              <SelectItem key={discipline} value={discipline}>
                {discipline}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FiltersBar;
