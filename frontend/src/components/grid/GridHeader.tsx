import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
}

interface GridHeaderProps {
  columns: Column[];
  totalCount: number;
  onAddRow?: () => void;
}

export function GridHeader({ columns, totalCount, onAddRow }: GridHeaderProps) {
  const { canCreate } = usePermissions();
  
  return (
    <div className="grid-header flex">
      {/* Space for expand button */}
      <div className="w-[40px] border-r border-border bg-muted/20"></div>
      
      <div className="flex-1 flex items-center" style={{ display: 'grid', gridTemplateColumns: columns.map(col => col.width).join(' ') }}>
        {columns.map((column) => (
          <div
            key={column.key}
            className="p-1 text-xs font-medium text-foreground border-r border-border last:border-r-0 flex items-center justify-between"
          >
            {column.label}
            {column.key === 'attachments' && canCreate && onAddRow && (
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 ml-1" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddRow();
                }} 
                title="Adicionar nova linha"
              >
                <span className="text-sm leading-none">+</span>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}