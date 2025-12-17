import React from 'react';

const PaperClip: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="35"
            height="36"
            viewBox="0 0 35 36"
            fill="none"
            className={className}
        >
            <path
                d="M13.1242 24.5618L26.2225 11.9569C26.9404 11.239 27.3438 10.2653 27.3438 9.25C27.3438 8.23472 26.9404 7.26102 26.2225 6.54311C25.5046 5.82519 24.5309 5.42188 23.5156 5.42188C22.5003 5.42187 21.5266 5.82519 20.8087 6.54311L7.39086 19.9221C6.16015 21.1528 5.46875 22.822 5.46875 24.5625C5.46875 26.303 6.16015 27.9722 7.39086 29.2029C8.62157 30.4336 10.2908 31.125 12.0313 31.125C13.7717 31.125 15.4409 30.4336 16.6716 29.2029L27.8898 17.9993"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default PaperClip;
