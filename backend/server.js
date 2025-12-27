const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3001;

// Persistent storage path - defaults to current directory
// On Hugging Face Spaces, set this to /data if persistent storage is enabled
const DATA_DIR = process.env.STORAGE_PATH || __dirname;

// In-memory storage for projects and documents (in production, use a real database)
let projectsData = [];
let documentsData = [];
let nextProjectId = 1;
let nextDocumentId = 1;

// Load existing data from file if it exists
const dataFilePath = path.join(DATA_DIR, 'data.json');
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

// Ensure uploads directory exists in the data directory
const uploadsBaseDir = path.join(DATA_DIR, 'uploads');
fs.ensureDirSync(uploadsBaseDir);
fs.ensureDirSync(path.join(uploadsBaseDir, 'temp'));

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
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// Endpoint to download and cache Montserrat fonts
app.get('/api/fonts/montserrat/:variant', async (req, res) => {
  try {
    const { variant } = req.params; // 'regular' or 'bold'
    const fontsDir = path.join(__dirname, 'fonts');
    await fs.ensureDir(fontsDir);
    
    const fontFileName = variant === 'bold' ? 'Montserrat-Bold.ttf' : 'Montserrat-Regular.ttf';
    const fontPath = path.join(fontsDir, fontFileName);
    
    // Check if font already exists
    if (fs.existsSync(fontPath)) {
      console.log(`[Fonts] Serving cached font: ${fontFileName}`);
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Content-Type', 'font/ttf');
      res.set('Cache-Control', 'public, max-age=31536000');
      return res.sendFile(fontPath);
    }
    
    // Download font from CDN
    console.log(`[Fonts] Downloading ${fontFileName} from CDN...`);
    // Use multiple reliable sources for TTF files
    const fontUrls = variant === 'bold' 
      ? [
          // Bunny Fonts (privacy-friendly Google Fonts alternative)
          'https://fonts.bunny.net/montserrat/files/montserrat-latin-700-normal.ttf',
          // db-fonts CDN
          'https://db.onlinewebfonts.com/t/157c6cc36dd65b1b2adc9e7f3329c761.ttf',
          // Fallback to GitHub
          'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf'
        ]
      : [
          // Bunny Fonts (privacy-friendly Google Fonts alternative)
          'https://fonts.bunny.net/montserrat/files/montserrat-latin-400-normal.ttf',
          // db-fonts CDN
          'https://db.onlinewebfonts.com/t/8f0f6e5f43f60e29e5dcb26c062c7bb9.ttf',
          // Fallback to GitHub
          'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Regular.ttf'
        ];
    
    let fontBuffer = null;
    for (const url of fontUrls) {
      try {
        const https = require('https');
        const http = require('http');
        const protocol = url.startsWith('https') ? https : http;
        
        fontBuffer = await new Promise((resolve, reject) => {
          protocol.get(url, (response) => {
            if (response.statusCode === 200) {
              const chunks = [];
              response.on('data', chunk => chunks.push(chunk));
              response.on('end', () => resolve(Buffer.concat(chunks)));
            } else {
              reject(new Error(`HTTP ${response.statusCode}`));
            }
          }).on('error', reject);
        });
        
        console.log(`[Fonts] ✓ Downloaded from ${url}`);
        break;
      } catch (error) {
        console.log(`[Fonts] ✗ Failed to download from ${url}:`, error.message);
      }
    }
    
    if (!fontBuffer) {
      return res.status(404).json({ success: false, error: 'Could not download font from any CDN' });
    }
    
    // Save font to disk
    await fs.writeFile(fontPath, fontBuffer);
    console.log(`[Fonts] ✓ Saved ${fontFileName} to disk`);
    
    // Send font to client
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'font/ttf');
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(fontBuffer);
    
  } catch (error) {
    console.error('[Fonts] Error serving font:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve font files for PDF generation (static files)
app.use('/fonts', express.static(path.join(__dirname, 'fonts'), {
  setHeaders: (res, path) => {
    // Allow CORS for fonts and cache them since they don't change
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  }
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // For multipart/form-data, body fields might not be available yet
    // We'll use a temporary directory and move files later
    const tempPath = path.join(DATA_DIR, 'uploads', 'temp');
    
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
    const finalDir = path.join(DATA_DIR, 'uploads', projectId, documentId);
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
    const finalDir = path.join(DATA_DIR, 'uploads', projectId, 'report-images');
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
    
    // Find the document to get its attachments with the correct file paths
    const document = documentsData.find(d => d.id === documentId && d.projectId === projectId);
    
    if (!document || !document.attachments || document.attachments.length === 0) {
      return res.json({
        success: true,
        files: []
      });
    }

    // Build file list from document's attachments
    // This ensures we use the actual file paths from attachments, not assuming current documentId
    const fileList = [];
    
    for (const attachment of document.attachments) {
      try {
        // Extract the actual file location from the attachment's filePath
        // filePath format: /uploads/{projectId}/{documentId}/{filename}
        const pathParts = attachment.filePath.split('/').filter(p => p);
        
        if (pathParts.length < 4) {
          console.warn(`Invalid filePath format: ${attachment.filePath}`);
          continue;
        }
        
        const fileProjectId = pathParts[1];
        const fileDocumentId = pathParts[2];
        const filename = pathParts[3];
        
        // Build the actual file path on disk
        const diskPath = path.join(DATA_DIR, 'uploads', fileProjectId, fileDocumentId, filename);
        
        // Check if file exists
        if (await fs.pathExists(diskPath)) {
          const stats = await fs.stat(diskPath);
          
          fileList.push({
            fileName: attachment.fileName || attachment.originalName || filename,
            serverFileName: filename,
            fileSize: attachment.fileSize || stats.size,
            uploadedAt: attachment.uploadedAt || stats.mtime.toISOString(),
            filePath: attachment.filePath
          });
        } else {
          console.warn(`File not found on disk: ${diskPath}`);
        }
      } catch (error) {
        console.error(`Error processing attachment:`, error);
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
    const filePath = path.join(DATA_DIR, 'uploads', projectId, documentId, filename);
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Get original filename - prioritize query parameter, then lookup in document
    let originalFileName = req.query.originalName || filename; // Use query param if provided
    
    // If no query param, try to find the document to get the original filename
    if (!req.query.originalName) {
      const document = documentsData.find(d => d.id === documentId && d.projectId === projectId);
      
      if (document && document.attachments) {
        const attachment = document.attachments.find((att) => {
          const serverFileName = att.filePath.split('/').pop();
          return serverFileName === filename;
        });
        if (attachment) {
          originalFileName = attachment.fileName || attachment.originalName || filename;
        }
      }
    }

    // Set headers to force download with original filename
    // Use RFC 6266 encoding for proper international filename support
    const encodedFileName = encodeURIComponent(originalFileName);
    res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"; filename*=UTF-8''${encodedFileName}`);
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

// Copy file endpoint - copies file from one document folder to another
app.post('/api/files/copy', async (req, res) => {
  try {
    const { sourceProjectId, sourceDocumentId, targetProjectId, targetDocumentId, filename, originalFileName } = req.body;
    
    if (!sourceProjectId || !sourceDocumentId || !targetProjectId || !targetDocumentId || !filename) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const sourcePath = path.join(DATA_DIR, 'uploads', sourceProjectId, sourceDocumentId, filename);
    const targetDir = path.join(DATA_DIR, 'uploads', targetProjectId, targetDocumentId);
    const targetPath = path.join(targetDir, filename);
    
    console.log('============================================');
    console.log('[Copy File] REQUEST:', {
      sourceProjectId,
      sourceDocumentId,
      targetProjectId,
      targetDocumentId,
      filename,
      originalFileName
    });
    console.log(`[Copy File] Source: ${sourcePath}`);
    console.log(`[Copy File] Target: ${targetPath}`);
    
    // Check if source file exists
    const sourceExists = await fs.pathExists(sourcePath);
    console.log(`[Copy File] Source exists: ${sourceExists}`);
    
    if (!sourceExists) {
      console.error(`[Copy File] ❌ ERROR: Source file NOT FOUND`);
      console.log('============================================');
      return res.status(404).json({
        success: false,
        error: `Source file not found: ${sourceProjectId}/${sourceDocumentId}/${filename}`
      });
    }
    
    console.log(`[Copy File] ✓ Source file exists, proceeding with copy`);
    
    // Create target directory
    await fs.ensureDir(targetDir);
    console.log(`[Copy File] ✓ Target directory ensured: ${targetDir}`);
    
    // Copy file to target location
    await fs.copy(sourcePath, targetPath);
    console.log(`[Copy File] ✓ File copied successfully`);
    
    const stats = await fs.stat(targetPath);
    console.log(`[Copy File] ✓ Target file size: ${stats.size} bytes`);
    console.log('============================================');
    
    res.json({
      success: true,
      message: 'File copied successfully',
      filePath: `/uploads/${targetProjectId}/${targetDocumentId}/${filename}`,
      fileName: originalFileName || filename,
      fileSize: stats.size
    });

  } catch (error) {
    console.error('Copy file error:', error);
    res.status(500).json({
      success: false,
      error: 'Error copying file'
    });
  }
});

// Delete file endpoint
app.delete('/api/files/:projectId/:documentId/:filename', async (req, res) => {
  try {
    const { projectId, documentId, filename } = req.params;
    const filePath = path.join(DATA_DIR, 'uploads', projectId, documentId, filename);
    
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

// View file endpoint - forces inline display
app.get('/api/view/:projectId/:documentId/:filename', async (req, res) => {
  try {
    const { projectId, documentId, filename } = req.params;
    const filePath = path.join(DATA_DIR, 'uploads', projectId, documentId, filename);
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Explicitly set Content-Type for Office documents to help browser viewers
    const extension = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif'
    };

    if (mimeTypes[extension]) {
      res.setHeader('Content-Type', mimeTypes[extension]);
    }

    // Set headers to force inline viewing
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the file
    res.sendFile(path.resolve(filePath));

  } catch (error) {
    console.error('View file error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao visualizar arquivo'
    });
  }
});

// Endpoint to save all data at once
app.post('/api/save-all', (req, res) => {
  try {
    const { projects, documents } = req.body;
    
    if (projects && Array.isArray(projects)) {
      projectsData = projects;
      console.log(`[save-all] Updated projectsData: ${projectsData.length} items`);
    }
    
    if (documents && Array.isArray(documents)) {
      documentsData = documents;
      console.log(`[save-all] Updated documentsData: ${documentsData.length} items`);
    }
    
    // Update next IDs
    if (projectsData.length > 0) {
      nextProjectId = Math.max(...projectsData.map(p => parseInt(p.id) || 0), 0) + 1;
    }
    if (documentsData.length > 0) {
      nextDocumentId = Math.max(...documentsData.map(d => parseInt(d.id) || 0), 0) + 1;
    }
    
    saveData();
    
    res.json({
      success: true,
      message: 'All data saved successfully'
    });
  } catch (error) {
    console.error('Save all error:', error);
    res.status(500).json({
      success: false,
      error: 'Error saving all data'
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
  console.log(`📁 Uploads directory: ${path.join(DATA_DIR, 'uploads')}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;