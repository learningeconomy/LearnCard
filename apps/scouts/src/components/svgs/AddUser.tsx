import React from 'react';

const AddUser: React.FC<{ className?: string; fill?: string; version?: string }> = ({
    className,
    fill = '#FF8DFF',
    version = '1',
}) => {
    if (version === '2') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="25"
                viewBox="0 0 26 25"
                fill="none"
                className={className}
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.3467 16.4404C5.54174 16.4404 1.43799 17.1667 1.43799 20.0767C1.43799 22.9854 5.51549 23.7392 10.3467 23.7392C15.1517 23.7392 19.2555 23.0117 19.2555 20.1029C19.2555 17.1942 15.178 16.4404 10.3467 16.4404Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.3467 12.2901C13.5167 12.2901 16.0567 9.74887 16.0567 6.58012C16.0567 3.41012 13.5167 0.870117 10.3467 0.870117C7.17797 0.870117 4.63672 3.41012 4.63672 6.58012C4.63672 9.74887 7.17797 12.2901 10.3467 12.2901Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M22.0051 8.26953V13.282"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M24.5625 10.7754H19.45"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="24"
            viewBox="0 0 26 24"
            fill="none"
            className={className}
        >
            <path
                d="M24.3763 8.98483H22.8724V7.51452C22.8724 6.88681 22.369 6.375 21.7487 6.375C21.1297 6.375 20.625 6.88681 20.625 7.51452V8.98483H19.1237C18.5034 8.98483 18 9.49664 18 10.1243C18 10.7521 18.5034 11.2639 19.1237 11.2639H20.625V12.7355C20.625 13.3632 21.1297 13.875 21.7487 13.875C22.369 13.875 22.8724 13.3632 22.8724 12.7355V11.2639H24.3763C24.9953 11.2639 25.5 10.7521 25.5 10.1243C25.5 9.49664 24.9953 8.98483 24.3763 8.98483"
                fill="currentColor"
            />
            <path
                d="M9.875 15.7695C4.81778 15.7695 0.5 16.5781 0.5 19.8084C0.5 23.0375 4.79151 23.8752 9.875 23.8752C14.931 23.8752 19.25 23.0666 19.25 19.8363C19.25 16.6059 14.9585 15.7695 9.875 15.7695"
                fill="currentColor"
            />
            <path
                d="M9.87492 12.6928C13.3181 12.6928 16.0782 9.89711 16.0782 6.40952C16.0782 2.92192 13.3181 0.125 9.87492 0.125C6.43171 0.125 3.67163 2.92192 3.67163 6.40952C3.67163 9.89711 6.43171 12.6928 9.87492 12.6928"
                fill={fill}
            />
        </svg>
    );
};

export default AddUser;
