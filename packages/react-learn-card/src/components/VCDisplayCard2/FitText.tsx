import React, { useEffect, useRef } from 'react';

interface FitTextProps {
    text: string;
    width: string;
    className?: string;
    minFontSize?: number;
    maxFontSize?: number;
}

const FitText: React.FC<FitTextProps> = ({
    text,
    width,
    className = '',
    minFontSize = 10,
    maxFontSize = 100,
}) => {
    const textRef = useRef<HTMLDivElement>(null);
    let animationFrameId: number | null = null;

    const adjustFontSize = () => {
        if (textRef.current) {
            const currentFontSize = parseFloat(
                window.getComputedStyle(textRef.current).getPropertyValue('font-size')
            );

            // Need to calculate spacing based on nowrap to prevent thrashing
            textRef.current.style.whiteSpace = 'nowrap';
            const parentWidth = (textRef.current.parentNode as any)?.clientWidth;
            const scrollWidth = textRef.current.scrollWidth || textRef.current.offsetWidth;

            // Sometimes scrollWidth can temporarily be 0. If so, just try again next frame
            if (scrollWidth === 0) {
                if (animationFrameId !== null) {
                    cancelAnimationFrame(animationFrameId);
                }

                animationFrameId = requestAnimationFrame(adjustFontSize);

                return;
            }

            const newFontSize = Math.min(
                Math.max((parentWidth / scrollWidth) * currentFontSize, minFontSize),
                maxFontSize
            );

            textRef.current.style.fontSize = `${newFontSize}px`;
            textRef.current.style.whiteSpace = newFontSize === minFontSize ? 'normal' : 'nowrap';
        }
    };

    const handleResize = () => {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(adjustFontSize);
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        adjustFontSize();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [text]);

    return (
        <div style={{ width }} className={`text-center ${className}`}>
            <span
                className={`text-[${minFontSize}px] transition-[font-size] whitespace-nowrap`}
                ref={textRef}
            >
                {text}
            </span>
        </div>
    );
};

export default FitText;
