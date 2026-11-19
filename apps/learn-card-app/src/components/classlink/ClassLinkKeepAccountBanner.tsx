import React from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, keypadOutline, shieldOutline } from 'ionicons/icons';

import * as m from '../../paraglide/messages.js';

export type ClassLinkKeepAccountBannerProps = {
    /**
     * What is left: a personal email; then a PIN (escrow accounts), the current PIN once so
     * the backup follows the new sign-in email (`confirmPin`), or a passkey or recovery
     * phrase (`method`: accounts that cannot have escrow here).
     */
    step: 'email' | 'pin' | 'confirmPin' | 'method';
    /** `pin` only: the PIN is locked, so the ask is for a new one. */
    pinLocked?: boolean;
    /** `method` only: a recovery phrase, where this device cannot make a passkey. */
    phrase?: boolean;
    /** The headline: "Keep your account after school" for a student, else "Keep your account". */
    title: string;
    onStart: () => void;
    onSnooze: () => void;
};

/**
 * Dashboard banner inviting a ClassLink user to keep their account after school: add a
 * personal email to sign in with, then create a PIN, enter the current PIN once (so the
 * backup follows the new sign-in email) or add a passkey / recovery phrase if the account
 * still needs one. Shown in the recovery banner's slot (and instead of it) while the
 * server says there is a step left; the host owns visibility and the snooze. The PIN ask
 * uses the recovery banner's keypad icon and words, so the same ask always looks the same.
 */
export const ClassLinkKeepAccountBanner: React.FC<ClassLinkKeepAccountBannerProps> = ({
    step,
    pinLocked = false,
    phrase = false,
    title,
    onStart,
    onSnooze,
}) => {
    let body: string;
    let action: string;
    if (step === 'confirmPin') {
        body = m['classlinkKeepAccount.banner.confirmPinBody']();
        action = m['classlinkKeepAccount.banner.confirmPinAction']();
    } else if (step === 'pin') {
        body = pinLocked
            ? m['classlinkKeepAccount.banner.pinLockedBody']()
            : m['classlinkKeepAccount.banner.pinBody']();
        action = pinLocked
            ? m['recovery.pin.pinLocked.action']()
            : m['recovery.prompt.pinFirst.action']();
    } else if (step === 'method') {
        body = phrase
            ? m['classlinkKeepAccount.methodBodyPhrase']()
            : m['classlinkKeepAccount.methodBody']();
        action = phrase
            ? m['classlinkKeepAccount.addPhrase']()
            : m['classlinkKeepAccount.addPasskey']();
    } else {
        body = m['classlinkKeepAccount.banner.emailBody']();
        action = m['classlinkKeepAccount.banner.action']();
    }

    return (
        <div
            data-testid="dashboard-keep-account-banner"
            data-step={step}
            className="animate-fade-in-up w-full flex items-stretch rounded-[20px] border bg-white border-grayscale-200"
        >
            <button
                type="button"
                onClick={onStart}
                className="group flex-1 min-w-0 flex items-center gap-3 p-4 text-start rounded-[20px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
                <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                    <IonIcon
                        icon={
                            step === 'pin' || step === 'confirmPin' ? keypadOutline : shieldOutline
                        }
                        className="text-lg text-emerald-600"
                    />
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold leading-tight text-grayscale-900 text-balance">
                        {title}
                    </span>
                    <span className="block text-xs leading-snug mt-0.5 text-grayscale-600">
                        {body}
                    </span>
                    <span className="block text-xs font-semibold mt-1 text-grayscale-800">
                        {action}
                    </span>
                </span>
            </button>
            <button
                type="button"
                onClick={onSnooze}
                aria-label={m['classlinkKeepAccount.banner.snoozeAria']()}
                className="self-center me-3 p-2 rounded-full text-grayscale-500 hover:text-grayscale-700 hover:bg-grayscale-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
            >
                <IonIcon icon={closeOutline} className="text-lg" />
            </button>
        </div>
    );
};
