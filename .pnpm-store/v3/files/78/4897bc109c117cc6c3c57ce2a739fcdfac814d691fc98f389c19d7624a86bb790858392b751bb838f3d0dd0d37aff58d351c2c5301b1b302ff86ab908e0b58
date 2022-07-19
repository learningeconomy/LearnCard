import { UISelectionRange } from '../../document';
import { editableInputTypes } from '../edit/isEditable';
/**
 * Backward-compatible selection.
 *
 * Handles input elements and contenteditable if it only contains a single text node.
 */
export declare function setSelectionRange(element: Element, anchorOffset: number, focusOffset: number): void;
/**
 * Determine if the element has its own selection implementation
 * and does not interact with the Document Selection API.
 */
export declare function hasOwnSelection(node: Node): node is HTMLTextAreaElement | (HTMLInputElement & {
    type: editableInputTypes;
});
/**
 * Reset the Document Selection when moving focus into an element
 * with own selection implementation.
 */
export declare function updateSelectionOnFocus(element: Element): void;
/**
 * Get the range that would be overwritten by input.
 */
export declare function getInputRange(focusNode: Node): UISelectionRange | Range | undefined;
/**
 * Extend/shrink the selection like with Shift+Arrows or Shift+Mouse
 */
export declare function modifySelection({ focusNode, focusOffset, }: {
    focusNode: Node;
    /** DOM Offset */
    focusOffset: number;
}): void;
/**
 * Set the selection
 */
export declare function setSelection({ focusNode, focusOffset, anchorNode, anchorOffset, }: {
    anchorNode?: Node;
    /** DOM offset */
    anchorOffset?: number;
    focusNode: Node;
    focusOffset: number;
}): void;
/**
 * Move the selection
 */
export declare function moveSelection(node: Element, direction: -1 | 1): void;
