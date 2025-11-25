import React from 'react';

const AddUserIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="30"
            height="31"
            viewBox="0 0 30 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.3462 19.4414C7.54125 19.4414 3.4375 20.1677 3.4375 23.0777C3.4375 25.9864 7.515 26.7402 12.3462 26.7402C17.1512 26.7402 21.255 26.0127 21.255 23.1039C21.255 20.1952 17.1775 19.4414 12.3462 19.4414Z"
                stroke="#353E64"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.3467 15.2911C15.5167 15.2911 18.0567 12.7498 18.0567 9.58109C18.0567 6.41109 15.5167 3.87109 12.3467 3.87109C9.17797 3.87109 6.63672 6.41109 6.63672 9.58109C6.63672 12.7498 9.17797 15.2911 12.3467 15.2911Z"
                stroke="#353E64"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M24.0039 11.2695V16.282"
                stroke="#353E64"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M26.5617 13.7754H21.4492"
                stroke="#353E64"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default AddUserIcon;
