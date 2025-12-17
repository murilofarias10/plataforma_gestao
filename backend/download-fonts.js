/**
 * One-time script to download Montserrat fonts
 * Run this once: node download-fonts.js
 */

const fs = require('fs-extra');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, 'fonts');

const fonts = [
  {
    name: 'Montserrat-Regular.ttf',
    urls: [
      'https://fonts.bunny.net/montserrat/files/montserrat-latin-400-normal.ttf',
      'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Regular.ttf'
    ]
  },
  {
    name: 'Montserrat-Bold.ttf',
    urls: [
      'https://fonts.bunny.net/montserrat/files/montserrat-latin-700-normal.ttf',
      'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf'
    ]
  }
];

async function downloadFont(font) {
  const fontPath = path.join(fontsDir, font.name);
  
  // Check if already exists
  if (fs.existsSync(fontPath)) {
    console.log(`✓ ${font.name} already exists`);
    return true;
  }
  
  console.log(`Downloading ${font.name}...`);
  
  for (const url of font.urls) {
    try {
      console.log(`  Trying: ${url}`);
      
      const buffer = await new Promise((resolve, reject) => {
        https.get(url, { 
          headers: {
            'User-Agent': 'Mozilla/5.0'
          },
          // Follow redirects
          followRedirect: true
        }, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            console.log(`  Redirected to: ${redirectUrl}`);
            https.get(redirectUrl, (redirectResponse) => {
              if (redirectResponse.statusCode === 200) {
                const chunks = [];
                redirectResponse.on('data', chunk => chunks.push(chunk));
                redirectResponse.on('end', () => resolve(Buffer.concat(chunks)));
              } else {
                reject(new Error(`HTTP ${redirectResponse.statusCode}`));
              }
            }).on('error', reject);
          } else if (response.statusCode === 200) {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
          } else {
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        }).on('error', reject);
      });
      
      await fs.writeFile(fontPath, buffer);
      console.log(`✓ ${font.name} downloaded successfully (${buffer.length} bytes)`);
      return true;
      
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
    }
  }
  
  console.log(`✗ ${font.name} - all sources failed`);
  return false;
}

async function main() {
  console.log('Downloading Montserrat fonts...\n');
  
  // Ensure fonts directory exists
  await fs.ensureDir(fontsDir);
  console.log(`Fonts directory: ${fontsDir}\n`);
  
  // Download each font
  let successCount = 0;
  for (const font of fonts) {
    const success = await downloadFont(font);
    if (success) successCount++;
  }
  
  console.log(`\n${successCount}/${fonts.length} fonts downloaded successfully`);
  
  if (successCount === fonts.length) {
    console.log('\n✓✓✓ All fonts ready! Restart your backend server.');
  } else {
    console.log('\n⚠️ Some fonts failed to download. Check the errors above.');
  }
}

main().catch(console.error);

