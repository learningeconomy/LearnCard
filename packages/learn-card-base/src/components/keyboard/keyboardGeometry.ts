export interface VerticalBounds {
    top: number;
    bottom: number;
}

export const isViewportZoomed = (viewport?: { scale?: number }): boolean =>
    (viewport?.scale ?? 1) > 1;

/** Keyboard coordinates are relative to the expanded WebView, not its resized height. */
export const getKeyboardViewport = (
    layoutHeight: number,
    expandedHeight: number,
    keyboardHeight: number,
    visualViewport?: { offsetTop: number; height: number; scale?: number }
): VerticalBounds => {
    // Pinch zoom shrinks the visual viewport without opening a keyboard.
    const viewport = isViewportZoomed(visualViewport) ? undefined : visualViewport;
    const top = viewport?.offsetTop ?? 0;
    const visualBottom = top + (viewport?.height ?? layoutHeight);
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
