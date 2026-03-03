import React from 'react';

export const TroopNationalLLeader: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            className={className}
        >
            <rect width="40" height="40" fill="#622599" />
            <path
                d="M32.5 24.3276L20.0006 31.5436L7.5 24.3276V21.1438V14.5H20.0006H32.5V21.1438V24.3276Z"
                fill="#9FED8F"
            />
        </svg>
    );
};

export default TroopNationalLLeader;
