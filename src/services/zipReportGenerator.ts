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

      // Collect all attachments for the project
      const allAttachments = await this.collectAllAttachments(selectedProject.id);
      const totalSize = this.calculateTotalSize(allAttachments);

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
          generatedAt: new Date().toLocaleDateString('pt-BR')
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
      
      // Add PDF to ZIP
      this.zip.file(`Relatorio_${selectedProject.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`, pdfBlob);

      // Add all attachment files to ZIP
      await this.addAttachmentFilesToZip(allAttachments);

      // Generate and download ZIP
      await this.generateAndDownloadZip(selectedProject.name);

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
      const folderStructure = fileManager.getProjectFolderStructure(projectId);
      if (!folderStructure) return [];

      const allAttachments: any[] = [];
      
      // Get FILTERED documents from the project store (same as used in the report)
      const projectStore = useProjectStore.getState();
      const filteredDocuments = projectStore.getFilteredDocuments(); // This respects current filters
      
      // Collect attachments only for filtered documents
      for (const document of filteredDocuments) {
        const documentAttachments = fileManager.getDocumentAttachments(projectId, document.id);
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
      
      return allAttachments;
    } catch (error) {
      console.error('Error collecting attachments:', error);
      return [];
    }
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
    for (const attachment of attachments) {
      try {
        // Create folder structure: Documentos/{DocumentName}/{FileName}
        const safeDocumentName = this.sanitizeFileName(attachment.documentName);
        const safeFileName = this.sanitizeFileName(attachment.fileName);
        const filePath = `Documentos/${safeDocumentName}/${safeFileName}`;

        // Fetch the file from the backend
        const fileUrl = `http://localhost:3001${attachment.filePath}`;
        const response = await fetch(fileUrl);
        
        if (response.ok) {
          const fileBlob = await response.blob();
          this.zip.file(filePath, fileBlob);
        } else {
          console.warn(`Could not fetch file: ${attachment.fileName}`);
        }
      } catch (error) {
        console.error(`Error adding file ${attachment.fileName} to ZIP:`, error);
      }
    }
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
  private async generateAndDownloadZip(projectName: string): Promise<void> {
    const zipBlob = await this.zip.generateAsync({ type: 'blob' });
    
    // Create download link
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Completo_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
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
