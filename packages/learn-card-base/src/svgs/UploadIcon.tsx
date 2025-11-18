import React from 'react';

type UploadIconProps = {
    className?: string;
    strokeWidth?: string;
};

const UploadIcon: React.FC<UploadIconProps> = ({ className = '', strokeWidth = '1' }) => {
    return (
        <svg
            width="24"
            height="20"
            viewBox="0 0 24 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M15.376 14.1303L11.566 10.3203M11.566 10.3203L7.75591 14.1303M11.566 10.3203V18.8929M19.5575 16.4068C20.4865 15.9003 21.2204 15.0989 21.6434 14.129C22.0663 13.1591 22.1543 12.076 21.8933 11.0505C21.6323 10.0251 21.0372 9.11582 20.2021 8.46614C19.3669 7.81647 18.3391 7.46342 17.281 7.46272H16.0809C15.7925 6.34756 15.2552 5.31227 14.5092 4.43469C13.7631 3.5571 12.8279 2.86005 11.7737 2.39595C10.7195 1.93184 9.57382 1.71276 8.42278 1.75517C7.27173 1.79758 6.14527 2.10037 5.1281 2.6408C4.11092 3.18122 3.22949 3.9452 2.55007 4.87531C1.87066 5.80541 1.41094 6.87744 1.20547 8.01079C1 9.14415 1.05414 10.3093 1.36381 11.4188C1.67348 12.5282 2.23062 13.553 2.99335 14.4161"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default UploadIcon;
