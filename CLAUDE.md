@AGENTS.md
@README.md

# Sticker Collections — Project Guide

Maintains collection definitions for [Haulseum](https://github.com/jaymeh/sticker-tracking-app).

**AI agents:** see `AGENTS.md` for script usage and decision guide. Do not hand-author collection JSON when `scripts/add-collection.js` can scaffold it.

## Scripts

Five scripts in `scripts/`. Two run in CI; three are optional helpers you invoke manually.

| Script | Required? | Purpose |
|---|---|---|
| `validate.js` | Yes (CI) | Schema checks on every PR |
| `check-id-immutability.js` | Yes (CI) | Blocks breaking ID changes |
| `add-collection.js` | Optional | Interactive scaffold for a new album |
| `generate-cover.js` | Optional | Placeholder cover JPG from `coverColor` |
| `add-collectable-ids.js` | Optional | Backfill missing `id` fields in hand-edited JSON |

Nothing runs automatically on sync or deploy except CI and what you invoke locally.

### `add-collection.js`

```bash
node scripts/add-collection.js
```

Prompts for brand, year, name, description, cover colour, collectable type, and sections. Creates `{slug}/{slug}.json` with `collectables` and IDs. Does not create a cover.

### `generate-cover.js`

```bash
node scripts/generate-cover.js <collection-slug>
```

Placeholder `{slug}.jpg` from JSON metadata. Needs `npm install` (`canvas`).

### `add-collectable-ids.js`

```bash
node scripts/add-collectable-ids.js <path-to.json> <prefix>
```

Example: `node scripts/add-collectable-ids.js naruto-ninja-adventures/naruto-ninja-adventures.json nna`

Only when IDs are missing. Skips collectables that already have an `id`.

### `validate.js`

```bash
node scripts/validate.js
```

Run before every commit. Required for PRs.

### `check-id-immutability.js`

```bash
node scripts/check-id-immutability.js [base-ref]
```

CI enforces on PRs. Run locally when editing existing collections.

## Quick Start: Add a Collection

```bash
node scripts/add-collection.js
node scripts/generate-cover.js <slug>
node scripts/validate.js
```

## Project Structure

```
sticker-collections/
├── AGENTS.md                 ← AI script/decision guide
├── scripts/
│   ├── validate.js
│   ├── check-id-immutability.js
│   ├── add-collection.js
│   ├── generate-cover.js
│   └── add-collectable-ids.js
├── {collection-slug}/
│   ├── {slug}.json
│   └── {slug}.jpg
└── README.md
```

## Collection JSON Format

See `README.md` for the full spec.

## Collectable types

Optional `"type"` on individual items: `foil`, `figured`, `rainbow`, `circle`.

## Collectable IDs

Format: `{prefix}-{zero-padded-3-digit-number}`, e.g. `fwc26-001`. **Immutable after publish.**

## CI/CD

GitHub Actions run `validate.js` on PRs and `check-id-immutability.js` when comparing against the base branch.
