import React from 'react';

const CopyStack: React.FC<{
    className?: string;
    onClick?: React.MouseEventHandler<SVGSVGElement>;
    version?: string;
}> = ({ className = '', onClick, version = '1' }) => {
    if (version === '2') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="25"
                viewBox="0 0 26 25"
                fill="none"
                className={className}
            >
                <path
                    d="M21.3333 9.375H11.9583C10.8077 9.375 9.875 10.3077 9.875 11.4583V20.8333C9.875 21.9839 10.8077 22.9167 11.9583 22.9167H21.3333C22.4839 22.9167 23.4167 21.9839 23.4167 20.8333V11.4583C23.4167 10.3077 22.4839 9.375 21.3333 9.375Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M5.70825 15.6237H4.66659C4.11405 15.6237 3.58415 15.4042 3.19345 15.0135C2.80275 14.6228 2.58325 14.0929 2.58325 13.5404V4.16536C2.58325 3.61283 2.80275 3.08293 3.19345 2.69223C3.58415 2.30152 4.11405 2.08203 4.66659 2.08203H14.0416C14.5941 2.08203 15.124 2.30152 15.5147 2.69223C15.9054 3.08293 16.1249 3.61283 16.1249 4.16536V5.20703"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 30 30" fill="none" className={className} onClick={onClick}>
            <path
                d="M25.7806 20.6246V4.21826H9.37354"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M21.093 8.90576H4.68604V25.312H21.093V8.90576Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default CopyStack;
