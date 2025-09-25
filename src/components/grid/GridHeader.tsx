import { Checkbox } from "@/components/ui/checkbox";

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
}

interface GridHeaderProps {
  columns: Column[];
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
}

export function GridHeader({ columns, selectedCount, totalCount, onSelectAll }: GridHeaderProps) {
  return (
    <div className="grid-header">
      <div className="flex items-center" style={{ display: 'grid', gridTemplateColumns: `32px 32px ${columns.map(col => col.width).join(' ')} 80px` }}>
        <div className="p-2 border-r border-border">
          <Checkbox
            checked={selectedCount === totalCount && totalCount > 0}
            onCheckedChange={onSelectAll}
            className="mx-auto"
          />
        </div>
        <div className="p-1 text-center text-xs font-medium text-muted-foreground border-r border-border">
          #
        </div>
        {columns.map((column) => (
          <div
            key={column.key}
            className="p-1 text-xs font-medium text-foreground border-r border-border last:border-r-0"
          >
            {column.label}
          </div>
        ))}
        <div className="p-1 text-center text-xs font-medium text-muted-foreground">
          Ações
        </div>
      </div>
    </div>
  );
}