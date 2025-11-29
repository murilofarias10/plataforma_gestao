import JSZip from 'jszip';
import { PDFReportGenerator } from './pdfReportGenerator';
import { useProjectStore } from '@/stores/projectStore';
import { fileManager } from './fileManager';

export interface ZipReportData {
  projectTracker: {
    kpiData: any;
    timelineData: any[];
    statusDistribution: any[];
    documents: any[];
    filters: any;
  };
  documentMonitor: {
    kpiData: any;
    sCurveData: any[];
    documentStatusTable: any[];
    filters: any;
  };
  projectInfo: {
    name: string;
    description: string;
    generatedAt: string;
  };
  attachments: {
    allAttachments: any[];
    totalFiles: number;
    totalSize: string;
  };
}

export class ZIPReportGenerator {
  private zip: JSZip;
  private projectId: string;

  constructor(projectId: string) {
    this.zip = new JSZip();
    this.projectId = projectId;
  }

  async generateComprehensiveZipReport(): Promise<void> {
    try {
      // Get current data from stores
      const projectStore = useProjectStore.getState();
      const selectedProject = projectStore.getSelectedProject();
      
      if (!selectedProject) {
        throw new Error('Nenhum projeto selecionado');
      }

      // Generate timestamp once to use consistently
      const timestamp = this.formatDateTimeForDisplay();
      const timestampForFilename = timestamp.replace(/[:\/ ]/g, (match) => match === '/' ? '-' : '_');

      // Collect all attachments for the project
      console.log('=== Starting report generation ===');
      const allAttachments = await this.collectAllAttachments(selectedProject.id);
      console.log(`Collected ${allAttachments.length} attachments for report`);
      const totalSize = this.calculateTotalSize(allAttachments);
      console.log(`Total size of attachments: ${totalSize}`);

      const reportData: ZipReportData = {
        projectTracker: {
          kpiData: projectStore.getKpiData(),
          timelineData: projectStore.getTimelineData(),
          statusDistribution: projectStore.getStatusDistribution(),
          documents: projectStore.getFilteredDocuments(),
          filters: projectStore.filters
        },
        documentMonitor: {
          kpiData: { emitidos: 65, aprovados: 70 }, // Static data for now
          sCurveData: this.getSCurveData(),
          documentStatusTable: this.getDocumentStatusData(),
          filters: { dateRange: { start: '09/01/2025', end: '09/09/2025' }, selectedDiscipline: 'All' }
        },
        projectInfo: {
          name: selectedProject.name,
          description: selectedProject.description,
          generatedAt: timestamp
        },
        attachments: {
          allAttachments: allAttachments,
          totalFiles: allAttachments.length,
          totalSize: totalSize
        }
      };

      // Generate PDF report
      const pdfGenerator = new PDFReportGenerator();
      const pdfBlob = await pdfGenerator.generatePDFBlob(reportData);
      
      // Add PDF to ZIP with same timestamp
      this.zip.file(`Relatorio_${selectedProject.name.replace(/\s+/g, '_')}_${timestampForFilename}.pdf`, pdfBlob);

      // Add all attachment files to ZIP
      if (allAttachments.length > 0) {
        console.log('Adding attachment files to ZIP...');
        await this.addAttachmentFilesToZip(allAttachments);
      } else {
        console.log('No attachments to add to ZIP');
      }

      // Generate and download ZIP
      console.log('Generating ZIP file...');
      await this.generateAndDownloadZip(selectedProject.name, timestampForFilename);
      console.log('=== Report generation complete ===');

    } catch (error) {
      console.error('Erro ao gerar relatório ZIP:', error);
      throw error;
    }
  }

  /**
   * Collect attachments only for filtered documents
   */
  private async collectAllAttachments(projectId: string): Promise<any[]> {
    try {
      const allAttachments: any[] = [];
      
      // Get FILTERED documents from the project store (same as used in the report)
      const projectStore = useProjectStore.getState();
      const filteredDocuments = projectStore.getFilteredDocuments(); // This respects current filters
      
      // Log for debugging
      console.log('Collecting attachments for filtered documents:', {
        totalFilteredDocuments: filteredDocuments.length,
        activeFilters: projectStore.filters,
        documentIds: filteredDocuments.map(d => ({ id: d.id, name: d.documento, status: d.status }))
      });
      
      // Collect attachments only for filtered documents
      for (const document of filteredDocuments) {
        // Get attachments from fileManager (which stores original names in localStorage)
        let documentAttachments = fileManager.getDocumentAttachments(projectId, document.id);
        
        // If no attachments in localStorage, fetch from backend
        if (documentAttachments.length === 0) {
          documentAttachments = await this.fetchAttachmentsFromBackend(projectId, document.id);
        }
        
        console.log(`Document ${document.documento} (${document.id}): ${documentAttachments.length} attachments`);
        documentAttachments.forEach(att => console.log(`  - ${att.fileName}`));
        
        documentAttachments.forEach(attachment => {
          // Ensure uploadedAt is properly handled
          const processedAttachment = {
            ...attachment,
            documentName: document.documento || 'Documento sem nome',
            documentId: document.id,
            uploadedAt: attachment.uploadedAt instanceof Date ? attachment.uploadedAt : new Date(attachment.uploadedAt)
          };
          allAttachments.push(processedAttachment);
        });
      }
      
      console.log(`Total attachments collected: ${allAttachments.length}`);
      
      return allAttachments;
    } catch (error) {
      console.error('Error collecting attachments:', error);
      return [];
    }
  }

