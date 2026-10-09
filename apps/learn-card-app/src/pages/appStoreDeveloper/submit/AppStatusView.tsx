import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    checkmarkOutline,
    copyOutline,
    createOutline,
    openOutline,
    sparklesOutline,
} from 'ionicons/icons';
import type { AppStoreListing } from '@learncard/types';

import { Confetti } from '../../issue/components/Confetti';
import { StoreListingPreview } from './StoreListingPreview';
import { listingToData } from './listingForm';
import { withPendingChanges } from './listingLifecycle';
import { getLaunchSummary, parseLaunchConfig } from './launchSettings';
import type { ListingMode } from './listingLifecycle';

type StatusMode = Exclude<ListingMode, 'draft'>;

interface AppStatusViewProps {
    listing: AppStoreListing;
    mode: StatusMode;
    celebrate: boolean;
    hasNewAppChanges: boolean;
    isWorking: boolean;
    shareUrl: string;
    onMakeChanges: () => void;
    onEdit: () => void;
    onViewInStore: () => void;
    onOpenDashboard: () => void;
}

const formatDay = (iso?: string): string | undefined => {
    if (!iso) return undefined;
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? undefined
        : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

interface Step {
    label: string;
    detail?: string;
    state: 'done' | 'current' | 'upcoming';
}

const getSteps = (mode: StatusMode, listing: AppStoreListing): Step[] => {
    const isUpdate = mode === 'update-in-review';
    const submittedAt = isUpdate ? listing.pending_update?.submitted_at : listing.submitted_at;
    const inReview = mode === 'in-review' || isUpdate;

    return [
        {
            label: isUpdate ? 'Update sent' : 'Submitted',
            detail: formatDay(submittedAt),
            state: 'done',
        },
        { label: 'In review', state: inReview ? 'current' : 'done' },
        {
            label: isUpdate ? 'Update live' : 'Live in the store',
            state: mode === 'live' ? 'done' : 'upcoming',
        },
    ];
};

const COPY: Record<StatusMode, (name: string) => { title: string; body: string }> = {
    'in-review': name => ({
        title: `${name} is in review`,
        body: "We're taking a look. You'll get a notification the moment it's live.",
    }),
    'update-in-review': name => ({
        title: 'Your update is in review',
        body: `${name} stays live as it is until the update is approved.`,
    }),
    'live': name => ({
        title: `${name} is live`,
        body: 'Learners can find it in the store now.',
    }),
    'removed': name => ({
        title: `${name} isn't in the store`,
        body: 'It was removed from the store. Open your app dashboard to see what to do next.',
    }),
};

const ProgressTracker: React.FC<{ steps: Step[] }> = ({ steps }) => {
    const [filled, setFilled] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setFilled(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const doneCount = steps.filter(step => step.state === 'done').length;
    const currentIndex = steps.findIndex(step => step.state === 'current');
    const reached = currentIndex >= 0 ? currentIndex : doneCount - 1;
    const progress = steps.length > 1 ? (reached / (steps.length - 1)) * 100 : 100;

    return (
        <div className="relative mt-8 mb-2" role="list" aria-label="Review progress">
            <div className="absolute left-[16.66%] right-[16.66%] top-4 h-1 rounded-full bg-grayscale-200">
                <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-1000 ease-out"
                    style={{ width: filled ? `${progress}%` : '0%' }}
                />
            </div>
            <div className="relative grid grid-cols-3">
                {steps.map(step => (
                    <div key={step.label} role="listitem" className="flex flex-col items-center">
                        <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center border-4 border-white transition-colors duration-500 ${
                                step.state === 'done'
                                    ? 'bg-emerald-500 text-white'
                                    : step.state === 'current'
                                      ? 'bg-amber-400 text-white'
                                      : 'bg-grayscale-200 text-grayscale-400'
                            }`}
                        >
                            {step.state === 'done' ? (
                                <IonIcon icon={checkmarkOutline} className="text-base" />
                            ) : step.state === 'current' ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-white motion-safe:animate-pulse" />
                            ) : (
                                <span className="w-2 h-2 rounded-full bg-grayscale-400" />
                            )}
                        </span>
                        <span
                            className={`mt-2 text-xs font-medium text-center ${
                                step.state === 'upcoming'
                                    ? 'text-grayscale-400'
                                    : 'text-grayscale-800'
                            }`}
                        >
                            {step.label}
                        </span>
                        {step.detail && (
                            <span className="text-xs text-grayscale-500">{step.detail}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AppStatusView: React.FC<AppStatusViewProps> = ({
    listing,
    mode,
    celebrate,
    hasNewAppChanges,
    isWorking,
    shareUrl,
    onMakeChanges,
    onEdit,
    onViewInStore,
    onOpenDashboard,
}) => {
    const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
    const [copied, setCopied] = useState(false);
    const working = withPendingChanges(listing);
    const data = listingToData(working);
    const name = data.name || 'Your app';
    const { title, body } = COPY[mode](name);
    const inReview = mode === 'in-review' || mode === 'update-in-review';

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard can be blocked; the link is still on screen in the address bar.
        }
    };

    const primaryClass =
        'py-3 px-5 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2';
    const secondaryClass =
        'py-3 px-5 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2';

    return (
        <div className="w-full max-w-[560px] mx-auto font-poppins py-8">
            <div className="relative overflow-hidden bg-white rounded-[20px] border border-grayscale-200 shadow-sm p-8 text-center animate-fade-in-up">
                {celebrate && <Confetti />}

                <img
                    src={data.iconUrl}
                    alt=""
                    className={`w-24 h-24 rounded-[24px] object-cover border border-grayscale-200 shadow-md mx-auto ${
                        celebrate ? 'motion-safe:animate-card-pop' : ''
                    }`}
                />
                <h1 className="mt-5 text-xl font-semibold text-grayscale-900">{title}</h1>
                <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">{body}</p>
                <p className="mt-2 text-xs text-grayscale-500 break-words">
                    {getLaunchSummary(
                        working.launch_type,
                        parseLaunchConfig(working.launch_config_json)
                    )}
                </p>

                {mode !== 'removed' && <ProgressTracker steps={getSteps(mode, listing)} />}

                {hasNewAppChanges && mode === 'live' && (
                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-left">
                        <IonIcon
                            icon={sparklesOutline}
                            className="text-emerald-600 text-xl shrink-0"
                        />
                        <p className="flex-1 text-sm text-emerald-800">
                            Your app does something new. Review it and send an update.
                        </p>
                        <button type="button" onClick={onEdit} className={primaryClass}>
                            Review
                        </button>
                    </div>
                )}

                {confirmingWithdraw ? (
                    <div className="mt-8 p-4 bg-grayscale-10 border border-grayscale-200 rounded-2xl text-left">
                        <p className="text-sm text-grayscale-700">
                            Take it out of review so you can edit? You can resubmit anytime.
                        </p>
                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmingWithdraw(false)}
                                className={secondaryClass}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onMakeChanges}
                                disabled={isWorking}
                                className={primaryClass}
                            >
                                {isWorking && (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                {isWorking ? 'Withdrawing…' : 'Withdraw and Edit'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {inReview && (
                            <button
                                type="button"
                                onClick={() => setConfirmingWithdraw(true)}
                                className={secondaryClass}
                            >
                                <IonIcon icon={createOutline} />
                                Make Changes
                            </button>
                        )}
                        {mode === 'live' && (
                            <button type="button" onClick={onEdit} className={secondaryClass}>
                                <IonIcon icon={createOutline} />
                                Edit Listing
                            </button>
                        )}
                        {mode === 'removed' ? (
                            <button
                                type="button"
                                onClick={onOpenDashboard}
                                className={`${primaryClass} sm:col-span-2`}
                            >
                                Open App Dashboard
                            </button>
                        ) : (
                            <button type="button" onClick={onViewInStore} className={primaryClass}>
                                <IonIcon icon={openOutline} />
                                {mode === 'live' ? 'View in Store' : 'Preview Store Page'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-6">
                <p className="text-xs font-medium text-grayscale-500 text-center mb-3">
                    {mode === 'live' ? 'In the store' : 'How it will look in the store'}
                </p>
                <StoreListingPreview
                    name={data.name}
                    tagline={data.tagline}
                    description={data.description}
                    iconUrl={data.iconUrl}
                    category={data.category}
                    ageRating={data.ageRating}
                    screenshots={data.screenshots}
                    highlights={data.highlights}
                    heroColor={data.heroColor}
                />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                <span className="text-grayscale-500">
                    Come back to this page anytime to check on your app.
                </span>
                <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center gap-1.5 font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors"
                >
                    <IonIcon icon={copied ? checkmarkOutline : copyOutline} />
                    {copied ? 'Copied' : 'Copy Link'}
                </button>
            </div>
            {mode !== 'removed' && (
                <div className="mt-3 text-center">
                    <button
                        type="button"
                        onClick={onOpenDashboard}
                        className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                    >
                        Open App Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};
