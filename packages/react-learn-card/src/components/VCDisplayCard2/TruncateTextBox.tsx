import React, { useState } from 'react';

type TruncateTextBoxProps = {
    headerText?: string;
    headerClassName?: string;

    // the text to be truncated if it's too long
    text: string;

    truncateThreshold?: number;

    // extra things to put at the bottom of the box
    children?: React.ReactNode;
    className?: string;

    // container styles
    containerClassName?: string;
    // text styles
    textClassName?: string;
};

const TruncateTextBox: React.FC<TruncateTextBoxProps> = ({
    headerText = '',
    headerClassName = '',
    text,
    truncateThreshold = 132,
    children,
    className = 'truncate-text-box',
    containerClassName = '',
    textClassName = '',
}) => {
    const needsTruncate = text?.length > truncateThreshold;
    const [showFullText, setShowFullText] = useState(false);
    const truncated = needsTruncate && !showFullText;

    const displayText = truncated ? text.substring(0, truncateThreshold) : text;

    const defaultStyles = 'shadow-bottom px-[15px] py-[20px]';

    return (
        <div
            className={`${className} ${defaultStyles} bg-white flex flex-col items-start gap-[10px] rounded-[20px] w-full ${containerClassName}`}
        >
            {headerText && (
                <h3 className={`${headerClassName} text-[20px] leading-[20px] text-grayscale-900`}>
                    {headerText}
                </h3>
            )}

            <p
                className={`text-[12px] text-grayscale-700 leading-[18px] font-poppins font-[400] mb-0 ${textClassName}`}
            >
                {displayText}
                {truncated && (
                    <>
                        ...{' '}
                        <button
                            className="text-indigo-500 font-[700]"
                            onClick={e => {
                                e.stopPropagation();
                                setShowFullText(true);
                            }}
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
                            onClick={e => {
                                e.stopPropagation();
                                setShowFullText(false);
                            }}
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
