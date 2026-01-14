require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001; // Default to 3001 for local, HF will provide PORT=7860

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'meetings_files_folder';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files (if they exist in 'public' folder)
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running with Supabase',
    timestamp: new Date().toISOString()
  });
});

// Projects API endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const normalizedProjects = data.map(project => ({
      ...project,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      meetings: Array.isArray(project.meetings) ? project.meetings : [],
      reportSettings: project.report_settings || { images: [] }
    }));

    res.json({
      success: true,
      projects: normalizedProjects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, error: 'Error fetching projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    // Get next ID
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id');
    
    let nextId = "1";
    if (allProjects && allProjects.length > 0) {
      const ids = allProjects.map(p => parseInt(p.id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        nextId = (Math.max(...ids) + 1).toString();
      }
    }

    const newProject = {
      id: nextId,
      name,
      description: description || '',
      meetings: [],
      report_settings: { images: [] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      project: {
        ...data,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        reportSettings: data.report_settings
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: 'Error creating project' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, meetings, reportSettings } = req.body;

    const updates = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (meetings !== undefined) updates.meetings = meetings;
    if (reportSettings !== undefined) updates.report_settings = reportSettings;

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      project: {
        ...data,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        reportSettings: data.report_settings
      }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: 'Error updating project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: 'Error deleting project' });
  }
});

// Documents API endpoints
app.get('/api/projects/:projectId/documents', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;

    const documents = data.map(doc => ({
      ...doc.data,
      id: doc.id,
      projectId: doc.project_id,
      numeroItem: doc.numero_item,
      attachments: doc.attachments || [],
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    }));

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, error: 'Error fetching documents' });
  }
});

app.post('/api/projects/:projectId/documents', async (req, res) => {
  try {
    const { projectId } = req.params;
    const documentData = req.body;

    // Get next ID
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id');
    
    let nextId = "1";
    if (allDocs && allDocs.length > 0) {
      const ids = allDocs.map(d => parseInt(d.id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        nextId = (Math.max(...ids) + 1).toString();
      }
    }

    const { id, projectId: pId, numeroItem, attachments, createdAt, updatedAt, ...rest } = documentData;

    const newDocument = {
      id: nextId,
      project_id: projectId,
      numero_item: Number.isFinite(parseInt(numeroItem, 10)) ? parseInt(numeroItem, 10) : 1,
      attachments: attachments || [],
      data: rest,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('documents')
      .insert(newDocument)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      document: {
        ...data.data,
        id: data.id,
        projectId: data.project_id,
        numeroItem: data.numero_item,
        attachments: data.attachments,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ success: false, error: 'Error creating document' });
  }
});

app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { id: docId, projectId, numeroItem, attachments, createdAt, updatedAt, ...rest } = updates;

    const dbUpdates = {
      updated_at: new Date().toISOString()
    };
    if (numeroItem !== undefined) dbUpdates.numero_item = numeroItem;
    if (attachments !== undefined) dbUpdates.attachments = attachments;
    if (Object.keys(rest).length > 0) dbUpdates.data = rest;

    const { data, error } = await supabase
      .from('documents')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      document: {
        ...data.data,
        id: data.id,
        projectId: data.project_id,
        numeroItem: data.numero_item,
        attachments: data.attachments,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ success: false, error: 'Error updating document' });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ success: false, error: 'Error deleting document' });
  }
});

// Maintenance: Renumber numeroItem sequentially for a project
app.post('/api/projects/:projectId/renumber', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get docs of project
    const { data: docs, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId);

    if (fetchError) throw fetchError;

    // Sort by current numeroItem (numeric), then createdAt, then id
    const sortedDocs = docs
      .filter(d => d.data.isCleared !== true)
      .sort((a, b) => {
        const an = parseInt(a.numero_item, 10);
        const bn = parseInt(b.numero_item, 10);
        if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
        const ad = new Date(a.created_at).getTime();
        const bd = new Date(b.created_at).getTime();
        if (ad !== bd) return ad - bd;
        return (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0);
      });

    // Assign sequential numbers and update
    const updates = sortedDocs.map((d, idx) => ({
      id: d.id,
      numero_item: idx + 1,
      updated_at: new Date().toISOString()
    }));

    for (const update of updates) {
      await supabase.from('documents').update(update).eq('id', update.id);
    }

    // Return the updated list
    const { data: updatedDocs } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId);

    res.json({ 
      success: true, 
      documents: updatedDocs.map(doc => ({
        ...doc.data,
        id: doc.id,
        projectId: doc.project_id,
        numeroItem: doc.numero_item,
        attachments: doc.attachments,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }))
    });
  } catch (error) {
    console.error('Renumber error:', error);
    res.status(500).json({ success: false, error: 'Error renumbering documents' });
  }
});

// Configure multer for temp file handling before Supabase upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  }
});

