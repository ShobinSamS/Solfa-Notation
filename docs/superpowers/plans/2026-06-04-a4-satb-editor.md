# A4 SATB Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace free-form notation entry with direct, structured editing inside printable A4 SATB tonic sol-fa blocks.

**Architecture:** Keep the existing React/Vite app and project context. Move notation behavior into structured block data, focused validation helpers, and an A4 editor component that renders editable rows directly inside each page. Export continues to use the visible DOM, so print/PDF/PNG share the same layout.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind CSS, html-to-image, jsPDF.

---

## File Structure

- Modify `src/types/project.ts`: rename lyric fields, add lyric mode, underline ranges, and block warnings.
- Modify `src/utils/projectModel.ts`: create new default blocks, duplicate blocks, move/delete helpers, and pagination behavior.
- Modify `src/services/notationValidation.ts`: tokenize tonic sol-fa notation, validate octave usage, meter format, middle lyric overflow, page block count, and measure alignment.
- Modify `src/services/notationValidation.test.ts`: add failing tests before validation implementation.
- Modify `src/utils/projectModel.test.ts`: add failing tests for new block shape and block pagination/actions.
- Create `src/components/A4BlockEditor.tsx`: direct editable SATB block rows, cursor tracking hooks, block actions, lyric mode control, underline control target.
- Modify `src/components/A4Page.tsx`: render editable page blocks instead of passive preview lines.
- Modify `src/components/NotationToolbar.tsx`: required note/symbol/octave/grouping controls, with no textarea assumptions.
- Modify `src/pages/EditorPage.tsx`: remove `TiptapNotationEditor` and selected voice textarea, track active row/cursor, add print preview mode, wire block actions and auto-save.
- Modify `src/data/constants.ts`: update symbols, octave labels, and default font list.
- Modify `src/styles/index.css`: A4 sheet styling, boxed measure divisions, editable rows, underline rendering, print preview, and print/export fidelity.
- Modify `src/services/exportService.ts`: export current page for PNG and ensure export errors remain friendly.
- Delete or stop importing `src/components/TiptapNotationEditor.tsx` from notation flow.

## Task 1: Validation Tests

**Files:**
- Modify: `src/services/notationValidation.test.ts`
- Modify: `src/services/notationValidation.ts`

- [ ] **Step 1: Write failing tests for required tonic sol-fa validation**

Add tests like:

```ts
it('supports required separators and rejects directly joined notes', () => {
  expect(validateNotation('dr').valid).toBe(false);
  expect(validateNotation('rm').valid).toBe(false);
  expect(validateNotation('sf').valid).toBe(false);
  expect(validateNotation('d:r').valid).toBe(true);
  expect(validateNotation('d,r').valid).toBe(true);
  expect(validateNotation("d ' r").valid).toBe(true);
});

it('treats chromatic notes as one token', () => {
  expect(parseNotationTokens('de:r re fe se ta')).toEqual(['de', ':', 'r', 're', 'fe', 'se', 'ta']);
  expect(validateNotation('de:r').valid).toBe(true);
});

it('uses real octave characters only with note tokens', () => {
  expect(applyOctaveToLastNote('d r', '²')).toBe('d r²');
  expect(applyOctaveToLastNote('d r', '₃')).toBe('d r₃');
  expect(applyOctaveToLastNote('| :', '¹')).toBe('| :');
  expect(validateNotation('¹ d').valid).toBe(false);
});

it('reports mismatched measure counts across voices', () => {
  const issues = validateBlockAlignment({
    S: '| d : r | m : f ||',
    A: '| m : f ||',
    T: '| s : l | t : d ||',
    B: '| d : d | s : s ||'
  }, { S: true, A: true, T: true, B: true });
  expect(issues.some((issue) => issue.message.includes('measure'))).toBe(true);
});
```

- [ ] **Step 2: Run the validation tests and verify RED**

Run: `npm test -- src/services/notationValidation.test.ts`

Expected: fails because new functions and real octave handling are missing.

- [ ] **Step 3: Implement minimal validation helpers**

Implement:

```ts
export function validateBlockAlignment(
  voices: Record<VoiceKey, string>,
  enabledVoices: VoiceSelection
): NotationIssue[]
```

Update token parsing to recognize `|`, `||`, `:`, `-`, `.`, `,`, and `'`; recognize real octaves `¹ ² ³ ₁ ₂ ₃`; and reject standalone octave symbols.

- [ ] **Step 4: Run validation tests and verify GREEN**

Run: `npm test -- src/services/notationValidation.test.ts`

Expected: validation tests pass.

## Task 2: Model And Pagination Tests

**Files:**
- Modify: `src/types/project.ts`
- Modify: `src/utils/projectModel.test.ts`
- Modify: `src/utils/projectModel.ts`

- [ ] **Step 1: Write failing model tests**

Add tests:

```ts
it('creates structured A4 blocks with lyric mode and warnings', () => {
  const block = createBlock();
  expect(block.topLyric).toBe('');
  expect(block.middleLyrics).toHaveLength(6);
  expect(block.bottomLyric).toBe('');
  expect(block.lyricMode).toBe('center');
  expect(block.warnings).toEqual([]);
});

it('splits blocks after five per page', () => {
  const project = createProject({ title: 'Test', scale: 'C' });
  const blocks = Array.from({ length: 6 }, () => createBlock());
  const paged = enforceFiveBlocksPerPage({ ...project, pages: [{ id: 'page-test', blocks }] });
  expect(paged.pages).toHaveLength(2);
  expect(paged.pages[0].blocks).toHaveLength(5);
  expect(paged.pages[1].blocks).toHaveLength(1);
});
```

- [ ] **Step 2: Run model tests and verify RED**

