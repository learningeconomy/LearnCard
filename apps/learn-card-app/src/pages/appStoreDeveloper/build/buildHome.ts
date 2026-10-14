import type { LCNIntegration } from '@learncard/types';

import { USE_CASES } from '../guides/types';
import type { UseCaseId } from '../guides/types';

export const FEATURED_GUIDE: UseCaseId = 'embed-app';

export const GUIDE_ORDER: UseCaseId[] = [
    'issue-credentials',
    'embed-claim',
    'consent-flow',
    'course-catalog',
    'server-webhooks',
    'verify-credentials',
];

export type ProjectState = 'app' | 'running' | 'in-progress' | 'not-started';

export interface ProjectSummary {
    integration: LCNIntegration;
    state: ProjectState;
    guideType?: UseCaseId;
    step?: number;
    path: string;
}

const isUseCase = (value: unknown): value is UseCaseId =>
    typeof value === 'string' && value in USE_CASES;

const readGuideState = (integration: LCNIntegration): Record<string, unknown> =>
    (integration.guideState as Record<string, unknown> | undefined) ?? {};

const STATE_ORDER: Record<ProjectState, number> = {
    'in-progress': 0,
    'not-started': 1,
    'running': 2,
    'app': 3,
};

export const summarizeProject = (
    integration: LCNIntegration,
    appIntegrationIds: ReadonlySet<string> = new Set()
): ProjectSummary => {
    const base = `/app-store/developer/integrations/${integration.id}`;
    const guideState = readGuideState(integration);
    const guideType = isUseCase(integration.guideType) ? integration.guideType : undefined;

    if (
        appIntegrationIds.has(integration.id) ||
        typeof guideState.publishedFromAppUrl === 'string'
    ) {
        return { integration, state: 'app', guideType, path: base };
    }
    if ((integration.status as string) === 'active') {
        return { integration, state: 'running', guideType, path: base };
    }
    if (guideType) {
        const current = typeof guideState.currentStep === 'number' ? guideState.currentStep : 0;
        return {
            integration,
            state: 'in-progress',
            guideType,
            step: current + 1,
            path: `${base}/guides/${guideType}`,
        };
    }
    return { integration, state: 'not-started', path: `${base}/guides` };
};

/** Projects for "Continue where you left off". Apps are excluded: they live in the Apps tab. */
export const summarizeProjects = (
    integrations: LCNIntegration[],
    appIntegrationIds: ReadonlySet<string> = new Set()
): ProjectSummary[] =>
    integrations
        .map(integration => summarizeProject(integration, appIntegrationIds))
        .filter(summary => summary.state !== 'app')
        .sort(
            (a, b) =>
                STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
                a.integration.name.localeCompare(b.integration.name)
        );

/** Projects a new guide can be set up in without disturbing another guide's progress. */
export const getProjectsForGuide = (
    integrations: LCNIntegration[],
    guideType: UseCaseId,
    appIntegrationIds: ReadonlySet<string> = new Set()
): LCNIntegration[] =>
    integrations.filter(integration => {
        const summary = summarizeProject(integration, appIntegrationIds);
        return (
            summary.state === 'not-started' ||
            (summary.state === 'in-progress' && summary.guideType === guideType)
        );
    });
