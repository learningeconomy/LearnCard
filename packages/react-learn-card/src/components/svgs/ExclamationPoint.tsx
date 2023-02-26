import React from 'react';

type ExclamationPointProps = {
    className?: string;
};

const ExclamationPoint: React.FC<ExclamationPointProps> = ({ className = '' }) => {
    return (
        <svg
            width="5"
            height="11"
            viewBox="0 0 5 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M1.1338 6.58451L0.5 0.5H4.30282L3.66901 6.58451H1.1338ZM2.40141 10.5C1.85681 10.5 1.4108 10.3357 1.06338 10.007C0.715963 9.66901 0.542253 9.26995 0.542253 8.80986C0.542253 8.34037 0.715963 7.94601 1.06338 7.62676C1.4108 7.30751 1.85681 7.14789 2.40141 7.14789C2.9554 7.14789 3.40141 7.30751 3.73944 7.62676C4.08685 7.94601 4.26056 8.34037 4.26056 8.80986C4.26056 9.26995 4.08685 9.66901 3.73944 10.007C3.40141 10.3357 2.9554 10.5 2.40141 10.5Z"
                fill="#FACC15"
            />
        </svg>
    );
};

export default ExclamationPoint;
