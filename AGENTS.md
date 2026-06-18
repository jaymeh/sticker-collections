@README.md

# Agent guide — sticker-collections

Read `README.md` for the public collection format. This file tells you **which scripts exist and when to use them**.

## Scripts (always prefer these over hand-rolling JSON)

Run from the repo root: `node scripts/<script>.js`

### `add-collection.js` — new album scaffold

Use when: adding a **new** collection from scratch.

```bash
node scripts/add-collection.js
```

Interactive. Creates `{slug}/{slug}.json` with sections, `collectables`, `collectableType`, and auto-generated IDs. Does **not** create a cover image — run `generate-cover.js` next or add a JPG manually.

### `generate-cover.js` — placeholder cover

Use when: the collection folder has JSON but no `{slug}.jpg` yet.

```bash
node scripts/generate-cover.js fifa-world-cup-2026
```

Reads `coverColor`, name, year, and publisher from the JSON. Writes `{slug}/{slug}.jpg`. Requires `npm install` (uses `canvas`). Replace with a real scan later if you want.

### `add-collectable-ids.js` — backfill IDs

Use when: JSON was hand-written or imported and collectables are **missing** `id` fields.

```bash
node scripts/add-collectable-ids.js naruto-ninja-adventures/naruto-ninja-adventures.json nna
```

Do **not** use after `add-collection.js` (IDs already assigned). Do **not** use to rename existing IDs — that breaks user progress.

### `validate.js` — pre-commit check

Use when: **always** before committing or opening a PR.

```bash
node scripts/validate.js
```

Also runs in CI on pull requests.

### `check-id-immutability.js` — ID safety (CI)

Use when: editing an **existing** published collection and you need to confirm no IDs were removed or renamed.

```bash
node scripts/check-id-immutability.js main
```

Runs automatically in CI on PRs. Fails if an existing collectable `id` disappears.

## Decision guide

| Task | Script |
|---|---|
| New collection | `add-collection.js` → `generate-cover.js` → `validate.js` |
| Missing cover only | `generate-cover.js` |
| JSON exists but no IDs | `add-collectable-ids.js` → `validate.js` |
| Edit names/types/pages | Edit JSON directly → `validate.js` |
| Add new collectables to published album | Edit JSON (new IDs only) → `validate.js` |

## Rules for agents

- New JSON must use `collectables`, not `stickers`.
- Set `collectableType` (`sticker`, `card`, `coin`, `stamp`, `figure`, `pin`).
- Never remove or rename published collectable `id` values.
- Folder name, JSON filename, and `"id"` field must all match.
- Always run `validate.js` after changes.
