import React, { useState } from 'react';

type TruncateTextBoxProps = {
    headerText?: string;
    headerLine2Text?: string;
    subHeaderText?: string;

    // the text to be truncated if it's too long
    text: string;

    truncateThreshold?: number;

    // extra things to put at the bottom of the box
    children?: React.ReactNode;
    className?: string;

    // text styles
    textClassName?: string;
    subHeaderTextClassName?: string;
    displayTextBelowChildren?: boolean;
    credentialVerificationDisplay?: React.ReactNode;
};

const TruncateTextBox: React.FC<TruncateTextBoxProps> = ({
    headerText = '',
    headerLine2Text = '',
    subHeaderText = '',
    text,
    truncateThreshold = 132,
    children,
    className = 'truncate-text-box',
    textClassName = '',
    subHeaderTextClassName = '',
    displayTextBelowChildren = false,
    credentialVerificationDisplay,
}) => {
    const needsTruncate = text?.length > truncateThreshold;
    const [showFullText, setShowFullText] = useState(false);
    const truncated = needsTruncate && !showFullText;

    const displayText = truncated ? text.substring(0, truncateThreshold) : text;

    const displayTextElement = (
        <p className="text-[14px] text-grayscale-700 font-notoSans mb-0">
            {displayText}
            {truncated && (
                <>
                    ...{' '}
                    <button
                        className="text-[#0094B4] text-[14px] font-[600]"
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
                        className="text-[#0094B4] text-[14px] font-[600]"
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
    );

    return (
        <div
            className={`${className} p-[15px] bg-white flex flex-col items-start gap-[10px] rounded-[20px] w-full shadow-bottom-2-4`}
        >
            {headerText && (
                <h3 className="text-[22px] leading-[130%] tracking-[-0.25px] text-grayscale-900 font-notoSans flex flex-col">
                    {headerText}
                    {headerLine2Text && (
                        <span className="text-[22px] leading-[130%] tracking-[-0.25px] text-grayscale-900 font-notoSans">
                            {headerLine2Text}
                        </span>
                    )}
                </h3>
            )}

            {subHeaderText && (
                <h5
                    className={`text-[17px] text-grayscale-900 font-notoSans ${subHeaderTextClassName}`}
                >
                    {subHeaderText}
                </h5>
            )}

            {!displayTextBelowChildren && displayTextElement}

            {children}

            {displayTextBelowChildren && displayTextElement}

            {credentialVerificationDisplay}
        </div>
    );
};

export default TruncateTextBox;
