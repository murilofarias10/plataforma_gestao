const fs = require('fs');
const path = require('path');

try {
  // Read server.js
  const serverPath = path.join(__dirname, 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.error('Error: server.js not found at', serverPath);
    process.exit(1);
  }
  
  let content = fs.readFileSync(serverPath, 'utf8');
  const originalContent = content;

  // 1. Change default port to 7860
  const portPattern = /const PORT = process\.env\.PORT \|\| 3001;/;
  if (portPattern.test(content)) {
    content = content.replace(portPattern, 'const PORT = process.env.PORT || 7860;');
    console.log('✓ Changed default port to 7860');
  } else {
    console.warn('⚠ Port pattern not found, skipping port change');
  }

  // 2. Add static file serving for frontend after CORS middleware
  const corsPattern = /app\.use\(cors\(\)\);/;
  if (corsPattern.test(content) && !content.includes('app.use(express.static(path.join(__dirname, "public")))')) {
    const staticFilesCode = `

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));`;
    content = content.replace(corsPattern, 'app.use(cors());' + staticFilesCode);
    console.log('✓ Added static file serving');
  } else {
    console.warn('⚠ CORS pattern not found or static serving already exists, skipping');
  }

  // 3. Add SPA fallback before 404 handler
  const handlerPattern = /\/\/ 404 handler/;
  if (handlerPattern.test(content) && !content.includes('SPA fallback')) {
    const spaFallbackCode = `

// SPA fallback - serve index.html for all non-API GET routes
app.get("*", (req, res, next) => {
  if (!req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
    const indexPath = path.join(__dirname, "public", "index.html");
    if (require("fs").existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});`;
    content = content.replace(handlerPattern, spaFallbackCode + '\n// 404 handler');
    console.log('✓ Added SPA fallback route');
  } else {
    console.warn('⚠ 404 handler pattern not found or SPA fallback already exists, skipping');
  }

  // Only write if content changed
  if (content !== originalContent) {
    fs.writeFileSync(serverPath, content);
    console.log('✓ Server.js modified successfully for production');
  } else {
    console.log('ℹ No changes needed to server.js');
  }
} catch (error) {
  console.error('Error modifying server.js:', error);
  process.exit(1);
}

