# Services

This directory contains service classes and utilities for the application.

## File Manager Service

The `FileManagerService` handles file uploads, folder structure management, and file organization for the Project Tracker.

### Features

- **Hierarchical Folder Structure**: Organizes files by project and document
  - Structure: `projects/{projectId}/documents/{documentId}/{fileName}`
- **File Validation**: Supports PDF, Excel, and Word files up to 10MB
- **File Upload Management**: Handles drag & drop and click-to-upload
- **File Metadata Storage**: Tracks file information in localStorage
- **File Operations**: Upload, remove, and download functionality

### Usage

```typescript
import { fileManager } from '@/services/fileManager';

// Upload a file
const result = await fileManager.uploadFile(file, projectId, documentId);

// Get document attachments
const attachments = fileManager.getDocumentAttachments(projectId, documentId);

// Remove an attachment
const success = fileManager.removeAttachment(projectId, documentId, attachmentId);
```

### Supported File Types

- **PDF**: `application/pdf`
- **Excel**: `.xls`, `.xlsx`
- **Word**: `.doc`, `.docx`
- **Images**: `.png`, `.jpeg`, `.jpg`

### File Size Limit

Maximum file size: 10MB

### Storage

Currently uses localStorage for file metadata. In a production environment, this would be replaced with:
- Cloud storage (AWS S3, Google Cloud Storage, etc.)
- Database storage for metadata
- Server-side file management

### Folder Structure Example

```
projects/
├── project-123/
│   └── documents/
│       ├── doc-456/
│       │   ├── document.pdf
│       │   ├── spreadsheet.xlsx
│       │   ├── report.docx
│       │   └── diagram.png
│       └── doc-789/
│           ├── drawing.pdf
│           └── photo.jpeg
└── project-456/
    └── documents/
        └── doc-101/
            └── specification.pdf
```
