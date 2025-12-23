import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download, Trash2, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProjectAttachment } from "@/types/project";
import { fileManager } from "@/services/fileManager";
import { usePermissions } from "@/hooks/usePermissions";
import { getApiUrl, getStaticUrl } from "@/lib/api-config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: ProjectAttachment[];
  onAttachmentsChange: (attachments: ProjectAttachment[]) => void;
  projectId: string;
  documentId: string;
}

export function FileUploadModal({
  isOpen,
  onClose,
  attachments,
  onAttachmentsChange,
  projectId,
  documentId,
}: FileUploadModalProps) {
  const { canCreate, canDelete } = usePermissions();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ProjectAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = fileArray.map(file => fileManager.uploadFile(file, projectId, documentId));
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(result => result.success);
      const failedUploads = results.filter(result => !result.success);

      if (successfulUploads.length > 0) {
        const newAttachments = successfulUploads.map(result => result.attachment!);
        const updatedAttachments = [...attachments, ...newAttachments];
        onAttachmentsChange(updatedAttachments);
      }

      if (failedUploads.length > 0) {
        failedUploads.forEach(result => {
          toast.error(result.error || "Erro ao fazer upload do arquivo.");
        });
      }

      if (successfulUploads.length > 0) {
        toast.success(`${successfulUploads.length} arquivo(s) anexado(s) com sucesso!`);
      }
    } catch (error) {
      toast.error("Erro ao fazer upload dos arquivos.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  }, [attachments, onAttachmentsChange, documentId, projectId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (attachment: ProjectAttachment) => {
    setFileToDelete(attachment);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      console.log('[FileUploadModal] Deleting attachment:', {
        id: fileToDelete.id,
        fileName: fileToDelete.fileName,
        filePath: fileToDelete.filePath,
        currentDocumentId: documentId
      });
      
      // Extract projectId, documentId, and filename directly from the attachment's filePath
      // filePath format: /uploads/{projectId}/{documentId}/{filename}
      const pathParts = fileToDelete.filePath.split('/').filter(part => part);
      
      if (pathParts.length < 4) {
        console.error('[FileUploadModal] Invalid file path format:', fileToDelete.filePath);
        toast.error("Caminho do arquivo inválido.");
        setFileToDelete(null);
        return;
      }
      
      const fileProjectId = pathParts[1]; // uploads/[projectId]/documentId/filename
      const fileDocumentId = pathParts[2]; // uploads/projectId/[documentId]/filename
      const filename = pathParts[3]; // uploads/projectId/documentId/[filename]
      
      console.log('[FileUploadModal] Deleting from:', {
        fileProjectId,
        fileDocumentId,
        filename
      });
      
      // Delete file from backend using the IDs from the file path
      const deleteUrl = getApiUrl(`/api/files/${fileProjectId}/${fileDocumentId}/${filename}`);
      
      console.log('[FileUploadModal] DELETE request to:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      console.log('[FileUploadModal] Delete response:', result);
      
      if (result.success) {
        const updatedAttachments = attachments.filter(att => att.id !== fileToDelete.id);
        onAttachmentsChange(updatedAttachments);
        toast.success("Arquivo removido com sucesso!");
        console.log('[FileUploadModal] File deleted successfully');
      } else {
        console.error('[FileUploadModal] Backend delete error:', result.error);
        toast.error("Erro ao remover arquivo.");
      }
    } catch (error) {
      console.error('[FileUploadModal] Delete error:', error);
      toast.error("Erro ao remover arquivo.");
    }
    
    setFileToDelete(null);
  };

  const cancelDelete = () => {
    setFileToDelete(null);
  };

  const downloadAttachment = (attachment: ProjectAttachment) => {
    // Extract projectId, documentId, and filename from the filePath
    // filePath format: /uploads/{projectId}/{documentId}/{filename}
    const pathParts = attachment.filePath.split('/').filter(part => part);
    
    if (pathParts.length < 4) {
      toast.error('Caminho do arquivo inválido');
      return;
    }
    
    // Extract the IDs and filename from the path
    const fileProjectId = pathParts[1]; // uploads/[projectId]/documentId/filename
    const fileDocumentId = pathParts[2]; // uploads/projectId/[documentId]/filename
    const serverFileName = pathParts[3]; // uploads/projectId/documentId/[filename]
    
    // Use the new download API endpoint which sets proper Content-Disposition header
    // Pass the original filename as a query parameter so backend can use it
    const encodedOriginalName = encodeURIComponent(attachment.fileName);
    const downloadUrl = getApiUrl(`/api/download/${fileProjectId}/${fileDocumentId}/${serverFileName}?originalName=${encodedOriginalName}`);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Download de ${attachment.fileName} iniciado!`);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{canCreate ? 'Gerenciar Anexos' : 'Visualizar Anexos'}</DialogTitle>
            <DialogDescription>
              {canCreate 
                ? 'Faça upload de arquivos ou gerencie os anexos existentes para este documento.'
                : 'Visualize e baixe os anexos existentes para este documento.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Upload Area - Only show for users with create permission */}
            {canCreate && (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
                  "hover:border-primary/50 hover:bg-muted/30",
                  isDragOver && "border-primary bg-primary/10",
                  isUploading && "opacity-50 pointer-events-none"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={openFileDialog}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/jpg"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {isUploading ? "Fazendo upload..." : "Arraste arquivos aqui ou clique para selecionar"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Suporte para PDF, Excel, Word, PNG e JPEG (máximo 10MB por arquivo)
                  </p>
                </div>
              </div>
            )}

            {/* Files List */}
            {attachments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Arquivos Anexados ({attachments.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={attachment.fileName}>
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fileManager.formatFileSize(attachment.fileSize)} • 
                            {new Date(attachment.uploadedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                          onClick={() => {
                            // Extract projectId, documentId, and filename from the filePath
                            // filePath format: /uploads/{projectId}/{documentId}/{filename}
                            const pathParts = attachment.filePath.split('/').filter(part => part);
                            
                            if (pathParts.length < 4) {
                              toast.error('Caminho do arquivo inválido');
                              return;
                            }
                            
                            const fileProjectId = pathParts[1];
                            const fileDocumentId = pathParts[2];
                            const serverFileName = pathParts[3];
                            
                            const viewUrl = getApiUrl(`/api/view/${fileProjectId}/${fileDocumentId}/${serverFileName}`);
                            window.open(viewUrl, '_blank');
                          }}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                          onClick={() => downloadAttachment(attachment)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(attachment)}
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for File Deletion */}
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o arquivo <strong>"{fileToDelete?.fileName}"</strong>?
              Esta ação não pode ser desfeita e o arquivo será removido permanentemente do servidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
