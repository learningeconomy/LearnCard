import React from 'react';

type FileExportIconProps = {
    className?: string;
    color?: string;
};

const FileExportIcon: React.FC<FileExportIconProps> = ({ className = '', color = 'white' }) => {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 26 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M16 22.9154H6.74935C6.19681 22.9154 5.66691 22.6959 5.27621 22.3052C4.88551 21.9145 4.66602 21.3846 4.66602 20.832V4.16536C4.66602 3.61283 4.88551 3.08293 5.27621 2.69223C5.66691 2.30152 6.19681 2.08203 6.74935 2.08203H14.041L21.3327 9.3737"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14.041 2.08203V9.3737H21.3327"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M20 13L24 17L20 21"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="22"
                y1="17"
                x2="13"
                y2="17"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default FileExportIcon;
