import React from 'react';

type RedFlagProps = {
    className?: string;
};

const RedFlag: React.FC<RedFlagProps> = ({ className = '' }) => {
    return (
        <svg
            width="16"
            height="15"
            viewBox="0 0 16 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g clipPath="url(#clip0_459_5374)">
                <path
                    d="M14.7314 6.31252C15.0064 5.94377 14.8751 5.41877 14.4501 5.23752C13.4626 4.80627 13.1064 4.14377 13.2376 3.03752C13.2876 2.59377 12.9126 2.21252 12.4626 2.26252C11.3501 2.39377 10.6876 2.03127 10.2626 1.05002C10.0814 0.625017 9.55012 0.493767 9.18762 0.768767C8.35637 1.40627 7.63762 1.40627 6.80637 0.768767C6.43762 0.493767 5.91262 0.625017 5.73137 1.05002C5.30012 2.03752 4.63762 2.39377 3.53137 2.26252C3.08762 2.21252 2.70637 2.58752 2.75637 3.03752C2.88762 4.15002 2.52512 4.81252 1.54387 5.23752C1.12512 5.41877 0.993867 5.95002 1.26887 6.31252C1.90637 7.14377 1.90637 7.86252 1.26887 8.69377C0.993867 9.06252 1.12512 9.58752 1.55012 9.76877C2.53762 10.2 2.89387 10.8625 2.76262 11.9688C2.71262 12.4125 3.08762 12.7938 3.53762 12.7438C4.65012 12.6125 5.31262 12.975 5.73762 13.9563C5.91887 14.3813 6.45012 14.5125 6.81262 14.2375C6.81887 14.2375 6.82512 14.2313 6.83137 14.225L4.05012 6.26877C4.05012 6.26877 4.05012 6.24377 4.05012 6.23127C3.98137 6.02502 3.98137 5.80002 4.09387 5.59377C5.09387 3.79377 6.67512 4.01252 7.83137 4.16877C8.99387 4.32502 9.53137 4.36252 9.99387 3.53127C10.1439 3.26252 10.4314 3.10627 10.7439 3.13127C11.0501 3.15627 11.3126 3.36252 11.4126 3.65002L13.0876 8.44377C13.1626 8.65627 13.1439 8.88752 13.0314 9.08127C12.0314 10.8813 10.4501 10.6688 9.29387 10.5063C8.27512 10.3688 7.73762 10.325 7.31262 10.8625L8.33762 13.7938C8.61262 13.8563 8.89387 14 9.18762 14.225C9.55637 14.5 10.0814 14.3688 10.2626 13.9438C10.6939 12.9563 11.3564 12.6 12.4626 12.7313C12.9064 12.7813 13.2876 12.4063 13.2376 11.9563C13.1064 10.8438 13.4689 10.1813 14.4501 9.75627C14.8751 9.57502 15.0064 9.04377 14.7314 8.68127C14.0939 7.85002 14.0939 7.13127 14.7314 6.30002V6.31252Z"
                    fill="#EB001B"
                />
                <path
                    d="M9.5062 8.95624C10.525 9.09374 11.0625 9.13749 11.4875 8.59999L10.3687 5.39374C9.4812 5.96874 8.4437 5.82499 7.6187 5.71249C6.59995 5.57499 6.06245 5.53124 5.63745 6.07499L6.7562 9.28124C7.6437 8.71249 8.6812 8.84999 9.49995 8.96249L9.5062 8.95624Z"
                    fill="#EB001B"
                />
            </g>
            <defs>
                <clipPath id="clip0_459_5374">
                    <rect
                        width="13.75"
                        height="13.75"
                        fill="white"
                        transform="translate(1.125 0.625)"
                    />
                </clipPath>
            </defs>
        </svg>
    );
};

export default RedFlag;