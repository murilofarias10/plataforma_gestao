import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, BarChart3, CalendarClock, ChevronLeft, ChevronRight, Download, LogOut, User, Shield } from "lucide-react";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { ReportGenerationDialog } from "@/components/ui/ReportGenerationDialog";
import { generateComprehensiveZipReport } from "@/services/zipReportGenerator";
import { useProjectStore } from "@/stores/projectStore";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getSelectedProject } = useProjectStore();
  const { userProfile, signOut } = useAuthStore();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const navigationItems = [
    {
      id: "project-tracker",
      label: "Módulo ATA",
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
        <TooltipProvider>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Tooltip key={item.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-3",
                      isCollapsed ? "px-2 py-3 justify-center" : "min-h-[3rem]"
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    <div className={cn(
                      "flex items-center gap-3 w-full",
                      isCollapsed && "justify-center"
                    )}>
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className={cn(
                          "font-medium text-sm",
                          isActive ? "text-primary-foreground" : "text-foreground"
                        )}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
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

      {/* User Info & Logout */}
      {!isCollapsed && userProfile && (
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {userProfile.role === 'super_admin' ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userProfile.full_name || userProfile.email}
              </p>
              <Badge 
                variant={userProfile.role === 'super_admin' ? 'default' : 'secondary'}
                className="mt-1 text-xs"
              >
                {userProfile.role === 'super_admin' ? 'Super Admin' : 'Visitante'}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
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
