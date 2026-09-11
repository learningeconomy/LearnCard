import React from 'react';

const NotificationIcon: React.FC<{ className?: string; version?: string }> = ({
    className = '',
    version = '1',
}) => {
    if (version === '2') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="35"
                height="35"
                viewBox="0 0 35 35"
                fill="none"
                className={className}
            >
                <path
                    d="M26.25 11.668C26.25 9.34732 25.3281 7.12173 23.6872 5.48078C22.0462 3.83984 19.8206 2.91797 17.5 2.91797C15.1794 2.91797 12.9538 3.83984 11.3128 5.48078C9.67187 7.12173 8.75 9.34732 8.75 11.668C8.75 21.8763 4.375 24.793 4.375 24.793H30.625C30.625 24.793 26.25 21.8763 26.25 11.668Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M20.0229 30.625C19.7665 31.067 19.3985 31.4339 18.9557 31.6889C18.513 31.9439 18.011 32.0782 17.5 32.0782C16.989 32.0782 16.487 31.9439 16.0443 31.6889C15.6015 31.4339 15.2335 31.067 14.9771 30.625"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    return (
        <svg
            width="36"
            height="35"
            viewBox="0 0 36 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M28.6945 13.1462C28.6945 10.4332 27.5677 7.83129 25.5621 5.91289C23.5565 3.99449 20.8363 2.91675 18 2.91675C15.1637 2.91675 12.4435 3.99449 10.4379 5.91289C8.43229 7.83129 7.30556 10.4332 7.30556 13.1462C7.30556 22.3918 3.22112 26.5213 1.38069 27.9127C1.17034 28.0717 1.29337 28.4904 1.55706 28.4904H11.5615C11.6785 28.4904 11.7799 28.5691 11.8126 28.6814C12.0811 29.6026 13.4926 33.5417 18 33.5417C22.5074 33.5417 23.9189 29.6026 24.1874 28.6814C24.2201 28.5691 24.3215 28.4904 24.4385 28.4904H34.4429C34.7066 28.4904 34.8297 28.0717 34.6193 27.9127C32.7789 26.5213 28.6945 22.3918 28.6945 13.1462Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default NotificationIcon;
