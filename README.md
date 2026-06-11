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
- **Aspect ratio:** 3:4 (portrait — the app crops to this ratio)
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
        { "number": "001" },
        { "number": "002", "type": "foil" },
        { "number": "003", "name": "Optional sticker name" }
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
| `stickers[].name` | | Optional label shown in the app |
| `stickers[].type` | | `"foil"` for special stickers |
