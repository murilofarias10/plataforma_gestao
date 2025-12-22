import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useProjectStore } from '@/stores/projectStore';
import { fileManager } from './fileManager';
import { MeetingMetadata } from '@/types/project';
import { getApiUrl } from '@/lib/api-config';

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
  meeting?: MeetingMetadata;
  reportSettings?: {
    images: Array<{
      id: string;
      imageData: string;
      fileName: string;
      enabled: boolean;
    }>;
  };
}

export class PDFReportGenerator {
  private pdf: jsPDF;
  private currentY: number = 0;
  private pageHeight: number = 0;
  private pageWidth: number = 0;
  private margin: number = 20;
  private lineHeight: number = 7;
  private static montserratFontLoaded: boolean = false;

  constructor() {
    this.pdf = new jsPDF('l', 'mm', 'a4');
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.currentY = this.margin;
    // Font will be loaded in generateComprehensiveReport before generating content
  }

  /**
   * Initialize Montserrat font for jsPDF
   * Loads Montserrat font from CDN and adds it to jsPDF
   * Uses a static cache to avoid reloading the font data multiple times
   */
  private static montserratFontData: {
    regular?: string;
    bold?: string;
  } = {};

  private async initializeMontserratFont(): Promise<void> {
    try {
      // Check if we have cached font data
      if (PDFReportGenerator.montserratFontData.regular || PDFReportGenerator.montserratFontData.bold) {
        // Font data is cached, just add it to this PDF instance
        if (PDFReportGenerator.montserratFontData.regular) {
          this.pdf.addFileToVFS('Montserrat-Regular.ttf', PDFReportGenerator.montserratFontData.regular);
          this.pdf.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
        }
        if (PDFReportGenerator.montserratFontData.bold) {
          this.pdf.addFileToVFS('Montserrat-Bold.ttf', PDFReportGenerator.montserratFontData.bold);
          this.pdf.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');
        }
        PDFReportGenerator.montserratFontLoaded = true;
        return;
      }

      // If not cached, load from CDN
      if (PDFReportGenerator.montserratFontLoaded) {
        // Already attempted to load but failed, skip
        return;
      }

      // Load fonts from local backend (no CORS issues, reliable)
      const regularTTFUrl = getApiUrl('/api/fonts/montserrat/regular');
      const boldTTFUrl = getApiUrl('/api/fonts/montserrat/bold');
      
      console.log('[PDF] Loading Montserrat fonts from backend...');
      console.log('[PDF] Regular font URL:', regularTTFUrl);
      console.log('[PDF] Bold font URL:', boldTTFUrl);
      
      // Try to load both regular and bold fonts
      const [regularResponse, boldResponse] = await Promise.all([
        fetch(regularTTFUrl).catch(err => {
          console.error('[PDF] Error fetching regular font:', err);
          return null;
        }),
        fetch(boldTTFUrl).catch(err => {
          console.error('[PDF] Error fetching bold font:', err);
          return null;
        })
      ]);
      
      console.log('[PDF] Regular font response:', regularResponse?.ok, regularResponse?.status);
      console.log('[PDF] Bold font response:', boldResponse?.ok, boldResponse?.status);

      if (regularResponse && regularResponse.ok) {
        const regularArrayBuffer = await regularResponse.arrayBuffer();
        // Convert ArrayBuffer to base64 using a chunked approach (avoids stack overflow)
        const regularBase64 = this.arrayBufferToBase64(regularArrayBuffer);
        
        // Cache the font data
        PDFReportGenerator.montserratFontData.regular = regularBase64;
        
        // Add font to jsPDF's virtual file system
        this.pdf.addFileToVFS('Montserrat-Regular.ttf', regularBase64);
        this.pdf.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
        console.log('[PDF] ✓ Regular font loaded and added to jsPDF');
      } else {
        console.warn('[PDF] ✗ Regular font failed to load');
      }

      if (boldResponse && boldResponse.ok) {
        const boldArrayBuffer = await boldResponse.arrayBuffer();
        // Convert ArrayBuffer to base64 using a chunked approach (avoids stack overflow)
        const boldBase64 = this.arrayBufferToBase64(boldArrayBuffer);
        
        // Cache the font data
        PDFReportGenerator.montserratFontData.bold = boldBase64;
        
        this.pdf.addFileToVFS('Montserrat-Bold.ttf', boldBase64);
        this.pdf.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');
        console.log('[PDF] ✓ Bold font loaded and added to jsPDF');
      } else {
        console.warn('[PDF] ✗ Bold font failed to load');
      }

      // Verify fonts are actually registered in jsPDF
      const registeredFonts = (this.pdf as any).internal.getFontList();
      const hasMontserratRegular = registeredFonts && registeredFonts['Montserrat-normal'];
      const hasMontserratBold = registeredFonts && registeredFonts['Montserrat-bold'];
      
      console.log('[PDF] Registered fonts check:', {
        hasRegular: hasMontserratRegular,
        hasBold: hasMontserratBold,
        allFonts: Object.keys(registeredFonts || {})
      });
      
      // Mark as loaded if at least one font was loaded
      if ((regularResponse && regularResponse.ok) || (boldResponse && boldResponse.ok)) {
        PDFReportGenerator.montserratFontLoaded = true;
        
        if (hasMontserratRegular || hasMontserratBold) {
          console.log('[PDF] ✓✓✓ Montserrat fonts successfully loaded and verified in jsPDF');
        } else {
          console.warn('[PDF] ⚠️ Fonts loaded but not verified in jsPDF. Font registration may have failed.');
        }
      } else {
        // If both fail, mark as loaded to prevent retries and use helvetica
        console.warn('[PDF] ⚠️ WARNING: Could not load Montserrat fonts from backend. PDF will use Helvetica as fallback.');
        console.warn('[PDF] Check backend logs for font download errors.');
        PDFReportGenerator.montserratFontLoaded = true;
      }
    } catch (error) {
      console.error('[PDF] ✗✗✗ Error loading Montserrat font:', error);
      console.warn('[PDF] PDF will use Helvetica as fallback font.');
      PDFReportGenerator.montserratFontLoaded = true; // Prevent retries
    }
  }

