#!/usr/bin/env node
// Checks that no collectable IDs have been removed or renamed between commits,
// and that no IDs are duplicated within a collection.
//
// Usage: node scripts/check-id-immutability.js [base-ref]
//   base-ref defaults to HEAD~1, or the BASE_SHA env var (set by CI for PRs).
//
// Exit 0 = all good. Exit 1 = breaking changes found.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COLLECTABLE_ID_RE = /^[a-z]+-\d{3}$/;

const baseRef = process.argv[2] || process.env.BASE_SHA || 'HEAD~1';

let errors = 0;

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  errors++;
}

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

function sectionCollectables(section) {
  return section.collectables ?? section.stickers ?? [];
}

function extractIds(data) {
  const seen = new Map();
  const duplicates = [];

  for (const [si, section] of (data.sections ?? []).entries()) {
    for (const [ki, item] of sectionCollectables(section).entries()) {
      const id = item.id;
      if (!id) continue;
      const loc = `section[${si}] collectable[${ki}]`;
      if (seen.has(id)) {
        duplicates.push({ id, first: seen.get(id), second: loc });
      } else {
        seen.set(id, loc);
      }
    }
  }

  return { ids: new Set(seen.keys()), duplicates };
}

function readAtRef(ref, relPath) {
  try {
    return execSync(`git show "${ref}:${relPath}"`, {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).toString('utf8');
  } catch {
    return null;
  }
}

function currentCollectionFolders() {
  return fs.readdirSync(ROOT).filter(f => {
    const full = path.join(ROOT, f);
    return (
      fs.statSync(full).isDirectory() &&
      !f.startsWith('.') &&
      fs.existsSync(path.join(full, `${f}.json`))
    );
  });
}

function assertBaseReachable(ref) {
  try {
    execSync(`git rev-parse --verify "${ref}"`, { cwd: ROOT, stdio: 'pipe' });
  } catch {
    console.error(
      `\nERROR: Base ref "${ref}" not found.\n` +
      `  On a PR this is set via BASE_SHA env var.\n` +
      `  On a first commit there is nothing to compare against — skip this check.`,
    );
    process.exit(0);
  }
}

assertBaseReachable(baseRef);

const folders = currentCollectionFolders();

if (folders.length === 0) {
  console.error('No collection folders found.');
  process.exit(1);
}

console.log(`Checking ID immutability vs "${baseRef}" for ${folders.length} collection(s)...\n`);

for (const folder of folders) {
  const relJson = `${folder}/${folder}.json`;
  const absJson = path.join(ROOT, relJson);

  let current;
  try {
    current = JSON.parse(fs.readFileSync(absJson, 'utf8'));
  } catch (e) {
    fail(`[${folder}] Cannot parse current JSON: ${e.message}`);
    continue;
  }

  const { ids: currentIds, duplicates } = extractIds(current);

  for (const { id, first, second } of duplicates) {
    fail(`[${folder}] Duplicate collectable id "${id}" at ${first} and ${second}`);
  }

  for (const id of currentIds) {
    if (!COLLECTABLE_ID_RE.test(id)) {
      fail(`[${folder}] Collectable id "${id}" does not match format {prefix}-{3-digit-number} (e.g. sa-001)`);
    }
  }

  const prevRaw = readAtRef(baseRef, relJson);
  if (prevRaw === null) {
    pass(`[${folder}] New collection — no previous version to compare`);
    continue;
  }

  let prev;
  try {
    prev = JSON.parse(prevRaw);
  } catch (e) {
    fail(`[${folder}] Cannot parse previous JSON at "${baseRef}": ${e.message}`);
    continue;
  }

  const { ids: prevIds } = extractIds(prev);

  const removed = [...prevIds].filter(id => !currentIds.has(id));
  const added = [...currentIds].filter(id => !prevIds.has(id));

  if (removed.length > 0) {
    for (const id of removed) {
      fail(`[${folder}] Collectable id "${id}" existed previously but is missing — removal and rename are breaking changes`);
    }
  }

  if (added.length > 0) {
    pass(`[${folder}] ${added.length} new id(s) added: ${added.join(', ')}`);
  }

  if (removed.length === 0 && added.length === 0 && duplicates.length === 0) {
    pass(`[${folder}] No ID changes`);
  }
}

console.log('');
if (errors > 0) {
  console.error(`ID immutability check failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log('All collectable IDs are immutable and unique.');
}
