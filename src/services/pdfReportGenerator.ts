import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useProjectStore } from '@/stores/projectStore';
import { fileManager } from './fileManager';

export interface ReportData {
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

export class PDFReportGenerator {
  private pdf: jsPDF;
  private currentY: number = 0;
  private pageHeight: number = 0;
  private pageWidth: number = 0;
  private margin: number = 20;
  private lineHeight: number = 7;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.currentY = this.margin;
  }

  async generateComprehensiveReport(): Promise<void> {
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

      const reportData: ReportData = {
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

      // Generate PDF content
      await this.generatePDFContent(reportData);
      
      // Save the PDF
      const fileName = `Relatorio_${selectedProject.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      this.pdf.save(fileName);
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  async generatePDFBlob(reportData: ReportData): Promise<Blob> {
    try {
      // Generate PDF content
      await this.generatePDFContent(reportData);
      
      // Return PDF as blob
      return this.pdf.output('blob');
      
    } catch (error) {
      console.error('Erro ao gerar PDF blob:', error);
      throw error;
    }
  }

  private async generatePDFContent(data: ReportData): Promise<void> {
    // Cover page
    this.addCoverPage(data.projectInfo);
    this.addNewPage();

    // Project Tracker section
    this.addSectionHeader('PROJECT TRACKER');
    this.addProjectTrackerContent(data.projectTracker);
    this.addNewPage();

    // Document Monitor section
    this.addSectionHeader('MONITOR DE DOCUMENTOS');
    this.addDocumentMonitorContent(data.documentMonitor);
    this.addNewPage();

    // Attachments section
    this.addSectionHeader('ANEXOS');
    this.addAttachmentsContent(data.attachments);
  }

  private addCoverPage(projectInfo: any): void {
    // Title
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('RELATÓRIO GERAL PLATAFORMA DE GESTÃO', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 20;

    // Project info
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Projeto: ${projectInfo.name}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 10;
    this.pdf.text(projectInfo.description, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 20;

    // Generated date
    this.pdf.setFontSize(12);
    this.pdf.text(`Gerado em: ${projectInfo.generatedAt}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 30;

    // Logo placeholder
    this.pdf.setFontSize(10);
    this.pdf.text('KUBIK ENGENHARIA', this.pageWidth / 2, this.pageHeight - 30, { align: 'center' });
  }

  private addSectionHeader(title: string): void {
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 15;

    // Add line separator
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addProjectTrackerContent(data: any): void {
    // KPI Cards
    this.addSubsectionHeader('Indicadores de Performance (KPIs)');
    this.addKPICards(data.kpiData);
    this.currentY += 10;

    // Filters applied
    this.addSubsectionHeader('Filtros Aplicados');
    this.addFiltersInfo(data.filters);
    this.currentY += 10;

    // Timeline Chart
    this.addSubsectionHeader('Timeline de Documentos');
    this.addTimelineData(data.timelineData);
    this.currentY += 10;

    // Status Distribution
    this.addSubsectionHeader('Distribuição por Status');
    this.addStatusDistribution(data.statusDistribution);
    this.currentY += 10;

    // Documents Table
    this.addSubsectionHeader('Controle de Documentos');
    this.addDocumentsTable(data.documents);
  }

  private addDocumentMonitorContent(data: any): void {
    // KPI Cards
    this.addSubsectionHeader('Indicadores de Performance (KPIs)');
    this.addDocumentMonitorKPIs(data.kpiData);
    this.currentY += 10;

    // Filters applied
    this.addSubsectionHeader('Filtros Aplicados');
    this.addDocumentMonitorFilters(data.filters);
    this.currentY += 10;

    // S-Curve Chart
    this.addSubsectionHeader('Curva "S"');
    this.addSCurveData(data.sCurveData);
    this.currentY += 10;

    // Document Status Table
    this.addSubsectionHeader('Status do Documento');
    this.addDocumentStatusTable(data.documentStatusTable);
  }

  private addSubsectionHeader(title: string): void {
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 8;
  }

  private addKPICards(kpiData: any): void {
    const total = kpiData.aIniciar + kpiData.emAndamento + kpiData.finalizado;
    const finalizadosPercent = total > 0 ? Math.round((kpiData.finalizado / total) * 100) : 0;
    const emAndamentoPercent = total > 0 ? Math.round((kpiData.emAndamento / total) * 100) : 0;
    const aIniciarPercent = total > 0 ? Math.round((kpiData.aIniciar / total) * 100) : 0;

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    this.pdf.text(`Total de Documentos: ${total}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`Finalizados: ${kpiData.finalizado} (${finalizadosPercent}%)`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`Em andamento: ${kpiData.emAndamento} (${emAndamentoPercent}%)`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`A iniciar: ${kpiData.aIniciar} (${aIniciarPercent}%)`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`Progresso Geral: ${finalizadosPercent}% concluído`, this.margin, this.currentY);
  }

  private addDocumentMonitorKPIs(kpiData: any): void {
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    this.pdf.text(`Emitidos: ${kpiData.emitidos}%`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`Aprovados: ${kpiData.aprovados}%`, this.margin, this.currentY);
  }

  private addFiltersInfo(filters: any): void {
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    if (filters.searchQuery) {
      this.pdf.text(`Busca: "${filters.searchQuery}"`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    if (filters.statusFilter.length > 0) {
      this.pdf.text(`Status: ${filters.statusFilter.join(', ')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    if (filters.areaFilter.length > 0) {
      this.pdf.text(`Área: ${filters.areaFilter.join(', ')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    if (filters.responsavelFilter.length > 0) {
      this.pdf.text(`Responsável: ${filters.responsavelFilter.join(', ')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    if (filters.dateRange.start || filters.dateRange.end) {
      const dateRange = `${filters.dateRange.start || 'Início'} até ${filters.dateRange.end || 'Fim'}`;
      this.pdf.text(`Período: ${dateRange}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
  }

  private addDocumentMonitorFilters(filters: any): void {
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    this.pdf.text(`Período: ${filters.dateRange.start} até ${filters.dateRange.end}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`Disciplina: ${filters.selectedDiscipline}`, this.margin, this.currentY);
  }

  private addTimelineData(timelineData: any[]): void {
    if (timelineData.length === 0) {
      this.pdf.text('Nenhum dado disponível', this.margin, this.currentY);
      this.currentY += this.lineHeight;
      return;
    }

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    timelineData.forEach(item => {
      this.pdf.text(`${item.month}: Criados ${item.created}, Finalizados ${item.finished}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addStatusDistribution(statusData: any[]): void {
    if (statusData.length === 0) {
      this.pdf.text('Nenhum dado disponível', this.margin, this.currentY);
      this.currentY += this.lineHeight;
      return;
    }

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    statusData.forEach(item => {
      this.pdf.text(`${item.status}: ${item.count} documentos (${item.percentage}%)`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addSCurveData(sCurveData: any[]): void {
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    sCurveData.forEach(item => {
      this.pdf.text(`${item.time}: Projetado ${item.projetado}, Baseline ${item.baseline}, Avançado ${item.avancado}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addDocumentStatusTable(tableData: any[]): void {
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    tableData.forEach(item => {
      this.pdf.text(`${item.status}: Qtde ${item.qtde}, Início ${item.inicio || '-'}, Fim ${item.fim || '-'}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addDocumentsTable(documents: any[]): void {
    if (documents.length === 0) {
      this.pdf.text('Nenhum documento encontrado', this.margin, this.currentY);
      this.currentY += this.lineHeight;
      return;
    }

    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    // Table header
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Documento', this.margin, this.currentY);
    this.pdf.text('Status', this.margin + 60, this.currentY);
    this.pdf.text('Responsável', this.margin + 90, this.currentY);
    this.pdf.text('Data Início', this.margin + 130, this.currentY);
    this.pdf.text('Data Fim', this.margin + 160, this.currentY);
    this.currentY += this.lineHeight;

    // Table rows
    this.pdf.setFont('helvetica', 'normal');
    documents.slice(0, 20).forEach(doc => { // Limit to 20 rows to avoid page overflow
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      
      this.pdf.text(doc.documento.substring(0, 30), this.margin, this.currentY);
      this.pdf.text(doc.status, this.margin + 60, this.currentY);
      this.pdf.text(doc.responsavel.substring(0, 15), this.margin + 90, this.currentY);
      this.pdf.text(doc.dataInicio, this.margin + 130, this.currentY);
      this.pdf.text(doc.dataFim || '-', this.margin + 160, this.currentY);
      this.currentY += this.lineHeight;
    });

    if (documents.length > 20) {
      this.pdf.text(`... e mais ${documents.length - 20} documentos`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
  }

  private addNewPage(): void {
    this.pdf.addPage();
    this.currentY = this.margin;
  }

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

  private getDocumentStatusData(): any[] {
    return [
      { status: 'Aprovado', qtde: 34, inicio: 34, fim: 34 },
      { status: 'Cancelado', qtde: 3, inicio: 1, fim: null },
      { status: 'Emitido', qtde: 60, inicio: 60, fim: 53 },
      { status: 'Não Se Aplica', qtde: 80, inicio: null, fim: null },
      { status: 'Para Emissão', qtde: 10, inicio: 10, fim: null },
    ];
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
   * Add attachments content to PDF
   */
  private addAttachmentsContent(attachmentsData: any): void {
    // Summary
    this.addSubsectionHeader('Resumo dos Anexos');
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Total de arquivos: ${attachmentsData.totalFiles}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`Tamanho total: ${attachmentsData.totalSize}`, this.margin, this.currentY);
    this.currentY += 10;

    if (attachmentsData.allAttachments.length === 0) {
      this.pdf.text('Nenhum anexo encontrado', this.margin, this.currentY);
      this.currentY += this.lineHeight;
      return;
    }

    // Attachments list
    this.addSubsectionHeader('Lista de Anexos');
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    // Table header
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Documento', this.margin, this.currentY);
    this.pdf.text('Arquivo', this.margin + 60, this.currentY);
    this.pdf.text('Tipo', this.margin + 120, this.currentY);
    this.pdf.text('Tamanho', this.margin + 150, this.currentY);
    this.pdf.text('Data Upload', this.margin + 180, this.currentY);
    this.currentY += this.lineHeight;

    // Table rows
    this.pdf.setFont('helvetica', 'normal');
    attachmentsData.allAttachments.forEach(attachment => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
        // Re-add header on new page
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text('Documento', this.margin, this.currentY);
        this.pdf.text('Arquivo', this.margin + 60, this.currentY);
        this.pdf.text('Tipo', this.margin + 120, this.currentY);
        this.pdf.text('Tamanho', this.margin + 150, this.currentY);
        this.pdf.text('Data Upload', this.margin + 180, this.currentY);
        this.currentY += this.lineHeight;
        this.pdf.setFont('helvetica', 'normal');
      }
      
      this.pdf.text(attachment.documentName.substring(0, 25), this.margin, this.currentY);
      this.pdf.text(attachment.fileName.substring(0, 20), this.margin + 60, this.currentY);
      this.pdf.text(this.getFileTypeDisplay(attachment.fileType), this.margin + 120, this.currentY);
      this.pdf.text(fileManager.formatFileSize(attachment.fileSize), this.margin + 150, this.currentY);
      this.pdf.text(this.formatUploadDate(attachment.uploadedAt), this.margin + 180, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  /**
   * Get file type display name
   */
  private getFileTypeDisplay(fileType: string): string {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
    if (fileType.includes('word') || fileType.includes('document')) return 'Word';
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpeg')) return 'Imagem';
    return 'Outro';
  }

  /**
   * Format upload date for display
   */
  private formatUploadDate(uploadedAt: any): string {
    try {
      // Handle both Date objects and date strings
      const date = uploadedAt instanceof Date ? uploadedAt : new Date(uploadedAt);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Error formatting upload date:', error);
      return 'Data inválida';
    }
  }
}

export const generateComprehensiveReport = async (): Promise<void> => {
  const generator = new PDFReportGenerator();
  await generator.generateComprehensiveReport();
};
