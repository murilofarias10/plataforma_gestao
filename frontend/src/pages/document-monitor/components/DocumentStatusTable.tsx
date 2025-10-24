import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DocumentStatusTable = () => {
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

  const tableData = [
    { status: 'Aprovado', qtde: 34, inicio: 34, fim: 34 },
    { status: 'Cancelado', qtde: 3, inicio: 1, fim: null },
    { status: 'Emitido', qtde: 60, inicio: 60, fim: 53 },
    { status: 'Não Se Aplica', qtde: 80, inicio: null, fim: null },
    { status: 'Para Emissão', qtde: 10, inicio: 10, fim: null },
  ];

  const total = {
    status: 'Total',
    qtde: 187,
    inicio: 105,
    fim: 87,
    isTotal: true
  };

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
            {tableData.map((row, index) => (
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
              <td className="border border-border p-3">
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
