import type { DashboardLearningSnapshot } from '../DashboardView.types';

type InsightArea = {
    title?: unknown;
    summary?: unknown;
};

type AiInsightCredential = {
    insights?: {
        strongestArea?: InsightArea;
        weakestArea?: InsightArea;
        roomForGrowth?: InsightArea;
    };
};

const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const toSnapshot = (
    area: InsightArea | undefined,
    tone: DashboardLearningSnapshot['tone'],
    label: string
): DashboardLearningSnapshot | null => {
    const title = asText(area?.title) || label;
    const description = asText(area?.summary);

    if (!description) return null;

    return { tone, label, title, description };
};

export const buildLearningSnapshots = (
    credential: AiInsightCredential | undefined
): DashboardLearningSnapshot[] => {
    const insights = credential?.insights;
    if (!insights) return [];

    return [
        toSnapshot(insights.strongestArea, 'strength', 'Strongest area'),
        toSnapshot(insights.weakestArea, 'weakness', 'Needs work'),
        toSnapshot(insights.roomForGrowth, 'growth', 'Room for growth'),
    ].filter((snapshot): snapshot is DashboardLearningSnapshot => snapshot !== null);
};
