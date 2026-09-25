import React from 'react';
import { IonIcon } from '@ionic/react';
import { chevronForward } from 'ionicons/icons';

import GlassCard from '../GlassCard';

export const SectionHeader: React.FC<{
    title: string;
    caption?: string;
    action?: React.ReactNode;
}> = ({ title, caption, action }) => (
    <div className="mb-2 flex items-baseline justify-between gap-4 px-1">
        <div className="flex min-w-0 items-baseline gap-2">
            <h3 className="text-[15px] font-semibold text-grayscale-900">{title}</h3>
            {caption && <span className="text-xs text-grayscale-500">{caption}</span>}
        </div>
        {action}
    </div>
);

export const QuietTextButton: React.FC<{
    onClick: () => void;
    icon?: string;
    children: React.ReactNode;
}> = ({ onClick, icon, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
    >
        {icon && <IonIcon icon={icon} aria-hidden="true" />}
        {children}
    </button>
);

export const ListShell: React.FC<{ children: React.ReactNode; label: string }> = ({
    children,
    label,
}) => (
    <GlassCard className="overflow-hidden">
        <ul aria-label={label} className="divide-y divide-grayscale-100">
            {children}
        </ul>
    </GlassCard>
);

export const SkeletonRows: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <>
        {Array.from({ length: count }, (_, index) => (
            <li key={index} aria-hidden="true" className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/5 rounded-full bg-grayscale-100 motion-safe:animate-pulse" />
                    <div className="h-3 w-3/5 rounded-full bg-grayscale-100 motion-safe:animate-pulse" />
                </div>
                <div className="h-8 w-8 rounded-full bg-grayscale-100 motion-safe:animate-pulse" />
            </li>
        ))}
    </>
);

export const MessageRow: React.FC<{
    tone?: 'muted' | 'error';
    children: React.ReactNode;
    action?: React.ReactNode;
}> = ({ tone = 'muted', children, action }) => (
    <li className="flex flex-col items-center gap-2 px-6 py-6 text-center">
        <p
            role={tone === 'error' ? 'alert' : undefined}
            className={`text-sm leading-relaxed ${tone === 'error' ? 'text-red-700' : 'text-grayscale-600'}`}
        >
            {children}
        </p>
        {action}
    </li>
);

export const ViewAllRow: React.FC<{ label: string; onClick: () => void }> = ({
    label,
    onClick,
}) => (
    <li>
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-center gap-1 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 hover:text-grayscale-900"
        >
            {label}
            <IonIcon icon={chevronForward} aria-hidden="true" className="rtl:-scale-x-100" />
        </button>
    </li>
);
