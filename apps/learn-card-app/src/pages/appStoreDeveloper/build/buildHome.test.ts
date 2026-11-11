import { describe, expect, it } from 'vitest';
import type { LCNIntegration } from '@learncard/types';

import { getProjectsForGuide, summarizeProject, summarizeProjects } from './buildHome';

const project = (id: string, overrides: Partial<LCNIntegration> = {}): LCNIntegration =>
    ({
        id,
        name: `Project ${id}`,
        whitelistedDomains: [],
        status: 'setup',
        ...overrides,
    }) as LCNIntegration;

describe('summarizeProject', () => {
    it('resumes a guide at the saved step', () => {
        expect(
            summarizeProject(
                project('a', { guideType: 'issue-credentials', guideState: { currentStep: 2 } })
            )
        ).toMatchObject({
            state: 'in-progress',
            step: 3,
            path: '/app-store/developer/integrations/a/guides/issue-credentials',
        });
    });

    it('opens the dashboard for running projects and published apps', () => {
        expect(summarizeProject(project('b', { status: 'active' }))).toMatchObject({
            state: 'running',
            path: '/app-store/developer/integrations/b',
        });
        expect(
            summarizeProject(
                project('c', {
                    guideType: 'embed-app',
                    guideState: { publishedFromAppUrl: 'https://quiz.app' },
                })
            ).state
        ).toBe('app');
    });

    it('asks a project with no guide to pick one', () => {
        expect(summarizeProject(project('d'))).toMatchObject({
            state: 'not-started',
            path: '/app-store/developer/integrations/d/guides',
        });
    });
});

describe('summarizeProjects', () => {
    it('puts work in progress first', () => {
        const order = summarizeProjects([
            project('a', { status: 'active' }),
            project('b', { guideType: 'embed-claim' }),
            project('c'),
        ]).map(summary => summary.integration.id);

        expect(order).toEqual(['b', 'c', 'a']);
    });
});

describe('projects with apps', () => {
    it('treats any project with a store listing as an app and leaves it out', () => {
        const integrations = [project('app', { guideType: 'embed-app' }), project('guide')];
        expect(summarizeProject(integrations[0]!, new Set(['app'])).state).toBe('app');
        expect(
            summarizeProjects(integrations, new Set(['app'])).map(summary => summary.integration.id)
        ).toEqual(['guide']);
    });
});

describe('getProjectsForGuide', () => {
    it('offers empty projects and ones already on this guide', () => {
        const ids = getProjectsForGuide(
            [
                project('empty'),
                project('same', { guideType: 'embed-claim' }),
                project('other', { guideType: 'issue-credentials' }),
                project('live', { status: 'active' }),
            ],
            'embed-claim'
        ).map(integration => integration.id);

        expect(ids).toEqual(['empty', 'same']);
    });
});
