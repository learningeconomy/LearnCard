import React from 'react';

import { generateOptimizedSrcSet, isOptimizableFilestackUrl, optimizeUrl } from 'learn-card-base';

/**
 * Widths offered to the browser for the desktop login background.
 *
 * The image occupies roughly half the viewport with `object-contain`, so the
 * largest entry still covers a 2x display at a ~1000px CSS slot.
 */
const SRC_SET_WIDTHS = [600, 900, 1200, 1600, 2000];

/** Width used for `src`, for browsers that ignore `srcSet`. */
const FALLBACK_WIDTH = 1200;

/**
 * The slot is half the grid on desktop; the component only renders there, but
 * the narrow arm keeps the hint honest if the breakpoint ever moves.
 */
const SIZES = '(min-width: 1024px) 50vw, 100vw';

export type DesktopLoginBackgroundProps = {
    /** Configured `branding.desktopLoginBgUrl` for the active tenant. */
    src: string;
};

/**
 * Desktop login background image.
 *
 * When the tenant points `desktopLoginBgUrl` at a Filestack CDN URL, the image
 * is served as responsive WebP renditions rather than the original upload — the
 * LearnCard source is a 5632x6078 PNG that weighs ~3.5MB on the wire. Any other
 * URL (a tenant's bundled `/branding/...` file) renders as-is.
 */
const DesktopLoginBackground: React.FC<DesktopLoginBackgroundProps> = ({ src }) => {
    const isOptimizable = isOptimizableFilestackUrl(src);

    return (
        <img
            src={isOptimizable ? optimizeUrl(src, { width: FALLBACK_WIDTH }) : src}
            srcSet={isOptimizable ? generateOptimizedSrcSet(src, SRC_SET_WIDTHS) : undefined}
            sizes={isOptimizable ? SIZES : undefined}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="w-full h-full object-contain"
            onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
            }}
        />
    );
};

export default DesktopLoginBackground;
