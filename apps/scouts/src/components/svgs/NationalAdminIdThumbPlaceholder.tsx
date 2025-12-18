import React from 'react';

type NationalAdminIdThumbPlaceholderProps = {
    className?: string;
};

const NationalAdminIdThumbPlaceholder: React.FC<NationalAdminIdThumbPlaceholderProps> = ({
    className = '',
}) => {
    return (
        <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="80" height="80" transform="translate(0 0.5)" fill="#622599" />
            <path
                d="M65 49.1552L40.0012 63.5872L15 49.1552V42.7877V29.5H40.0012H65V42.7877V49.1552Z"
                fill="#9FED8F"
            />
        </svg>
    );
};

export default NationalAdminIdThumbPlaceholder;
