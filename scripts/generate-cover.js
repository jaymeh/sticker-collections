#!/usr/bin/env node
/**
 * Generate a cover image thumbnail for a collection.
 * Creates a JPG (400×530, 0.755 aspect) with the collection name, year, and publisher
 * overlaid on the cover color. Text padding accounts for list-thumbnail horizontal crop.
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

// Matches app thumbnail / hero crop (COVER_W / 0.755 in Haulseum).
const COVER_ASPECT = 0.755;
const WIDTH = 400;
const HEIGHT = Math.round(WIDTH / COVER_ASPECT);

// List thumbnail uses a taller container (thumbH + overflow), so cover mode crops the sides.
const THUMB_W = 80;
const THUMB_OVERFLOW = 14;

function horizontalCropPad(imageW, imageH, containerW, containerH) {
  const scaledW = imageW * (containerH / imageH);
  if (scaledW <= containerW) return 0;
  const cropEachSide = ((scaledW - containerW) / 2) * (imageW / scaledW);
  return Math.ceil(cropEachSide) + 4;
}

const thumbH = Math.round(THUMB_W / COVER_ASPECT);
const thumbContainerH = thumbH + THUMB_OVERFLOW * 2;
const TITLE_PAD_X = horizontalCropPad(WIDTH, HEIGHT, THUMB_W, thumbContainerH);

// Layout tuned for the visible frame — keep text inside the crop-safe band.
const ACCENT_TOP = 24;
const ACCENT_BOTTOM = 28;
const TITLE_FONT_SIZE = 34;
const TITLE_LINE_HEIGHT = 38;
const META_PUBLISHER_SIZE = 18;
const META_YEAR_SIZE = 22;
const META_GAP = 6;
const META_BOTTOM_PAD = 36;

// Generate using Canvas
try {
  const { createCanvas } = require('canvas');

  const width = WIDTH;
  const height = HEIGHT;
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

  // Top and bottom accent bars (inside the visible frame)
  ctx.fillRect(0, 0, width, ACCENT_TOP);
  ctx.fillRect(0, height - ACCENT_BOTTOM, width, ACCENT_BOTTOM);

  // Text color
  ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';

  // Draw text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Collection name — compact band so long titles stay in frame
  ctx.font = `bold ${TITLE_FONT_SIZE}px Futura`;
  const maxNameWidth = width - TITLE_PAD_X * 2;

  // Wrap long names
  const words = collection.name.split(' ');
  let line = '';
  const lines = [];
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

  const titleBlockHeight = lines.length * TITLE_LINE_HEIGHT;
  const metaBlockHeight = META_PUBLISHER_SIZE + META_GAP + META_YEAR_SIZE;
  const titleTop = ACCENT_TOP + 20;
  const titleBottomLimit = height - ACCENT_BOTTOM - META_BOTTOM_PAD - metaBlockHeight - 16;
  const titleStartY =
    titleTop +
    Math.max(0, (titleBottomLimit - titleTop - titleBlockHeight) / 2) +
    TITLE_LINE_HEIGHT / 2;

  let currentY = titleStartY;
  lines.forEach((textLine) => {
    ctx.fillText(textLine, width / 2, currentY);
    currentY += TITLE_LINE_HEIGHT;
  });

  // Publisher + year anchored above the bottom accent
  const yearY = height - ACCENT_BOTTOM - META_BOTTOM_PAD;
  const publisherY = yearY - META_GAP - META_YEAR_SIZE / 2 - META_PUBLISHER_SIZE / 2;

  ctx.font = `bold ${META_PUBLISHER_SIZE}px Futura`;
  ctx.fillText(`${collection.publisher}`, width / 2, publisherY);

  ctx.font = `bold ${META_YEAR_SIZE}px Futura`;
  ctx.fillText(`${collection.year}`, width / 2, yearY);

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
