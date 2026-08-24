#!/usr/bin/env node
/**
 * Generate a cover image thumbnail for a collection.
 * Creates a JPG with the collection name, year, and brand overlaid on the cover color.
 *
 * Usage: node scripts/generate-cover.js <collection-slug>
 * Example: node scripts/generate-cover.js fifa-world-cup-2026
 */

const fs = require('fs');
const path = require('path');

const collectionSlug = process.argv[2];

if (!collectionSlug) {
  console.error('Usage: node scripts/generate-cover.js <collection-slug>');
  console.error('Example: node scripts/generate-cover.js fifa-world-cup-2026');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const collectionDir = path.join(ROOT, collectionSlug);
const jsonPath = path.join(collectionDir, `${collectionSlug}.json`);
const outputPath = path.join(collectionDir, `${collectionSlug}.jpg`);

// Check if collection exists
if (!fs.existsSync(jsonPath)) {
  console.error(`❌ Collection not found: ${jsonPath}`);
  process.exit(1);
}

// Parse collection
let collection;
try {
  collection = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
} catch (e) {
  console.error(`❌ Invalid JSON: ${e.message}`);
  process.exit(1);
}

// Validate required fields
if (!collection.name || !collection.year || !collection.publisher || !collection.coverColor) {
  console.error('❌ Collection missing required fields: name, year, publisher, coverColor');
  process.exit(1);
}

// Helper: parse hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Helper: determine if color is dark or light
function isColorDark(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.5;
}

// Generate using Canvas
try {
  const { createCanvas } = require('canvas');

  const width = 400;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background with gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, collection.coverColor);

  // Darken or lighten the color for gradient
  const rgb = hexToRgb(collection.coverColor);
  const darkerHex = `#${Math.max(0, rgb.r - 30).toString(16).padStart(2, '0')}${Math.max(0, rgb.g - 30).toString(16).padStart(2, '0')}${Math.max(0, rgb.b - 30).toString(16).padStart(2, '0')}`;
  gradient.addColorStop(1, darkerHex);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle decorative shapes (minimal, doesn't interfere with text)
  const isDark = isColorDark(collection.coverColor);
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // Top and bottom accent bars
  ctx.fillRect(0, 0, width, 40);
  ctx.fillRect(0, height - 50, width, 50);

  // Text color
  ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';

  // Draw text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Collection name (positioned in middle, centered)
  ctx.font = 'bold 46px Futura';
  const maxNameWidth = width - 120;

  // Wrap long names
  const words = collection.name.split(' ');
  let line = '';
  let lines = [];
  words.forEach((word) => {
    const testLine = line + (line ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxNameWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);

  // Title block positioning
  const titleBlockY = 75;
  const lineHeight = 58;
  let currentY = titleBlockY;

  lines.forEach((textLine) => {
    ctx.fillText(textLine, width / 2, currentY);
    currentY += lineHeight;
  });

  // Brand + Year block positioning (separate block)
  const brandYearBlockY = height - 115;

  ctx.font = 'bold 24px Futura';
  ctx.fillText(`${collection.publisher}`, width / 2, brandYearBlockY);

  ctx.font = 'bold 28px Futura';
  ctx.fillText(`${collection.year}`, width / 2, brandYearBlockY + 38);

  // Save as JPEG
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
  fs.writeFileSync(outputPath, buffer);

  const sizeKB = (buffer.length / 1024).toFixed(1);
  console.log(`✅ Generated cover: ${outputPath}`);
  console.log(`   Size: ${sizeKB} KB (target: <100 KB)`);
  if (buffer.length > 100 * 1024) {
    console.warn('⚠️  Image exceeds 100 KB limit. Consider optimizing.');
  }
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('canvas')) {
    console.error(
      '❌ Canvas library not found. Install it:\n\n' +
      '   npm install canvas\n\n' +
      'On macOS, you may need: brew install pkg-config cairo pango libpng jpeg giflib librsvg'
    );
    process.exit(1);
  }
  console.error(`❌ Error generating cover: ${err.message}`);
  process.exit(1);
}
