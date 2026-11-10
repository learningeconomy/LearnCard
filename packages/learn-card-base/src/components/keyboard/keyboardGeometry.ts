export interface VerticalBounds {
    top: number;
    bottom: number;
}

/** Keyboard coordinates are relative to the expanded WebView, not its resized height. */
export const getKeyboardViewport = (
    layoutHeight: number,
    expandedHeight: number,
    keyboardHeight: number,
    visualViewport?: { offsetTop: number; height: number }
): VerticalBounds => {
    const top = visualViewport?.offsetTop ?? 0;
    const visualBottom = top + (visualViewport?.height ?? layoutHeight);
    const keyboardTop = keyboardHeight > 0 ? expandedHeight - keyboardHeight : layoutHeight;
    return { top, bottom: Math.max(top, Math.min(visualBottom, layoutHeight, keyboardTop)) };
};

/** Reveal only the obscured edge; tall textareas stay anchored at their top. */
export const getFocusScrollDelta = (
    field: VerticalBounds,
    viewport: VerticalBounds,
    margin = 16
): number => {
    const top = viewport.top + margin;
    const bottom = viewport.bottom - margin;
    if (bottom <= top) return 0;
    if (field.top < top) return field.top - top;
    if (field.bottom - field.top > bottom - top) return 0;
    return Math.max(0, field.bottom - bottom);
};
