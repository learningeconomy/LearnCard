import React from 'react';

type SkinnyCaretRightProps = {
    className?: string;
};

const SkinnyCaretRight: React.FC<SkinnyCaretRightProps> = ({ className = 'text-white' }) => {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M9.5 5L17 12.5L9.5 20"
                stroke="currentcolor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default SkinnyCaretRight;
