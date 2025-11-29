import { ProjectAttachment } from "@/types/project";

/**
 * File Manager Service
 * Handles file uploads, folder structure, and file organization
 * Now integrated with backend API
 */

// Use relative URL in production, absolute URL in development
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001/api' 
  : '/api';

export interface FileUploadResult {
  success: boolean;
  attachment?: ProjectAttachment;
  error?: string;
}

export interface FolderStructure {
  projectId: string;
  documents: {
    [documentId: string]: {
      attachments: ProjectAttachment[];
      folderPath: string;
    };
  };
}

export interface BackendFileResponse {
  success: boolean;
  message?: string;
  files?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedAt: string;
    filePath: string;
    serverPath: string;
    originalName: string;
  }>;
  error?: string;
}

export class FileManagerService {
  private static instance: FileManagerService;
  private folderStructure: FolderStructure[] = [];

  private constructor() {
    this.loadFolderStructure();
  }

  public static getInstance(): FileManagerService {
    if (!FileManagerService.instance) {
      FileManagerService.instance = new FileManagerService();
    }
    return FileManagerService.instance;
  }

  /**
   * Generate hierarchical folder path for a project document
   * Structure: projects/{projectId}/documents/{documentId}/
   */
  public generateFolderPath(projectId: string, documentId: string): string {
    return `projects/${projectId}/documents/${documentId}/`;
  }

  /**
   * Generate full file path for an attachment
   */
  public generateFilePath(projectId: string, documentId: string, fileName: string): string {
    const folderPath = this.generateFolderPath(projectId, documentId);
    return `${folderPath}${fileName}`;
  }

  /**
   * Validate file type and size
   */
  public validateFile(file: File): { valid: boolean; error?: string } {
    const acceptedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de arquivo não suportado. Use PDF, Excel, Word, PNG ou JPEG.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Máximo permitido: 10MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Upload file and create attachment metadata
   */
  public async uploadFile(
    file: File,
    projectId: string,
    documentId: string
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('files', file);
      formData.append('projectId', projectId);
      formData.append('documentId', documentId);

      // Upload file to backend
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result: BackendFileResponse = await response.json();

      if (!result.success || !result.files || result.files.length === 0) {
        return {
          success: false,
          error: result.error || 'Erro ao fazer upload do arquivo.'
        };
      }

      // Convert backend response to ProjectAttachment
      const backendFile = result.files[0];
      const attachment: ProjectAttachment = {
        id: backendFile.id,
        fileName: backendFile.originalName,
        fileSize: backendFile.fileSize,
        fileType: backendFile.fileType,
        uploadedAt: new Date(backendFile.uploadedAt),
        filePath: backendFile.filePath,
      };

      // Update local folder structure
      this.updateFolderStructure(projectId, documentId, attachment);
      this.saveFolderStructure();

      return {
        success: true,
        attachment: attachment
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: 'Erro ao fazer upload do arquivo.'
      };
    }
  }

  /**
   * Remove attachment and update folder structure
   */
  public async removeAttachment(projectId: string, documentId: string, attachmentId: string): Promise<boolean> {
    try {
      // Find the attachment to get the filename
      const project = this.folderStructure.find(p => p.projectId === projectId);
      if (!project) return false;

      const document = project.documents[documentId];
      if (!document) return false;

      const attachment = document.attachments.find(att => att.id === attachmentId);
      if (!attachment) return false;

      // Extract filename from filePath (format: /uploads/projectId/documentId/filename)
      const filename = attachment.filePath.split('/').pop();
      if (!filename) return false;

      // Delete file from backend
      const response = await fetch(`${API_BASE_URL}/files/${projectId}/${documentId}/${filename}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Backend delete error:', result.error);
        return false;
      }

      // Remove attachment from local structure
      document.attachments = document.attachments.filter(att => att.id !== attachmentId);
      this.saveFolderStructure();

      return true;
    } catch (error) {
      console.error('Remove attachment error:', error);
      return false;
    }
  }

  /**
   * Load attachments from backend for a specific document
   */
  public async loadDocumentAttachments(projectId: string, documentId: string): Promise<ProjectAttachment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${projectId}/${documentId}`);
      const result = await response.json();

      if (!result.success) {
        console.error('Error loading files:', result.error);
        return [];
      }

      // Convert backend files to ProjectAttachment format
      const attachments: ProjectAttachment[] = result.files.map((file: any) => ({
        id: `${documentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: this.getFileTypeFromExtension(file.fileName),
        uploadedAt: new Date(file.uploadedAt),
        filePath: file.filePath,
      }));

      // Update local folder structure
      this.updateFolderStructureFromBackend(projectId, documentId, attachments);
      this.saveFolderStructure();

      return attachments;
    } catch (error) {
      console.error('Error loading document attachments:', error);
      return [];
    }
  }

  /**
   * Get file type from file extension
   */
  private getFileTypeFromExtension(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const typeMap: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
    };
    return typeMap[extension || ''] || 'application/octet-stream';
  }

  /**
   * Update folder structure from backend data
   */
  private updateFolderStructureFromBackend(projectId: string, documentId: string, attachments: ProjectAttachment[]): void {
    let project = this.folderStructure.find(p => p.projectId === projectId);
    
    if (!project) {
      project = {
        projectId,
        documents: {}
      };
      this.folderStructure.push(project);
    }

    project.documents[documentId] = {
      attachments: attachments,
      folderPath: this.generateFolderPath(projectId, documentId)
    };
  }

  /**
   * Get all attachments for a document (from local cache)
   */
  public getDocumentAttachments(projectId: string, documentId: string): ProjectAttachment[] {
    const project = this.folderStructure.find(p => p.projectId === projectId);
    if (!project) return [];

    const document = project.documents[documentId];
    if (!document) return [];

    return document.attachments;
  }

  /**
   * Get folder structure for a project
   */
  public getProjectFolderStructure(projectId: string): FolderStructure | undefined {
    return this.folderStructure.find(p => p.projectId === projectId);
  }

  /**
   * Get all folder structures
   */
  public getAllFolderStructures(): FolderStructure[] {
    return this.folderStructure;
  }


  /**
   * Update folder structure with new attachment
   */
  private updateFolderStructure(projectId: string, documentId: string, attachment: ProjectAttachment): void {
    let project = this.folderStructure.find(p => p.projectId === projectId);
    
    if (!project) {
      project = {
        projectId,
        documents: {}
      };
      this.folderStructure.push(project);
    }

    if (!project.documents[documentId]) {
      project.documents[documentId] = {
        attachments: [],
        folderPath: this.generateFolderPath(projectId, documentId)
      };
    }

    project.documents[documentId].attachments.push(attachment);
  }

  /**
   * Load folder structure from localStorage
   */
  private loadFolderStructure(): void {
    try {
      const stored = localStorage.getItem('project-file-structure');
      if (stored) {
        this.folderStructure = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading folder structure:', error);
      this.folderStructure = [];
    }
  }

  /**
   * Save folder structure to localStorage
   */
  private saveFolderStructure(): void {
    try {
      localStorage.setItem('project-file-structure', JSON.stringify(this.folderStructure));
    } catch (error) {
      console.error('Error saving folder structure:', error);
    }
  }

  /**
   * Format file size for display
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on file type
   */
  public getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpeg')) return '🖼️';
    return '📎';
  }

  /**
   * Clean up old or unused folder structures
   */
  public cleanupFolderStructure(): void {
    // Remove projects that no longer exist
    // This would be called periodically or when projects are deleted
    console.log('Cleaning up folder structure...');
  }
}

// Export singleton instance
export const fileManager = FileManagerService.getInstance();
