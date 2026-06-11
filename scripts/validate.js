#!/usr/bin/env node
// Validates all collection folders in this repo.
// Exit code 0 = all good, 1 = one or more failures.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

const REQUIRED_COLLECTION_FIELDS = ['id', 'name', 'publisher', 'year', 'description', 'coverColor', 'sections'];
const REQUIRED_SECTION_FIELDS = ['id', 'name', 'stickers'];
const REQUIRED_STICKER_FIELDS = ['number'];
const VALID_STICKER_TYPES = ['foil'];

let errors = 0;

function fail(folder, msg) {
  console.error(`  ✗ [${folder}] ${msg}`);
  errors++;
}

function pass(folder, msg) {
  console.log(`  ✓ [${folder}] ${msg}`);
}

const entries = fs.readdirSync(ROOT).filter(f => {
  const full = path.join(ROOT, f);
  return fs.statSync(full).isDirectory()
    && !f.startsWith('.')
    && fs.existsSync(path.join(full, `${f}.json`));
});

if (entries.length === 0) {
  console.error('No collection folders found.');
  process.exit(1);
}

console.log(`Validating ${entries.length} collection(s)...\n`);

for (const folder of entries) {
  const dir = path.join(ROOT, folder);

  // JSON must exist and match folder name
  const jsonPath = path.join(dir, `${folder}.json`);
  if (!fs.existsSync(jsonPath)) {
    fail(folder, `Missing ${folder}.json`);
    continue;
  }

  // Cover image must exist
  const imageFile = fs.readdirSync(dir).find(f => IMAGE_EXTS.includes(path.extname(f).toLowerCase()));
  if (!imageFile) {
    fail(folder, `Missing cover image (expected ${folder}.jpg or similar)`);
  } else {
    const stem = path.basename(imageFile, path.extname(imageFile));
    if (stem !== folder) {
      fail(folder, `Cover image filename "${imageFile}" must match folder name "${folder}"`);
    } else {
      pass(folder, `Cover image: ${imageFile}`);
    }
  }

  // Parse JSON
  let data;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    fail(folder, `Invalid JSON: ${e.message}`);
    continue;
  }

  // Required top-level fields
  for (const field of REQUIRED_COLLECTION_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      fail(folder, `Missing or empty field: "${field}"`);
    }
  }

  // id must match folder name
  if (data.id && data.id !== folder) {
    fail(folder, `"id" field "${data.id}" must match folder name "${folder}"`);
  }

  // year must be a number
  if (data.year !== undefined && typeof data.year !== 'number') {
    fail(folder, `"year" must be a number, got ${typeof data.year}`);
  }

  // coverColor must be a hex colour
  if (data.coverColor && !/^#[0-9A-Fa-f]{6}$/.test(data.coverColor)) {
    fail(folder, `"coverColor" must be a 6-digit hex colour (e.g. "#FF6B00"), got "${data.coverColor}"`);
  }

  // sections
  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    fail(folder, '"sections" must be a non-empty array');
    continue;
  }

  const sectionIds = new Set();
  let stickerCount = 0;

  for (const [si, section] of data.sections.entries()) {
    const sectionRef = `section[${si}] "${section.id ?? '?'}"`;

    for (const field of REQUIRED_SECTION_FIELDS) {
      if (section[field] === undefined || section[field] === null || section[field] === '') {
        fail(folder, `${sectionRef}: missing or empty field "${field}"`);
      }
    }

    if (section.id) {
      if (sectionIds.has(section.id)) {
        fail(folder, `${sectionRef}: duplicate section id "${section.id}"`);
      }
      sectionIds.add(section.id);
    }

    if (!Array.isArray(section.stickers) || section.stickers.length === 0) {
      fail(folder, `${sectionRef}: "stickers" must be a non-empty array`);
      continue;
    }

    const stickerNumbers = new Set();
    for (const [ki, sticker] of section.stickers.entries()) {
      for (const field of REQUIRED_STICKER_FIELDS) {
        if (sticker[field] === undefined || sticker[field] === null || sticker[field] === '') {
          fail(folder, `${sectionRef} sticker[${ki}]: missing "${field}"`);
        }
      }
      if (sticker.number) {
        if (stickerNumbers.has(sticker.number)) {
          fail(folder, `${sectionRef}: duplicate sticker number "${sticker.number}"`);
        }
        stickerNumbers.add(sticker.number);
        stickerCount++;
      }
      if (sticker.type !== undefined && !VALID_STICKER_TYPES.includes(sticker.type)) {
        fail(folder, `${sectionRef} sticker "${sticker.number}": unknown type "${sticker.type}"`);
      }
    }
  }

  if (errors === 0 || !errors) {
    pass(folder, `${data.sections.length} sections, ${stickerCount} stickers`);
  }
}

console.log('');
if (errors > 0) {
  console.error(`Failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log(`All collections valid.`);
}
