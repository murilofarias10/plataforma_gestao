import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, BarChart3, CalendarClock, Download, LogOut, User, Shield, Plus, FolderOpen, Trash2 } from "lucide-react";
import { ReportGenerationDialog } from "@/components/ui/ReportGenerationDialog";
import { generateComprehensiveZipReport } from "@/services/zipReportGenerator";
import { generateReportForMultipleMeetings } from "@/services/pdfReportGenerator";
import { useProjectStore } from "@/stores/projectStore";
import { useAuthStore } from "@/stores/authStore";
import { useMeetingFilterStore } from "@/stores/meetingFilterStore";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isSelectProjectOpen, setIsSelectProjectOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, selectedProjectId, setSelectedProject, getSelectedProject, deleteProject, addProject } = useProjectStore();
  const { userProfile, signOut } = useAuthStore();

  const selectedProject = getSelectedProject();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setIsSelectProjectOpen(false);
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      deleteProject(selectedProject.id);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Projeto excluído",
        description: `Projeto "${selectedProject.name}" foi excluído com sucesso.`,
        variant: "destructive",
      });
    }
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      const projectName = newProjectName.trim();
      await addProject({
        name: projectName,
        description: newProjectDescription.trim() || undefined,
      });
      setNewProjectName("");
      setNewProjectDescription("");
      setIsCreateProjectOpen(false);
      toast({
        title: "Projeto criado",
        description: `Projeto "${projectName}" foi criado com sucesso.`,
      });
    }
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

  const handleGenerateReport = async () => {
    try {
      const selectedProject = getSelectedProject();
      if (!selectedProject) {
        throw new Error('Nenhum projeto selecionado');
      }

      // Check if we're on the meeting-environment page
      const isMeetingEnvironmentPage = location.pathname === '/meeting-environment';
      
      if (isMeetingEnvironmentPage) {
        // Generate report for all filtered meetings
        const filteredMeetings = useMeetingFilterStore.getState().filteredMeetings;
        
        if (filteredMeetings.length === 0) {
          toast({
            title: "Nenhuma reunião encontrada",
            description: "Não há reuniões para gerar o relatório. Aplique filtros ou verifique se há reuniões registradas.",
            variant: "destructive",
          });
          return;
        }

        await generateReportForMultipleMeetings(filteredMeetings);
        toast({
          title: "Relatório gerado",
          description: `Relatório gerado para ${filteredMeetings.length} ${filteredMeetings.length === 1 ? 'reunião' : 'reuniões'}.`,
        });
      } else {
        // Generate comprehensive ZIP report for other pages
        await generateComprehensiveZipReport(selectedProject.id);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar o relatório.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-card border-r border-border w-16",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-border">
        <img 
          src="/kubik-logo.png" 
          alt="KUBIK" 
          className="h-8 w-auto"
        />
      </div>

      {/* Project Actions */}
      <div className="p-2 border-b border-border space-y-2">
        <TooltipProvider>
          {/* Create Project */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-10 px-2 py-3 justify-center hover:bg-primary/10"
                onClick={() => setIsCreateProjectOpen(true)}
              >
                <Plus className="h-5 w-5 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">Criar Novo Projeto</p>
              <p className="text-xs text-muted-foreground mt-1">Adicionar um novo projeto</p>
            </TooltipContent>
          </Tooltip>

          {/* Select Project */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-10 px-2 py-3 justify-center hover:bg-blue-500/10"
                onClick={() => setIsSelectProjectOpen(true)}
              >
                <FolderOpen className="h-5 w-5 text-blue-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">Selecionar Projeto</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedProject ? selectedProject.name : 'Nenhum projeto selecionado'}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Delete Project */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-10 px-2 py-3 justify-center hover:bg-destructive/10"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={!selectedProject}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">Excluir Projeto</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedProject ? `Excluir ${selectedProject.name}` : 'Nenhum projeto selecionado'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-2">
        <TooltipProvider>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Tooltip key={item.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full px-2 py-3 justify-center h-auto"
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="h-5 w-5" />
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
      <div className="p-2">
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => setIsReportDialogOpen(true)} 
                className="w-full px-2 py-3 justify-center bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">Gerar Relatório</p>
              <p className="text-xs text-muted-foreground mt-1">
                {location.pathname === '/meeting-environment' 
                  ? 'Gerar relatório de todas as reuniões filtradas'
                  : 'Exportar relatório completo do projeto'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* User Info & Logout */}
      {userProfile && (
        <div className="p-2 border-t border-border space-y-2">
          <TooltipProvider>
            {/* User Info Icon */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
                  {userProfile.role === 'super_admin' ? (
                    <Shield className="h-5 w-5 text-primary" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{userProfile.full_name || userProfile.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {userProfile.role === 'super_admin' ? 'Super Admin' : 'Visitante'}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Logout Button */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full px-2 py-3 justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">Sair</p>
                <p className="text-xs text-muted-foreground mt-1">Fazer logout da conta</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      {/* Report Generation Dialog */}
      <ReportGenerationDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onGenerate={handleGenerateReport}
      />

      {/* Project Selector Dialog */}
      <Dialog open={isSelectProjectOpen} onOpenChange={setIsSelectProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Projeto</DialogTitle>
            <DialogDescription>
              Escolha um projeto para visualizar e gerenciar seus documentos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedProjectId || ""} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSelectProjectOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto <strong>{selectedProject?.name}</strong>?
              Esta ação não pode ser desfeita e todos os documentos associados serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Project Dialog */}
      <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Projeto</DialogTitle>
            <DialogDescription>
              Adicione um novo projeto para organizar seus documentos e reuniões.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nome do Projeto *</Label>
              <Input
                id="project-name"
                placeholder="Ex: RUMO 12"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newProjectName.trim()) {
                    handleCreateProject();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Descrição (Opcional)</Label>
              <Textarea
                id="project-description"
                placeholder="Descreva o projeto..."
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
            >
              Criar Projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sidebar;
