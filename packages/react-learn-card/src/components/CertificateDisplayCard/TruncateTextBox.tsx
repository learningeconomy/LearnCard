import React, { useState } from 'react';

type TruncateTextBoxProps = {
    headerText: string;
    headerClassName?: string;

    // the text to be truncated if it's too long
    text: string;

    truncateThreshold?: number;

    // extra things to put at the bottom of the box
    children?: React.ReactNode;
    className?: string;
};

const TruncateTextBox: React.FC<TruncateTextBoxProps> = ({
    headerText,
    headerClassName = '',
    text,
    truncateThreshold = 132,
    children,
    className = 'truncate-text-box',
}) => {
    const needsTruncate = text?.length > truncateThreshold;
    const [showFullText, setShowFullText] = useState(false);
    const truncated = needsTruncate && !showFullText;

    const displayText = truncated ? text.substring(0, truncateThreshold) : text;

    return (
        <div
            className={`${className} w-full bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom p-[15px]`}
        >
            <h3 className={`${headerClassName} text-[17px] text-grayscale-900 font-poppins`}>
                {headerText}
            </h3>

            <p className="text-[12px] text-grayscale-700 font-poppins mb-0 flex flex-col items-start">
                {displayText}
                {truncated && (
                    <>
                        ...
                        <button
                            className="text-indigo-500 text-[12px]"
                            onClick={() => setShowFullText(true)}
                        >
                            Show more
                        </button>
                    </>
                )}
                {needsTruncate && showFullText && (
                    <button
                        className="text-indigo-500 text-[12px]"
                        onClick={() => setShowFullText(false)}
                    >
                        Show less
                    </button>
                )}
            </p>

            {children}
        </div>
    );
};

export default TruncateTextBox;
