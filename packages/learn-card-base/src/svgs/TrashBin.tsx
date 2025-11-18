import React from 'react';

const TrashBin: React.FC<{
    className?: string;
    version?: 'thick' | 'thin';
    onClick?: React.MouseEventHandler<SVGSVGElement>;
}> = ({ className = '', version = 'thick', onClick }) => {
    if (version === 'thin') {
        return (
            <svg
                width="25"
                height="26"
                viewBox="0 0 25 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M21.0934 5.90234L3.90588 5.90235"
                    stroke="#353E64"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M10.1562 10.5898V16.8398"
                    stroke="#353E64"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M14.8438 10.5898V16.8398"
                    stroke="black"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M19.5309 5.90235V20.7461C19.5309 20.9533 19.4486 21.152 19.3021 21.2985C19.1555 21.445 18.9568 21.5273 18.7496 21.5273H6.24963C6.04243 21.5273 5.84372 21.445 5.69721 21.2985C5.55069 21.152 5.46838 20.9533 5.46838 20.7461V5.90234"
                    stroke="black"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M16.4062 5.90234V4.33984C16.4062 3.92544 16.2416 3.52801 15.9486 3.23499C15.6556 2.94196 15.2582 2.77734 14.8438 2.77734H10.1562C9.74185 2.77734 9.34442 2.94196 9.0514 3.23499C8.75837 3.52801 8.59375 3.92544 8.59375 4.33984V5.90234"
                    stroke="black"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 30 30" fill="none" className={className} onClick={onClick}>
            <path
                d="M25.312 7.03125L4.68701 7.03126"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.1875 12.1875V19.6875"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.8125 12.1875V19.6875"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10.3125 2.34375H19.6875"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23.437 7.03126V24.375C23.437 24.6236 23.3382 24.8621 23.1624 25.0379C22.9866 25.2137 22.7482 25.3125 22.4995 25.3125H7.49951C7.25087 25.3125 7.01241 25.2137 6.8366 25.0379C6.66078 24.8621 6.56201 24.6236 6.56201 24.375V7.03125"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default TrashBin;
