import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiCardsProps {
  emitidosPercentage: number;
  aprovadosPercentage: number;
}

const KpiCards = ({ emitidosPercentage, aprovadosPercentage }: KpiCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-report-section="document-monitor-kpis">
      {/* Emitidos Card */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Emitidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {emitidosPercentage}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Documentos emitidos do total planejado
          </p>
        </CardContent>
      </Card>

      {/* Aprovados Card */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Aprovados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {aprovadosPercentage}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Percentual de documentos emitidos aprovados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KpiCards;
