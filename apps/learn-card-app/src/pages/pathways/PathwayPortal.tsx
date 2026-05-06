import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children to `document.body` so `position: fixed` overlays
 * escape any ancestor `overflow: auto` container — which on iOS
 * WebView traps fixed descendants positionally (the fixed element
 * gets clipped to the scrolling parent's box instead of the
 * viewport). The shell's body container has `overflow-y-auto` to
 * give modes their own scroll region; without this portal, every
 * pathway modal renders below the `PathwaysHeader` instead of over
 * the whole screen.
 */
export const PathwayPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (typeof document === 'undefined') return null;

    return createPortal(children, document.body);
};

export default PathwayPortal;
