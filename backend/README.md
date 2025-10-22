# Backend API - File Upload Service

This backend service handles file uploads for the project management platform.

## Features

- ✅ File upload with validation (type and size)
- ✅ Organized folder structure by project and document
- ✅ Static file serving
- ✅ File management (list, delete)
- ✅ CORS enabled for frontend integration
- ✅ Error handling and validation

## API Endpoints

### Health Check
- `GET /api/health` - Check if server is running

### File Upload
- `POST /api/upload` - Upload files
  - Body: `multipart/form-data`
  - Fields: `files` (array), `projectId`, `documentId`
  - Response: Array of uploaded file metadata

### File Management
- `GET /api/files/:projectId/:documentId` - List files for a project/document
- `DELETE /api/files/:projectId/:documentId/:filename` - Delete a specific file

## File Structure

```
backend/
├── uploads/
│   ├── project-123/
│   │   ├── document-456/
│   │   │   ├── 1703123456789-abc123.pdf
│   │   │   └── 1703123456790-def456.xlsx
│   │   └── document-789/
│   │       └── 1703123456791-ghi789.png
│   └── project-456/
│       └── document-101/
│           └── 1703123456792-jkl012.docx
├── server.js
└── package.json
```

## Installation & Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Start the server:
```bash
npm start
# or for development with auto-restart:
npm run dev
```

3. Server will run on `http://localhost:3001`

## File Validation

- **Allowed file types**: PDF, Excel (.xls, .xlsx), Word (.doc, .docx), PNG, JPEG
- **Maximum file size**: 10MB per file
- **Maximum files per request**: 5 files

## Environment Variables

- `PORT`: Server port (default: 3001)

## Frontend Integration

The frontend should send requests to:
- Upload: `POST http://localhost:3001/api/upload`
- List files: `GET http://localhost:3001/api/files/:projectId/:documentId`
- Delete file: `DELETE http://localhost:3001/api/files/:projectId/:documentId/:filename`
- Access files: `http://localhost:3001/uploads/:projectId/:documentId/:filename`
