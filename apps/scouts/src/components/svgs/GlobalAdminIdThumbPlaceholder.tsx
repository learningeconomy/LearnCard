import React from 'react';

type GlobalAdminIdThumbPlaceholderProps = {
    className?: string;
};

const GlobalAdminIdThumbPlaceholder: React.FC<GlobalAdminIdThumbPlaceholderProps> = ({
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
            <rect width="80" height="80" transform="translate(0 0.5)" fill="#9FED8F" />
            <path
                d="M61.9825 53V28L40.4924 15.5L19 28V53L40.4924 65.5L61.9825 53Z"
                fill="#622599"
            />
        </svg>
    );
};

export default GlobalAdminIdThumbPlaceholder;