  /**
   * Fetch attachments from backend API
   */
  private async fetchAttachmentsFromBackend(projectId: string, documentId: string): Promise<any[]> {
    try {
      const cacheBuster = `?t=${Date.now()}`;
      const apiBase = import.meta.env.DEV ? 'http://localhost:3001' : '';
      const response = await fetch(`${apiBase}/api/files/${projectId}/${documentId}${cacheBuster}`, {
        cache: 'no-store' // Prevent caching
      });
      const result = await response.json();

      if (!result.success || !result.files) {
        console.log(`No files found for document ${documentId}`);
        return [];
      }

      // Convert backend files to attachment format
      const attachments = result.files.map((file: any) => ({
        id: `${documentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: this.getFileTypeFromExtension(file.fileName),
        uploadedAt: new Date(file.uploadedAt),
        filePath: file.filePath,
      }));

      return attachments;
    } catch (error) {
      console.error(`Error fetching attachments for document ${documentId}:`, error);
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
   * Calculate total size of all attachments
   */
  private calculateTotalSize(attachments: any[]): string {
    const totalBytes = attachments.reduce((sum, attachment) => sum + (attachment.fileSize || 0), 0);
    return fileManager.formatFileSize(totalBytes);
  }

  /**
   * Add all attachment files to the ZIP archive
   */
  private async addAttachmentFilesToZip(attachments: any[]): Promise<void> {
    console.log(`Adding ${attachments.length} attachments to ZIP...`);
    
    for (const attachment of attachments) {
      try {
        // Create folder structure: Documentos/{DocumentName}/{FileName}
        const safeDocumentName = this.sanitizeFileName(attachment.documentName);
        const safeFileName = this.sanitizeFileName(attachment.fileName);
        const filePath = `Documentos/${safeDocumentName}/${safeFileName}`;

        // Fetch the file from the backend with cache-busting parameter
        const cacheBuster = `?t=${Date.now()}`;
        const apiBase = import.meta.env.DEV ? 'http://localhost:3001' : '';
        const fileUrl = `${apiBase}${attachment.filePath}${cacheBuster}`;
        console.log(`Fetching file from: ${fileUrl}`);
        
        const response = await fetch(fileUrl, {
          cache: 'no-store' // Prevent caching
        });
        
        if (response.ok) {
          const fileBlob = await response.blob();
          this.zip.file(filePath, fileBlob);
          console.log(`✓ Added file to ZIP: ${filePath} (${fileBlob.size} bytes)`);
        } else {
          console.warn(`✗ Could not fetch file: ${attachment.fileName} (Status: ${response.status})`);
        }
      } catch (error) {
        console.error(`✗ Error adding file ${attachment.fileName} to ZIP:`, error);
      }
    }
    
    console.log(`Finished adding attachments to ZIP`);
  }

  /**
   * Sanitize filename for ZIP archive
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length
  }

  /**
   * Generate and download the ZIP file
   */
  private async generateAndDownloadZip(projectName: string, timestampForFilename: string): Promise<void> {
    const zipBlob = await this.zip.generateAsync({ type: 'blob' });
    
    // Create download link
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Completo_${projectName.replace(/\s+/g, '_')}_${timestampForFilename}.zip`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  /**
   * Format date and time for display (e.g., 24/10/2025 14:30:52)
   */
  private formatDateTimeForDisplay(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Get S-Curve data
   */
  private getSCurveData(): any[] {
    return [
      { time: '01-jan', projetado: 100, baseline: 100, avancado: 50 },
      { time: '01-feb', projetado: 200, baseline: 200, avancado: 120 },
      { time: '01-mar', projetado: 300, baseline: 300, avancado: 180 },
      { time: '01-apr', projetado: 400, baseline: 400, avancado: 250 },
      { time: '01-may', projetado: 500, baseline: 500, avancado: 320 },
      { time: '01-jun', projetado: 600, baseline: 600, avancado: 400 },
      { time: '01-jul', projetado: 700, baseline: 700, avancado: 480 },
      { time: '01-aug', projetado: 800, baseline: 800, avancado: 560 },
      { time: '01-sep', projetado: 900, baseline: 900, avancado: 640 },
      { time: '01-oct', projetado: 1000, baseline: 1000, avancado: 720 },
      { time: '01-nov', projetado: 3000, baseline: 3000, avancado: 1800 },
    ];
  }

  /**
   * Get Document Status data
   */
  private getDocumentStatusData(): any[] {
    return [
      { status: 'Aprovado', qtde: 34, inicio: 34, fim: 34 },
      { status: 'Cancelado', qtde: 3, inicio: 1, fim: null },
      { status: 'Emitido', qtde: 60, inicio: 60, fim: 53 },
      { status: 'Não Se Aplica', qtde: 80, inicio: null, fim: null },
      { status: 'Para Emissão', qtde: 10, inicio: 10, fim: null },
    ];
  }
}

export const generateComprehensiveZipReport = async (projectId: string): Promise<void> => {
  const generator = new ZIPReportGenerator(projectId);
  await generator.generateComprehensiveZipReport();
};
