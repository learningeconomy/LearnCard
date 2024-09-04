import React from 'react';

type LineProps = {
    className?: string;
    width?: string;
};

const Line: React.FC<LineProps> = ({ className = '', width = '109' }) => {
    return (
        <svg
            width={width}
            height="6"
            viewBox="0 0 109 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect y="0.575806" width="109" height="5" rx="2.5" fill="#E2E3E9" />
        </svg>
    );
};

export default Line;
