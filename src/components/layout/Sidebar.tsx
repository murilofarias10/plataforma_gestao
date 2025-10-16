import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    }
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
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
              <p className="text-xs text-muted-foreground">ENGINEERING</p>
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
                "w-full justify-start h-auto p-3",
                isCollapsed && "px-2"
              )}
              onClick={() => navigate(item.path)}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5 flex-shrink-0")} />
                {!isCollapsed && (
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Plataforma de Gestão
          </p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
