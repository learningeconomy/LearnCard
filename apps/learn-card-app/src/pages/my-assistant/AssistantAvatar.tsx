import React from 'react';

import type {
    AssistantAvatarAccessory,
    AssistantAvatarConfig,
    AssistantAvatarMouth,
} from './assistantAvatarOptions';
import { DEFAULT_ASSISTANT_AVATAR_CONFIG } from './assistantAvatarOptions';

const OUTLINE = '#18224E';
const EMERALD = '#34D399';
const MINT = '#D1FAE5';
const SKY = '#7DD3FC';
const AMBER = '#FBBF24';
const RED = '#F87171';
const WHITE = '#FFFFFF';
const LAVENDER = '#EDE9FE';

const renderAccessory = (accessory: AssistantAvatarAccessory): React.ReactNode => {
    switch (accessory) {
        case 'long-hair':
            return (
                <path
                    d="M29 28c-1 12 2 22 12 26 5-11 14-15 24-16C60 22 44 17 29 28Z"
                    fill="#F9A8D4"
                    stroke={OUTLINE}
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
            );
        case 'short-hair':
            return (
                <path
                    d="M30 30c5-10 22-12 35 1-10-1-18 3-25 9-2-5-5-8-10-10Z"
                    fill="#F9A8D4"
                    stroke={OUTLINE}
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
            );
        case 'cat':
            return (
                <>
                    <path d="M30 29 25 15l14 9" fill={WHITE} stroke={OUTLINE} strokeWidth="3" />
                    <path d="M66 29 71 15l-14 9" fill={WHITE} stroke={OUTLINE} strokeWidth="3" />
                </>
            );
        case 'bear':
            return (
                <>
                    <circle cx="31" cy="25" r="9" fill={WHITE} stroke={OUTLINE} strokeWidth="3" />
                    <circle cx="65" cy="25" r="9" fill={WHITE} stroke={OUTLINE} strokeWidth="3" />
                </>
            );
        case 'unicorn':
            return (
                <>
                    <path
                        d="M48 7 41 26h14L48 7Z"
                        fill="#C4B5FD"
                        stroke={OUTLINE}
                        strokeWidth="3"
                    />
                    <path d="M45 16h6" stroke={WHITE} strokeWidth="2" strokeLinecap="round" />
                </>
            );
        case 'bunny':
            return (
                <>
                    <path
                        d="M36 27c-10-14-10-24-3-25 8-1 11 12 10 24"
                        fill={WHITE}
                        stroke={OUTLINE}
                        strokeWidth="3"
                    />
                    <path
                        d="M60 27c10-14 10-24 3-25-8-1-11 12-10 24"
                        fill={WHITE}
                        stroke={OUTLINE}
                        strokeWidth="3"
                    />
                </>
            );
        case 'cowboy':
            return (
                <>
                    <path
                        d="M24 26c12 5 36 5 48 0"
                        stroke={OUTLINE}
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    <path
                        d="M36 24c1-11 23-11 24 0l-3 6H39l-3-6Z"
                        fill={AMBER}
                        stroke={OUTLINE}
                        strokeWidth="3"
                    />
                </>
            );
        case 'chef':
            return (
                <>
                    <circle cx="36" cy="18" r="9" fill={WHITE} stroke={OUTLINE} strokeWidth="3" />
                    <circle cx="48" cy="13" r="10" fill={WHITE} stroke={OUTLINE} strokeWidth="3" />
                    <circle cx="60" cy="18" r="9" fill={WHITE} stroke={OUTLINE} strokeWidth="3" />
                    <path d="M35 22h26v12H35z" fill={WHITE} stroke={OUTLINE} strokeWidth="3" />
                </>
            );
        case 'pinwheel':
            return (
                <>
                    <path d="M48 10v18" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
                    <circle cx="48" cy="10" r="3" fill={RED} stroke={OUTLINE} strokeWidth="2" />
                    <path d="M48 10 38 5l2 10Z" fill={RED} stroke={OUTLINE} strokeWidth="2" />
                    <path d="M48 10 58 5l-2 10Z" fill={AMBER} stroke={OUTLINE} strokeWidth="2" />
                    <path d="M48 10 43 20l10-2Z" fill={SKY} stroke={OUTLINE} strokeWidth="2" />
                </>
            );
        case 'side-cap':
            return (
                <>
                    <path
                        d="M31 27c10-10 28-9 35 2l-5 7H35l-4-9Z"
                        fill={AMBER}
                        stroke={OUTLINE}
                        strokeWidth="3"
                    />
                    <path d="M58 29h16" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
                </>
            );
        case 'front-cap':
            return (
                <>
                    <path
                        d="M30 28c8-10 28-10 36 0v8H30v-8Z"
                        fill="#93C5FD"
                        stroke={OUTLINE}
                        strokeWidth="3"
                    />
                    <path d="M48 19v17" stroke={OUTLINE} strokeWidth="3" />
                    <path d="M36 36h24" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
                </>
            );
        case 'crown':
            return (
                <path
                    d="M31 29 36 14l10 10 9-12 7 13 7-8-2 18H32l-1-6Z"
                    fill={AMBER}
                    stroke={OUTLINE}
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
            );
        case 'bandana':
            return (
                <>
                    <path
                        d="M29 29c10 7 29 7 38 0v9H29v-9Z"
                        fill={RED}
                        stroke={OUTLINE}
                        strokeWidth="3"
                    />
                    <path
                        d="M65 31h13l-8 8"
                        fill={RED}
                        stroke={OUTLINE}
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                </>
            );
        default:
            return null;
    }
};

