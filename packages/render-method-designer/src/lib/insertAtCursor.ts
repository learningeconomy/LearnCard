import type { EditorView } from '@codemirror/view';

/**
 * Insert text at the editor's current cursor position. If a range is selected the range is
 * replaced. Returns the new cursor position (end of the inserted text) so the caller can
 * focus the editor and place the cursor predictably.
 *
 * This is the canonical CodeMirror 6 pattern: dispatch a transaction with `changes` and a
 * `selection` update. We do not call `view.focus()` here — focus management is the caller's
 * responsibility because some flows (e.g. clicking a button) want focus to stay on the
 * button for keyboard accessibility.
 */
export const insertAtCursor = (view: EditorView, text: string): number => {
    const { from, to } = view.state.selection.main;
    const insertedEnd = from + text.length;
    view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: insertedEnd },
    });
    return insertedEnd;
};
