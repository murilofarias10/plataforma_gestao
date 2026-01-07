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
    return jsonData.map(item => {
      // Helper to find a value by checking multiple possible key variations
      const findValue = (keys: string[]) => {
        for (const key of keys) {
          if (item[key] !== undefined && item[key] !== null) return item[key];
        }
        // Also try case-insensitive match as a fallback
        const itemKeys = Object.keys(item);
        for (const key of keys) {
          const foundKey = itemKeys.find(ik => ik.toLowerCase() === key.toLowerCase());
          if (foundKey) return item[foundKey];
        }
        return null;
      };

      return {
        Documento: findValue(['Documento', 'documento', 'Doc', 'doc']) || '',
        Status: findValue(['Status', 'status', 'Situação', 'situacao']) || '',
        Disciplina: findValue(['Disciplina', 'disciplina']) || '',
        Data_baseline: findValue(['Data_baseline', 'Data Baseline', 'data_baseline', 'Baseline']),
        Data_projetado: findValue(['Data_projetado', 'Data Projetado', 'data_projetado', 'Projetado', 'Previsto']),
        Data_avancado: findValue(['Data_avancado', 'Data Avancado', 'data_avancado', 'Avancado', 'Avançado', 'Real']),
      };
    });
  } catch (error) {
    console.error('Error fetching/parsing SharePoint Excel:', error);
    throw error;
  }
};
