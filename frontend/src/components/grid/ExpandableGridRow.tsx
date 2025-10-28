import React, { useState, useCallback } from 'react';
import { ProjectDocument, MeetingMetadata } from '@/types/project';
import { ChevronDown, ChevronRight, Clock, Plus, X } from 'lucide-react';
import { GridRow } from './GridRow';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTimestamp, formatFieldChange } from '@/lib/changeTracking';
import { v4 as uuidv4 } from 'uuid';

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
}

interface ExpandableGridRowProps {
  document: ProjectDocument;
  columns: Column[];
  editingCell: { id: string; field: string } | null;
  onCellEdit: (id: string, field: string, value: any) => void;
  onStartEdit: (field: string) => void;
  onStopEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent, id: string, field: string) => void;
  isEven: boolean;
}

export function ExpandableGridRow({
  document,
  columns,
  editingCell,
  onCellEdit,
  onStartEdit,
  onStopEdit,
  onKeyDown,
  isEven,
}: ExpandableGridRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [meetingData, setMeetingData] = useState('');
  const [meetingNumero, setMeetingNumero] = useState('');
  const [newParticipant, setNewParticipant] = useState('');
  const [tempParticipants, setTempParticipants] = useState<string[]>([]);

  const meetings = document.meetings || [];

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleHistory = useCallback(() => {
    setIsHistoryExpanded((prev) => !prev);
  }, []);

  const handleAddParticipant = useCallback(() => {
    if (newParticipant.trim()) {
      setTempParticipants([...tempParticipants, newParticipant.trim()]);
      setNewParticipant('');
    }
  }, [newParticipant, tempParticipants]);

  const handleRemoveParticipant = useCallback((index: number) => {
    setTempParticipants(tempParticipants.filter((_, i) => i !== index));
  }, [tempParticipants]);

  const handleAddMeeting = useCallback(() => {
    if (!meetingData.trim() || !meetingNumero.trim()) {
      return;
    }

    const newMeeting: MeetingMetadata = {
      id: uuidv4(),
      data: meetingData,
      numeroAta: meetingNumero,
      participants: tempParticipants,
      createdAt: new Date().toISOString(),
    };

    const updatedMeetings = [...meetings, newMeeting];
    onCellEdit(document.id, 'meetings', updatedMeetings);

    // Also update document participants with unique list
    const allParticipants = Array.from(new Set([
      ...(document.participants || []),
      ...tempParticipants
    ]));
    onCellEdit(document.id, 'participants', allParticipants);

    // Reset form
    setMeetingData('');
    setMeetingNumero('');
    setTempParticipants([]);
  }, [meetingData, meetingNumero, tempParticipants, meetings, document.id, document.participants, onCellEdit]);

  const handleRemoveMeeting = useCallback((meetingId: string) => {
    const updatedMeetings = meetings.filter(m => m.id !== meetingId);
    onCellEdit(document.id, 'meetings', updatedMeetings);
  }, [meetings, document.id, onCellEdit]);

  const canAddMeeting = meetingData.trim() && meetingNumero.trim();

  return (
    <>
      {/* Main Row with Expand Button */}
      <div className="flex">
        <button
          onClick={toggleExpanded}
          className="p-2 hover:bg-muted/50 border-r border-b border-border flex items-center justify-center"
          title={isExpanded ? 'Recolher' : 'Expandir'}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1">
          <GridRow
            document={document}
            columns={columns}
            editingCell={editingCell}
            onCellEdit={onCellEdit}
            onStartEdit={onStartEdit}
            onStopEdit={onStopEdit}
            onKeyDown={onKeyDown}
            isEven={isEven}
          />
        </div>
      </div>

      {/* Expanded Detail Panel - Compact Split Layout */}
      {isExpanded && (
        <div className="border-b border-border bg-muted/5">
          <div className="p-3 pl-12 grid grid-cols-2 gap-4">
            {/* Left Side - Meeting Registration */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-foreground">Registrar Reunião</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">
                    Data da Reunião
                  </label>
                  <Input
                    type="text"
                    placeholder="dd-mm-aaaa"
                    className="h-7 text-xs"
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
                  <label className="text-[11px] text-muted-foreground mb-1 block">
                    Número da Ata
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: ATA-001"
                    className="h-7 text-xs"
                    value={meetingNumero}
                    onChange={(e) => setMeetingNumero(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">
                  Participantes
                </label>
                
                {/* Participant Tags */}
                {tempParticipants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
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

                {/* Add Participant */}
                <div className="flex gap-1 mb-2">
                  <Input
                    type="text"
                    placeholder="Nome do participante"
                    className="h-7 text-xs flex-1"
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
                    className="h-7 px-2"
                    onClick={handleAddParticipant}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* Add Meeting Button */}
                <Button 
                  size="sm" 
                  className="h-7 text-xs px-3"
                  onClick={handleAddMeeting}
                  disabled={!canAddMeeting}
                >
                  Adicionar Reunião
                </Button>
              </div>

              {/* Registered Meetings */}
              {meetings.length > 0 && (
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    Reuniões Registradas
                  </div>
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="bg-background rounded px-2 py-1.5 border border-border text-xs flex items-center justify-between"
                    >
                      <div className="flex-1 truncate">
                        {meeting.data} - {meeting.numeroAta}
                        {meeting.participants.length > 0 && (
                          <> - {meeting.participants.join(', ')}</>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveMeeting(meeting.id)}
                        className="ml-2 text-muted-foreground hover:text-destructive flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - History */}
            <div className="space-y-2">
              <button
                onClick={toggleHistory}
                className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary w-full"
              >
                {isHistoryExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <Clock className="w-3 h-3" />
                Histórico de Alterações
                {document.history && document.history.length > 0 && (
                  <span className="text-muted-foreground">({document.history.length})</span>
                )}
              </button>

              {/* History List - Expandable */}
              {isHistoryExpanded && document.history && document.history.length > 0 && (
                <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                  {document.history.slice().reverse().map((change) => {
                    // Only show changes where BOTH old and new values exist
                    const meaningfulChanges = change.changes.filter(
                      (fc) => fc.oldValue !== null && fc.newValue !== null
                    );

                    if (meaningfulChanges.length === 0) return null;

                    return (
                      <div
                        key={change.id}
                        className="text-xs bg-background rounded p-2 border border-border"
                      >
                        <div className="text-[11px] text-muted-foreground mb-1">
                          {formatTimestamp(change.timestamp)}
                        </div>
                        <div className="space-y-0.5 text-[11px] text-foreground">
                          {meaningfulChanges.map((fieldChange, idx) => (
                            <div key={idx} className="leading-tight">
                              • {formatFieldChange(fieldChange)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(!document.history || document.history.length === 0) && isHistoryExpanded && (
                <div className="text-xs text-muted-foreground italic">
                  Nenhuma alteração registrada
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
