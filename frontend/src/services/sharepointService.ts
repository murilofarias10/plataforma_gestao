import * as XLSX from 'xlsx';
import { API_BASE_URL } from '@/lib/api-config';

export interface ExcelDocument {
  Documento: string;
  Status: string;
  Disciplina: string;
  Data_baseline: string | number | Date;
  Data_projetado: string | number | Date;
  Data_avancado: string | number | Date;
}

export const fetchSharePointExcel = async (url: string): Promise<ExcelDocument[]> => {
  try {
    // We use a backend proxy to avoid CORS issues when fetching directly from SharePoint
    // API_BASE_URL handles both local development and production/HuggingFace environments
    const proxyUrl = `${API_BASE_URL}/api/sharepoint/proxy?url=${encodeURIComponent(url)}`;
    
    console.log('Fetching from SharePoint via Proxy:', proxyUrl);

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Proxy fetch failed:', response.status, errorData);
      throw new Error(errorData.error || `Failed to fetch Excel file via proxy: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    
    // The user mentioned a sheet named 'doc'
    const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'doc') || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
    
    // Map data to ensure it matches our interface and handle potential column name variations
    return jsonData.map(item => ({
      Documento: item.Documento || item.documento || '',
      Status: item.Status || item.status || '',
      Disciplina: item.Disciplina || item.disciplina || '',
      Data_baseline: item.Data_baseline || item.data_baseline || item['Data Baseline'] || null,
      Data_projetado: item.Data_projetado || item.data_projetado || item['Data Projetado'] || null,
      Data_avancado: item.Data_avancado || item.data_avancado || item['Data Avancado'] || null,
    }));
  } catch (error) {
    console.error('Error fetching/parsing SharePoint Excel:', error);
    throw error;
  }
};
