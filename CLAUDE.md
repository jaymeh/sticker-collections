# Sticker Collections — Project Guide

Maintains collection definitions for the [Sticker Tracker app](https://github.com/jaymeh/sticker-tracking-app).

## Quick Start: Add a Collection

Run the interactive collection builder:

```bash
node scripts/add-collection.js
```

This prompts for:
- **Brand** (Panini, Topps, etc.)
- **Year** (release year)
- **Name** (e.g., "FIFA World Cup 2026™")
- **Description** (1–2 sentences)
- **Cover color** (hex, e.g., #003087)
- **Sections** (organized by theme/team/region, not individual stickers)
- **Coca-Cola promo stickers** (optional section for CC-labeled stickers with date ranges)

Output: generates `{slug}/{slug}.json` with auto-incremented sticker IDs.

## After Creating a Collection

1. **Generate cover image** (automatic):
   ```bash
   node scripts/generate-cover.js {slug}
   ```
   Creates a clean thumbnail JPG using the collection's `coverColor`, name, year, and brand. 
   - Automatically sizes text for readability
   - Chooses white or dark text based on color contrast
   - Outputs to `{slug}/{slug}.jpg` (typically <10 KB)
   - Can be replaced with a real album scan if desired

2. **Edit sticker details** (optional): if any stickers need custom names, add `"name"` field to that sticker in the JSON

3. **Validate**: `node scripts/validate.js`

## Project Structure

```
sticker-collections/
├── scripts/
│   ├── add-collection.js     ← Collection builder (interactive)
│   ├── generate-cover.js     ← Generate cover thumbnail from coverColor
│   ├── validate.js           ← Validation against JSON schema
│   ├── check-id-immutability ← CI check for immutable IDs
│   └── add-sticker-ids.js    ← Auto-assign IDs (if needed)
├── {collection-slug}/
│   ├── {slug}.json           ← Collection definition
│   └── {slug}.jpg            ← Cover image (required)
└── README.md                 ← Public API documentation
```

## Collection JSON Format

See `README.md` for the full spec. Quick reference:

```json
{
  "id": "unique-slug",
  "name": "Display Name",
  "publisher": "Brand",
  "year": 2026,
  "description": "Short description.",
  "coverColor": "#003087",
  "sections": [
    {
      "id": "section-slug",
      "name": "Section Name",
      "stickers": [
        { "number": "001", "id": "slug-001" },
        { "number": "002", "id": "slug-002", "name": "Optional name" }
      ]
    }
  ]
}
```

### Sticker Types

Optional `"type"` field (affects display in app):
- `"foil"` — metallic/holographic
- `"figured"` — shaped/die-cut
- `"rainbow"` — iridescent/prismatic

No type = regular sticker.

### Sticker IDs

Format: `{prefix}-{zero-padded-3-digit-number}`, e.g., `fwc26-001`.

**Immutable after publish**: IDs never change, rename, or delete — users rely on them to track progress.

## Sections vs. Teams

Sections are logical groupings (not individual teams). For example:

**FIFA World Cup**: sections by region/theme
- Introduction
- North/Central America (team stickers grouped)
- Europe
- Africa
- Asia
- South America
- Coca-Cola Promotional

**Panini Serie A**: sections by league position or club
- Top 4 Teams
- Mid-Table Teams
- etc.

Use sections to organize the album's natural structure, not to list every team separately.

## Coca-Cola Promotional Stickers

Many Panini albums include promotional stickers (labeled "CC") available for a limited time (e.g., July 15 – Dec 31, 2026 for FWC 2026). Group these in a dedicated section.

These are regular stickers; no special type needed.

## Validation

Run before committing:

```bash
node scripts/validate.js
```

Checks:
- Folder name matches JSON filename and `id` field
- All required fields present and non-empty
- Hex color is valid
- No duplicate section IDs or sticker numbers
- Cover image exists and matches folder name
- All sticker types are recognized

## CI/CD

The repo includes GitHub Actions that:
- Validate all collections on push/PR
- Enforce sticker ID immutability (CI fails if an existing ID is modified)
- Run on Node 24+

See `.github/workflows/` for details.
