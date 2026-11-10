import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    checkmark,
    documentTextOutline,
    hourglassOutline,
    notificationsOutline,
    paperPlaneOutline,
    ribbonOutline,
} from 'ionicons/icons';
import { useRequestTranscript, useTranscriptStatus, getLogger } from 'learn-card-base';
import { formatClrGpa } from 'learn-card-base/helpers/credentials/clr/helpers';

import * as m from '../../paraglide/messages.js';
import { getLocale } from '../../paraglide/runtime.js';
import { useAnalytics, AnalyticsEvents } from '@analytics';
import { useTranscriptArrival } from '../../hooks/useTranscriptArrival';
import { useReceivedTranscript } from '../../hooks/useReceivedTranscript';
import BoostEarnedCard from '../boost/boost-earned-card/BoostEarnedCard';
import { getTranscriptCategory } from './transcriptCategory';
import { TranscriptDeliveryProgress } from './TranscriptDeliveryProgress';
import { formatExpectedDelivery, getDeliveryPace } from './transcriptDelivery';
import {
    TranscriptConsentCheckbox,
    TranscriptErrorBanner,
    getTranscriptErrorMessage,
} from './TranscriptConsent';

const log = getLogger('transcript-request-flow');

/** After this long without arrival, the flow lets the student move on. */
export const TRANSCRIPT_FLOW_PATIENCE_MS = 90_000;
/** Extra time past a timed estimate before the flow lets the student move on. */
export const TRANSCRIPT_FLOW_ESTIMATE_GRACE_MS = 60_000;

type RequestOutcome = {
    status: 'requested' | 'none_yet' | 'failed';
    requestedAt: string;
    requestId?: string;
    expectedBy?: string;
};

export type TranscriptRequestFlowProps = {
    /** `onboarding` fills the onboarding step; `modal` sits inside a sheet. */
    variant: 'onboarding' | 'modal';
    stateDisplayName: string;
    /** Called when the student leaves the flow (Not now, Continue). */
    onDone: (result: { requested: boolean }) => void | Promise<void>;
};

const primaryButton =
    'w-full min-h-[48px] py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed';
const quietButton =
    'w-full min-h-[48px] py-3 px-4 rounded-[20px] text-grayscale-600 font-medium text-sm hover:bg-grayscale-10 hover:text-grayscale-900 transition-colors disabled:opacity-40';

const Hero: React.FC<{
    icon: string;
    tone: 'emerald' | 'amber' | 'grayscale';
    /** `working` radiates soft ripples while we wait; `arrived` pops in once. */
    motion?: 'working' | 'arrived';
}> = ({ icon, tone, motion }) => {
    const tones = {
        emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
        amber: 'bg-amber-50 text-amber-600 ring-amber-100',
        grayscale: 'bg-grayscale-100 text-grayscale-600 ring-grayscale-200',
    };
    const ripple =
        'absolute inset-0 rounded-full bg-emerald-200 opacity-0 motion-safe:animate-transcript-ripple motion-reduce:hidden';
    return (
        <div className="relative mx-auto mb-6 h-20 w-20" data-testid="transcript-flow-hero">
            {motion === 'working' && (
                <>
                    <span aria-hidden="true" className={ripple} />
                    <span aria-hidden="true" className={`${ripple} [animation-delay:1.4s]`} />
                </>
            )}
            <div
                className={`relative flex h-20 w-20 items-center justify-center rounded-full ring-8 ${tones[tone]} ${
                    motion === 'arrived' ? 'motion-safe:animate-pop-in' : ''
                }`}
            >
                <IonIcon icon={icon} className="text-4xl" aria-hidden="true" />
            </div>
        </div>
    );
};

type StepState = 'done' | 'active' | 'pending';

