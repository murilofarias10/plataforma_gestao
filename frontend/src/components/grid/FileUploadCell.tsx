import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectAttachment } from "@/types/project";
import { FileUploadModal } from "./FileUploadModal";

interface FileUploadCellProps {
  attachments?: ProjectAttachment[];
  onAttachmentsChange: (attachments: ProjectAttachment[]) => void;
  projectId: string;
  documentId: string;
  onModalClose?: () => void;
  autoOpen?: boolean;
}

export function FileUploadCell({ 
  attachments = [], 
  onAttachmentsChange, 
  projectId, 
  documentId,
  onModalClose,
  autoOpen = false
}: FileUploadCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-open modal when component mounts if autoOpen is true
  useEffect(() => {
    if (autoOpen) {
      setIsModalOpen(true);
    }
  }, [autoOpen]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  return (
    <div className="p-2 min-h-[40px]">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-muted/30",
          attachments.length > 0 && "border-solid border-border bg-muted/10"
        )}
        onClick={() => setIsModalOpen(true)}
      >
        {attachments.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <Upload className="h-10 w-10 text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {attachments.length} arquivo{attachments.length !== 1 ? 's' : ''} anexado{attachments.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              Gerenciar
            </Button>
          </div>
        )}
      </div>

      <FileUploadModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange}
        projectId={projectId}
        documentId={documentId}
      />
    </div>
  );
}
