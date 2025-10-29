import React, { useState, useCallback } from 'react';
import { MeetingMetadata } from '@/types/project';
import { Plus, X, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { useProjectStore } from '@/stores/projectStore';
import { toast } from 'sonner';

export function MeetingRegistrationSection() {
  // Subscribe to projects array directly - Zustand will re-render when this changes
  const projects = useProjectStore((state) => state.projects);
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const updateProject = useProjectStore((state) => state.updateProject);
  const getSelectedProject = useProjectStore((state) => state.getSelectedProject);
  const documents = useProjectStore((state) => state.documents);
  
  const selectedProject = getSelectedProject();
  
  const [meetingData, setMeetingData] = useState('');
  const [meetingNumero, setMeetingNumero] = useState('');
  const [meetingDetalhes, setMeetingDetalhes] = useState('');
  const [newParticipant, setNewParticipant] = useState('');
  const [tempParticipants, setTempParticipants] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set());

  // Get meetings from the project directly from store to ensure reactivity
  const meetings = React.useMemo(() => {
    if (!selectedProjectId) {
      console.log('[MeetingSection] No selectedProjectId');
      return [];
    }
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) {
      console.log('[MeetingSection] Project not found');
      return [];
    }
    const meetingsArray = project?.meetings || [];
    console.log('[MeetingSection] Meetings from project:', meetingsArray, 'length:', meetingsArray.length);
    return meetingsArray;
  }, [projects, selectedProjectId]);

  // Get available items from documents
  const availableItems = React.useMemo(() => {
    if (!selectedProjectId) return [];
    return documents
      .filter(doc => doc.projectId === selectedProjectId && !doc.isCleared)
      .map(doc => doc.numeroItem)
      .filter((num): num is number => typeof num === 'number' && num > 0)
      .sort((a, b) => a - b);
  }, [documents, selectedProjectId]);

  const handleAddParticipant = useCallback(() => {
    if (newParticipant.trim()) {
      setTempParticipants([...tempParticipants, newParticipant.trim()]);
      setNewParticipant('');
    }
  }, [newParticipant, tempParticipants]);

  const handleRemoveParticipant = useCallback((index: number) => {
    setTempParticipants(tempParticipants.filter((_, i) => i !== index));
  }, [tempParticipants]);

  const toggleItemSelection = useCallback((itemNumber: number) => {
    setSelectedItems(prev => {
      if (prev.includes(itemNumber)) {
        return prev.filter(num => num !== itemNumber);
      } else {
        return [...prev, itemNumber].sort((a, b) => a - b);
      }
    });
  }, []);

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
        relatedItems: selectedItems.length > 0 ? selectedItems : undefined,
        createdAt: new Date().toISOString(),
      };

      const updatedMeetings = [...currentMeetings, newMeeting];
      
      await updateProject(selectedProjectId, { meetings: updatedMeetings });
      
      // Reset form
      setMeetingData('');
      setMeetingNumero('');
      setMeetingDetalhes('');
      setTempParticipants([]);
      setSelectedItems([]);
      
      toast.success('Reunião adicionada com sucesso!');
    } catch (error) {
      console.error('Error adding meeting:', error);
      toast.error('Erro ao adicionar reunião. Tente novamente.');
    }
  }, [meetingData, meetingNumero, meetingDetalhes, tempParticipants, selectedItems, projects, selectedProjectId, updateProject]);

  const handleRemoveMeeting = useCallback(async (meetingId: string) => {
    if (!selectedProjectId) return;
    const currentProject = projects.find(p => p.id === selectedProjectId);
    const currentMeetings = currentProject?.meetings || [];
    const updatedMeetings = currentMeetings.filter(m => m.id !== meetingId);
    await updateProject(selectedProjectId, { meetings: updatedMeetings });
  }, [projects, selectedProjectId, updateProject]);

  const toggleMeetingExpansion = useCallback((meetingId: string) => {
    setExpandedMeetings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(meetingId)) {
        newSet.delete(meetingId);
      } else {
        newSet.add(meetingId);
      }
      return newSet;
    });
  }, []);

  const canAddMeeting = meetingData.trim() && meetingNumero.trim();

  if (!selectedProject) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-foreground">Registrar Reunião</div>
      
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
        <div className="col-span-2">
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
      </div>

      {/* Item Selection */}
      {availableItems.length > 0 && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Itens Discutidos (Nº Item)
          </label>
          <div className="flex flex-wrap gap-1.5 p-2 border border-border rounded-md bg-muted/30 min-h-[40px]">
            {availableItems.map((itemNum) => {
              const isSelected = selectedItems.includes(itemNum);
              return (
                <Badge
                  key={itemNum}
                  variant={isSelected ? "default" : "outline"}
                  className={`text-xs cursor-pointer transition-all hover:scale-105 ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleItemSelection(itemNum)}
                >
                  {itemNum}
                </Badge>
              );
            })}
          </div>
          {selectedItems.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {selectedItems.length} {selectedItems.length === 1 ? 'item selecionado' : 'itens selecionados'}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          Participantes
        </label>
        
        {/* Add Participant - Shorter input with button close */}
        <div className="flex items-center gap-1 mb-2">
          <Input
            type="text"
            placeholder="Nome do participante"
            className="h-8 text-sm w-48"
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

        {/* Participant Tags - Display below input */}
        {tempParticipants.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
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

        {/* Add Meeting Button */}
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

      {/* Registered Meetings */}
      {meetings.length > 0 ? (
        <div className="border-t border-border pt-3 space-y-3">
          <div className="text-xs font-medium text-muted-foreground">
            Reuniões Registradas ({meetings.length})
          </div>
          {meetings.map((meeting) => {
            const isExpanded = expandedMeetings.has(meeting.id);
            const hasDetails = meeting.detalhes || (meeting.relatedItems && meeting.relatedItems.length > 0);
            
            return (
              <div
                key={meeting.id}
                className="bg-background rounded px-3 py-2 border border-border"
              >
                {/* Top line: Date, ATA Number, Participants, Expand Icon, Delete Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                    {/* Date Tag */}
                    <Badge variant="outline" className="text-xs">
                      {meeting.data}
                    </Badge>
                    {/* Minutes Number Tag */}
                    <Badge variant="outline" className="text-xs">
                      {meeting.numeroAta}
                    </Badge>
                    {/* Participants */}
                    {meeting.participants.map((participant, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {participant}
                      </Badge>
                    ))}
                    {/* Expand/Collapse Button */}
                    {hasDetails && (
                      <button
                        onClick={() => toggleMeetingExpansion(meeting.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemoveMeeting(meeting.id)}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Expandable Details Section */}
                {isExpanded && hasDetails && (
                  <div className="mt-2 pt-2 border-t border-border space-y-2">
                    {/* Related Items */}
                    {meeting.relatedItems && meeting.relatedItems.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Itens Discutidos:</p>
                        <div className="flex flex-wrap gap-1">
                          {meeting.relatedItems.map((itemNum) => (
                            <Badge key={itemNum} variant="default" className="text-xs">
                              Nº {itemNum}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Details Text */}
                    {meeting.detalhes && (
                      <div className="text-xs text-foreground">
                        {meeting.detalhes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-t border-border pt-3">
          <div className="text-xs text-muted-foreground italic">
            Nenhuma reunião registrada ainda
          </div>
        </div>
      )}
    </div>
  );
}

