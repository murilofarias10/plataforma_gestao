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
  return (
    <div className="grid-header">
      <div className="flex items-center" style={{ display: 'grid', gridTemplateColumns: columns.map(col => col.width).join(' ') }}>
        {columns.map((column) => (
          <div
            key={column.key}
            className="p-1 text-xs font-medium text-foreground border-r border-border last:border-r-0"
          >
            {column.label}
          </div>
        ))}
      </div>
    </div>
  );
}