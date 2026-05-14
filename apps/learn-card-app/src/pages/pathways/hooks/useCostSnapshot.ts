/**
 * useCostSnapshot — emit `pathways.learnerCost.snapshot` at most once
 * per UTC day when the shell mounts.
 *
 * Reads the learner's invocation history from `costStore`, builds the
 * `CostSnapshot` payload, and fires the analytics event. Stores the
 * date it last emitted so a same-day remount is cheap.
 */

import { useEffect } from 'react';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { costStore } from '../agents/costStore';

import { useLearnerDid } from './useLearnerDid';

const utcDateKey = (iso: string): string => iso.slice(0, 10);

export const useCostSnapshot = (): void => {
    const analytics = useAnalytics();
    const learnerDid = useLearnerDid();
    const lastSnapshotDate = costStore.use.lastSnapshotDate();

    useEffect(() => {
        const now = new Date().toISOString();
        const today = utcDateKey(now);

        if (lastSnapshotDate === today) return;

        const snapshot = costStore.get.snapshot(learnerDid, now);

        analytics.track(AnalyticsEvents.PATHWAYS_LEARNER_COST_SNAPSHOT, snapshot);
        costStore.set.markSnapshotEmitted(today);
    }, [analytics, learnerDid, lastSnapshotDate]);
};
