import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline, megaphoneOutline } from 'ionicons/icons';
import type { CampaignStatus } from '@learncard/types';
import type { CampaignSectionProps, CampaignToggleProps } from './types';

const interactionClass =
    'inline-flex items-center justify-center gap-2 py-3 px-4 rounded-[20px] font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed';
export const inputClass =
    'w-full min-w-0 py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white disabled:bg-grayscale-100 disabled:text-grayscale-600';
export const buttonClass = `${interactionClass} border border-solid border-grayscale-300 bg-white text-grayscale-700 hover:bg-grayscale-100`;
export const primaryClass = `${interactionClass} bg-grayscale-900 text-white hover:bg-grayscale-800`;
export const textButtonClass = `${interactionClass} text-grayscale-600 hover:bg-grayscale-100 hover:text-grayscale-900`;
export const panelClass =
    'p-5 sm:p-6 bg-white border border-grayscale-200 rounded-[20px] space-y-5';

export const CampaignMark = () => (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <IonIcon icon={megaphoneOutline} className="text-xl" aria-hidden="true" />
    </span>
);

export const StatusPill: React.FC<{ status: CampaignStatus }> = ({ status }) => (
    <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
            status === 'live'
                ? 'bg-emerald-50 text-emerald-900'
                : status === 'paused'
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-grayscale-100 text-grayscale-700'
        }`}
    >
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
);

export const SectionHeading: React.FC<CampaignSectionProps> = ({ step, title, description }) => (
    <div className="flex items-start gap-3">
        {step && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grayscale-100 text-xs font-semibold text-grayscale-600">
                {step}
            </span>
        )}
        <div>
            <h2 className="text-base font-semibold text-grayscale-900">{title}</h2>
            {description && (
                <p className="mt-1 text-xs leading-relaxed text-grayscale-600">{description}</p>
            )}
        </div>
    </div>
);

export const Toggle: React.FC<CampaignToggleProps> = ({
    label,
    description,
    checked,
    onChange,
}) => (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
        <span>
            <span className="block text-sm font-medium text-grayscale-900">{label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-grayscale-600">
                {description}
            </span>
        </span>
        <span className="relative shrink-0">
            <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                aria-label={label}
            />
            <span className="block h-6 w-11 rounded-full bg-grayscale-300 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 peer-disabled:opacity-40" />
            <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
        </span>
    </label>
);

export const Field: React.FC<React.PropsWithChildren<{ label: string; htmlFor: string }>> = ({
    label,
    htmlFor,
    children,
}) => (
    <div className="min-w-0 space-y-2">
        <label htmlFor={htmlFor} className="block text-xs font-medium text-grayscale-700">
            {label}
        </label>
        {children}
    </div>
);
export const Notice: React.FC<React.PropsWithChildren<{ error?: boolean }>> = ({
    error,
    children,
}) => (
    <div
        role={error ? 'alert' : 'status'}
        className={`flex items-start gap-2.5 p-3 border rounded-2xl text-sm leading-relaxed ${error ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}
    >
        <IonIcon
            icon={error ? alertCircleOutline : checkmarkCircleOutline}
            className="mt-0.5 shrink-0 text-lg"
            aria-hidden="true"
        />
        <div className="min-w-0 break-words">{children}</div>
    </div>
);
export const Busy: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center gap-2">
        <span
            aria-hidden="true"
            className="w-4 h-4 shrink-0 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
        {children}
    </span>
);
export const DeferredFeatures = () => (
    <div className="border-t border-grayscale-200 pt-4 space-y-2">
        <button
            type="button"
            disabled
            className={`${buttonClass} w-full`}
            aria-describedby="campaign-send-limit"
        >
            Send Notifications — unavailable
        </button>
        <p id="campaign-send-limit" className="text-xs leading-relaxed text-grayscale-500">
            Audience sending is waiting for recipient counts. You can still send yourself a test.
        </p>
    </div>
);
