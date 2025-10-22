// Test script for file upload API
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    // Create a test file
    const testContent = 'This is a test file for upload';
    fs.writeFileSync('test-file.txt', testContent);
    
    // Create FormData
    const formData = new FormData();
    formData.append('files', fs.createReadStream('test-file.txt'));
    formData.append('projectId', 'test-project-123');
    formData.append('documentId', 'test-document-456');
    
    // Upload file
    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Upload result:', result);
    
    // Clean up test file
    fs.unlinkSync('test-file.txt');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run test
testUpload();
