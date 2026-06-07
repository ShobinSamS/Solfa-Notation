# A4 SATB Editor Design

## Goal

Replace the separate textarea and Tiptap notation entry with direct editing inside structured A4 tonic sol-fa blocks. The editor must feel like a printed A4 tonic sol-fa sheet, while the app stores and renders each notation block from structured JSON.

## Data Model

Each notation block stores editable rows separately:

```ts
block = {
  id,
  topLyric: "",
  voices: {
    S: "",
    A: "",
    T: "",
    B: ""
  },
  middleLyrics: [],
  bottomLyric: "",
  lyricMode: "center" | "close",
  underlines: [],
  warnings: []
}
```

The project keeps existing metadata and pages, with `pages` containing A4 pages and each page containing no more than five blocks.

## A4 Editing Surface

The A4 page is the editor. Users type directly into editable rows inside each SATB block. There is no separate notation textarea, side editor, popup editor, hidden editor, or free-form rich text notation editor.

Each row is a structured editable line. The active row and cursor range are tracked so toolbar insertions happen at the current cursor position without moving focus away from the A4 sheet.

Default notes use a monospace font. Spaces in notation and lyrics are preserved with `white-space: pre`, so lyrics can sit exactly below matching note positions.

## SATB Layouts

Full SATB layout:

```text
top lyric
S: notes
A: notes

middle lyric line 1
middle lyric line 2
middle lyric line 3
middle lyric line 4
middle lyric line 5
middle lyric line 6

T: notes
B: notes
bottom lyric
```

SA-only layout renders S and A rows followed by lyrics. TB-only layout renders T and B rows followed by lyrics. Mixed SATB groups render SA above TB with visible spacing between them.

Each block stays aligned as a single block and cannot break across pages.

## Measure Rendering

Rows are parsed into measure segments separated by `|` and `||`. Measures render as boxed sections across active voices and lyrics, so bar divisions visually align like printed tonic sol-fa notation.

The renderer preserves the original row text for editing and uses the parsed measure structure for visual boxing and validation. Single bars separate measures; double bars end sections.

## Lyrics

The editor supports one top lyric line, up to six middle lyric lines, and one bottom lyric line. Extra middle lyric lines are moved after the notation block and warned.

Lyrics preserve spaces exactly. A space advances the lyric cursor visually, enabling alignment below notes.

Each block supports lyric placement mode:

- `center`: middle lyrics are centered in the A/T space.
- `close`: lyrics sit closer to related note rows.

## Toolbar

The note toolbar inserts tonic sol-fa note tokens:

```text
d r m f s l t re de fe se ta
```

The symbol toolbar inserts:

```text
| || : - . , '
```

Octave controls apply only to a selected note or the closest previous valid note in the active notation row:

```text
¹ ² ³ ₁ ₂ ₃
```

Octave symbols are never inserted alone.

Grouping applies underline metadata to the selected notation range. Underlines render below notes without changing text spacing and are included in print, PDF, and PNG export.

## Block Controls

Each SATB block supports:

- Add
- Duplicate
- Delete
- Move up
- Move down
- Lyric mode toggle

Adding or duplicating beyond five blocks automatically creates or fills the next A4 page. Validation warns if any page has more than five blocks.

## Validation

Validation is warning-based and does not block saving for minor issues. The editor shows friendly messages for:

- Missing title
- Missing scale
- Invalid meter format
- Invalid tempo decimal
- Invalid note joining such as `dr`, `rm`, or `sf`
- Invalid octave usage
- Mismatched measure counts between active voices
- Missing or extra bar lines
- Too many middle lyric lines
- More than five SATB blocks on one page
- Export failure
- Save failure

Valid notes are `d`, `r`, `m`, `f`, `s`, `l`, `t`, `de`, `re`, `fe`, `se`, and `ta`. Chromatic notes are treated as single tokens.

Valid separators are spaces plus `|`, `||`, `:`, `-`, `.`, `,`, and `'`.

## Export And Print

PDF export preserves the exact visible A4 layout, including pages, boxed measures, alignment, lyrics, and underlines. PNG export exports the current visible A4 page at high resolution.

Before export, users can enter print preview mode to view the printable A4 layout. Export uses the same DOM layout shown on screen.

## Testing

Implementation will add or update tests for:

- Token parsing and invalid note joining.
- Real octave symbols and invalid octave usage.
- Meter validation.
- Measure count comparison across active voices.
- Five-block pagination.
- New block defaults and duplication behavior.
