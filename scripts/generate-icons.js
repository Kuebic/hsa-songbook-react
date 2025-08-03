import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple SVG icon content for HSA Songbook
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#1d4ed8" rx="24"/>
  <g fill="white">
    <!-- Music note -->
    <circle cx="60" cy="120" r="12"/>
    <rect x="72" y="60" width="4" height="60"/>
    <path d="M76 60 Q86 50 96 60 L96 100 Q86 90 76 100 Z"/>
    
    <!-- Second music note -->
    <circle cx="100" cy="140" r="10"/>
    <rect x="110" y="80" width="3" height="60"/>
    <path d="M113 80 Q120 72 128 80 L128 110 Q120 102 113 110 Z"/>
    
    <!-- Book pages -->
    <rect x="40" y="40" width="80" height="100" fill="none" stroke="white" stroke-width="3" rx="4"/>
    <line x1="60" y1="55" x2="100" y2="55" stroke="white" stroke-width="2"/>
    <line x1="60" y1="70" x2="110" y2="70" stroke="white" stroke-width="2"/>
    <line x1="60" y1="85" x2="95" y2="85" stroke="white" stroke-width="2"/>
    
    <!-- Center line -->
    <line x1="80" y1="40" x2="80" y2="140" stroke="white" stroke-width="1" opacity="0.5"/>
  </g>
</svg>`;

// For now, let's create a simple base64 encoded PNG for development
// In production, you'd want to use proper icon generation tools

const createBase64Icon = (size) => {
  // This is a minimal PNG data URL - in production you'd generate proper icons
  return `data:image/svg+xml;base64,${Buffer.from(svgContent.replace('192', size)).toString('base64')}`;
};

// Create icon files with proper content
const publicDir = path.join(__dirname, '..', 'public');

// Create SVG files
const svg192 = svgContent.replace(/192/g, '192');
const svg512 = svgContent.replace(/192/g, '512');

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.svg'), svg192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.svg'), svg512);

// Convert SVGs to PNGs
async function createPngIcons() {
  try {
    // Create 192x192 PNG
    await sharp(Buffer.from(svg192))
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'pwa-192x192.png'));

    // Create 512x512 PNG  
    await sharp(Buffer.from(svg512))
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'pwa-512x512.png'));

    console.log('PWA icons created successfully: pwa-192x192.png and pwa-512x512.png');
  } catch (error) {
    console.error('Error creating PNG icons:', error);
    
    // Fallback: create simple colored rectangles as PNGs if SVG processing fails
    console.log('Attempting fallback PNG creation...');
    
    await sharp({
      create: {
        width: 192,
        height: 192,
        channels: 4,
        background: { r: 29, g: 78, b: 216, alpha: 1 }
      }
    })
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
    
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 29, g: 78, b: 216, alpha: 1 }
      }
    })
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
    
    console.log('Fallback PNG icons created');
  }
}

createPngIcons();