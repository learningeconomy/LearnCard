import { collectFsrsDue } from '../../pathways/scheduler/fsrsScheduler';
import type { Pathway } from '../../pathways/types';

export type DueReviewSummary = {
    total: number;
    pathwayId: string | null;
};

export const countReviewsDueToday = (
    pathways: Record<string, Pathway>,
    activePathwayId: string | null,
    now: Date = new Date()
): DueReviewSummary => {
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const cutoff = endOfDay.getTime();

    let total = 0;
    for (const pathway of Object.values(pathways)) {
        const due = collectFsrsDue(pathway);
        for (const entry of due) {
            const dueMs = new Date(entry.dueAt).getTime();
            if (Number.isFinite(dueMs) && dueMs <= cutoff) total += 1;
        }
    }

    return { total, pathwayId: activePathwayId };
};
