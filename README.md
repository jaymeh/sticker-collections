# sticker-collections

Community-maintained collection definitions for [Haulseum](https://github.com/jaymeh/sticker-tracking-app).

## Structure

Each collection lives in its own folder named after its ID:

```
naruto-ninja-adventures/
  naruto-ninja-adventures.json   ← collection definition
  naruto-ninja-adventures.jpg    ← cover image
```

The folder name, JSON filename, and `"id"` field inside the JSON must all match.

## Adding a collection

**Prefer the helper scripts** in `scripts/` rather than hand-authoring JSON from scratch. See [Scripts](#scripts) below.

1. Fork this repo
2. Run `node scripts/add-collection.js` (or follow the manual steps if you already have JSON)
3. Run `node scripts/generate-cover.js your-collection-id` for a placeholder cover, or add your own JPG
4. Run `node scripts/validate.js` before committing
5. Open a pull request

### Manual alternative

1. Create a folder: `your-collection-id/`
2. Add `your-collection-id.json` — see [Collection format](#collection-format) below
3. Add `your-collection-id.jpg` — a cover image (see [Cover image](#cover-image) below)
4. If any collectables lack `id` fields, run `node scripts/add-collectable-ids.js your-collection-id/your-collection-id.json abc`
5. Run `node scripts/validate.js`
6. Open a pull request

## Scripts

All scripts live in `scripts/` and are run from the repo root with `node scripts/<name>.js`.

| Script | When to use | Command |
|---|---|---|
| `add-collection.js` | **Starting a new album** — interactive prompts; creates folder, JSON, and collectable IDs | `node scripts/add-collection.js` |
| `generate-cover.js` | **Need a cover image** — builds a placeholder JPG from `coverColor`, name, year, publisher (requires `canvas` npm dep) | `node scripts/generate-cover.js <collection-id>` |
| `add-collectable-ids.js` | **Hand-edited JSON missing IDs** — backfills `{prefix}-001` style IDs in section order; safe to re-run | `node scripts/add-collectable-ids.js <path-to.json> <prefix>` |
| `validate.js` | **Before every commit/PR** — schema, duplicates, cover image, collectable types | `node scripts/validate.js` |
| `check-id-immutability.js` | **CI only** — compares collectable IDs against base branch; run locally with `node scripts/check-id-immutability.js [base-ref]` when changing existing collections |

`add-collection.js` already assigns IDs — you only need `add-collectable-ids.js` if you wrote or imported JSON without them.

Typical new-album workflow:

```bash
node scripts/add-collection.js
node scripts/generate-cover.js my-new-album-id
node scripts/validate.js
```


## Cover image

The image is only ever rendered at small sizes (max 110pt wide), so keep it lightweight.

- **Format:** JPEG
- **Max width:** 400px (covers 3× retina at the largest rendered size)
- **Aspect ratio:** any — the app reads dimensions from the image and renders at its natural ratio
- **File size:** aim for under 100 KB

## Collection format

```json
{
  "id": "your-collection-id",
  "name": "Display Name",
  "publisher": "Publisher Name",
  "year": 2024,
  "description": "Short description of the collection.",
  "coverColor": "#FF6B00",
  "collectableType": "sticker",
  "sections": [
    {
      "id": "section-id",
      "name": "Section Name",
      "startPage": 1,
      "endPage": 2,
      "collectables": [
        { "number": "001", "id": "ab-001" },
        { "number": "002", "id": "ab-002", "type": "foil" },
        { "number": "003", "id": "ab-003", "name": "Optional item name" }
      ]
    }
  ]
}
```

### Fields

| Field | Required | Description |
|---|---|---|
| `id` | ✓ | Unique slug, must match folder and filename |
| `name` | ✓ | Display name shown in the app |
| `publisher` | ✓ | e.g. Panini, Topps |
| `year` | ✓ | Release year |
| `description` | ✓ | One or two sentences |
| `coverColor` | ✓ | Hex fallback colour when no cover image is loaded |
| `collectableType` | | `sticker`, `card`, `coin`, `stamp`, `figure`, or `pin` — drives labels in the app (defaults to sticker) |
| `sections[].id` | ✓ | Unique slug within this collection |
| `sections[].name` | ✓ | Display name for the section |
| `sections[].startPage` | | First album page this section appears on |
| `sections[].endPage` | | Last album page this section appears on |
| `collectables[].number` | ✓ | Item number as printed (e.g. `"001"`, `"A1"`) |
| `collectables[].id` | ✓ | Stable unique identifier — see [Collectable IDs](#collectable-ids) |
| `collectables[].name` | | Optional label shown in the app |
| `collectables[].type` | | Visual variant: `foil`, `figured`, `rainbow`, or `circle` |

## Collectable IDs

Every collectable must have an `id` field in the format **`{prefix}-{suffix}`**, e.g. `sa-001`, `fwc26-493`, `bfy-x01`. Both parts are lowercase alphanumeric; the suffix is at least three characters.

IDs are **permanent**. Once a collection is published:

- IDs must never be removed or renamed — this is a breaking change for any user who has saved progress against that ID.
- New collectables can be added with new IDs.
- The CI workflow enforces this automatically on every push and pull request.

## Legacy `stickers` field

The app still accepts `sections[].stickers` in cached copies until they re-sync. New contributions must use `collectables`.