const ProgressStep: React.FC<{ label: string; state: StepState; last?: boolean }> = ({
    label,
    state,
    last,
}) => (
    <li className="relative flex items-start gap-3 pb-5 last:pb-0">
        {!last && (
            <span
                aria-hidden="true"
                className={`absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-0.5 overflow-hidden rounded-full transition-colors duration-500 ${
                    state === 'done' ? 'bg-emerald-200' : 'bg-grayscale-200'
                }`}
            >
                {state === 'active' && (
                    <span className="block h-1/2 w-full rounded-full bg-gradient-to-b from-transparent via-emerald-400 to-transparent motion-safe:animate-transcript-flow motion-reduce:hidden" />
                )}
            </span>
        )}
        <span
            aria-hidden="true"
            className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
                state === 'done'
                    ? 'bg-emerald-500 text-white'
                    : state === 'active'
                      ? 'bg-emerald-50 ring-2 ring-emerald-500'
                      : 'bg-grayscale-100 ring-2 ring-grayscale-200'
            }`}
        >
            {state === 'done' && <IonIcon icon={checkmark} className="text-sm" />}
            {state === 'active' && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 motion-safe:animate-pulse-dot" />
            )}
        </span>
        <span
            className={`pt-0.5 text-left text-sm leading-relaxed transition-colors duration-500 ${
                state === 'pending' ? 'text-grayscale-400' : 'text-grayscale-900 font-medium'
            }`}
        >
            {label}
            <span className="sr-only">
                {state === 'done' ? ' (done)' : state === 'active' ? ' (in progress)' : ''}
            </span>
        </span>
    </li>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex-1 rounded-2xl bg-grayscale-10 border border-grayscale-200 px-3 py-3 text-center">
        <p className="text-lg font-semibold text-grayscale-900">{value}</p>
        <p className="text-xs text-grayscale-500">{label}</p>
    </div>
);

/**
 * Guided "get your transcript" flow: ask, on its way (live progress), arrived. It stays on
 * screen until the student continues, so they see the transcript land instead of a request
 * silently disappearing. Arrival tracking and claiming are delegated to useTranscriptArrival.
 */
export const TranscriptRequestFlow: React.FC<TranscriptRequestFlowProps> = ({
    variant,
    stateDisplayName,
    onDone,
}) => {
    const { track } = useAnalytics();
    const locale = getLocale();
    const requestTranscript = useRequestTranscript();
    const status = useTranscriptStatus(true);
    const [consent, setConsent] = useState(false);
    const [error, setError] = useState('');
    const [isFinishing, setIsFinishing] = useState(false);
    const [outcome, setOutcome] = useState<RequestOutcome | null>(null);
    const [outOfPatience, setOutOfPatience] = useState(false);
    const headingRef = useRef<HTMLHeadingElement>(null);

    const data = status.data;
    // Only this session's request drives the flow; an older request shows the card instead.
    const latest = outcome && data?.latest?.requestId === outcome.requestId ? data?.latest : null;
    const requestId = outcome?.requestId;
    const receivedAt = latest?.receivedAt;

    const { isPollingExhausted } = useTranscriptArrival({
        status: outcome?.status,
        issuerDid: data?.issuerDid,
        issuerProfileId: data?.issuerProfileId,
        requestId,
        requestedAt: outcome?.requestedAt,
        receivedAt,
    });
    const { entry, model } = useReceivedTranscript({
        issuerDid: data?.issuerDid,
        requestId,
        enabled: Boolean(receivedAt),
    });

    const pace = outcome ? getDeliveryPace(outcome.requestedAt, outcome.expectedBy) : 'quick';
    const step: 'ask' | 'onTheWay' | 'timed' | 'later' | 'arrived' | 'longer' | 'noneYet' =
        outcome?.status === 'none_yet'
            ? 'noneYet'
            : outcome?.status === 'requested'
              ? model
                  ? 'arrived'
                  : pace === 'later'
                    ? 'later'
                    : outOfPatience || isPollingExhausted
                      ? 'longer'
                      : pace === 'timed'
                        ? 'timed'
                        : 'onTheWay'
              : 'ask';

    const isWaiting = step === 'onTheWay' || step === 'timed';
    const timedEstimate = pace === 'timed' ? outcome?.expectedBy : undefined;

    useEffect(() => {
        if (!isWaiting) return;
        const patienceMs = timedEstimate
            ? Math.max(
                  TRANSCRIPT_FLOW_PATIENCE_MS,
                  Date.parse(timedEstimate) - Date.now() + TRANSCRIPT_FLOW_ESTIMATE_GRACE_MS
              )
            : TRANSCRIPT_FLOW_PATIENCE_MS;
        const timer = setTimeout(() => setOutOfPatience(true), patienceMs);
        return () => clearTimeout(timer);
    }, [isWaiting, timedEstimate]);

    // Move focus with the step so screen readers and keyboards follow the story.
    useEffect(() => {
        if (step !== 'ask') headingRef.current?.focus();
    }, [step]);

    const isBusy = requestTranscript.isPending || isFinishing;
    const source = variant === 'modal' ? 'wallet' : 'onboarding';

    const finish = async (requested: boolean): Promise<void> => {
        setIsFinishing(true);
        try {
            await onDone({ requested });
        } finally {
            setIsFinishing(false);
        }
    };

    const handleRequest = async (): Promise<void> => {
        if (!consent || isBusy) return;
        setError('');
        try {
            const result = await requestTranscript.mutateAsync();
            if (result.status === 'failed') {
                setError(m['transcriptOptIn.error']());
                return;
            }
            setOutcome(result);
            track(AnalyticsEvents.TRANSCRIPT_REQUESTED, { source });
        } catch (err) {
            log.error('transcript.request.failed', err);
            setError(getTranscriptErrorMessage(err));
        }
    };

    const handleSkip = async (): Promise<void> => {
        if (isBusy) return;
        track(AnalyticsEvents.TRANSCRIPT_AUTO_ACCEPT_SKIPPED, {
            reason: variant === 'modal' ? 'modal_skipped' : 'onboarding_skipped',
        });
        await finish(false);
    };

    const heading = (text: string) => (
        <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold text-grayscale-900 mb-2 outline-none"
        >
            {text}
        </h2>
    );

    let content: React.ReactNode;
    if (step === 'arrived' && model && entry) {
        const transcriptCategory = getTranscriptCategory(entry.vc);
        const gpa = model.summary.gpa?.value;
        const awarded = model.header.awardedDate?.value;
        const classOf = awarded ? new Date(String(awarded)).getFullYear() : undefined;
        content = (
            <div data-testid="transcript-flow-arrived" className="motion-safe:animate-fade-in-up">
                <Hero icon={ribbonOutline} tone="emerald" motion="arrived" />
                {heading(m['transcriptOptIn.arrivedTitle']())}
                <p className="text-sm text-grayscale-600 mb-6">
                    {m['transcriptOptIn.flow.arrivedBody']()}
                </p>
                <div className="rounded-[20px] border border-grayscale-200 bg-white p-4 mb-6 text-left shadow-sm motion-safe:animate-reveal-card">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <IonIcon icon={documentTextOutline} className="text-xl" />
                        </span>
                        <p className="text-sm font-semibold text-grayscale-900 leading-snug">
                            {model.header.issuerName?.value ||
                                model.header.title?.value ||
                                m['transcriptOptIn.transcript']()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {gpa !== undefined && (
                            <Stat
                                label={m['transcriptOptIn.flow.gpa']()}
                                value={formatClrGpa(gpa)}
                            />
                        )}
                        {model.summary.courseCount > 0 && (
                            <Stat
                                label={m['transcriptOptIn.flow.courses']()}
                                value={String(model.summary.courseCount)}
                            />
                        )}
                        {classOf && (
                            <Stat
                                label={m['transcriptOptIn.flow.classOf']()}
                                value={String(classOf)}
                            />
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <BoostEarnedCard
                        record={{ uri: entry.uri, category: transcriptCategory }}
                        credential={entry.vc}
                        categoryType={transcriptCategory}
                        renderPreviewTrigger={openPreview => (
                            <button
                                type="button"
                                data-testid="transcript-flow-view"
                                className={primaryButton}
                                onClick={openPreview}
                            >
                                {m['transcriptOptIn.viewTranscript']()}
                            </button>
                        )}
                    />
                    <button
                        type="button"
                        data-testid="transcript-flow-continue"
                        className={quietButton}
                        onClick={() => void finish(true)}
                        disabled={isFinishing}
                    >
                        {m['transcriptOptIn.flow.continue']()}
                    </button>
                </div>
            </div>
        );
    } else if (step === 'timed' && outcome?.expectedBy) {
        content = (
            <div data-testid="transcript-flow-timed" className="motion-safe:animate-fade-in-up">
                <Hero icon={documentTextOutline} tone="emerald" motion="working" />
                {heading(m['transcriptOptIn.flow.onTheWayTitle']())}
                <p className="text-sm text-grayscale-600 mb-6">
                    {m['transcriptOptIn.delivery.notifyYou']()}
                </p>
                <div className="rounded-[20px] border border-grayscale-200 bg-white/90 backdrop-blur-md p-5 mb-6 shadow-sm">
                    <TranscriptDeliveryProgress
                        requestedAt={outcome.requestedAt}
                        expectedBy={outcome.expectedBy}
                        received={Boolean(receivedAt)}
                        stage={m['transcriptOptIn.flow.preparing']()}
                    />
                </div>
            </div>
        );
    } else if (step === 'later' && outcome?.expectedBy) {
        content = (
            <div data-testid="transcript-flow-later" className="motion-safe:animate-fade-in-up">
                <Hero icon={paperPlaneOutline} tone="emerald" motion="arrived" />
                {heading(m['transcriptOptIn.delivery.requestedTitle']())}
                <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                    {m['transcriptOptIn.delivery.expectedWhen']({
                        when: formatExpectedDelivery(outcome.expectedBy, Date.now(), locale),
                    })}
                </p>
                <div className="flex items-center gap-3 rounded-[20px] border border-grayscale-200 bg-white/90 backdrop-blur-md p-4 mb-8 text-left shadow-sm motion-safe:animate-reveal-card">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <IonIcon
                            icon={notificationsOutline}
                            className="text-xl"
                            aria-hidden="true"
                        />
                    </span>
                    <p className="text-sm text-grayscale-700 leading-snug">
                        {m['transcriptOptIn.delivery.notifyYou']()}
                    </p>
                </div>
                <button
                    type="button"
                    data-testid="transcript-flow-continue"
                    className={primaryButton}
                    onClick={() => void finish(true)}
                    disabled={isFinishing}
                >
                    {m['transcriptOptIn.flow.continue']()}
                </button>
            </div>
        );
    } else if (step === 'onTheWay') {
        content = (
            <div
                data-testid="transcript-flow-on-the-way"
                className="motion-safe:animate-fade-in-up"
            >
                <Hero icon={documentTextOutline} tone="emerald" motion="working" />
                {heading(m['transcriptOptIn.flow.onTheWayTitle']())}
                <p className="text-sm text-grayscale-600 mb-6">
                    {m['transcriptOptIn.flow.usuallyTakes']()}
                </p>
                <ol className="rounded-[20px] border border-grayscale-200 bg-white p-5 mb-6 shadow-sm">
                    <ProgressStep label={m['transcriptOptIn.flow.requestSent']()} state="done" />
                    <ProgressStep
                        label={m['transcriptOptIn.flow.preparing']()}
                        state={receivedAt ? 'done' : 'active'}
                    />
                    <ProgressStep
                        label={m['transcriptOptIn.flow.adding']()}
                        state={receivedAt ? 'active' : 'pending'}
                        last
                    />
                </ol>
            </div>
        );
    } else if (step === 'longer') {
        content = (
            <div data-testid="transcript-flow-longer" className="motion-safe:animate-fade-in-up">
                <Hero icon={hourglassOutline} tone="amber" />
                {heading(m['transcriptOptIn.flow.stillWorkingTitle']())}
                <p className="text-sm text-grayscale-600 leading-relaxed mb-8">
                    {m['transcriptOptIn.flow.takingLonger']()}
                </p>
                <button
                    type="button"
                    data-testid="transcript-flow-continue"
                    className={primaryButton}
                    onClick={() => void finish(true)}
                    disabled={isFinishing}
                >
                    {m['transcriptOptIn.flow.continue']()}
                </button>
            </div>
        );
    } else if (step === 'noneYet') {
        content = (
            <div data-testid="transcript-flow-none-yet" className="motion-safe:animate-fade-in-up">
                <Hero icon={documentTextOutline} tone="grayscale" />
                {heading(m['transcriptOptIn.flow.noneYetTitle']())}
                <p className="text-sm text-grayscale-600 leading-relaxed mb-8">
                    {m['transcriptOptIn.noneYet']()}
                </p>
                <button
                    type="button"
                    data-testid="transcript-flow-continue"
                    className={primaryButton}
                    onClick={() => void finish(true)}
                    disabled={isFinishing}
                >
                    {m['transcriptOptIn.flow.continue']()}
                </button>
            </div>
        );
    } else {
        content = (
            <div data-testid="transcript-flow-ask" className="motion-safe:animate-fade-in-up">
                <Hero icon={documentTextOutline} tone="emerald" />
                <h2 className="text-2xl font-semibold text-grayscale-900 mb-2">
                    {m['onboarding.transcript.title']()}
                </h2>
                <p className="text-sm text-grayscale-600 mb-6">
                    {m['onboarding.transcript.desc']()}
                </p>
                <div className="mb-4">
                    <TranscriptConsentCheckbox
                        checked={consent}
                        onChange={setConsent}
                        stateDisplayName={stateDisplayName}
                        disabled={isBusy}
                    />
                </div>
                {error && (
                    <div className="mb-4">
                        <TranscriptErrorBanner message={error} />
                    </div>
                )}
                <div className="space-y-2">
                    <button
                        type="button"
                        data-testid="onboarding-transcript-get"
                        disabled={!consent || isBusy}
                        onClick={() => void handleRequest()}
                        className={primaryButton}
                    >
                        {requestTranscript.isPending ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {m['transcriptOptIn.requesting']()}
                            </span>
                        ) : error ? (
                            m['transcriptOptIn.tryAgain']()
                        ) : (
                            m['onboarding.transcript.get']()
                        )}
                    </button>
                    <button
                        type="button"
                        data-testid="onboarding-transcript-skip"
                        disabled={isBusy}
                        onClick={() => void handleSkip()}
                        className={quietButton}
                    >
                        {m['onboarding.transcript.notNow']()}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <section
            data-testid="transcript-request-flow"
            aria-live="polite"
            className={`w-full max-w-[420px] mx-auto text-center font-poppins ${
                variant === 'modal' ? 'py-2' : ''
            }`}
        >
            {content}
        </section>
    );
};
