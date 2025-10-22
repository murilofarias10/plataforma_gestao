const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
        fileList.push({
          fileName: file,
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