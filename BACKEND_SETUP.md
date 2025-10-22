# Backend Setup and Test Script

## Instructions

1. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the Backend Server:**
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

3. **Test the API:**
   - Health check: `http://localhost:3001/api/health`
   - Upload endpoint: `POST http://localhost:3001/api/upload`
   - List files: `GET http://localhost:3001/api/files/:projectId/:documentId`
   - Delete file: `DELETE http://localhost:3001/api/files/:projectId/:documentId/:filename`

## File Structure Created

```
backend/
├── uploads/                    # Directory for uploaded files
│   ├── project-123/           # Project-specific folders
│   │   └── document-456/       # Document-specific folders
│   │       └── files...       # Actual uploaded files
│   └── project-456/
│       └── document-789/
│           └── files...
├── server.js                  # Express server with file upload API
├── package.json              # Backend dependencies
└── README.md                 # Backend documentation
```

## API Endpoints

### POST /api/upload
- **Body**: `multipart/form-data`
- **Fields**: 
  - `files`: Array of files to upload
  - `projectId`: Project identifier
  - `documentId`: Document identifier
- **Response**: Array of uploaded file metadata

### GET /api/files/:projectId/:documentId
- **Response**: List of files for the specified project/document

### DELETE /api/files/:projectId/:documentId/:filename
- **Response**: Success/error message

## Frontend Integration

The frontend `fileManager` service has been updated to:
- Send files to `http://localhost:3001/api/upload`
- Load files from `http://localhost:3001/api/files/:projectId/:documentId`
- Delete files via `http://localhost:3001/api/files/:projectId/:documentId/:filename`
- Download files from `http://localhost:3001/uploads/:projectId/:documentId/:filename`

## File Validation

- **Allowed types**: PDF, Excel (.xls, .xlsx), Word (.doc, .docx), PNG, JPEG
- **Max file size**: 10MB per file
- **Max files per request**: 5 files

## Next Steps

1. Start the backend server
2. Test file uploads from the frontend
3. Verify files are saved in the correct directory structure
4. Test file downloads and deletions
