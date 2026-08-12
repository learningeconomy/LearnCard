import React from 'react';

type AcuteCheckmarkProps = {
    className?: string;
};

const AcuteCheckmark: React.FC<AcuteCheckmarkProps> = ({ className = '' }) => {
    return (
        <svg
            width="16"
            height="11"
            viewBox="0 0 16 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M0.5 4.26859L5.96103 10.5L15.3 0.5H10.6348L5.96103 6.3205L4.49338 4.06677L0.5 4.26859Z"
                fill="#00BA88"
            />
        </svg>
    );
};

export default AcuteCheckmark;
