import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjectStore } from "@/stores/projectStore";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onComplete: () => void;
}

export function BulkEditDialog({ open, onOpenChange, selectedIds, onComplete }: BulkEditDialogProps) {
  const { bulkUpdateDocuments, getUniqueAreas, getUniqueResponsaveis } = useProjectStore();
  const [updates, setUpdates] = useState<{
    status?: "A iniciar" | "Em andamento" | "Finalizado";
    responsavel?: string;
    area?: string;
  }>({});

  const areas = getUniqueAreas();
  const responsaveis = getUniqueResponsaveis();

  const handleSave = () => {
    if (Object.keys(updates).length > 0) {
      bulkUpdateDocuments(selectedIds, updates);
      onComplete();
      setUpdates({});
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setUpdates({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar em Lote</DialogTitle>
          <DialogDescription>
            Editar {selectedIds.length} documento(s) selecionado(s). 
            Apenas os campos preenchidos serão atualizados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <div className="col-span-3">
              <Select
                value={updates.status || ""}
                onValueChange={(value: "A iniciar" | "Em andamento" | "Finalizado") => setUpdates(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A iniciar">A iniciar</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="responsavel" className="text-right">
              Responsável
            </Label>
            <div className="col-span-3">
              <Select
                value={updates.responsavel || ""}
                onValueChange={(value) => setUpdates(prev => ({ ...prev, responsavel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.map((responsavel) => (
                    <SelectItem key={responsavel} value={responsavel}>
                      {responsavel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="area" className="text-right">
              Área
            </Label>
            <div className="col-span-3">
              <Select
                value={updates.area || ""}
                onValueChange={(value) => setUpdates(prev => ({ ...prev, area: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={Object.keys(updates).length === 0}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}