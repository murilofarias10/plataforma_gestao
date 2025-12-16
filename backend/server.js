const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory storage for projects and documents (in production, use a real database)
let projectsData = [];
let documentsData = [];
let nextProjectId = 1;
let nextDocumentId = 1;

// Load existing data from file if it exists
const dataFilePath = path.join(__dirname, 'data.json');
try {
  if (fs.existsSync(dataFilePath)) {
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    projectsData = data.projects || [];
    documentsData = data.documents || [];
    nextProjectId = Math.max(...projectsData.map(p => parseInt(p.id) || 0), 0) + 1;
    nextDocumentId = Math.max(...documentsData.map(d => parseInt(d.id) || 0), 0) + 1;
  }
} catch (error) {
  console.error('Error loading data file:', error);
}

// Save data to file
const saveData = () => {
  try {
    const dataToSave = {
      projects: projectsData,
      documents: documentsData
    };
    console.log('[saveData] Saving data - Projects count:', projectsData.length);
    fs.writeFileSync(dataFilePath, JSON.stringify(dataToSave, null, 2));
    console.log('[saveData] Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory with no cache
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // For multipart/form-data, body fields might not be available yet
    // We'll use a temporary directory and move files later
    const tempPath = path.join(__dirname, 'uploads', 'temp');
    
    try {
      await fs.ensureDir(tempPath);
      cb(null, tempPath);
    } catch (error) {
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${extension}`;
    cb(null, filename);
  }
});

// Maintenance: Renumber numeroItem sequentially for a project
app.post('/api/projects/:projectId/renumber', (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projectsData.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Get docs of project (ignore cleared) and sort by current numeroItem (numeric), then createdAt, then id
    const projectDocs = documentsData
      .filter(d => d.projectId === projectId && d.isCleared !== true)
      .sort((a, b) => {
        const an = parseInt(a.numeroItem, 10);
        const bn = parseInt(b.numeroItem, 10);
        if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
        const ad = new Date(a.createdAt).getTime();
        const bd = new Date(b.createdAt).getTime();
        if (ad !== bd) return ad - bd;
        return (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0);
      });

    // Assign sequential numbers starting at 1
    projectDocs.forEach((d, idx) => {
      d.numeroItem = idx + 1;
      d.updatedAt = new Date().toISOString();
    });

    saveData();

    return res.json({ success: true, documents: projectDocs });
  } catch (error) {
    console.error('Renumber error:', error);
    return res.status(500).json({ success: false, error: 'Error renumbering documents' });
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use PDF, Excel, Word, PNG ou JPEG.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Arquivo muito grande. Máximo permitido: 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Muitos arquivos. Máximo permitido: 5 arquivos por vez.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Campo de arquivo inesperado.'
      });
    }
  }
  
  if (error.message.includes('Tipo de arquivo não suportado')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
};

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Projects API endpoints
app.get('/api/projects', (req, res) => {
  // Ensure all projects have a meetings array and persist the change
  const normalizedProjects = projectsData.map(project => {
    if (!project.meetings) {
      project.meetings = []; // Add meetings field if missing
    }
    return {
      ...project,
      meetings: Array.isArray(project.meetings) ? project.meetings : []
    };
  });
  
  // Save the normalized data to persist the meetings field
  saveData();
  
  res.json({
    success: true,
    projects: normalizedProjects
  });
});

app.post('/api/projects', (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    const newProject = {
      id: nextProjectId.toString(),
      name,
      description: description || '',
      meetings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projectsData.push(newProject);
    nextProjectId++;
    saveData();

    res.json({
      success: true,
      project: newProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating project'
    });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, meetings, reportSettings } = req.body;

    console.log('[Backend] PUT /api/projects/:id - Request:', { id, name, description, meetings, reportSettings });

    const projectIndex = projectsData.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Ensure meetings array exists
    const currentMeetings = projectsData[projectIndex].meetings || [];
    const updatedMeetings = meetings !== undefined ? meetings : currentMeetings;
    
    // Handle reportSettings update
    const currentReportSettings = projectsData[projectIndex].reportSettings || { images: [] };
    const updatedReportSettings = reportSettings !== undefined ? reportSettings : currentReportSettings;
    
    console.log('[Backend] Current meetings:', currentMeetings);
    console.log('[Backend] Updated meetings:', updatedMeetings);
    console.log('[Backend] Updated report settings:', updatedReportSettings);
    
    projectsData[projectIndex] = {
      ...projectsData[projectIndex],
      name: name || projectsData[projectIndex].name,
      description: description !== undefined ? description : projectsData[projectIndex].description,
      meetings: updatedMeetings,
      reportSettings: updatedReportSettings,
      updatedAt: new Date().toISOString()
    };

    saveData();

    // Ensure the response includes meetings and reportSettings
    const responseProject = {
      ...projectsData[projectIndex],
      meetings: updatedMeetings,
      reportSettings: updatedReportSettings
    };

    console.log('[Backend] Response project:', JSON.stringify(responseProject, null, 2));

    res.json({
      success: true,
      project: responseProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating project'
    });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;

    const projectIndex = projectsData.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Remove project and all its documents
    projectsData.splice(projectIndex, 1);
    documentsData = documentsData.filter(d => d.projectId !== id);
    saveData();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting project'
    });
  }
});

// Documents API endpoints
app.get('/api/projects/:projectId/documents', (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDocuments = documentsData.filter(d => d.projectId === projectId);
    
    res.json({
      success: true,
      documents: projectDocuments
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching documents'
    });
  }
});

app.post('/api/projects/:projectId/documents', (req, res) => {
  try {
    const { projectId } = req.params;
    const documentData = req.body;

    // Check if project exists
    const project = projectsData.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Frontend always sends numeroItem, but provide fallback just in case
    const newDocument = {
      id: nextDocumentId.toString(),
      projectId,
      ...documentData,
      // Use numeroItem from frontend (frontend handles per-meeting numbering)
      numeroItem: Number.isFinite(parseInt(documentData.numeroItem, 10))
        ? parseInt(documentData.numeroItem, 10)
        : 1, // Fallback to 1 if not provided
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    documentsData.push(newDocument);
    nextDocumentId++;
    saveData();

    res.json({
      success: true,
      document: newDocument
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating document'
    });
  }
});

app.put('/api/documents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const documentIndex = documentsData.findIndex(d => d.id === id);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    documentsData[documentIndex] = {
      ...documentsData[documentIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveData();

    res.json({
      success: true,
      document: documentsData[documentIndex]
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating document'
    });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  try {
    const { id } = req.params;

    const documentIndex = documentsData.findIndex(d => d.id === id);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    documentsData.splice(documentIndex, 1);
    saveData();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting document'
    });
  }
});

// File upload endpoint
app.post('/api/upload', upload.array('files', 5), handleMulterError, async (req, res) => {
  try {
    const { projectId, documentId } = req.body;
    
    if (!projectId || !documentId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and Document ID are required'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi enviado'
      });
    }

    // Create the final destination directory
    const finalDir = path.join(__dirname, 'uploads', projectId, documentId);
    await fs.ensureDir(finalDir);

    // Process uploaded files - move from temp to final location
    const uploadedFiles = [];
    
    for (const file of req.files) {
      const finalPath = path.join(finalDir, file.filename);
      
      // Move file from temp to final location
      await fs.move(file.path, finalPath);
      
      const fileId = `${documentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      uploadedFiles.push({
        id: fileId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        filePath: `/uploads/${projectId}/${documentId}/${file.filename}`,
        serverPath: finalPath,
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
    
    // Clean up any temp files if there was an error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.remove(file.path);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao fazer upload dos arquivos'
    });
  }
});

// Report images upload endpoint
app.post('/api/projects/:projectId/report-images', upload.single('image'), handleMulterError, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { imageId } = req.body;
    
    if (!projectId || !imageId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and Image ID are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem foi enviada'
      });
    }

    // Create the final destination directory for report images
    const finalDir = path.join(__dirname, 'uploads', projectId, 'report-images');
    await fs.ensureDir(finalDir);

    // Move file from temp to final location
    const finalPath = path.join(finalDir, req.file.filename);
    await fs.move(req.file.path, finalPath);

    // Return the file path
    const filePath = `/uploads/${projectId}/report-images/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Imagem enviada com sucesso!',
      filePath: filePath,
      fileName: req.file.originalname
    });

  } catch (error) {
    console.error('Report image upload error:', error);
    
    // Clean up temp file if there was an error
    if (req.file) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer upload da imagem'
    });
  }
});

// Get files for a specific project/document
app.get('/api/files/:projectId/:documentId', async (req, res) => {
  try {
    const { projectId, documentId } = req.params;
    const uploadPath = path.join(__dirname, 'uploads', projectId, documentId);
    
    // Check if directory exists
    if (!await fs.pathExists(uploadPath)) {
      return res.json({
        success: true,
        files: []
      });
    }

    // Read directory contents
    const files = await fs.readdir(uploadPath);
    const fileList = [];

    for (const file of files) {
      const filePath = path.join(uploadPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        // Try to find original filename from documents data
        let originalFileName = file;
        const document = documentsData.find(d => d.id === documentId && d.projectId === projectId);
        if (document && document.attachments) {
          const attachment = document.attachments.find((att) => {
            const serverFileName = att.filePath.split('/').pop();
            return serverFileName === file;
          });
          if (attachment) {
            originalFileName = attachment.fileName || attachment.originalName || file;
          }
        }
        
        fileList.push({
          fileName: originalFileName,
          serverFileName: file, // Keep server filename for reference
          fileSize: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          filePath: `/uploads/${projectId}/${documentId}/${file}`
        });
      }
    }

    res.json({
      success: true,
      files: fileList
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar arquivos'
    });
  }
});

// Download file endpoint with proper filename
app.get('/api/download/:projectId/:documentId/:filename', async (req, res) => {
  try {
    const { projectId, documentId, filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', projectId, documentId, filename);
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Find the document to get the original filename
    const document = documentsData.find(d => d.id === documentId && d.projectId === projectId);
    let originalFileName = filename; // Fallback to server filename
    
    if (document && document.attachments) {
      const attachment = document.attachments.find((att) => {
        const serverFileName = att.filePath.split('/').pop();
        return serverFileName === filename;
      });
      if (attachment) {
        originalFileName = attachment.fileName || attachment.originalName || filename;
      }
    }

    // Set headers to force download with original filename
    res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the file
    res.sendFile(path.resolve(filePath));

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao baixar arquivo'
    });
  }
});

// Delete file endpoint
app.delete('/api/files/:projectId/:documentId/:filename', async (req, res) => {
  try {
    const { projectId, documentId, filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', projectId, documentId, filename);
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Delete file
    await fs.remove(filePath);
    
    res.json({
      success: true,
      message: 'Arquivo removido com sucesso'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover arquivo'
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;