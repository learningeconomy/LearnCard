import * as m from '../../../paraglide/messages.js';

export type DashboardLearningSnapshot = {
    label: string;
    title: string;
    description: string;
    tone: 'strength' | 'weakness' | 'growth';
};

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
        toSnapshot(
            insights.strongestArea,
            'strength',
            m['dashboard.learningProfile.snapStrongest']()
        ),
        toSnapshot(insights.weakestArea, 'weakness', m['dashboard.learningProfile.snapWeakest']()),
        toSnapshot(insights.roomForGrowth, 'growth', m['dashboard.learningProfile.snapGrowth']()),
    ].filter((snapshot): snapshot is DashboardLearningSnapshot => snapshot !== null);
};