// File upload endpoint
app.post('/api/upload', upload.array('files', 5), async (req, res) => {
  try {
    const { projectId, documentId } = req.body;
    
    if (!projectId || !documentId) {
      return res.status(400).json({ success: false, error: 'Project ID and Document ID are required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo foi enviado' });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(file.originalname);
      const filename = `${timestamp}-${randomString}${extension}`;
      const storagePath = `${projectId}/${documentId}/${filename}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) throw error;

      const fileId = `${documentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      uploadedFiles.push({
        id: fileId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        filePath: `/uploads/${projectId}/${documentId}/${filename}`,
        originalName: file.originalname
      });
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso!`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Erro ao fazer upload dos arquivos' });
  }
});

// Report images upload endpoint
app.post('/api/projects/:projectId/report-images', upload.single('image'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { imageId } = req.body;
    
    if (!projectId || !imageId) {
      return res.status(400).json({ success: false, error: 'Project ID and Image ID are required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem foi enviada' });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${req.file.originalname}`;
    const storagePath = `${projectId}/report-images/${filename}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Imagem enviada com sucesso!',
      filePath: `/uploads/${projectId}/report-images/${filename}`,
      fileName: req.file.originalname
    });

  } catch (error) {
    console.error('Report image upload error:', error);
    res.status(500).json({ success: false, error: 'Erro ao fazer upload da imagem' });
  }
});

// Get files for a specific project/document
app.get('/api/files/:projectId/:documentId', async (req, res) => {
  try {
    const { projectId, documentId } = req.params;
    
    const { data: document, error } = await supabase
      .from('documents')
      .select('attachments')
      .eq('id', documentId)
      .single();
    
    if (error || !document || !document.attachments || document.attachments.length === 0) {
      return res.json({ success: true, files: [] });
    }

    res.json({
      success: true,
      files: document.attachments.map(att => ({
        fileName: att.fileName || att.originalName,
        fileSize: att.fileSize,
        uploadedAt: att.uploadedAt,
        filePath: att.filePath
      }))
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar arquivos' });
  }
});

// Helper for download/view
async function handleFileRequest(req, res, isDownload) {
  try {
    const { projectId, documentId, filename } = req.params;
    
    // Special case for report images
    const isReportImage = documentId === 'report-images';
    const storagePath = isReportImage ? `${projectId}/report-images/${filename}` : `${projectId}/${documentId}/${filename}`;

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) throw error;

    // Redirect to Supabase signed URL
    res.redirect(data.signedUrl);
  } catch (error) {
    console.error('File request error:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar arquivo' });
  }
}

// Download/View file endpoints
app.get('/api/download/:projectId/:documentId/:filename', (req, res) => handleFileRequest(req, res, true));
app.get('/api/view/:projectId/:documentId/:filename', (req, res) => handleFileRequest(req, res, false));

// Support for legacy /uploads path if needed (static redirect)
app.get('/uploads/:projectId/:documentId/:filename', (req, res) => handleFileRequest(req, res, false));

// Copy file endpoint
app.post('/api/files/copy', async (req, res) => {
  try {
    const { sourceProjectId, sourceDocumentId, targetProjectId, targetDocumentId, filename, originalFileName } = req.body;
    
    const sourcePath = `${sourceProjectId}/${sourceDocumentId}/${filename}`;
    const targetPath = `${targetProjectId}/${targetDocumentId}/${filename}`;
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .copy(sourcePath, targetPath);

    if (error) throw error;
    
    res.json({
      success: true,
      message: 'File copied successfully',
      filePath: `/uploads/${targetProjectId}/${targetDocumentId}/${filename}`,
      fileName: originalFileName || filename
    });
  } catch (error) {
    console.error('Copy file error:', error);
    res.status(500).json({ success: false, error: 'Error copying file' });
  }
});

// Delete file endpoint
app.delete('/api/files/:projectId/:documentId/:filename', async (req, res) => {
  try {
    const { projectId, documentId, filename } = req.params;
    const storagePath = `${projectId}/${documentId}/${filename}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) throw error;
    
    res.json({ success: true, message: 'Arquivo removido com sucesso' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ success: false, error: 'Erro ao remover arquivo' });
  }
});

// SharePoint Proxy
app.get('/api/sharepoint/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    console.log(`[SharePoint Proxy] Input URL: ${url}`);

    let downloadUrl = url;
    
    // Transform SharePoint sharing link to direct download link
    // Pattern: https://tenant.sharepoint.com/:x:/g/personal/user/token?rtime=...
    // Target: https://tenant.sharepoint.com/personal/user/_layouts/15/download.aspx?share=token
    if (url.includes('sharepoint.com') && url.includes('/personal/')) {
      try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/');
        
        // Find 'personal' in the path
        const personalIndex = parts.indexOf('personal');
        if (personalIndex !== -1 && parts.length > personalIndex + 2) {
          const tenantUrl = `${urlObj.protocol}//${urlObj.host}`;
          const userPath = parts[personalIndex + 1];
          const token = parts[personalIndex + 2];
          
          downloadUrl = `${tenantUrl}/personal/${userPath}/_layouts/15/download.aspx?share=${token}`;
          console.log(`[SharePoint Proxy] Transformed to Direct Download: ${downloadUrl}`);
        }
      } catch (e) {
        console.warn('[SharePoint Proxy] Transformation failed, using original with download=1:', e.message);
        if (url.includes('?')) {
          downloadUrl = url.includes('download=1') ? url : `${url}&download=1`;
        } else {
          downloadUrl = `${url}?download=1`;
        }
      }
    }

    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      maxRedirects: 5
    });

    console.log(`[SharePoint Proxy] Download Success: ${response.status}, Content-Type: ${response.headers['content-type']}`);

    // Check if we actually got an HTML page instead of the Excel file
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('[SharePoint Proxy] Error: Received HTML instead of Excel file. Possibly a login page or redirect.');
      return res.status(403).json({ 
        success: false, 
        error: 'SharePoint returned an HTML page. Please ensure the link is shared with "Anyone with the link".' 
      });
    }

    res.setHeader('Content-Type', contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(response.data);

  } catch (error) {
    console.error('[SharePoint Proxy] Error:', error.message);
    if (error.response) {
      return res.status(error.response.status).json({ 
        success: false, 
        error: `SharePoint returned ${error.response.status}: ${error.message}` 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// SPA fallback - serve index.html for all non-API GET routes
app.get("*", (req, res, next) => {
  if (!req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
    const indexPath = path.join(__dirname, "public", "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ success: false, error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} with Supabase`);
});

module.exports = app;
