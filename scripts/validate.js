#!/usr/bin/env node
// Validates all collection folders in this repo.
// Exit code 0 = all good, 1 = one or more failures.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

const REQUIRED_COLLECTION_FIELDS = ['id', 'name', 'publisher', 'year', 'description', 'coverColor', 'sections'];
const REQUIRED_SECTION_FIELDS = ['id', 'name'];
const REQUIRED_COLLECTABLE_FIELDS = ['number', 'id'];
const VALID_COLLECTABLE_TYPES = ['sticker', 'card', 'coin', 'stamp', 'figure', 'pin'];
const VALID_ITEM_TYPES = ['foil', 'figured', 'rainbow', 'circle'];

let errors = 0;

function fail(folder, msg) {
  console.error(`  ✗ [${folder}] ${msg}`);
  errors++;
}

function pass(folder, msg) {
  console.log(`  ✓ [${folder}] ${msg}`);
}

function sectionCollectables(section) {
  return section.collectables ?? section.stickers ?? null;
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

  const jsonPath = path.join(dir, `${folder}.json`);
  if (!fs.existsSync(jsonPath)) {
    fail(folder, `Missing ${folder}.json`);
    continue;
  }

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

  let data;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    fail(folder, `Invalid JSON: ${e.message}`);
    continue;
  }

  for (const field of REQUIRED_COLLECTION_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      fail(folder, `Missing or empty field: "${field}"`);
    }
  }

  if (data.collectableType && !VALID_COLLECTABLE_TYPES.includes(data.collectableType)) {
    fail(folder, `Unknown collectableType "${data.collectableType}"`);
  }

  if (data.id && data.id !== folder) {
    fail(folder, `"id" field "${data.id}" must match folder name "${folder}"`);
  }

  if (data.year !== undefined && typeof data.year !== 'number') {
    fail(folder, `"year" must be a number, got ${typeof data.year}`);
  }

  if (data.coverColor && !/^#[0-9A-Fa-f]{6}$/.test(data.coverColor)) {
    fail(folder, `"coverColor" must be a 6-digit hex colour (e.g. "#FF6B00"), got "${data.coverColor}"`);
  }

  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    fail(folder, '"sections" must be a non-empty array');
    continue;
  }

  const sectionIds = new Set();
  let collectableCount = 0;

  for (const [si, section] of data.sections.entries()) {
    const sectionRef = `section[${si}] "${section.id ?? '?'}"`;

    for (const field of REQUIRED_SECTION_FIELDS) {
      if (section[field] === undefined || section[field] === null || section[field] === '') {
        fail(folder, `${sectionRef}: missing or empty field "${field}"`);
      }
    }

    if (section.stickers) {
      fail(folder, `${sectionRef}: legacy "stickers" field — use "collectables" instead`);
    }

    const collectables = sectionCollectables(section);
    if (!Array.isArray(collectables) || collectables.length === 0) {
      fail(folder, `${sectionRef}: "collectables" must be a non-empty array`);
      continue;
    }

    if (section.id) {
      if (sectionIds.has(section.id)) {
        fail(folder, `${sectionRef}: duplicate section id "${section.id}"`);
      }
      sectionIds.add(section.id);
    }

    const numbers = new Set();
    for (const [ki, item] of collectables.entries()) {
      for (const field of REQUIRED_COLLECTABLE_FIELDS) {
        if (item[field] === undefined || item[field] === null || item[field] === '') {
          fail(folder, `${sectionRef} collectable[${ki}]: missing "${field}"`);
        }
      }
      if (item.number) {
        if (numbers.has(item.number)) {
          fail(folder, `${sectionRef}: duplicate collectable number "${item.number}"`);
        }
        numbers.add(item.number);
        collectableCount++;
      }
      if (item.type !== undefined && !VALID_ITEM_TYPES.includes(item.type)) {
        fail(folder, `${sectionRef} collectable "${item.number}": unknown type "${item.type}"`);
      }
    }
  }

  if (errors === 0 || !errors) {
    const typeLabel = data.collectableType ?? 'sticker';
    pass(folder, `${data.sections.length} sections, ${collectableCount} ${typeLabel}s`);
  }
}

console.log('');
if (errors > 0) {
  console.error(`Failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log(`All collections valid.`);
}
