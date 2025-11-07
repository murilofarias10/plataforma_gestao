import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, BarChart3, CalendarClock, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { ReportGenerationDialog } from "@/components/ui/ReportGenerationDialog";
import { generateComprehensiveZipReport } from "@/services/zipReportGenerator";
import { useProjectStore } from "@/stores/projectStore";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getSelectedProject } = useProjectStore();

  const navigationItems = [
    {
      id: "project-tracker",
      label: "Project Tracker",
      icon: FileSpreadsheet,
      path: "/project-tracker",
      description: "Controle de documentos e acompanhamento de projetos"
    },
    {
      id: "document-monitor", 
      label: "Monitor de Documentos",
      icon: BarChart3,
      path: "/document-monitor",
      description: "Monitoramento de status de documentos técnicos"
    },
    {
      id: "meeting-environment",
      label: "Ambiente de Reuniões",
      icon: CalendarClock,
      path: "/meeting-environment",
      description: "Histórico e gestão de reuniões registradas"
    }
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleGenerateReport = async () => {
    try {
      const selectedProject = getSelectedProject();
      if (!selectedProject) {
        throw new Error('Nenhum projeto selecionado');
      }
      await generateComprehensiveZipReport(selectedProject.id);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-80 min-w-80",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <img 
              src="/kubik-logo.png" 
              alt="KUBIK" 
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold text-foreground">KUBIK</h1>
              <p className="text-xs text-muted-foreground">ENGENHARIA</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <img 
            src="/kubik-logo.png" 
            alt="KUBIK" 
            className="h-8 w-auto mx-auto"
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Project Selection */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <ProjectSelector />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-4 min-h-[4rem]",
                isCollapsed && "px-2 py-3 min-h-[3rem]"
              )}
              onClick={() => navigate(item.path)}
            >
              <div className="flex items-start gap-3 w-full">
                <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5")} />
                {!isCollapsed && (
                  <div className="flex flex-col items-start flex-1 min-w-0 pr-2">
                    <span className={cn(
                      "font-medium text-sm leading-tight block",
                      isActive ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {item.label}
                    </span>
                    <span className={cn(
                      "text-xs leading-relaxed mt-1 block break-words whitespace-normal",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </span>
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </nav>

      {/* Generate Report Button */}
      {!isCollapsed && (
        <div className="p-4">
          <Button 
            onClick={() => setIsReportDialogOpen(true)} 
            className="w-full flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Download className="h-4 w-4" />
            Gerar Relatório
          </Button>
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center break-words">
            Plataforma de Gestão
          </p>
        </div>
      )}
      
      {/* Report Generation Dialog */}
      <ReportGenerationDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onGenerate={handleGenerateReport}
      />
    </div>
  );
};

export default Sidebar;