Run: `npm test -- src/utils/projectModel.test.ts`

Expected: fails because block field names and defaults are still old.

- [ ] **Step 3: Update model types and helpers**

Update `NotationBlock` to include `topLyric`, `middleLyrics`, `bottomLyric`, `lyricMode`, `underlines`, and `warnings`; remove `notesHtml`, `lyricTop`, `lyricCenter`, and `lyricBottom` from active use.

Add helpers:

```ts
export function duplicateBlock(block: NotationBlock): NotationBlock
export function moveBlock(project: ChoirProject, blockId: string, direction: -1 | 1): ChoirProject
export function deleteBlock(project: ChoirProject, blockId: string): ChoirProject
```

- [ ] **Step 4: Run model tests and verify GREEN**

Run: `npm test -- src/utils/projectModel.test.ts`

Expected: model tests pass.

## Task 3: A4 Direct Editing Component

**Files:**
- Create: `src/components/A4BlockEditor.tsx`
- Modify: `src/components/A4Page.tsx`
- Modify: `src/pages/EditorPage.tsx`

- [ ] **Step 1: Add a component test or focused render smoke test if the existing test setup supports React rendering**

Create a test that renders a page, finds editable row labels `S`, `A`, `T`, `B`, edits the S row, and expects the callback to receive updated structured block data.

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test`

Expected: fails because `A4BlockEditor` does not exist.

- [ ] **Step 3: Implement direct editable rows**

Create `A4BlockEditor` with props:

```ts
type A4BlockEditorProps = {
  block: NotationBlock;
  enabledVoices: VoiceSelection;
  styles: ChoirProject['styles'];
  activeRow: ActiveRow | null;
  onFocusRow: (row: ActiveRow) => void;
  onChangeBlock: (block: NotationBlock) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};
```

Use `contentEditable` or controlled editable text areas styled as flat page text. Preserve spaces with `white-space: pre` and update only the active row field.

- [ ] **Step 4: Replace old editor controls**

Remove the selected voice textarea and Tiptap editor from `EditorPage`. Render `A4Page` as the direct editing surface and pass editing callbacks down to blocks.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test`

Run: `npm run build`

Expected: tests and TypeScript build pass.

## Task 4: Toolbar Cursor Insertion

**Files:**
- Modify: `src/components/NotationToolbar.tsx`
- Modify: `src/pages/EditorPage.tsx`
- Modify: `src/data/constants.ts`

- [ ] **Step 1: Write failing tests for toolbar constants and octave behavior**

Assert symbol buttons equal `['|', '||', ':', '-', '.', ',', "'"]` and octave values equal `['¹', '²', '³', '₁', '₂', '₃']`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: fails because constants still use old symbols and mojibake-compatible values.

- [ ] **Step 3: Update toolbar constants and handlers**

Update note, symbol, octave, and grouping controls. Insert note/symbol text at the saved selection in the active row. Apply octave only to selected note text or nearest previous valid note. Keep focus on the A4 editor after button clicks.

- [ ] **Step 4: Run tests and build**

Run: `npm test`

Run: `npm run build`

Expected: pass.

## Task 5: Boxed Measures, Lyrics, And Underlines

**Files:**
- Modify: `src/components/A4BlockEditor.tsx`
- Modify: `src/styles/index.css`
- Modify: `src/services/notationValidation.ts`

- [ ] **Step 1: Add validation tests for middle lyric overflow and page block warnings**

Test that more than six middle lyric lines returns a friendly warning and that pages with more than five blocks return a warning.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/services/notationValidation.test.ts`

Expected: fails because page/block warning helpers are missing.

- [ ] **Step 3: Implement visual layout**

Style blocks as printed notation with:

```css
.satb-block {
  break-inside: avoid;
  border: 1px solid #94a3b8;
}

.notation-row,
.lyric-row {
  white-space: pre;
  font-variant-ligatures: none;
}

.measure-box {
  border-left: 1px solid #94a3b8;
  border-right: 1px solid #94a3b8;
}
```

Render rows in SATB, SA, or TB order based on enabled voices. Render underlines as absolutely positioned row decorations or CSS text-decoration spans that are included in DOM export.

- [ ] **Step 4: Run tests and build**

Run: `npm test`

Run: `npm run build`

Expected: pass.

## Task 6: Print Preview And Export Fidelity

**Files:**
- Modify: `src/pages/EditorPage.tsx`
- Modify: `src/services/exportService.ts`
- Modify: `src/styles/index.css`

- [ ] **Step 1: Add print preview state**

Add a `previewMode` boolean in `EditorPage`, a preview toggle button, and CSS class that hides editing chrome while showing A4 pages as they will export.

- [ ] **Step 2: Update PNG export to current page**

Track the selected page index. Pass one page element to PNG export and all page elements to PDF export.

- [ ] **Step 3: Preserve exact DOM export**

Ensure export functions use `[data-export-page]` DOM nodes without alternate rendering. Errors should surface as `Export failed: <reason>`.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: TypeScript and Vite build pass.

## Task 7: Manual Verification

**Files:**
- No file changes.

- [ ] **Step 1: Start local dev server**

Run: `npm run dev`

Expected: Vite prints a local URL.

- [ ] **Step 2: Open the editor**

Use the browser to verify the app opens, an A4 page is visible, and rows are directly editable.

- [ ] **Step 3: Verify interactions**

Check note insertion, symbol insertion including comma, octave application, lyric spacing, block duplicate/delete/move, five-block pagination, print preview, PDF export, and PNG export.

- [ ] **Step 4: Final verification**

Run: `npm test`

Run: `npm run build`

Expected: both pass.

## Notes

This workspace is not currently a Git repository, so commit steps are intentionally omitted. If Git is initialized later, commit after each task with the task summary.
