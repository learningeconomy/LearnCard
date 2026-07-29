import React, { useLayoutEffect, useRef } from 'react';

interface FitTextProps {
    text: string;
    width: string;
    className?: string;
    minFontSize?: number;
    maxFontSize?: number;
}

// Keep fitted text slightly inside the measured edge to account for borders,
// subpixel rounding, and glyph overhang on narrow screens.
const FIT_GUTTER_PX = 12;

/**
 * Shrinks a single-line label to fit its container, wrapping only when the
 * text still cannot fit at the configured minimum font size.
 */
const FitText: React.FC<FitTextProps> = ({
    text,
    width,
    className = '',
    minFontSize = 10,
    maxFontSize = 100,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        const textElement = textRef.current;
        if (!container || !textElement) return;

        const fitText = () => {
            // Measure from the maximum size each time so repeated resizes do not
            // compound a previously calculated font size. Font-size transitions
            // are intentionally avoided so scrollWidth reflects this size immediately.
            textElement.style.fontSize = `${maxFontSize}px`;
            textElement.style.whiteSpace = 'nowrap';

            const availableWidth = Math.max(container.clientWidth - FIT_GUTTER_PX, 0);
            const requiredWidth = textElement.scrollWidth;
            if (!availableWidth || !requiredWidth) return;

            let fittedFontSize = Math.min(
                maxFontSize,
                Math.max(minFontSize, Math.floor((availableWidth / requiredWidth) * maxFontSize))
            );

            textElement.style.fontSize = `${fittedFontSize}px`;

            // Font metrics and browser rounding are not perfectly linear. Verify
            // the estimate so a one-pixel overflow cannot silently clip a title.
            while (textElement.scrollWidth > availableWidth && fittedFontSize > minFontSize) {
                fittedFontSize -= 1;
                textElement.style.fontSize = `${fittedFontSize}px`;
            }

            // Preserve the single-line ribbon treatment whenever possible.
            // Extremely long titles may wrap only after reaching the minimum.
            textElement.style.whiteSpace =
                fittedFontSize === minFontSize && textElement.scrollWidth > availableWidth
                    ? 'normal'
                    : 'nowrap';
        };

        fitText();

        // Device rotation and responsive layouts change the container without
        // necessarily changing the text or receiving a window resize event.
        let resizeObserver: ResizeObserver | undefined;
        if (typeof ResizeObserver !== 'undefined') {
            let lastObservedWidth: number | undefined;
            resizeObserver = new ResizeObserver(([entry]) => {
                const observedWidth = entry?.contentRect.width;

                if (observedWidth === undefined || observedWidth === lastObservedWidth) return;

                lastObservedWidth = observedWidth;
                fitText();
            });
            resizeObserver.observe(container);
        }

        // Web fonts can alter the measured glyph width after the first layout.
        let isMounted = true;
        document.fonts?.ready
            .then(() => {
                if (isMounted) fitText();
            })
            .catch(() => {
                // The initial synchronous measurement remains a safe fallback.
            });

        return () => {
            isMounted = false;
            resizeObserver?.disconnect();
        };
    }, [maxFontSize, minFontSize, text, width]);

    return (
        <div
            ref={containerRef}
            style={{ width, maxWidth: '100%' }}
            className={`text-center ${className}`}
        >
            <span className="inline-block max-w-full whitespace-nowrap" ref={textRef}>
                {text}
            </span>
        </div>
    );
};

export default FitText;
