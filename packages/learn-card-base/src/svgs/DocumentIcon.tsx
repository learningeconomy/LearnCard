import { fill } from 'lodash';
import React from 'react';

export const DocumentIcon: React.FC<{
    className?: string;
    variant?: 'docx' | 'txt' | 'zip' | 'md';
}> = ({ className, variant }) => {
    if (variant === 'docx') {
        return (
            // docx
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="51"
                height="51"
                viewBox="0 0 51 51"
                fill="none"
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M31.3156 5.86914H17.178C12.8026 5.86914 9.03076 9.41577 9.03076 13.7933V36.5584C9.03076 41.1824 12.5561 44.8693 17.178 44.8693H34.1546C38.5321 44.8693 42.0788 40.938 42.0788 36.5584V17.0806L31.3156 5.86914Z"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M30.7573 5.84375V12.0254C30.7573 15.0429 33.1989 17.4909 36.2143 17.4973C39.0129 17.5036 41.8753 17.5057 42.0687 17.493"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M30.3536 33.0605H18.885"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M26.0153 22.5371H18.8838"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    if (variant === 'zip') {
        // zip
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="51"
                height="51"
                viewBox="0 0 51 51"
                fill="none"
                className={className}
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M31.3156 5.86914H17.178C12.8026 5.86914 9.03076 9.41577 9.03076 13.7933V36.5584C9.03076 41.1824 12.5561 44.8693 17.178 44.8693H34.1546C38.5321 44.8693 42.0788 40.938 42.0788 36.5584V17.0806L31.3156 5.86914Z"
                    stroke="#7C3AED"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M30.7573 5.84375V12.0254C30.7573 15.0429 33.1989 17.4909 36.2143 17.4973C39.0129 17.5036 41.8753 17.5057 42.0687 17.493"
                    stroke="#7C3AED"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M21 16C22.6569 16 24 14.6569 24 13C24 11.3431 22.6569 10 21 10C19.3431 10 18 11.3431 18 13C18 14.6569 19.3431 16 21 16Z"
                    stroke="#7C3AED"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M21 23V20"
                    stroke="#7C3AED"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M21 30V27"
                    stroke="#7C3AED"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M21 37V34"
                    stroke="#7C3AED"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M21 44V41"
                    stroke="#7C3AED"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    if (variant === 'md') {
        // md
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="51"
                height="51"
                viewBox="0 0 51 51"
                fill="none"
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M31.3156 5.86914H17.178C12.8026 5.86914 9.03076 9.41577 9.03076 13.7933V36.5584C9.03076 41.1824 12.5561 44.8693 17.178 44.8693H34.1546C38.5321 44.8693 42.0788 40.938 42.0788 36.5584V17.0806L31.3156 5.86914Z"
                    stroke="#18224E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M30.7573 5.84375V12.0254C30.7573 15.0429 33.1989 17.4909 36.2143 17.4973C39.0129 17.5036 41.8753 17.5057 42.0687 17.493"
                    stroke="#18224E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M30.3536 33.0605H18.885"
                    stroke="#18224E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M26.0153 22.5371H18.8838"
                    stroke="#18224E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    if (variant === 'txt') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="51"
                height="51"
                viewBox="0 0 51 51"
                fill="none"
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M31.3156 5.86914H17.178C12.8026 5.86914 9.03076 9.41577 9.03076 13.7933V36.5584C9.03076 41.1824 12.5561 44.8693 17.178 44.8693H34.1546C38.5321 44.8693 42.0788 40.938 42.0788 36.5584V17.0806L31.3156 5.86914Z"
                    stroke="#DC2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M30.7573 5.84375V12.0254C30.7573 15.0429 33.1989 17.4909 36.2143 17.4973C39.0129 17.5036 41.8753 17.5057 42.0687 17.493"
                    stroke="#DC2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M30.3536 33.0605H18.885"
                    stroke="#DC2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.4"
                    d="M26.0153 22.5371H18.8838"
                    stroke="#DC2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="51"
            height="51"
            viewBox="0 0 51 51"
            fill="none"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M31.3156 5.86914H17.178C12.8026 5.86914 9.03076 9.41577 9.03076 13.7933V36.5584C9.03076 41.1824 12.5561 44.8693 17.178 44.8693H34.1546C38.5321 44.8693 42.0788 40.938 42.0788 36.5584V17.0806L31.3156 5.86914Z"
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M30.7573 5.84375V12.0254C30.7573 15.0429 33.1989 17.4909 36.2143 17.4973C39.0129 17.5036 41.8753 17.5057 42.0687 17.493"
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                opacity="0.4"
                d="M30.3536 33.0605H18.885"
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                opacity="0.4"
                d="M26.0153 22.5371H18.8838"
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default DocumentIcon;
