#!/usr/bin/env node
/**
 * Adds a permanent sequential `id` field to every collectable in a collection JSON.
 * Format: {prefix}-{zero-padded-3-digit-index}
 * IDs are assigned in section order, incrementing across the whole collection.
 * Safe to re-run — skips collectables that already have an `id`.
 *
 * Usage: node scripts/add-collectable-ids.js <path-to-json> <prefix>
 * Example: node scripts/add-collectable-ids.js naruto-ninja-adventures/naruto-ninja-adventures.json nna
 */

const fs = require('fs');
const path = require('path');

const [, , filePath, prefix] = process.argv;

if (!filePath || !prefix) {
  console.error('Usage: node add-collectable-ids.js <path-to-json> <prefix>');
  process.exit(1);
}

function sectionCollectables(section) {
  return section.collectables ?? section.stickers ?? [];
}

const abs = path.resolve(filePath);
const collection = JSON.parse(fs.readFileSync(abs, 'utf8'));

let counter = 1;
let added = 0;

for (const section of collection.sections) {
  for (const item of sectionCollectables(section)) {
    if (!item.id) {
      item.id = `${prefix}-${String(counter).padStart(3, '0')}`;
      added++;
    }
    counter++;
  }
}

fs.writeFileSync(abs, JSON.stringify(collection, null, 2) + '\n');
console.log(`${added} IDs added to ${collection.id} (${counter - 1} total collectables)`);
