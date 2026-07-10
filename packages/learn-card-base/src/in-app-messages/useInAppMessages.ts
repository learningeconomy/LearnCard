import { useEffect, useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { parseInAppMessagesFlag, type InAppMessage } from '@learncard/types';

import {
    explainMessage,
    messageMatches,
    pickHighestPriority,
    type InAppMessageRuntimeContext,
    type PredicateTrace,
} from './predicates';
import { filterSuppressed, shouldSuppressMessage } from './dismissalStore';
import { useInAppMessageRuntimeContext } from './useRuntimeContext';
import { iamDebug, isInAppMessagesDebug } from './debug';

export const IN_APP_MESSAGES_FLAG_KEY = 'inAppMessages';

export interface InAppMessageDiagnostic {
    id: string;
    priority: number;
    enabled: boolean;
    matched: boolean;
    suppressed: boolean;
    willShow: boolean;
    trace: PredicateTrace | null;
}

export interface InAppMessagesReport {
    ready: boolean;
    context: InAppMessageRuntimeContext | null;
    flagMessageCount: number;
    diagnostics: InAppMessageDiagnostic[];
    winnerId: string | null;
}

export interface UseInAppMessagesResult {
    message: InAppMessage | null;
    context: InAppMessageRuntimeContext | null;
    ready: boolean;
    report: InAppMessagesReport;
}

const EMPTY_REPORT: InAppMessagesReport = {
    ready: false,
    context: null,
    flagMessageCount: 0,
    diagnostics: [],
    winnerId: null,
};

let lastReport: InAppMessagesReport = EMPTY_REPORT;

export const getLastInAppMessagesReport = (): InAppMessagesReport => lastReport;

export const useInAppMessages = (
    flagKey: string = IN_APP_MESSAGES_FLAG_KEY
): UseInAppMessagesResult => {
    const flags = useFlags();
    const { context, ready } = useInAppMessageRuntimeContext();

    const flag = useMemo(() => parseInAppMessagesFlag(flags?.[flagKey]), [flags, flagKey]);

    const { message, report } = useMemo(() => {
        if (!ready || !context) {
            return {
                message: null as InAppMessage | null,
                report: { ...EMPTY_REPORT, flagMessageCount: flag.messages.length },
            };
        }

        const matching = flag.messages.filter(m => messageMatches(m, context));
        const winner = pickHighestPriority(filterSuppressed(matching));

        const diagnostics: InAppMessageDiagnostic[] = flag.messages.map(m => {
            const explanation = explainMessage(m, context);
            const suppressed = shouldSuppressMessage(m.id, m.frequency);

            return {
                id: m.id,
                priority: m.priority,
                enabled: m.enabled,
                matched: explanation.matched,
                suppressed,
                willShow: explanation.matched && !suppressed,
                trace: explanation.trace,
            };
        });

        const nextReport: InAppMessagesReport = {
            ready: true,
            context,
            flagMessageCount: flag.messages.length,
            diagnostics,
            winnerId: winner?.id ?? null,
        };

        return { message: winner, report: nextReport };
    }, [flag, ready, context]);

    useEffect(() => {
        lastReport = report;

        if (!isInAppMessagesDebug() || !report.ready) return;

        iamDebug('evaluated', {
            platform: report.context?.platform,
            role: report.context?.role,
            versions: report.context?.versions,
            flagMessageCount: report.flagMessageCount,
            winnerId: report.winnerId,
            diagnostics: report.diagnostics,
        });
    }, [report]);

    return { message, context, ready, report };
};
