import React, { useState } from 'react';

type TruncateTextBoxProps = {
    headerText: string;

    // the text to be truncated if it's too long
    text: string;

    truncateThreshold?: number;

    // extra things to put at the bottom of the box
    children?: React.ReactNode;
    className?: string;
};

const TruncateTextBox: React.FC<TruncateTextBoxProps> = ({
    headerText,
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
            className={`${className} bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full"`}
        >
            <h3 className="text-[20px] leading-[20px] text-grayscale-900">{headerText}</h3>

            <p className="text-[12px] text-grayscale-700 leading-[18px] font-poppins font-[400] mb-0">
                {displayText}
                {truncated && (
                    <>
                        ...{' '}
                        <button
                            className="text-indigo-500 font-[700]"
                            onClick={() => setShowFullText(true)}
                        >
                            More
                        </button>
                    </>
                )}
                {needsTruncate && showFullText && (
                    <>
                        {' '}
                        <button
                            className="text-indigo-500 font-[700]"
                            onClick={() => setShowFullText(false)}
                        >
                            Close
                        </button>
                    </>
                )}
            </p>

            {children}
        </div>
    );
};

export default TruncateTextBox;
