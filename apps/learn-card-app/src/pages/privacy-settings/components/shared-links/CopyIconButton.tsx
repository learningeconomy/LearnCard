import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmark, copyOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

import './sharedLinks.css';

const COPIED_MS = 1500;

type CopyIconButtonProps = {
    label: string;
    onCopy: () => Promise<boolean>;
    disabled?: boolean;
    /** `icon` = 36px round row action; `primary` = full-width sheet button with text. */
    variant?: 'icon' | 'primary';
    text?: string;
};

const CopyIconButton: React.FC<CopyIconButtonProps> = ({
    label,
    onCopy,
    disabled = false,
    variant = 'icon',
    text,
}) => {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>();
    const mounted = useRef(true);

    useEffect(
        () => () => {
            mounted.current = false;
            clearTimeout(timer.current);
        },
        []
    );

    const handleClick = async (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!(await onCopy()) || !mounted.current) return;
        if (Capacitor.isNativePlatform())
            void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    };

    const icon = (
        <IonIcon
            key={copied ? 'check' : 'copy'}
            icon={copied ? checkmark : copyOutline}
            className={copied ? 'sl-copy-pop' : undefined}
            aria-hidden="true"
        />
    );

    if (variant === 'primary')
        return (
            <button
                type="button"
                aria-label={label}
                disabled={disabled}
                onClick={event => void handleClick(event)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[20px] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${copied ? 'bg-emerald-600' : 'bg-grayscale-900 hover:opacity-90'}`}
            >
                {icon}
                {text}
            </button>
        );

    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={event => void handleClick(event)}
            className={`relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[17px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${copied ? 'bg-emerald-50 text-emerald-700' : 'text-grayscale-600 hover:bg-grayscale-100 hover:text-grayscale-900'}`}
        >
            {icon}
        </button>
    );
};

export default CopyIconButton;
