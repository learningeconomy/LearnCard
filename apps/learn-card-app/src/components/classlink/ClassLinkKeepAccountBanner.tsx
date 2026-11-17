import React from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, shieldOutline } from 'ionicons/icons';

import * as m from '../../paraglide/messages.js';

export type ClassLinkKeepAccountBannerProps = {
    /** What is left: a personal email, or a passkey / recovery phrase. */
    step: 'email' | 'method';
    onStart: () => void;
    onSnooze: () => void;
};

/**
 * Dashboard banner inviting a ClassLink user to keep their account after school. Shown in
 * the recovery banner's slot (and instead of it) while the server says there is a step
 * left; the host owns visibility and its own snooze.
 */
export const ClassLinkKeepAccountBanner: React.FC<ClassLinkKeepAccountBannerProps> = ({
    step,
    onStart,
    onSnooze,
}) => (
    <div
        data-testid="dashboard-keep-account-banner"
        className="animate-fade-in-up w-full flex items-stretch rounded-[20px] border bg-white border-grayscale-200"
    >
        <button
            type="button"
            onClick={onStart}
            className="group flex-1 min-w-0 flex items-center gap-3 p-4 text-start rounded-[20px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
            <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                <IonIcon icon={shieldOutline} className="text-lg text-emerald-600" />
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold leading-tight text-grayscale-900">
                    {m['classlinkKeepAccount.banner.title']()}
                </span>
                <span className="block text-xs leading-snug mt-0.5 text-grayscale-600">
                    {step === 'method'
                        ? m['classlinkKeepAccount.banner.methodBody']()
                        : m['classlinkKeepAccount.banner.emailBody']()}
                </span>
                <span className="block text-xs font-semibold mt-1 text-grayscale-800">
                    {m['classlinkKeepAccount.banner.action']()}
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
