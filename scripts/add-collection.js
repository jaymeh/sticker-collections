#!/usr/bin/env node
/**
 * Interactive script to add a new sticker collection.
 * Prompts for collection metadata, organizes by sections, generates JSON.
 * Usage: node scripts/add-collection.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

async function main() {
  console.log('\n📋 Sticker Collection Creator\n');

  // Gather metadata
  const brand = await prompt('Brand (e.g., Panini, Topps, Merlin): ');
  const year = await prompt('Release year (e.g., 2026): ');
  const name = await prompt('Collection name (e.g., FIFA World Cup 2026™): ');
  const description = await prompt('Short description (1–2 sentences): ');
  const coverColorInput = await prompt('Cover color hex (e.g., #003087): ');

  // Validate hex
  if (!/^#[0-9A-Fa-f]{6}$/.test(coverColorInput)) {
    console.error('❌ Invalid hex color. Must be #RRGGBB.');
    rl.close();
    process.exit(1);
  }

  // Generate slug
  const slug = slugify(name);
  const collectionPath = path.join(ROOT, slug);

  if (fs.existsSync(collectionPath)) {
    console.error(`❌ Folder "${slug}" already exists.`);
    rl.close();
    process.exit(1);
  }

  // Sections
  console.log('\n📚 Define sections (leave blank to finish):\n');
  const sections = [];
  let sectionCount = 1;

  while (true) {
    const sectionName = await prompt(`Section ${sectionCount} name (or press Enter to finish): `);
    if (!sectionName) break;

    const stickerCountStr = await prompt(`Number of stickers in this section: `);
    const stickerCount = parseInt(stickerCountStr, 10);
    if (isNaN(stickerCount) || stickerCount < 1) {
      console.log('⚠️  Invalid count. Skipping.');
      continue;
    }

    sections.push({
      id: slugify(sectionName),
      name: sectionName,
      stickerCount,
    });

    sectionCount++;
  }

  // Special: offer Coca-Cola section for CC stickers
  const addCCSection = await prompt('\nInclude Coca-Cola promotional stickers section? (y/n): ');
  if (addCCSection.toLowerCase() === 'y') {
    sections.push({
      id: 'coca-cola',
      name: 'Coca-Cola Promotional Stickers',
      stickerCount: 12,
      note: 'Available July 15 – Dec 31, 2026',
    });
  }

  if (sections.length === 0) {
    console.error('❌ No sections defined.');
    rl.close();
    process.exit(1);
  }

  // Generate collection JSON
  const totalStickers = sections.reduce((sum, s) => sum + s.stickerCount, 0);
  const stickers = [];
  let stickerIndex = 0;

  sections.forEach((section, sectionIdx) => {
    const sectionStickers = [];
    for (let i = 0; i < section.stickerCount; i++) {
      const num = String(stickerIndex + 1).padStart(3, '0');
      sectionStickers.push({
        number: String(stickerIndex + 1),
        id: `${slug.substring(0, 4).toUpperCase()}-${num}`,
      });
      stickerIndex++;
    }
    stickers.push({ ...section, stickers: sectionStickers });
  });

  const collection = {
    id: slug,
    name,
    publisher: brand,
    year: parseInt(year, 10),
    description,
    coverColor: coverColorInput,
    sections: stickers,
  };

  // Write JSON
  fs.mkdirSync(collectionPath, { recursive: true });
  const jsonPath = path.join(collectionPath, `${slug}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(collection, null, 2) + '\n');

  console.log(`\n✅ Created collection JSON: ${jsonPath}`);
  console.log(`📁 Folder: ${collectionPath}`);
  console.log(`📊 Total stickers: ${totalStickers} across ${sections.length} sections\n`);
  console.log('Next steps:');
  console.log(`  1. Add cover image: ${slug}.jpg (max 400px wide, under 100KB)`);
  console.log(`  2. Edit sticker names/details in the JSON as needed`);
  console.log(`  3. Run: node scripts/validate.js\n`);

  rl.close();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  rl.close();
  process.exit(1);
});
