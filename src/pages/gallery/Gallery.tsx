import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Gallery = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <img 
              src="/kubik-logo.png" 
              alt="KUBIK ENG" 
              className="h-12 w-auto"
            />
            <h1 className="text-2xl font-bold text-foreground">Plataforma de Gestão</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Escolha sua Ferramenta
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acesse as ferramentas de gestão disponíveis para otimizar seus projetos e processos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Project Tracker Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Project Tracker</CardTitle>
              <CardDescription className="text-base">
                Controle de documentos e acompanhamento de projetos com dashboard integrado
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => navigate('/project-tracker')}
                className="w-full"
                size="lg"
              >
                Acessar Project Tracker
              </Button>
            </CardContent>
          </Card>

          {/* Document Monitor Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Monitor de Documentos</CardTitle>
              <CardDescription className="text-base">
                Monitoramento de status de documentos técnicos com dashboard de acompanhamento
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => navigate('/document-monitor')}
                className="w-full"
                size="lg"
              >
                Acessar Monitor de Documentos
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Gallery;
