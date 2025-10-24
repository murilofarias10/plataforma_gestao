import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { toast } from "@/hooks/use-toast";

interface ProjectSelectorProps {
  className?: string;
}

export function ProjectSelector({ className }: ProjectSelectorProps) {
  const { projects, selectedProjectId, setSelectedProject, getSelectedProject, addProject, deleteProject } = useProjectStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  const selectedProject = getSelectedProject();

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      addProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
      });
      setNewProjectName("");
      setNewProjectDescription("");
      setIsAddDialogOpen(false);
      toast({
        title: "Projeto criado",
        description: `Projeto "${newProjectName.trim()}" foi criado com sucesso.`,
      });
    }
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      deleteProject(selectedProject.id);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Projeto excluído",
        description: `Projeto "${selectedProject.name}" e todos os seus documentos foram excluídos permanentemente.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            Criar Novo Projeto
          </label>
          <div className="flex gap-1">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Projeto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Nome do Projeto</Label>
                  <Input
                    id="project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ex: KODEK Controle de Qualidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Descrição (opcional)</Label>
                  <Textarea
                    id="project-description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Descrição do projeto..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddProject} disabled={!newProjectName.trim()}>
                    Adicionar Projeto
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {selectedProject && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  disabled={projects.length <= 1}
                  title={projects.length <= 1 ? "Deve haver pelo menos um projeto" : "Excluir projeto"}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tem certeza que deseja excluir o projeto <strong>"{selectedProject.name}"</strong>?
                  </p>
                  <p className="text-sm text-destructive">
                    Esta ação não pode ser desfeita. Todos os documentos e dados relacionados a este projeto serão excluídos permanentemente.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteProject}>
                    Confirmar Exclusão
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          </div>
        </div>
        
        <Select value={selectedProjectId || ""} onValueChange={handleProjectChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um projeto" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedProject && (
          <p className="text-xs text-muted-foreground">
            {selectedProject.description}
          </p>
        )}
      </div>
    </div>
  );
}
