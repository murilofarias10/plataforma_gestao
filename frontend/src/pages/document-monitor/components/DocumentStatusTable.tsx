import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusTableRow {
  status: string;
  qtde: number;
  inicio: number | null;
  fim: number | null;
}

interface DocumentStatusTableProps {
  data: StatusTableRow[];
}

const DocumentStatusTable = ({ data }: DocumentStatusTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (status: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(status)) {
      newExpanded.delete(status);
    } else {
      newExpanded.add(status);
    }
    setExpandedRows(newExpanded);
  };

  const total = data.reduce((acc, row) => ({
    status: 'Total',
    qtde: acc.qtde + row.qtde,
    inicio: (acc.inicio || 0) + (row.inicio || 0),
    fim: (acc.fim || 0) + (row.fim || 0)
  }), { status: 'Total', qtde: 0, inicio: 0, fim: 0 });

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="border border-border p-3 text-left font-medium">Status do Documento</th>
              <th className="border border-border p-3 text-center font-medium">Qtde.</th>
              <th className="border border-border p-3 text-center font-medium">Início</th>
              <th className="border border-border p-3 text-center font-medium">Fim</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-muted/30">
                <td className="border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleRow(row.status)}
                    >
                      {expandedRows.has(row.status) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <span>{row.status}</span>
                  </div>
                </td>
                <td className="border border-border p-3 text-center">{row.qtde}</td>
                <td className="border border-border p-3 text-center">{row.inicio || '-'}</td>
                <td className="border border-border p-3 text-center">{row.fim || '-'}</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-muted/50 font-semibold">
              <td className="border border-border p-3 pl-11">
                <span>{total.status}</span>
              </td>
              <td className="border border-border p-3 text-center">{total.qtde}</td>
              <td className="border border-border p-3 text-center">{total.inicio}</td>
              <td className="border border-border p-3 text-center">{total.fim}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentStatusTable;
