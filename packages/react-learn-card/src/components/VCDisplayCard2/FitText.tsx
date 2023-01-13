import React, { useEffect, useRef } from 'react';
import fitty, { FittyInstance, FittyOptions } from 'fitty';

type FitTextProps = {
    text: string;
    width: string; // Must be set for this to work
    options?: FittyOptions;
    textClassName?: string;
};

const FitText: React.FC<FitTextProps> = ({ text, width, options, textClassName = '' }) => {
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let fit: FittyInstance;
        if (textRef.current) fit = fitty(textRef.current, options);

        return () => fit?.unsubscribe();
    }, [textRef.current]);

    return (
        <div style={{ width }} className="text-center">
            <span ref={textRef} className={textClassName}>
                {text}
            </span>
        </div>
    );
};

export default FitText;