const renderMouth = (mouth: AssistantAvatarMouth): React.ReactNode => {
    switch (mouth) {
        case 'mustache':
            return (
                <>
                    <path d="M48 49c-6-6-12-2-16 2 6 2 11 1 16-2Z" fill={OUTLINE} />
                    <path d="M48 49c6-6 12-2 16 2-6 2-11 1-16-2Z" fill={OUTLINE} />
                </>
            );
        case 'vampire':
            return (
                <>
                    <path
                        d="M42 48c3.5 3 8.5 3 12 0"
                        stroke={EMERALD}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <path d="M44 49v7l4-5" fill={WHITE} stroke={EMERALD} strokeWidth="2" />
                    <path d="M52 49v7l-4-5" fill={WHITE} stroke={EMERALD} strokeWidth="2" />
                </>
            );
        case 'whiskers':
            return (
                <>
                    <path
                        d="M42 49c3.5 2.5 8.5 2.5 12 0"
                        stroke={EMERALD}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <path
                        d="M34 46h-10M34 51H23M62 46h10M62 51h11"
                        stroke={EMERALD}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </>
            );
        case 'short-snout':
            return (
                <>
                    <ellipse
                        cx="48"
                        cy="49"
                        rx="9"
                        ry="8"
                        fill={LAVENDER}
                        stroke={EMERALD}
                        strokeWidth="3"
                    />
                    <circle cx="48" cy="47" r="2.5" fill={OUTLINE} />
                    <path
                        d="M45 52c2 2 4 2 6 0"
                        stroke={OUTLINE}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </>
            );
        case 'long-snout':
            return (
                <>
                    <path
                        d="M39 45c3-4 15-4 18 0l4 11H35l4-11Z"
                        fill={LAVENDER}
                        stroke={EMERALD}
                        strokeWidth="3"
                    />
                    <circle cx="48" cy="48" r="2.5" fill={OUTLINE} />
                    <path
                        d="M44 54c3 2 5 2 8 0"
                        stroke={OUTLINE}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </>
            );
        default:
            return (
                <path
                    d="M42 48c3.5 3 8.5 3 12 0"
                    stroke={EMERALD}
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            );
    }
};

export const AssistantAvatar: React.FC<{
    className?: string;
    config?: AssistantAvatarConfig;
    size?: 'sm' | 'lg';
}> = ({ className = '', config = DEFAULT_ASSISTANT_AVATAR_CONFIG, size = 'lg' }) => {
    const outerSize = size === 'lg' ? 'w-[150px] h-[150px]' : 'w-[70px] h-[70px]';
    const robotSize = size === 'lg' ? 'w-[112px] h-[112px]' : 'w-[58px] h-[58px]';
    const animationClass = config.animated ? 'assistant-avatar-float' : '';

    if (config.assetUri) {
        return (
            <div
                className={`${outerSize} rounded-full bg-emerald-50 flex items-center justify-center relative overflow-visible ${className}`}
                aria-hidden="true"
            >
                <style>
                    {`@keyframes assistant-avatar-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } } .assistant-avatar-float { animation: assistant-avatar-float 3.6s ease-in-out infinite; }`}
                </style>
                <img
                    src={config.assetUri}
                    alt=""
                    className={`${robotSize} object-contain ${animationClass}`}
                    draggable={false}
                />
            </div>
        );
    }

    return (
        <div
            className={`${outerSize} rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center relative overflow-visible ${className}`}
            aria-hidden="true"
        >
            <style>
                {`@keyframes assistant-avatar-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } } @keyframes assistant-avatar-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(.12); } } .assistant-avatar-float { animation: assistant-avatar-float 3.6s ease-in-out infinite; } .assistant-avatar-eye { transform-origin: center; animation: assistant-avatar-blink 4.8s ease-in-out infinite; }`}
            </style>

            <svg className="absolute left-5 top-8 w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path
                    d="M10 2v16M2 10h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
            <svg className="absolute right-7 top-7 w-4 h-4" viewBox="0 0 20 20" fill="none">
                <path
                    d="M10 2v16M2 10h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
            <svg className="absolute right-8 bottom-9 w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path
                    d="M10 2v16M2 10h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>

            <svg viewBox="0 0 96 96" fill="none" className={`${robotSize} ${animationClass}`}>
                {renderAccessory(config.accessory)}

                <path
                    d="M24 58c0-12.15 9.85-22 22-22h4c12.15 0 22 9.85 22 22v11H24V58Z"
                    fill={WHITE}
                    stroke={OUTLINE}
                    strokeWidth="3"
                />
                <path d="M28 68h40v7a20 20 0 0 1-40 0v-7Z" fill="#E2E3E9" />
                <rect
                    x="24"
                    y="25"
                    width="48"
                    height="34"
                    rx="17"
                    fill={WHITE}
                    stroke={OUTLINE}
                    strokeWidth="3"
                />
                <path d="M48 16v9" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
                <circle cx="48" cy="13" r="4" fill={SKY} stroke={OUTLINE} strokeWidth="2" />
                <path d="M16 46h9v14h-9z" fill="#BEF264" stroke={OUTLINE} strokeWidth="3" />
                <path d="M71 46h9v14h-9z" fill={SKY} stroke={OUTLINE} strokeWidth="3" />
                <rect
                    x="18"
                    y="70"
                    width="20"
                    height="8"
                    rx="4"
                    fill={SKY}
                    stroke={OUTLINE}
                    strokeWidth="3"
                />
                <circle
                    className={config.animated ? 'assistant-avatar-eye' : ''}
                    cx="39"
                    cy="42"
                    r="3.5"
                    fill={EMERALD}
                />
                <circle
                    className={config.animated ? 'assistant-avatar-eye' : ''}
                    cx="57"
                    cy="42"
                    r="3.5"
                    fill={EMERALD}
                />
                {renderMouth(config.mouth)}
            </svg>
        </div>
    );
};

export default AssistantAvatar;
