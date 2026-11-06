import { useEffect, useMemo, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import {
    type InAppMessage,
    type MyCampaign,
    type InAppMessagePredicate,
    type InAppMessageSettings,
    type InvalidInAppMessage,
} from '@learncard/types';

import {
    explainMessage,
    messageMatches,
    pickHighestPriority,
    type InAppMessageRuntimeContext,
    type PredicateTrace,
} from './predicates';
import { shouldSuppressMessage, onDismissalsReset } from './dismissalStore';
import { useInAppMessageRuntimeContext } from './useRuntimeContext';
import { iamDebug, isInAppMessagesDebug } from './debug';
import { useCredentialFacts, type CredentialFactsState } from './useCredentialFacts';
import { onInAppMessageEventsChanged, useRecentInAppMessageEvents } from './inAppMessageEvents';
import { shouldSuppressByFatigue, onFatigueChanged } from './fatigueStore';
import { isInAppMessagePresentationSupported } from './presentationSupport';
import {
    IN_APP_MESSAGES_FLAG_KEY,
    inspectInAppMessagesFlagDelivery,
    readInAppMessagesFlags,
} from './flagDelivery';

import {
    EMPTY_CAMPAIGNS,
    mergeCampaignMessages,
    isCampaignInWindow,
    isCampaignFrequencySuppressed,
} from './campaignMessages';

export { IN_APP_MESSAGES_FLAG_KEY, LEGACY_IN_APP_MESSAGES_FLAG_KEY } from './flagDelivery';

export interface InAppMessageDiagnostic {
    id: string;
    source: 'flag' | 'campaign';
    priority: number;
    enabled: boolean;
    matched: boolean;
    suppressed: boolean;
    willShow: boolean;
    trace: PredicateTrace | null;
    triggerSatisfied: boolean;
    fatigueSuppressed: boolean;
    presentationSupported: boolean;
}

export type InAppMessagesReportContext = Pick<
    InAppMessageRuntimeContext,
    'platform' | 'role' | 'versions' | 'credentialsComplete'
> & { credentialCount: number | null; recentEventCount: number };

export interface InAppMessagesReport {
    ready: boolean;
    context: InAppMessagesReportContext | null;
    flagMessageCount: number;
    campaignMessageCount?: number;
    diagnostics: InAppMessageDiagnostic[];
    winnerId: string | null;
    invalid: InvalidInAppMessage[];
}

export interface UseInAppMessagesResult {
    messages: InAppMessage[];
    message: InAppMessage | null;
    context: InAppMessageRuntimeContext | null;
    ready: boolean;
    report: InAppMessagesReport;
    credentialFacts: CredentialFactsState;
    settings: InAppMessageSettings;
}

export interface UseInAppMessagesOptions {
    /** Load credential facts even when no active flag message currently requires them. */
    forceCredentialFacts?: boolean;
    campaigns?: MyCampaign[];
}

const EMPTY_REPORT: InAppMessagesReport = {
    ready: false,
    context: null,
    flagMessageCount: 0,
    diagnostics: [],
    winnerId: null,
    invalid: [],
};

const predicateUsesCredentials = (predicate: InAppMessagePredicate): boolean => {
    if ('credential' in predicate) return true;
    if ('all' in predicate) return predicate.all.some(predicateUsesCredentials);
    if ('any' in predicate) return predicate.any.some(predicateUsesCredentials);
    if ('not' in predicate) return predicateUsesCredentials(predicate.not);

    return false;
};

export const messageUsesCredentialFacts = (message: InAppMessage): boolean =>
    Boolean(
        (message.targeting && predicateUsesCredentials(message.targeting)) || message.trigger?.where
    );

// Module-level singletons backing the dev tooling (window.__inAppMessages,
// the debug panel). They assume the single-host invariant: exactly one
// InAppMessageHost is mounted per app. Multiple concurrent callers would
// clobber each other's snapshots (harmless for rendering — each hook call
// derives its own state — but the "last report" would be whichever
// evaluated most recently).
let lastReport: InAppMessagesReport = EMPTY_REPORT;
let lastMessages: InAppMessage[] = [];
let lastCredentialFacts: CredentialFactsState | null = null;

export const getLastInAppMessagesReport = (): InAppMessagesReport => lastReport;

export const getLastInAppMessages = (): InAppMessage[] => lastMessages;
export const getLastInAppMessageCredentialFacts = (): CredentialFactsState | null =>
    lastCredentialFacts;

export const useInAppMessages = (
    flagKey: string = IN_APP_MESSAGES_FLAG_KEY,
    options: UseInAppMessagesOptions = {}
): UseInAppMessagesResult => {
    const flags = useFlags();
    const { context: baseContext, ready: baseReady } = useInAppMessageRuntimeContext();

    const parsed = useMemo(() => readInAppMessagesFlags(flags ?? {}, flagKey), [flags, flagKey]);
    const flagDeliveryDebug = useMemo(
        () => inspectInAppMessagesFlagDelivery(flags ?? {}, parsed, flagKey),
        [flags, flagKey, parsed]
    );
    const debugEnabled = isInAppMessagesDebug();
    const flag = parsed.flag;
    const campaigns = options.campaigns ?? EMPTY_CAMPAIGNS;
    const campaignById = useMemo(
        () => new Map(campaigns.map(item => [item.campaign.id, item])),
        [campaigns]
    );
    const messages = useMemo(
        () => mergeCampaignMessages(flag.messages, campaigns),
        [flag.messages, campaigns]
    );
    const needsCredentialFacts =
        options.forceCredentialFacts ||
        messages.some(message => message.enabled && messageUsesCredentialFacts(message));
    const credentialFacts = useCredentialFacts(needsCredentialFacts);
    const recentEvents = useRecentInAppMessageEvents(credentialFacts.accountDid ?? undefined);
    const factsWaitKey = `${credentialFacts.accountDid ?? 'none'}:${messages
        .filter(message => message.enabled && messageUsesCredentialFacts(message))
        .map(message => message.id)
        .join(',')}`;
    const [timedOutFactsKey, setTimedOutFactsKey] = useState<string | null>(null);
    const [clock, setClock] = useState(() => Date.now());
    const [suppressionRevision, setSuppressionRevision] = useState(0);

    useEffect(() => {
        if (debugEnabled) iamDebug('flag:delivery', flagDeliveryDebug);
    }, [debugEnabled, flagDeliveryDebug]);

    useEffect(() => onInAppMessageEventsChanged(() => setClock(Date.now())), []);

    useEffect(() => {
        const update = (): void => setSuppressionRevision(value => value + 1);
        const removeSeen = onDismissalsReset(update);
        const removeFatigue = onFatigueChanged(update);
        return () => {
            removeSeen();
            removeFatigue();
        };
    }, []);

    useEffect(() => {
        if (!needsCredentialFacts || credentialFacts.complete) return;

        const timeout = globalThis.setTimeout(() => setTimedOutFactsKey(factsWaitKey), 5000);

        return () => globalThis.clearTimeout(timeout);
    }, [credentialFacts.complete, factsWaitKey, needsCredentialFacts]);

    useEffect(() => {
        const deadlines = messages.flatMap(message => {
            if (!message.enabled) return [];
            const campaign = campaignById.get(message.id);
            const schedule = [campaign?.campaign.startsAt, campaign?.campaign.endsAt].flatMap(
                value => (value ? [Date.parse(value)] : [])
            );
            if (!message.trigger) return schedule.filter(deadline => deadline > Date.now());

            return [
                ...schedule,
                ...recentEvents
                    .filter(event => event.event === message.trigger?.event)
                    .map(event => event.occurredAt + message.trigger!.windowMinutes * 60 * 1000),
            ].filter(deadline => deadline > Date.now());
        });

        if (deadlines.length === 0) return;

        const nextDeadline = Math.min(...deadlines);
        const timeout = globalThis.setTimeout(
            () => setClock(Date.now()),
            Math.min(nextDeadline - Date.now() + 1, 2_147_483_647)
        );

        return () => globalThis.clearTimeout(timeout);
    }, [messages, campaignById, recentEvents, clock]);

    const waitingForFacts =
        needsCredentialFacts && !credentialFacts.complete && timedOutFactsKey !== factsWaitKey;
    const ready = baseReady && !waitingForFacts;
    const context = useMemo<InAppMessageRuntimeContext | null>(() => {
        if (!baseContext) return null;

        return {
            ...baseContext,
            now: Math.max(clock, baseContext.now),
            credentials: needsCredentialFacts ? credentialFacts.summaries : null,
            credentialsComplete: needsCredentialFacts && credentialFacts.complete,
            recentEvents,
        };
    }, [
        baseContext,
        clock,
        credentialFacts.complete,
        credentialFacts.summaries,
        needsCredentialFacts,
        recentEvents,
    ]);

    useEffect(() => {
        lastMessages = messages;
    }, [messages]);

    useEffect(() => {
        lastCredentialFacts = credentialFacts;
        return () => {
            if (lastCredentialFacts === credentialFacts) lastCredentialFacts = null;
        };
    }, [credentialFacts]);

    const { message, report } = useMemo(() => {
        if (!ready || !context) {
            return {
                message: null as InAppMessage | null,
                report: {
                    ...EMPTY_REPORT,
                    flagMessageCount: flag.messages.length + parsed.invalid.length,
                    campaignMessageCount: campaigns.length,
                    invalid: parsed.invalid,
                },
            };
        }

        const suppressed = (m: InAppMessage): boolean => {
            const campaign = campaignById.get(m.id);
            return (
                shouldSuppressMessage(
                    m.id,
                    m.frequency,
                    context.now,
                    credentialFacts.accountDid ?? undefined
                ) ||
                Boolean(
                    campaign &&
                    (!isCampaignInWindow(campaign, context.now) ||
                        isCampaignFrequencySuppressed(campaign, context.now))
                )
            );
        };
        const frequencyEligible = messages.filter(
            m =>
                isInAppMessagePresentationSupported(m) &&
                messageMatches(m, context) &&
                !suppressed(m)
        );
        const winner = pickHighestPriority(
            frequencyEligible.filter(
                candidate =>
                    !shouldSuppressByFatigue(
                        candidate,
                        flag.settings,
                        context.now,
                        credentialFacts.accountDid ?? undefined
                    )
            )
        );

        const diagnostics: InAppMessageDiagnostic[] = messages.map(m => {
            const explanation = explainMessage(m, context);
            const presentationSupported = isInAppMessagePresentationSupported(m);
            const frequencySuppressed = suppressed(m);
            const fatigueSuppressed = shouldSuppressByFatigue(
                m,
                flag.settings,
                context.now,
                credentialFacts.accountDid ?? undefined
            );

            return {
                id: m.id,
                source: campaignById.has(m.id) ? 'campaign' : 'flag',
                priority: m.priority,
                enabled: m.enabled,
                matched: explanation.matched,
                suppressed: frequencySuppressed,
                willShow:
                    presentationSupported &&
                    explanation.matched &&
                    !frequencySuppressed &&
                    !fatigueSuppressed,
                trace: explanation.trace,
                triggerSatisfied: explanation.triggerSatisfied,
                fatigueSuppressed,
                presentationSupported,
            };
        });

        const nextReport: InAppMessagesReport = {
            ready: true,
            context: {
                platform: context.platform,
                role: context.role,
                versions: context.versions,
                credentialsComplete: context.credentialsComplete,
                credentialCount: context.credentials?.length ?? null,
                recentEventCount: context.recentEvents.length,
            },
            flagMessageCount: flag.messages.length + parsed.invalid.length,
            campaignMessageCount: campaigns.length,
            diagnostics,
            winnerId: winner?.id ?? null,
            invalid: parsed.invalid,
        };

        return { message: winner, report: nextReport };
    }, [
        credentialFacts.accountDid,
        flag,
        campaigns,
        campaignById,
        messages,
        parsed.invalid,
        ready,
        context,
        suppressionRevision,
    ]);

    useEffect(() => {
        lastReport = report;

        if (!isInAppMessagesDebug() || !report.ready) return;

        iamDebug('evaluated', {
            platform: report.context?.platform,
            role: report.context?.role,
            versions: report.context?.versions,
            flagMessageCount: report.flagMessageCount,
            winnerId: report.winnerId,
        });
    }, [report]);

    return {
        message,
        messages,
        context,
        ready,
        report,
        credentialFacts,
        settings: flag.settings,
    };
};
