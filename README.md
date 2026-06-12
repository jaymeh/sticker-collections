# sticker-collections

Community-maintained collection definitions for the [Sticker Tracker app](https://github.com/jaymeh/sticker-tracking-app).

## Structure

Each collection lives in its own folder named after its ID:

```
naruto-ninja-adventures/
  naruto-ninja-adventures.json   ← collection definition
  naruto-ninja-adventures.jpg    ← cover image
```

The folder name, JSON filename, and `"id"` field inside the JSON must all match.

## Adding a collection

1. Fork this repo
2. Create a folder: `your-collection-id/`
3. Add `your-collection-id.json` — see [Collection format](#collection-format) below
4. Add `your-collection-id.jpg` — a cover image (see [Cover image](#cover-image) below)
5. Open a pull request

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
  "sections": [
    {
      "id": "section-id",
      "name": "Section Name",
      "startPage": 1,
      "endPage": 2,
      "stickers": [
        { "number": "001", "id": "ab-001" },
        { "number": "002", "id": "ab-002", "type": "foil" },
        { "number": "003", "id": "ab-003", "name": "Optional sticker name" }
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
| `sections[].id` | ✓ | Unique slug within this collection |
| `sections[].name` | ✓ | Display name for the section |
| `sections[].startPage` | | First album page this section appears on |
| `sections[].endPage` | | Last album page this section appears on |
| `stickers[].number` | ✓ | Sticker number as printed (e.g. `"001"`, `"A1"`) |
| `stickers[].id` | ✓ | Stable unique identifier — see [Sticker IDs](#sticker-ids) |
| `stickers[].name` | | Optional label shown in the app |
| `stickers[].type` | | `"foil"` for special stickers |

## Sticker IDs

Every sticker must have an `id` field in the format **`{prefix}-{zero-padded-3-digit-number}`**, e.g. `sa-001`, `nna-042`. The prefix is typically an abbreviation of the collection name.

IDs are **permanent**. Once a collection is published:

- IDs must never be removed or renamed — this is a breaking change for any user who has saved progress against that ID.
- New stickers can be added with new IDs.
- The CI workflow enforces this automatically on every push and pull request.
