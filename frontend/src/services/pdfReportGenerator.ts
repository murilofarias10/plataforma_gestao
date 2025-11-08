import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useProjectStore } from '@/stores/projectStore';
import { fileManager } from './fileManager';

// Helper function to capture element as image
async function captureElement(selector: string): Promise<string | null> {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
      return null;
    }
    
    const canvas = await html2canvas(element as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`Error capturing ${selector}:`, error);
    return null;
  }
}

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
    this.pdf = new jsPDF('l', 'mm', 'a4');
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.currentY = this.margin;
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

  async generateComprehensiveReport(): Promise<void> {
    try {
      // Capture screenshots from both pages
      const screenshots = await this.captureAllScreenshots();
      
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
          generatedAt: timestamp
        },
        attachments: {
          allAttachments: allAttachments,
          totalFiles: allAttachments.length,
          totalSize: totalSize
        }
      };

      // Generate PDF content with screenshots
      await this.generatePDFContent(reportData, screenshots);
      
      // Save the PDF with same timestamp
      const fileName = `Relatorio_${selectedProject.name.replace(/\s+/g, '_')}_${timestampForFilename}.pdf`;
      this.pdf.save(fileName);
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }
  
  private async captureAllScreenshots(): Promise<Record<string, string | null>> {
    const screenshots: Record<string, string | null> = {};
    const currentPath = window.location.pathname;
    
    try {
      // Capture Project Tracker screenshots
      await this.navigateToPage('/project-tracker');
      await new Promise(resolve => setTimeout(resolve, 800)); // Wait for page to load
      
      // Expand charts if collapsed
      await this.expandChartsSection();
      
      // Capture Project Tracker elements
      screenshots.kpiCards = await captureElement('[data-report-section="kpi-cards"]');
      screenshots.timelineChart = await captureElement('[data-chart="timeline"]');
      screenshots.statusChart = await captureElement('[data-chart="status"]');
      
      // Capture Document Monitor screenshots
      await this.navigateToPage('/document-monitor');
      await new Promise(resolve => setTimeout(resolve, 800)); // Wait for page to load
      
      // Capture Document Monitor elements
      screenshots.documentMonitorKPIs = await captureElement('[data-report-section="document-monitor-kpis"]');
      screenshots.scurveChart = await captureElement('[data-chart-section="scurve"]');
      
      // Navigate back to original page
      await this.navigateToPage(currentPath);
      
    } catch (error) {
      console.error('Error capturing screenshots:', error);
    }
    
    return screenshots;
  }
  
  private async navigateToPage(path: string): Promise<void> {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async generatePDFBlob(reportData: ReportData): Promise<Blob> {
    try {
      // Capture screenshots from both pages
      const screenshots = await this.captureAllScreenshots();
      
      // Generate PDF content
      await this.generatePDFContent(reportData, screenshots);
      
      // Return PDF as blob
      return this.pdf.output('blob');
      
    } catch (error) {
      console.error('Erro ao gerar PDF blob:', error);
      throw error;
    }
  }

  private async generatePDFContent(data: ReportData, screenshots?: Record<string, string | null>): Promise<void> {
    screenshots = screenshots || {};
    
    // Cover page
    this.addCoverPage(data.projectInfo);
    this.addNewPage();

    // Project Tracker section
    this.addSectionHeader('PROJECT TRACKER');
    await this.addProjectTrackerContent(data.projectTracker, screenshots);
    this.addNewPage();

    // Document Monitor section
    this.addSectionHeader('MONITOR DE DOCUMENTOS');
    await this.addDocumentMonitorContent(data.documentMonitor, screenshots);
    this.addNewPage();

    // Attachments section
    this.addSectionHeader('ANEXOS');
    this.addAttachmentsContent(data.attachments);
  }
  
  private async expandChartsSection(): Promise<void> {
    // Wait a bit for the page to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try to expand charts if they're collapsed
    const chartsSection = document.querySelector('[data-charts-section]');
    if (chartsSection) {
      // Trigger click to expand (if collapsed)
      const event = new MouseEvent('click', { bubbles: true });
      chartsSection.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
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

  private async addProjectTrackerContent(data: any, screenshots: Record<string, string | null>): Promise<void> {
    // KPI Cards - Capture the entire grid
    this.ensureSpaceForSection(screenshots.kpiCards ? 120 : 70);
    this.addSubsectionHeader('Indicadores de Performance (KPIs)');
    if (screenshots.kpiCards) {
      await this.addImage(screenshots.kpiCards, 'KPI Cards');
    } else {
      this.addKPICards(data.kpiData);
    }
    this.currentY += 10;

    // Filters applied
    const filtersHeightEstimate =
      40 +
      (data.filters?.statusFilter?.length ? this.lineHeight : 0) +
      (data.filters?.areaFilter?.length ? this.lineHeight : 0) +
      (data.filters?.responsavelFilter?.length ? this.lineHeight : 0);
    this.ensureSpaceForSection(filtersHeightEstimate);
    this.addSubsectionHeader('Filtros Aplicados');
    this.addFiltersInfo(data.filters);
    this.currentY += 10;

    // Timeline Chart
    const timelineHeightEstimate = screenshots.timelineChart
      ? 130
      : Math.min((data.timelineData?.length || 1) * this.lineHeight + 50, 120);
    this.ensureSpaceForSection(timelineHeightEstimate);
    this.addSubsectionHeader('Timeline de Documentos');
    if (screenshots.timelineChart) {
      await this.addImage(screenshots.timelineChart, 'Timeline Chart');
    } else {
      this.addTimelineData(data.timelineData);
    }
    this.currentY += 10;

    // Status Distribution
    const statusHeightEstimate = screenshots.statusChart
      ? 130
      : Math.min((data.statusDistribution?.length || 1) * this.lineHeight + 50, 120);
    this.ensureSpaceForSection(statusHeightEstimate);
    this.addSubsectionHeader('Distribuição por Status');
    if (screenshots.statusChart) {
      await this.addImage(screenshots.statusChart, 'Status Distribution');
    } else {
      this.addStatusDistribution(data.statusDistribution);
    }
    this.currentY += 10;

    // Documents Table
    this.ensureNewPageForWideTable();
    this.addSubsectionHeader('Controle de Documentos');
    this.addDocumentsTable(data.documents);
  }
  
  private async captureChartElement(selector: string): Promise<string | null> {
    try {
      // Try the specific selector provided
      const element = document.querySelector(selector);
      if (element) {
        const canvas = await html2canvas(element as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
        });
        return canvas.toDataURL('image/png');
      }
      
      return null;
    } catch (error) {
      console.error(`Error capturing chart element:`, error);
      return null;
    }
  }
  
  private async addImage(imageData: string, title: string): Promise<void> {
    try {
      // Convert data URL to image
      const img = new Image();
      img.src = imageData;
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Calculate dimensions to fit within page width
          const maxWidth = this.pageWidth - (this.margin * 2);
          const maxHeight = 100; // Maximum height per image in mm
          
          let imgWidth = img.width;
          let imgHeight = img.height;
          
          // Scale to fit width
          const scale = maxWidth / imgWidth;
          imgWidth = maxWidth;
          imgHeight = imgHeight * scale;
          
          // If still too tall, scale down
          if (imgHeight > maxHeight) {
            const heightScale = maxHeight / imgHeight;
            imgWidth = imgWidth * heightScale;
            imgHeight = maxHeight;
          }
          
          // Center the image
          const x = (this.pageWidth - imgWidth) / 2;
          
          // Check if we need a new page
          if (this.currentY + imgHeight > this.pageHeight - this.margin) {
            this.addNewPage();
          }
          
          // Add the image
          this.pdf.addImage(imageData, 'PNG', x, this.currentY, imgWidth, imgHeight);
          this.currentY += imgHeight + 5;
          
          resolve(null);
        };
        img.onerror = reject;
      });
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      // Fallback to text
      this.pdf.text(`[Image: ${title}]`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
  }

  private async addDocumentMonitorContent(data: any, screenshots: Record<string, string | null>): Promise<void> {
    // KPI Cards - Try to capture, but skip if not on correct page
    this.ensureSpaceForSection(screenshots.documentMonitorKPIs ? 120 : 70);
    this.addSubsectionHeader('Indicadores de Performance (KPIs)');
    if (screenshots.documentMonitorKPIs) {
      await this.addImage(screenshots.documentMonitorKPIs, 'Document Monitor KPIs');
    } else {
      // Fallback to formatted text display
      this.addDocumentMonitorKPIsFormatted(data.kpiData);
    }
    this.currentY += 10;

    // Filters applied
    const filtersHeightEstimate = 40;
    this.ensureSpaceForSection(filtersHeightEstimate);
    this.addSubsectionHeader('Filtros Aplicados');
    this.addDocumentMonitorFilters(data.filters);
    this.currentY += 10;

    // S-Curve Chart - Try to capture, but skip if not on correct page
    const sCurveHeightEstimate = screenshots.scurveChart
      ? 130
      : Math.min((data.sCurveData?.length || 1) * this.lineHeight + 60, 130);
    this.ensureSpaceForSection(sCurveHeightEstimate);
    this.addSubsectionHeader('Curva "S"');
    if (screenshots.scurveChart) {
      await this.addImage(screenshots.scurveChart, 'S-Curve Chart');
    } else {
      // Fallback to formatted text display
      this.addSCurveDataFormatted(data.sCurveData);
    }
    this.currentY += 10;

    // Document Status Table
    const statusTableHeightEstimate = Math.min((data.documentStatusTable?.length || 1) * this.lineHeight + 70, 140);
    this.ensureSpaceForSection(statusTableHeightEstimate);
    this.addSubsectionHeader('Status do Documento');
    this.addDocumentStatusTable(data.documentStatusTable);
  }
  
  private addDocumentMonitorKPIsFormatted(kpiData: any): void {
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    // Create a card-like display
    const cardWidth = 80;
    const cardHeight = 20;
    const cardX = this.margin;
    
    // Emitidos card
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(cardX, this.currentY, cardWidth, cardHeight);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Emitidos', cardX + 2, this.currentY + 5);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(14);
    this.pdf.text(`${kpiData.emitidos}%`, cardX + 2, this.currentY + 12);
    
    // Aprovados card
    const cardX2 = cardX + cardWidth + 10;
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(cardX2, this.currentY, cardWidth, cardHeight);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    this.pdf.text('Aprovados', cardX2 + 2, this.currentY + 5);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(14);
    this.pdf.text(`${kpiData.aprovados}%`, cardX2 + 2, this.currentY + 12);
    
    this.currentY += cardHeight + 5;
    this.pdf.setFontSize(10);
  }
  
  private addSCurveDataFormatted(sCurveData: any[]): void {
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    // Table header
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Data', this.margin, this.currentY);
    this.pdf.text('Projetado', this.margin + 40, this.currentY);
    this.pdf.text('Baseline', this.margin + 80, this.currentY);
    this.pdf.text('Avançado', this.margin + 120, this.currentY);
    this.currentY += this.lineHeight;
    
    // Table rows
    this.pdf.setFont('helvetica', 'normal');
    sCurveData.forEach(item => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
        // Re-add header
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text('Data', this.margin, this.currentY);
        this.pdf.text('Projetado', this.margin + 40, this.currentY);
        this.pdf.text('Baseline', this.margin + 80, this.currentY);
        this.pdf.text('Avançado', this.margin + 120, this.currentY);
        this.currentY += this.lineHeight;
        this.pdf.setFont('helvetica', 'normal');
      }
      
      this.pdf.text(item.time, this.margin, this.currentY);
      this.pdf.text(item.projetado.toString(), this.margin + 40, this.currentY);
      this.pdf.text(item.baseline.toString(), this.margin + 80, this.currentY);
      this.pdf.text(item.avancado.toString(), this.margin + 120, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addSubsectionHeader(title: string): void {
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 8;
  }

  private ensureSpaceForSection(estimatedHeight: number): void {
    const minHeight = estimatedHeight > 0 ? estimatedHeight : this.lineHeight * 4;
    if (this.currentY + minHeight > this.pageHeight - this.margin) {
      this.addNewPage();
    }
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
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    // Table header
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Status', this.margin, this.currentY);
    this.pdf.text('Quantidade', this.margin + 50, this.currentY);
    this.pdf.text('Início', this.margin + 90, this.currentY);
    this.pdf.text('Fim', this.margin + 120, this.currentY);
    this.currentY += this.lineHeight;
    
    // Add line under header
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 2;
    
    // Table rows
    this.pdf.setFont('helvetica', 'normal');
    tableData.forEach(item => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
        // Re-add header
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text('Status', this.margin, this.currentY);
        this.pdf.text('Quantidade', this.margin + 50, this.currentY);
        this.pdf.text('Início', this.margin + 90, this.currentY);
        this.pdf.text('Fim', this.margin + 120, this.currentY);
        this.currentY += this.lineHeight;
        this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
        this.currentY += 2;
        this.pdf.setFont('helvetica', 'normal');
      }
      
      this.pdf.text(item.status, this.margin, this.currentY);
      this.pdf.text(item.qtde.toString(), this.margin + 50, this.currentY);
      this.pdf.text(item.inicio?.toString() || '-', this.margin + 90, this.currentY);
      this.pdf.text(item.fim?.toString() || '-', this.margin + 120, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private ensureNewPageForWideTable(): void {
    const threshold = this.margin + 10;
    if (this.currentY > threshold) {
      this.addNewPage();
    } else {
      // Ensure a little breathing room at top of page
      this.currentY = this.margin;
    }
  }

  private addDocumentsTable(documents: any[]): void {
    if (documents.length === 0) {
      this.pdf.text('Nenhum documento encontrado', this.margin, this.currentY);
      this.currentY += this.lineHeight;
      return;
    }

    type ColumnAlign = 'left' | 'center' | 'right';
    type DocumentsColumn = {
      label: string;
      width: number;
      align: ColumnAlign;
      getValue: (doc: any) => string;
    };

    const columns: DocumentsColumn[] = [
      {
        label: 'Nº Item',
        width: 16,
        align: 'center',
        getValue: (doc) => (doc.numeroItem !== undefined && doc.numeroItem !== null ? String(doc.numeroItem) : '-'),
      },
      {
        label: 'Data Início',
        width: 22,
        align: 'center',
        getValue: (doc) => doc.dataInicio || '-',
      },
      {
        label: 'Data Fim',
        width: 22,
        align: 'center',
        getValue: (doc) => doc.dataFim || '-',
      },
      {
        label: 'Tópico',
        width: 64,
        align: 'left',
        getValue: (doc) => doc.documento || '-',
      },
      {
        label: 'Detalhe',
        width: 80,
        align: 'left',
        getValue: (doc) => doc.detalhe || '-',
      },
      {
        label: 'Responsável',
        width: 28,
        align: 'left',
        getValue: (doc) => doc.responsavel || '-',
      },
      {
        label: 'Status',
        width: 23,
        align: 'left',
        getValue: (doc) => doc.status || '-',
      },
    ];

    const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const startX = this.margin;
    const headerLineSpacing = 6;
    const rowLineSpacing = 4.6;

    const drawHeader = () => {
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      let x = startX;
      columns.forEach((col) => {
        const textX =
          col.align === 'center'
            ? x + col.width / 2
            : col.align === 'right'
              ? x + col.width
              : x;
        const options = col.align === 'left' ? undefined : { align: col.align };
        this.pdf.text(col.label, textX, this.currentY, options as any);
        x += col.width;
      });
      this.currentY += headerLineSpacing;
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.line(startX, this.currentY, startX + tableWidth, this.currentY);
      this.pdf.setDrawColor(0, 0, 0);
      this.currentY += 2;
      this.pdf.setFont('helvetica', 'normal');
    };

    const getColumnXPositions = () => {
      const positions: number[] = [];
      let x = startX;
      columns.forEach((col) => {
        positions.push(x);
        x += col.width;
      });
      return positions;
    };

    const columnPositions = getColumnXPositions();

    drawHeader();
    this.pdf.setFontSize(8);

    documents.forEach((doc, index) => {
      const cellContents = columns.map((col) => {
        const value = col.getValue(doc);
        const text = value || '-';
        const padding = col.align === 'left' ? 3 : 2;
        const lines = this.pdf.splitTextToSize(text, Math.max(col.width - padding, 8));
        return { lines, align: col.align };
      });

      const linesPerColumn = cellContents.map((cell) => Math.max(cell.lines.length, 1));
      const maxLines = Math.max(...linesPerColumn);
      const rowHeight = maxLines * rowLineSpacing + 1;

      if (this.currentY + rowHeight > this.pageHeight - this.margin) {
        this.addNewPage();
        this.pdf.setFontSize(8);
        columnPositions.splice(0, columnPositions.length, ...getColumnXPositions());
        drawHeader();
        this.pdf.setFontSize(8);
      }

      // Optional zebra striping for readability
      if (index % 2 === 1) {
        this.pdf.setFillColor(245, 245, 245);
        this.pdf.rect(startX, this.currentY - 1, tableWidth, rowHeight + 1, 'F');
        this.pdf.setDrawColor(0, 0, 0);
      }

      cellContents.forEach((cell, colIndex) => {
        const baseX = columnPositions[colIndex];
        const col = columns[colIndex];
        const textX =
          col.align === 'center'
            ? baseX + col.width / 2
            : col.align === 'right'
              ? baseX + col.width
              : baseX;

        cell.lines.forEach((line, lineIdx) => {
          const lineY = this.currentY + (lineIdx + 1) * rowLineSpacing;
          if (col.align === 'left') {
            this.pdf.text(line, textX, lineY);
          } else {
            this.pdf.text(line, textX, lineY, { align: col.align });
          }
        });
      });

      this.currentY += rowHeight;
      this.pdf.setDrawColor(230, 230, 230);
      this.pdf.line(startX, this.currentY, startX + tableWidth, this.currentY);
      this.pdf.setDrawColor(0, 0, 0);
    });

    this.currentY += 2;
    this.pdf.setFontSize(10);
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
      const response = await fetch(`http://localhost:3001/api/files/${projectId}/${documentId}${cacheBuster}`, {
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
    this.pdf.setFontSize(8); // Smaller font for better fit
    this.pdf.setFont('helvetica', 'normal');
    
    // Table header - Adjusted column positions
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Documento', this.margin, this.currentY);
    this.pdf.text('Arquivo', this.margin + 50, this.currentY);
    this.pdf.text('Tipo', this.margin + 100, this.currentY);
    this.pdf.text('Tamanho', this.margin + 130, this.currentY);
    this.pdf.text('Data', this.margin + 165, this.currentY);
    this.currentY += this.lineHeight;
    
    // Add line under header
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 2;

    // Table rows
    this.pdf.setFont('helvetica', 'normal');
    attachmentsData.allAttachments.forEach(attachment => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
        // Re-add header on new page
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setFontSize(8);
        this.pdf.text('Documento', this.margin, this.currentY);
        this.pdf.text('Arquivo', this.margin + 50, this.currentY);
        this.pdf.text('Tipo', this.margin + 100, this.currentY);
        this.pdf.text('Tamanho', this.margin + 130, this.currentY);
        this.pdf.text('Data', this.margin + 165, this.currentY);
        this.currentY += this.lineHeight;
        this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
        this.currentY += 2;
        this.pdf.setFont('helvetica', 'normal');
      }
      
      // Truncate text to fit columns
      this.pdf.text(attachment.documentName.substring(0, 20), this.margin, this.currentY);
      this.pdf.text(attachment.fileName.substring(0, 18), this.margin + 50, this.currentY);
      this.pdf.text(this.getFileTypeDisplay(attachment.fileType), this.margin + 100, this.currentY);
      this.pdf.text(fileManager.formatFileSize(attachment.fileSize), this.margin + 130, this.currentY);
      
      // Format date more compactly
      const dateStr = this.formatUploadDateCompact(attachment.uploadedAt);
      this.pdf.text(dateStr, this.margin + 165, this.currentY);
      this.currentY += this.lineHeight;
    });
  }
  
  /**
   * Format upload date compactly for PDF
   */
  private formatUploadDateCompact(uploadedAt: any): string {
    try {
      const date = uploadedAt instanceof Date ? uploadedAt : new Date(uploadedAt);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'N/A';
    }
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
