import React from 'react';

type VideoIconProps = {
    className?: string;
    size?: string;
};

const VideoIcon: React.FC<VideoIconProps> = ({ className = '', size = '25' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 25 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.61304 4.5H12.4051C14.8271 4.5 16.5181 6.16904 16.5181 8.56091V15.4391C16.5181 17.831 14.8271 19.5 12.4051 19.5H6.61304C4.19102 19.5 2.5 17.831 2.5 15.4391V8.56091C2.5 6.16904 4.19102 4.5 6.61304 4.5ZM20.458 6.87898C20.897 6.65563 21.412 6.67898 21.831 6.94294C22.25 7.20589 22.5 7.66274 22.5 8.16223V15.8384C22.5 16.3389 22.25 16.7947 21.831 17.0577C21.602 17.2008 21.346 17.2739 21.088 17.2739C20.873 17.2739 20.658 17.2231 20.457 17.1206L18.976 16.3734C18.428 16.0952 18.088 15.5369 18.088 14.9165V9.08305C18.088 8.46173 18.428 7.90335 18.976 7.62721L20.458 6.87898Z"
                fill="white"
            />
        </svg>
    );
};

export default VideoIcon;
