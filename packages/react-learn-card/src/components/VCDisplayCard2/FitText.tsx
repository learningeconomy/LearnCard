import React, { useLayoutEffect, useRef } from 'react';

interface FitTextProps {
    text: string;
    width: string;
    className?: string;
    minFontSize?: number;
    maxFontSize?: number;
}

const FIT_GUTTER_PX = 16;

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
            textElement.style.fontSize = `${maxFontSize}px`;
            textElement.style.whiteSpace = 'nowrap';

            const availableWidth = Math.max(container.clientWidth - FIT_GUTTER_PX, 0);
            const requiredWidth = textElement.scrollWidth;
            if (!availableWidth || !requiredWidth) return;

            const fittedFontSize = Math.min(
                maxFontSize,
                Math.max(minFontSize, Math.floor((availableWidth / requiredWidth) * maxFontSize))
            );

            textElement.style.fontSize = `${fittedFontSize}px`;
            textElement.style.whiteSpace =
                fittedFontSize === minFontSize && textElement.scrollWidth > availableWidth
                    ? 'normal'
                    : 'nowrap';
        };

        fitText();

        const resizeObserver = new ResizeObserver(fitText);
        resizeObserver.observe(container);

        let isMounted = true;
        document.fonts?.ready.then(() => {
            if (isMounted) fitText();
        });

        return () => {
            isMounted = false;
            resizeObserver.disconnect();
        };
    }, [maxFontSize, minFontSize, text, width]);

    return (
        <div
            ref={containerRef}
            style={{ width, maxWidth: '100%' }}
            className={`text-center ${className}`}
        >
            <span className="inline-block whitespace-nowrap transition-[font-size]" ref={textRef}>
                {text}
            </span>
        </div>
    );
};

export default FitText;