  /**
   * Convert ArrayBuffer to base64 string (chunked to avoid stack overflow)
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192; // Process in chunks to avoid stack overflow
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  /**
   * Set font to Montserrat (or helvetica as fallback)
   */
  private setMontserratFont(style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'): void {
    try {
      // Try to use Montserrat if loaded, otherwise fallback to helvetica
      const hasRegular = !!PDFReportGenerator.montserratFontData.regular;
      const hasBold = !!PDFReportGenerator.montserratFontData.bold;
      
      if (hasRegular || hasBold) {
        const fontStyle = style === 'bold' || style === 'bolditalic' ? 'bold' : 'normal';
        
        // Check if we have the required style
        let fontToUse = 'Montserrat';
        let styleToUse = fontStyle;
        
        if (fontStyle === 'bold' && !hasBold) {
          console.warn('[PDF] Bold requested but not available, using regular');
          styleToUse = 'normal';
        } else if (fontStyle === 'normal' && !hasRegular && hasBold) {
          console.warn('[PDF] Regular requested but not available, using bold');
          styleToUse = 'bold';
        }
        
        // Set the font
        this.pdf.setFont(fontToUse, styleToUse);
        
        // Verify the font was actually set (for debugging)
        const currentFont = (this.pdf as any).internal.getFont();
        if (currentFont && currentFont.fontName !== 'Montserrat') {
          console.warn('[PDF] Font set to Montserrat but jsPDF is using:', currentFont.fontName);
        }
      } else {
        // Fallback to helvetica if Montserrat is not loaded
        console.warn('[PDF] Using Helvetica fallback - Montserrat not loaded (regular:', hasRegular, 'bold:', hasBold, ')');
        this.pdf.setFont('helvetica', style);
      }
    } catch (error) {
      // Fallback to helvetica if Montserrat is not available
      console.error('[PDF] Error setting Montserrat font:', error);
      this.pdf.setFont('helvetica', style);
    }
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

  async generateReportForMultipleMeetings(meetings: MeetingMetadata[]): Promise<void> {
    if (meetings.length === 0) {
      throw new Error('Nenhuma reunião selecionada para gerar o relatório');
    }

    try {
      // Reset PDF instance
      this.pdf = new jsPDF('l', 'mm', 'a4');
      this.pageHeight = this.pdf.internal.pageSize.height;
      this.pageWidth = this.pdf.internal.pageSize.width;
      this.currentY = this.margin;

      // Ensure Montserrat font is loaded before generating content
      await this.initializeMontserratFont();

      // Get current data from stores
      const projectStore = useProjectStore.getState();
      const selectedProject = projectStore.getSelectedProject();
      
      if (!selectedProject) {
        throw new Error('Nenhum projeto selecionado');
      }

      // Generate timestamp
      const timestamp = this.formatDateTimeForDisplay();
      const timestampForFilename = timestamp.replace(/[:\/ ]/g, (match) => match === '/' ? '-' : '_');

      // Collect all documents from all meetings
      const allDocuments: any[] = [];
      const allDocumentIds = new Set<string>();
      
      for (const meeting of meetings) {
        const allDocumentsList = projectStore.documents;
        let meetingDocumentIds: string[] = [];
        
        if (meeting.relatedDocumentIds && meeting.relatedDocumentIds.length > 0) {
          meetingDocumentIds = [...meeting.relatedDocumentIds];
        } else if (meeting.relatedItems && meeting.relatedItems.length > 0) {
          const meetingDocs = allDocumentsList.filter(doc => meeting.relatedItems?.includes(doc.numeroItem));
          meetingDocumentIds = meetingDocs.map(doc => doc.id);
        }
        
        meetingDocumentIds.forEach(id => allDocumentIds.add(id));
      }
      
      allDocuments.push(...projectStore.documents.filter(doc => allDocumentIds.has(doc.id)));

      // Collect all attachments from all meetings
      const allAttachments = await this.collectAllAttachments(
        selectedProject.id,
        Array.from(allDocumentIds)
      );
      const totalSize = this.calculateTotalSize(allAttachments);

      // Generate cover page
      this.addCoverPage({
        name: selectedProject.name,
        description: selectedProject.description || '',
        generatedAt: timestamp
      });
      this.addNewPage();

      // Add summary section
      this.addSectionHeader('RESUMO DAS REUNIÕES');
      this.pdf.setFontSize(12);
      this.setMontserratFont('normal');
      this.pdf.text(`Total de reuniões: ${meetings.length}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      this.pdf.text(`Total de documentos: ${allDocuments.length}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      this.pdf.text(`Total de anexos: ${allAttachments.length}`, this.margin, this.currentY);
      this.currentY += 15;
      this.addNewPage();

      // Generate report for each meeting
      for (let i = 0; i < meetings.length; i++) {
        const meeting = meetings[i];
        
        // Meeting Overview section
        this.addSectionHeader(`REUNIÃO ${i + 1} - ${meeting.numeroAta || meeting.id}`);
        this.addMeetingOverview(meeting);
        this.currentY += 10;
        
        // Get documents for this meeting
        let meetingDocuments: any[] = [];
        let meetingDocumentIds: string[] = [];
        
        if (meeting.relatedDocumentIds && meeting.relatedDocumentIds.length > 0) {
          meetingDocumentIds = [...meeting.relatedDocumentIds];
          meetingDocuments = allDocuments.filter(doc => meetingDocumentIds.includes(doc.id));
        } else if (meeting.relatedItems && meeting.relatedItems.length > 0) {
          meetingDocuments = allDocuments.filter(doc => meeting.relatedItems?.includes(doc.numeroItem));
          meetingDocumentIds = meetingDocuments.map(doc => doc.id);
        }

        // Meeting Items section
        this.addSectionHeader('ITENS DA REUNIÃO');
        if (meetingDocuments.length > 0) {
          this.addDocumentsTable(meetingDocuments);
        } else {
          this.pdf.setFontSize(10);
          this.setMontserratFont('normal');
          this.pdf.text('Nenhum item encontrado para esta reunião.', this.margin, this.currentY);
          this.currentY += this.lineHeight;
        }
        
        // Add page break between meetings (except for the last one)
        if (i < meetings.length - 1) {
          this.addNewPage();
        }
      }

      // Add attachments section at the end
      this.addNewPage();
      this.addSectionHeader('ANEXOS');
      this.addAttachmentsContent({
        allAttachments: allAttachments,
        totalFiles: allAttachments.length,
        totalSize: totalSize
      });

      // Open PDF in new tab
      const pdfBlob = this.pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      
    } catch (error) {
      console.error('Erro ao gerar relatório de múltiplas reuniões:', error);
      throw error;
    }
  }

  async generateComprehensiveReport(meeting?: MeetingMetadata): Promise<void> {
    try {
      // Reset PDF instance to ensure fresh start
      this.pdf = new jsPDF('l', 'mm', 'a4');
      this.pageHeight = this.pdf.internal.pageSize.height;
      this.pageWidth = this.pdf.internal.pageSize.width;
      this.currentY = this.margin;
      
      // Ensure Montserrat font is loaded before generating content
      await this.initializeMontserratFont();
      
      // Get current data from stores
      const projectStore = useProjectStore.getState();
      const selectedProject = projectStore.getSelectedProject();
      
      if (!selectedProject) {
        throw new Error('Nenhum projeto selecionado');
      }

      // For meeting reports, we don't need screenshots
      if (!meeting) {
        // Capture screenshots from both pages only for general reports
        const screenshots = await this.captureAllScreenshots();
        // ... rest of general report logic would go here if needed
      }

      // Generate timestamp once to use consistently
      const timestamp = this.formatDateTimeForDisplay();
      const timestampForFilename = timestamp.replace(/[:\/ ]/g, (match) => match === '/' ? '-' : '_');

      // Get meeting-related documents if meeting is provided
      let meetingDocuments: any[] = [];
      let meetingDocumentIds: string[] = [];
      
      if (meeting) {
        const allDocuments = projectStore.documents;
        // Use relatedDocumentIds (new) or fall back to relatedItems (old) for backward compatibility
        if (meeting.relatedDocumentIds && meeting.relatedDocumentIds.length > 0) {
          meetingDocumentIds = [...meeting.relatedDocumentIds]; // Create a copy to avoid mutations
          meetingDocuments = allDocuments.filter(doc => meetingDocumentIds.includes(doc.id));
        } else if (meeting.relatedItems && meeting.relatedItems.length > 0) {
          // Old method: filter by item numbers (backward compatibility)
          meetingDocuments = allDocuments.filter(doc => meeting.relatedItems?.includes(doc.numeroItem));
          meetingDocumentIds = meetingDocuments.map(doc => doc.id);
        }
        console.log(`[PDF Report] Meeting ${meeting.numeroAta || meeting.id}: Found ${meetingDocuments.length} related documents`);
        console.log(`[PDF Report] Meeting document IDs:`, meetingDocumentIds);
        console.log(`[PDF Report] Meeting document names:`, meetingDocuments.map(d => d.documento));
      }

      // Collect attachments - if meeting is provided, only collect for meeting documents
      // IMPORTANT: Pass a fresh copy of document IDs to avoid any caching issues
      // If meeting has no documents, pass empty array explicitly (not undefined)
      let allAttachments: any[] = [];
      if (meeting) {
        if (meetingDocumentIds.length > 0) {
          allAttachments = await this.collectAllAttachments(
            selectedProject.id,
            [...meetingDocumentIds]
          );
        } else {
          // Meeting has no documents, so no attachments
          console.log(`[PDF Report] Meeting ${meeting.numeroAta || meeting.id} has no documents, returning empty attachments`);
          allAttachments = [];
        }
      } else {
        // General report (no meeting)
        allAttachments = await this.collectAllAttachments(selectedProject.id, undefined);
      }
      const totalSize = this.calculateTotalSize(allAttachments);
      
      console.log(`[PDF Report] Final attachment count: ${allAttachments.length}, total size: ${totalSize}`);

      const reportData: ReportData = {
        projectTracker: {
          kpiData: projectStore.getKpiData(),
          timelineData: projectStore.getTimelineData(),
          statusDistribution: projectStore.getStatusDistribution(),
          // If meeting is provided, use meeting documents; otherwise use all filtered documents
          documents: meeting ? meetingDocuments : projectStore.getFilteredDocuments(),
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
        },
        reportSettings: selectedProject.reportSettings
      };

      if (meeting) {
        reportData.meeting = {
          ...meeting,
          participants: Array.isArray(meeting.participants) ? meeting.participants : []
        };
      }

      // Generate PDF content (no screenshots needed for meeting reports)
      await this.generatePDFContent(reportData, {});
      
      // For meeting reports, open PDF in new tab instead of downloading
      if (meeting) {
        const pdfBlob = this.pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        // Clean up the URL after a delay (give browser time to open the tab)
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      } else {
        // For general reports, download as before
        const sanitizedProject = selectedProject.name.replace(/\s+/g, '_');
        const fileName = `Relatorio_${sanitizedProject}_${timestampForFilename}.pdf`;
        this.pdf.save(fileName);
      }
      
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
    
    // If this is a meeting report, combine cover and overview on first page
    if (data.meeting) {
      // Combined cover page with meeting overview
      await this.addCoverPageWithMeetingOverview(data.projectInfo, data.meeting, data.reportSettings);
      this.addNewPage();

      // Meeting Items section (Itens da Reunião)
      this.addSectionHeader('ITENS DA REUNIÃO');
      if (data.projectTracker.documents.length > 0) {
        this.addDocumentsTable(data.projectTracker.documents);
      } else {
        this.pdf.setFontSize(10);
        this.setMontserratFont('normal');
        this.pdf.text('Nenhum item encontrado para esta reunião.', this.margin, this.currentY);
        this.currentY += this.lineHeight;
      }
      this.addNewPage();

      // Attachments section
      this.addSectionHeader('ANEXOS');
      this.addAttachmentsContent(data.attachments);
    } else {
      // General report (keep original structure)
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
    this.setMontserratFont('bold');
    this.pdf.text('RELATÓRIO GERAL PLATAFORMA DE GESTÃO', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 20;

    // Project info
    this.pdf.setFontSize(16);
    this.setMontserratFont('normal');
    this.pdf.text(`Projeto: ${projectInfo.name}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 10;
    this.setMontserratFont('normal');
    this.pdf.text(projectInfo.description, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 20;

    // Generated date
    this.pdf.setFontSize(12);
    this.setMontserratFont('normal');
    this.pdf.text(`Gerado em: ${projectInfo.generatedAt}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 30;

    // Logo placeholder
    this.pdf.setFontSize(10);
    this.setMontserratFont('normal');
    this.pdf.text('KUBIK ENGENHARIA', this.pageWidth / 2, this.pageHeight - 30, { align: 'center' });
  }

  /**
   * Helper function to convert backend image URL to base64
   */
  private async loadImageAsBase64(imageUrl: string): Promise<string | null> {
    try {
      // If it's already base64, return as is
      if (imageUrl.startsWith('data:')) {
        return imageUrl;
      }
      
      // Construct full URL
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : getApiUrl(imageUrl);
      
      // Fetch the image
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      
      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image as base64:', error);
      return null;
    }
  }

  /**
   * Combined cover page with meeting overview for meeting reports
   * Optimizes space by putting everything on the first page
   */
  private async addCoverPageWithMeetingOverview(projectInfo: any, meeting: MeetingMetadata, reportSettings?: { images: Array<{ id: string; imageData: string; fileName: string; enabled: boolean }> }): Promise<void> {
    // Add report images centered at the top if they exist and are enabled
    if (reportSettings?.images) {
      const enabledImages = reportSettings.images.filter(img => img.enabled && img.imageData);
      if (enabledImages.length > 0) {
        const imageHeight = 20; // Height for each image in mm
        const imageSpacing = 5; // Spacing between images in mm
        const imageY = this.currentY;
        
        // First pass: calculate total width of all images
        let totalWidth = 0;
        const imageWidths: number[] = [];
        
        for (const image of enabledImages) {
          try {
            // Load image as base64
            const base64Image = await this.loadImageAsBase64(image.imageData);
            
            if (base64Image) {
              // Calculate width to maintain aspect ratio
              const imgElement = new Image();
              imgElement.src = base64Image;
              
              // Wait for image to load to get dimensions
              await new Promise((resolve) => {
                imgElement.onload = resolve;
                imgElement.onerror = resolve; // Continue even if image fails
              });
              
              if (imgElement.naturalWidth > 0) {
                const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
                const imageWidth = imageHeight * aspectRatio;
                imageWidths.push(imageWidth);
                totalWidth += imageWidth;
              } else {
                imageWidths.push(0);
              }
            } else {
              imageWidths.push(0);
            }
          } catch (error) {
            console.error(`Error calculating image width for ${image.fileName}:`, error);
            imageWidths.push(0);
          }
        }
        
        // Calculate total width including spacing
        const totalSpacing = (enabledImages.length - 1) * imageSpacing;
        const totalImagesWidth = totalWidth + totalSpacing;
        
        // Calculate starting X position to center images
        const startX = (this.pageWidth - totalImagesWidth) / 2;
        let imageX = startX;
        
        // Second pass: add images to PDF
        for (let i = 0; i < enabledImages.length; i++) {
          const image = enabledImages[i];
          const imageWidth = imageWidths[i];
          
          if (imageWidth > 0) {
            try {
              // Load image as base64
              const base64Image = await this.loadImageAsBase64(image.imageData);
              
              if (base64Image) {
                // Add image to PDF
                this.pdf.addImage(base64Image, 'PNG', imageX, imageY, imageWidth, imageHeight);
                
                // Move X position for next image
                imageX += imageWidth + imageSpacing;
              }
            } catch (error) {
              console.error(`Error adding image ${image.fileName} to PDF:`, error);
            }
          }
        }
        
        // Move currentY down after images
        this.currentY += imageHeight + 10;
      }
    }
    
    // Title (slightly smaller to save space)
    this.pdf.setFontSize(20);
    this.setMontserratFont('bold');
    this.pdf.text('RELATÓRIO GERAL PLATAFORMA DE GESTÃO', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;

    // Project info
    this.pdf.setFontSize(14);
    this.setMontserratFont('normal');
    this.pdf.text(`Projeto: ${projectInfo.name}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 8;
    if (projectInfo.description) {
      this.setMontserratFont('normal');
      this.pdf.text(projectInfo.description, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 8;
    }

    // Generated date
    this.pdf.setFontSize(11);
    this.setMontserratFont('normal');
    this.pdf.text(`Gerado em: ${projectInfo.generatedAt}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 18;

    // Section header for meeting overview (inline, no extra spacing)
    this.pdf.setFontSize(16);
    this.setMontserratFont('bold');
    this.pdf.text('RESUMO DA REUNIÃO', this.margin, this.currentY);
    this.currentY += 12;

    // Add line separator
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;
    
    // Meeting overview content
    this.addMeetingOverview(meeting);
    
    // Logo at bottom if there's space
    const remainingSpace = this.pageHeight - this.currentY;
    if (remainingSpace > 40) {
      this.pdf.setFontSize(10);
      this.setMontserratFont('normal');
      this.pdf.text('KUBIK ENGENHARIA', this.pageWidth / 2, this.pageHeight - 20, { align: 'center' });
    }
  }

  private addSectionHeader(title: string): void {
    this.pdf.setFontSize(16);
    this.setMontserratFont('bold');
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 15;

    // Add line separator
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addMeetingOverview(meeting: MeetingMetadata): void {
    this.pdf.setFontSize(12);
    this.setMontserratFont('bold');
    this.pdf.text('Resumo da Reunião', this.margin, this.currentY);
    this.currentY += 8;

    this.pdf.setFontSize(10);
    this.setMontserratFont('normal');

    const infoRows: Array<{ label: string; value: string }> = [
      { label: 'Data', value: meeting.data || '-' },
      { label: 'Número da Ata', value: meeting.numeroAta || '-' },
      {
        label: 'Participantes',
        value: (meeting.participants && meeting.participants.length > 0)
          ? meeting.participants.join(', ')
          : '-'
      },
    ];

    const labelWidth = 35;
    const valueWidth = this.pageWidth - this.margin * 2 - labelWidth;

    infoRows.forEach((row) => {
      const valueLines = this.pdf.splitTextToSize(row.value, valueWidth);
      this.setMontserratFont('bold');
      this.pdf.text(`${row.label}:`, this.margin, this.currentY);
      valueLines.forEach((line, index) => {
        const lineY = this.currentY + index * this.lineHeight;
        this.setMontserratFont('normal');
        this.pdf.text(line, this.margin + labelWidth, lineY);
      });
      this.currentY += valueLines.length * this.lineHeight;
    });

    if (meeting.detalhes) {
      this.currentY += 5;
      this.setMontserratFont('bold');
      this.pdf.text('Detalhes:', this.margin, this.currentY);
      this.currentY += this.lineHeight;
      this.setMontserratFont('normal');
      const detailLines = this.pdf.splitTextToSize(meeting.detalhes, this.pageWidth - this.margin * 2);
      detailLines.forEach((line) => {
        if (this.currentY > this.pageHeight - this.margin) {
          this.addNewPage();
        }
        this.setMontserratFont('normal');
        this.pdf.text(line, this.margin, this.currentY);
        this.currentY += this.lineHeight;
      });
    }
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
    this.setMontserratFont('normal');
    
    // Create a card-like display
    const cardWidth = 80;
    const cardHeight = 20;
    const cardX = this.margin;
    
    // Emitidos card
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(cardX, this.currentY, cardWidth, cardHeight);
    this.setMontserratFont('bold');
    this.pdf.text('Emitidos', cardX + 2, this.currentY + 5);
    this.setMontserratFont('normal');
    this.pdf.setFontSize(14);
    this.setMontserratFont('normal');
    this.pdf.text(`${kpiData.emitidos}%`, cardX + 2, this.currentY + 12);
    
    // Aprovados card
    const cardX2 = cardX + cardWidth + 10;
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(cardX2, this.currentY, cardWidth, cardHeight);
    this.setMontserratFont('bold');
    this.pdf.setFontSize(10);
    this.pdf.text('Aprovados', cardX2 + 2, this.currentY + 5);
    this.setMontserratFont('normal');
    this.pdf.setFontSize(14);
    this.setMontserratFont('normal');
    this.pdf.text(`${kpiData.aprovados}%`, cardX2 + 2, this.currentY + 12);
    
    this.currentY += cardHeight + 5;
    this.pdf.setFontSize(10);
  }
  
  private addSCurveDataFormatted(sCurveData: any[]): void {
    this.pdf.setFontSize(9);
    this.setMontserratFont('normal');
    
    // Table header
    this.setMontserratFont('bold');
    this.pdf.text('Data', this.margin, this.currentY);
    this.pdf.text('Projetado', this.margin + 40, this.currentY);
    this.pdf.text('Baseline', this.margin + 80, this.currentY);
    this.pdf.text('Avançado', this.margin + 120, this.currentY);
    this.currentY += this.lineHeight;
    
    // Table rows
    this.setMontserratFont('normal');
    sCurveData.forEach(item => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
        // Re-add header
        this.setMontserratFont('bold');
        this.pdf.text('Data', this.margin, this.currentY);
        this.pdf.text('Projetado', this.margin + 40, this.currentY);
        this.pdf.text('Baseline', this.margin + 80, this.currentY);
        this.pdf.text('Avançado', this.margin + 120, this.currentY);
        this.currentY += this.lineHeight;
        this.setMontserratFont('normal');
      }
      
      this.setMontserratFont('normal');
      this.pdf.text(item.time, this.margin, this.currentY);
      this.pdf.text(item.projetado.toString(), this.margin + 40, this.currentY);
      this.pdf.text(item.baseline.toString(), this.margin + 80, this.currentY);
      this.pdf.text(item.avancado.toString(), this.margin + 120, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addSubsectionHeader(title: string): void {
    this.pdf.setFontSize(12);
    this.setMontserratFont('bold');
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
    this.setMontserratFont('normal');
    
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
    this.setMontserratFont('normal');
    
    this.pdf.text(`Emitidos: ${kpiData.emitidos}%`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`Aprovados: ${kpiData.aprovados}%`, this.margin, this.currentY);
  }

  private addFiltersInfo(filters: any): void {
    this.pdf.setFontSize(10);
    this.setMontserratFont('normal');
    
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
    this.setMontserratFont('normal');
    
    this.pdf.text(`Período: ${filters.dateRange.start} até ${filters.dateRange.end}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`Disciplina: ${filters.selectedDiscipline}`, this.margin, this.currentY);
  }

  private addTimelineData(timelineData: any[]): void {
    if (timelineData.length === 0) {
      this.pdf.setFontSize(10);
      this.setMontserratFont('normal');
      this.pdf.text('Nenhum dado disponível', this.margin, this.currentY);
      this.currentY += this.lineHeight;
      return;
    }

    this.pdf.setFontSize(10);
    this.setMontserratFont('normal');
    
    timelineData.forEach(item => {
      this.pdf.text(`${item.month}: Criados ${item.created}, Finalizados ${item.finished}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addStatusDistribution(statusData: any[]): void {
    if (statusData.length === 0) {
      this.pdf.setFontSize(10);
      this.setMontserratFont('normal');
      this.pdf.text('Nenhum dado disponível', this.margin, this.currentY);
      this.currentY += this.lineHeight;
      return;
    }

    this.pdf.setFontSize(10);
    this.setMontserratFont('normal');
    
    statusData.forEach(item => {
      this.pdf.text(`${item.status}: ${item.count} documentos (${item.percentage}%)`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addSCurveData(sCurveData: any[]): void {
    this.pdf.setFontSize(10);
    this.setMontserratFont('normal');
    
    sCurveData.forEach(item => {
      this.pdf.text(`${item.time}: Projetado ${item.projetado}, Baseline ${item.baseline}, Avançado ${item.avancado}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addDocumentStatusTable(tableData: any[]): void {
    this.pdf.setFontSize(9);
    this.setMontserratFont('normal');
    
    // Table header
    this.setMontserratFont('bold');
    this.pdf.text('Status', this.margin, this.currentY);
    this.pdf.text('Quantidade', this.margin + 50, this.currentY);
    this.pdf.text('Início', this.margin + 90, this.currentY);
    this.pdf.text('Fim', this.margin + 120, this.currentY);
    this.currentY += this.lineHeight;
    
    // Add line under header
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 2;
    
    // Table rows
    this.setMontserratFont('normal');
    tableData.forEach(item => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
        // Re-add header
        this.setMontserratFont('bold');
        this.pdf.text('Status', this.margin, this.currentY);
        this.pdf.text('Quantidade', this.margin + 50, this.currentY);
        this.pdf.text('Início', this.margin + 90, this.currentY);
        this.pdf.text('Fim', this.margin + 120, this.currentY);
        this.currentY += this.lineHeight;
        this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
        this.currentY += 2;
        this.setMontserratFont('normal');
      }
      
      this.setMontserratFont('normal');
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
      this.pdf.setFontSize(10);
      this.setMontserratFont('normal');
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
      this.setMontserratFont('bold');
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
      this.setMontserratFont('normal');
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
    this.setMontserratFont('normal');

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
        this.setMontserratFont('normal');
        columnPositions.splice(0, columnPositions.length, ...getColumnXPositions());
        drawHeader();
        this.pdf.setFontSize(8);
        this.setMontserratFont('normal');
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
          this.setMontserratFont('normal');
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
   * @param projectId - The project ID
   * @param documentIds - Optional: specific document IDs to collect attachments for (for meeting-specific reports)
   */
  private async collectAllAttachments(projectId: string, documentIds?: string[]): Promise<any[]> {
    try {
      // Always start with a fresh, empty array
      const allAttachments: any[] = [];
      
      // Get documents - if documentIds provided, filter by them; otherwise use filtered documents
      const projectStore = useProjectStore.getState();
      let targetDocuments: any[] = [];
      
      if (documentIds && documentIds.length > 0) {
        // For meeting-specific reports: only collect attachments for meeting documents
        // Create a Set for faster lookup and ensure we only get exact matches
        const documentIdsSet = new Set(documentIds);
        targetDocuments = projectStore.documents.filter(doc => documentIdsSet.has(doc.id));
        console.log('[collectAllAttachments] Collecting attachments for meeting documents:', {
          requestedDocumentIds: documentIds,
          totalMeetingDocuments: targetDocuments.length,
          foundDocumentIds: targetDocuments.map(d => d.id),
          documentNames: targetDocuments.map(d => ({ id: d.id, name: d.documento, status: d.status }))
        });
      } else if (!documentIds) {
        // For general reports: use filtered documents (only if documentIds is undefined, not empty array)
        targetDocuments = projectStore.getFilteredDocuments();
        console.log('[collectAllAttachments] Collecting attachments for filtered documents:', {
          totalFilteredDocuments: targetDocuments.length,
          activeFilters: projectStore.filters,
          documentIds: targetDocuments.map(d => ({ id: d.id, name: d.documento, status: d.status }))
        });
      } else {
        // Empty documentIds array means no documents for this meeting
        console.log('[collectAllAttachments] No documents provided (empty array), returning empty attachments');
        return [];
      }
      
      // If no target documents, return empty array immediately
      if (targetDocuments.length === 0) {
        console.log('[collectAllAttachments] No target documents found, returning empty attachments');
        return [];
      }
      
      // Collect attachments only for target documents
      // Use a Set to track document IDs we've already processed to avoid duplicates
      const processedDocumentIds = new Set<string>();
      
      for (const document of targetDocuments) {
        // Skip if we've already processed this document (safety check)
        if (processedDocumentIds.has(document.id)) {
          console.warn(`[collectAllAttachments] Skipping duplicate document: ${document.id}`);
          continue;
        }
        processedDocumentIds.add(document.id);
        
        let documentAttachments: any[] = [];
        
        // First, check if document has attachments directly stored
        if (document.attachments && Array.isArray(document.attachments) && document.attachments.length > 0) {
          // Create a fresh copy to avoid any reference issues
          documentAttachments = document.attachments.map(att => ({ ...att }));
          console.log(`[collectAllAttachments] Document ${document.documento} (${document.id}): Found ${documentAttachments.length} attachments in document.attachments`);
        }
        
        // If no attachments in document, try fileManager (which stores original names in localStorage)
        if (documentAttachments.length === 0) {
          const fileManagerAttachments = fileManager.getDocumentAttachments(projectId, document.id);
          if (fileManagerAttachments && fileManagerAttachments.length > 0) {
            // Create a fresh copy
            documentAttachments = fileManagerAttachments.map(att => ({ ...att }));
            console.log(`[collectAllAttachments] Document ${document.documento} (${document.id}): Found ${documentAttachments.length} attachments in fileManager`);
          }
        }
        
        // If still no attachments, fetch from backend
        if (documentAttachments.length === 0) {
          documentAttachments = await this.fetchAttachmentsFromBackend(projectId, document.id);
          if (documentAttachments.length > 0) {
            console.log(`[collectAllAttachments] Document ${document.documento} (${document.id}): Found ${documentAttachments.length} attachments from backend`);
          }
        }
        
        console.log(`[collectAllAttachments] Document ${document.documento} (${document.id}): Total ${documentAttachments.length} attachments`);
        documentAttachments.forEach(att => console.log(`  - ${att.fileName || att.originalName || 'Unknown'}`));
        
        // Process each attachment and add to the collection
        documentAttachments.forEach(attachment => {
          // Ensure uploadedAt is properly handled
          const processedAttachment = {
            id: attachment.id || `${document.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fileName: attachment.fileName || attachment.originalName || 'Unknown',
            fileSize: attachment.fileSize || 0,
            fileType: attachment.fileType || this.getFileTypeFromExtension(attachment.fileName || attachment.originalName || ''),
            uploadedAt: attachment.uploadedAt instanceof Date ? attachment.uploadedAt : new Date(attachment.uploadedAt || Date.now()),
            filePath: attachment.filePath || attachment.path || '',
            documentName: document.documento || 'Documento sem nome',
            documentId: document.id,
          };
          allAttachments.push(processedAttachment);
        });
      }
      
      console.log(`[collectAllAttachments] Total attachments collected: ${allAttachments.length}`);
      if (allAttachments.length > 0) {
        console.log(`[collectAllAttachments] Attachments breakdown:`, allAttachments.map(att => ({
          document: att.documentName,
          fileName: att.fileName,
          documentId: att.documentId
        })));
      } else {
        console.log(`[collectAllAttachments] No attachments found for the provided documents`);
      }
      
      // Return a fresh copy to avoid any reference issues
      // Always return a new array, even if empty
      return allAttachments.length > 0 ? [...allAttachments] : [];
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
      const response = await fetch(getApiUrl(`/api/files/${projectId}/${documentId}${cacheBuster}`), {
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
    // Ensure we have valid data
    const allAttachments = attachmentsData.allAttachments || [];
    const totalFiles = allAttachments.length;
    const totalSize = attachmentsData.totalSize || '0 B';
    
    // Summary
    this.addSubsectionHeader('Resumo dos Anexos');
    this.pdf.setFontSize(10);
    this.setMontserratFont('normal');
    this.pdf.text(`Total de arquivos: ${totalFiles}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`Tamanho total: ${totalSize}`, this.margin, this.currentY);
    this.currentY += 10;

    if (totalFiles === 0 || allAttachments.length === 0) {
      this.pdf.text('Nenhum anexo encontrado', this.margin, this.currentY);
      this.currentY += this.lineHeight;
      return;
    }

    // Attachments list
    this.addSubsectionHeader('Lista de Anexos');
    this.pdf.setFontSize(8); // Smaller font for better fit
    this.setMontserratFont('normal');
    
    // Table header - Adjusted column positions
    this.setMontserratFont('bold');
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
    this.setMontserratFont('normal');
    allAttachments.forEach(attachment => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
        // Re-add header on new page
        this.setMontserratFont('bold');
        this.pdf.setFontSize(8);
        this.pdf.text('Documento', this.margin, this.currentY);
        this.pdf.text('Arquivo', this.margin + 50, this.currentY);
        this.pdf.text('Tipo', this.margin + 100, this.currentY);
        this.pdf.text('Tamanho', this.margin + 130, this.currentY);
        this.pdf.text('Data', this.margin + 165, this.currentY);
        this.currentY += this.lineHeight;
        this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
        this.currentY += 2;
        this.setMontserratFont('normal');
      }
      
      // Truncate text to fit columns
      const docName = attachment.documentName || 'Documento sem nome';
      const fileName = attachment.fileName || attachment.originalName || 'Arquivo sem nome';
      this.pdf.text(docName.substring(0, 20), this.margin, this.currentY);
      this.pdf.text(fileName.substring(0, 18), this.margin + 50, this.currentY);
      this.pdf.text(this.getFileTypeDisplay(attachment.fileType || ''), this.margin + 100, this.currentY);
      this.pdf.text(fileManager.formatFileSize(attachment.fileSize || 0), this.margin + 130, this.currentY);
      
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

export const generateMeetingReportForMeeting = async (meeting: MeetingMetadata): Promise<void> => {
  const generator = new PDFReportGenerator();
  await generator.generateComprehensiveReport(meeting);
};

export const generateReportForMultipleMeetings = async (meetings: MeetingMetadata[]): Promise<void> => {
  const generator = new PDFReportGenerator();
  await generator.generateReportForMultipleMeetings(meetings);
};