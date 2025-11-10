import React, { useState, useCallback } from 'react';
import { MeetingMetadata } from '@/types/project';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { useProjectStore } from '@/stores/projectStore';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

export function MeetingRegistrationSection() {
  // Subscribe to projects array directly - Zustand will re-render when this changes
  const projects = useProjectStore((state) => state.projects);
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const updateProject = useProjectStore((state) => state.updateProject);
  const getSelectedProject = useProjectStore((state) => state.getSelectedProject);
  const { canCreate } = usePermissions();
  
  const selectedProject = getSelectedProject();
  
  const [meetingData, setMeetingData] = useState('');
  const [meetingNumero, setMeetingNumero] = useState('');
  const [meetingDetalhes, setMeetingDetalhes] = useState('');
  const [newParticipant, setNewParticipant] = useState('');
  const [tempParticipants, setTempParticipants] = useState<string[]>([]);


  const handleAddParticipant = useCallback(() => {
    if (newParticipant.trim()) {
      setTempParticipants([...tempParticipants, newParticipant.trim()]);
      setNewParticipant('');
    }
  }, [newParticipant, tempParticipants]);

  const handleRemoveParticipant = useCallback((index: number) => {
    setTempParticipants(tempParticipants.filter((_, i) => i !== index));
  }, [tempParticipants]);


  const handleAddMeeting = useCallback(async () => {
    if (!meetingData.trim() || !meetingNumero.trim() || !selectedProjectId) {
      toast.error('Por favor, preencha a Data da Reunião e o Número da Ata');
      return;
    }

    try {
      // Get current meetings fresh from store
      const currentProject = projects.find(p => p.id === selectedProjectId);
      const currentMeetings = currentProject?.meetings || [];

      const newMeeting: MeetingMetadata = {
        id: uuidv4(),
        data: meetingData,
        numeroAta: meetingNumero,
        detalhes: meetingDetalhes.trim() || undefined,
        participants: tempParticipants,
        createdAt: new Date().toISOString(),
      };

      const updatedMeetings = [...currentMeetings, newMeeting];
      
      await updateProject(selectedProjectId, { meetings: updatedMeetings });
      
      // Reset form
      setMeetingData('');
      setMeetingNumero('');
      setMeetingDetalhes('');
      setTempParticipants([]);
      
      toast.success('Reunião adicionada com sucesso!');
    } catch (error) {
      console.error('Error adding meeting:', error);
      toast.error('Erro ao adicionar reunião. Tente novamente.');
    }
  }, [meetingData, meetingNumero, meetingDetalhes, tempParticipants, projects, selectedProjectId, updateProject]);

  const canAddMeeting = meetingData.trim() && meetingNumero.trim();

  if (!selectedProject) {
    return null;
  }

  // Hide entire section for visitors (no create permission)
  if (!canCreate) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold text-foreground">Registrar Reunião</div>
        <Button 
          size="sm" 
          className="h-8 text-xs px-3"
          onClick={handleAddMeeting}
          disabled={!canAddMeeting}
          type="button"
        >
          Adicionar Reunião
        </Button>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Data da Reunião
          </label>
          <Input
            type="text"
            placeholder="dd-mm-aaaa"
            className="h-8 text-sm w-full"
            value={meetingData}
            onChange={(e) => {
              let value = e.target.value;
              // Remove non-numeric characters except dashes
              value = value.replace(/[^0-9-]/g, '');
              
              // Auto-format as user types (dd-mm-aaaa)
              if (value.length <= 2) {
                value = value;
              } else if (value.length <= 5) {
                value = value.replace(/^(\d{2})(\d)/, '$1-$2');
              } else if (value.length <= 10) {
                value = value.replace(/^(\d{2})-(\d{2})(\d)/, '$1-$2-$3');
              } else {
                value = value.substring(0, 10);
              }
              
              setMeetingData(value);
            }}
            maxLength={10}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Número da Ata
          </label>
          <Input
            type="text"
            placeholder="Ex: ATA-001"
            className="h-8 text-sm w-full"
            value={meetingNumero}
            onChange={(e) => setMeetingNumero(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Detalhes
          </label>
          <Input
            type="text"
            placeholder="Detalhes da reunião"
            className="h-8 text-sm w-full"
            value={meetingDetalhes}
            onChange={(e) => setMeetingDetalhes(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Participantes
          </label>
          {/* Add Participant - Input with button */}
          <div className="flex items-center gap-1">
            <Input
              type="text"
              placeholder="Nome do participante"
              className="h-8 text-sm flex-1"
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddParticipant();
                }
              }}
            />
            <Button 
              size="sm" 
              variant="outline"
              className="h-8 px-2 flex-shrink-0"
              onClick={handleAddParticipant}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        {/* Participant Tags - Display below input */}
        {tempParticipants.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tempParticipants.map((participant, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-0.5 flex items-center gap-1"
              >
                {participant}
                <button
                  onClick={() => handleRemoveParticipant(index)}
                  className="hover:bg-muted rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

