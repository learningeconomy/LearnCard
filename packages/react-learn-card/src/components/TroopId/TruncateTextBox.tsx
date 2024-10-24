import React, { useState } from 'react';

type TruncateTextBoxProps = {
    headerText?: string;
    subHeaderText?: string;

    // the text to be truncated if it's too long
    text: string;

    truncateThreshold?: number;

    // extra things to put at the bottom of the box
    children?: React.ReactNode;
    className?: string;

    // text styles
    textClassName?: string;
};

const TruncateTextBox: React.FC<TruncateTextBoxProps> = ({
    headerText = '',
    subHeaderText = '',
    text,
    truncateThreshold = 132,
    children,
    className = 'truncate-text-box',
    textClassName = '',
}) => {
    const needsTruncate = text?.length > truncateThreshold;
    const [showFullText, setShowFullText] = useState(false);
    const truncated = needsTruncate && !showFullText;

    const displayText = truncated ? text.substring(0, truncateThreshold) : text;

    return (
        <div
            className={`${className} p-[15px] bg-white flex flex-col items-start gap-[10px] rounded-[20px] w-full shadow-bottom-2-4`}
        >
            {headerText && (
                <h3 className="text-[22px] leading-[130%] tracking-[-0.25px] text-grayscale-900 font-notoSans">
                    {headerText}
                </h3>
            )}

            {subHeaderText && (
                <h4 className="text-[17px] text-grayscale-900 font-notoSans">{subHeaderText}</h4>
            )}

            <p className="text-[14px] text-grayscale-700 font-notoSans mb-0">
                {displayText}
                {truncated && (
                    <>
                        ...{' '}
                        <button
                            className="text-blue-ocean text-[14px] font-[600]"
                            onClick={e => {
                                e.stopPropagation();
                                setShowFullText(true);
                            }}
                        >
                            Show more
                        </button>
                    </>
                )}
                {needsTruncate && showFullText && (
                    <>
                        {' '}
                        <button
                            className="text-blue-ocean text-[14px] font-[600]"
                            onClick={e => {
                                e.stopPropagation();
                                setShowFullText(false);
                            }}
                        >
                            Show less
                        </button>
                    </>
                )}
            </p>

            {children}
        </div>
    );
};

export default TruncateTextBox;
