import { describe, expect, it } from 'vitest';

import type { ActionDescriptor, PathwayNode, Policy, Termination } from '../types';

import { buildInAppHref, resolveNodeAction, type ResolvedAction } from './action';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = '2026-04-22T00:00:00.000Z';

const practicePolicy = (): Policy => ({
    kind: 'practice',
    cadence: { frequency: 'daily', perPeriod: 1 },
    artifactTypes: ['text'],
});

const externalPolicy = (serverId = 'figma', toolName = 'export'): Policy => ({
    kind: 'external',
    mcp: { serverId, toolName },
});

const selfAttest = (): Termination => ({ kind: 'self-attest', prompt: 'Done?' });

const makeNode = (overrides: Partial<PathwayNode> = {}): PathwayNode => ({
    id: '00000000-0000-4000-8000-000000000001',
    pathwayId: '00000000-0000-4000-8000-0000000000aa',
    title: 'Node',
    stage: {
        initiation: [],
        policy: overrides.stage?.policy ?? practicePolicy(),
        termination: overrides.stage?.termination ?? selfAttest(),
    },
    endorsements: [],
    progress: {
        status: 'not-started',
        artifacts: [],
        reviewsDue: 0,
        streak: { current: 0, longest: 0 },
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

// ---------------------------------------------------------------------------
// Explicit dispatch — every `ActionDescriptor.kind` produces the matching
// `ResolvedAction` with `source: 'explicit'`.
// ---------------------------------------------------------------------------

describe('resolveNodeAction — explicit descriptor', () => {
    it('dispatches in-app-route as-is', () => {
        const action: ActionDescriptor = {
            kind: 'in-app-route',
            to: '/ai-sessions/new',
            params: { topicId: 'algebra-1' },
        };

        const node = makeNode({ action });

        expect(resolveNodeAction(node)).toEqual<ResolvedAction>({
            kind: 'in-app-route',
            to: '/ai-sessions/new',
            params: { topicId: 'algebra-1' },
            source: 'explicit',
        });
    });

    it('dispatches app-listing with optional deepLinkSection', () => {
        const action: ActionDescriptor = {
            kind: 'app-listing',
            listingId: 'listing-khanmigo',
            deepLinkSection: 'tutor/biology',
        };

        const node = makeNode({ action });

        expect(resolveNodeAction(node)).toEqual<ResolvedAction>({
            kind: 'app-listing',
            listingId: 'listing-khanmigo',
            deepLinkSection: 'tutor/biology',
            source: 'explicit',
        });
    });

    it('dispatches ai-session with topicUri, pathwayUri, and seedPrompt passthrough', () => {
        // The resolver is a pure projection — every field authors
        // can set on the action must end up on the resolved shape so
        // dispatchers don't have to re-open the descriptor.
        const action: ActionDescriptor = {
            kind: 'ai-session',
            topicUri: 'boost:aws-iam-deep-dive',
            pathwayUri: 'boost:aws-curriculum-v1',
            seedPrompt: 'Drill cross-account assume-role specifically.',
        };

        const node = makeNode({ action });

        expect(resolveNodeAction(node)).toEqual<ResolvedAction>({
            kind: 'ai-session',
            topicUri: 'boost:aws-iam-deep-dive',
            pathwayUri: 'boost:aws-curriculum-v1',
            seedPrompt: 'Drill cross-account assume-role specifically.',
            source: 'explicit',
        });
    });

    it('dispatches ai-session with only the required topicUri', () => {
        // Minimal shape: no pathway, no seed prompt. Optionality on
        // the schema must carry through to the resolver without
        // synthesising empty-string placeholders.
        const action: ActionDescriptor = {
            kind: 'ai-session',
            topicUri: 'boost:aws-iam-deep-dive',
        };

        const node = makeNode({ action });

        expect(resolveNodeAction(node)).toEqual<ResolvedAction>({
            kind: 'ai-session',
            topicUri: 'boost:aws-iam-deep-dive',
            pathwayUri: undefined,
            seedPrompt: undefined,
            source: 'explicit',
        });
    });

    it('dispatches external-url and marks it NOT a landing page', () => {
        const action: ActionDescriptor = {
            kind: 'external-url',
            url: 'https://www.coursera.org/learn/statistics',
        };

        const node = makeNode({ action });

        const resolved = resolveNodeAction(node);

        expect(resolved).toEqual<ResolvedAction>({
            kind: 'external-url',
            url: 'https://www.coursera.org/learn/statistics',
            mobileDeepLink: undefined,
            source: 'explicit',
            landingPage: false,
        });
    });

    it('dispatches mcp-tool with default args passthrough', () => {
        const action: ActionDescriptor = {
            kind: 'mcp-tool',
            ref: { serverId: 'figma', toolName: 'export', defaultArgs: { mode: 'png' } },
        };

        const node = makeNode({ action });

        expect(resolveNodeAction(node)).toEqual<ResolvedAction>({
            kind: 'mcp-tool',
            ref: { serverId: 'figma', toolName: 'export', defaultArgs: { mode: 'png' } },
            source: 'explicit',
        });
    });

    it('dispatches none', () => {
        const node = makeNode({ action: { kind: 'none' } });

        expect(resolveNodeAction(node)).toEqual<ResolvedAction>({
            kind: 'none',
            source: 'explicit',
        });
    });
});

// ---------------------------------------------------------------------------
// Fallback dispatch — when node.action is absent, synthesise from legacy
// fields so pre-action pathways keep working.
// ---------------------------------------------------------------------------

describe('resolveNodeAction — fallback when action absent', () => {
    it('synthesises external-url from sourceData earnUrl (not a landing page)', () => {
        const node = makeNode({
            credentialProjection: {
                achievementType: 'Certification',
                criteria: 'Pass the thing',
                earnUrl: 'https://credentialengine.example/earn/abc',
                earnUrlSource: 'sourceData',
            },
        });

        const resolved = resolveNodeAction(node);

        expect(resolved).toMatchObject({
            kind: 'external-url',
            url: 'https://credentialengine.example/earn/abc',
            source: 'earn-url',
            landingPage: false,
        });
    });

    it('flags subjectWebpage earn links as landing pages', () => {
        const node = makeNode({
            credentialProjection: {
                achievementType: 'Badge',
                criteria: 'Do the thing',
                earnUrl: 'https://issuer.example/marketing',
                earnUrlSource: 'subjectWebpage',
            },
        });

        expect(resolveNodeAction(node)).toMatchObject({
            kind: 'external-url',
            source: 'earn-url',
            landingPage: true,
        });
    });

    it('synthesises mcp-tool from policy.external.mcp', () => {
        const node = makeNode({
            stage: {
                initiation: [],
                policy: externalPolicy('notion', 'create-page'),
                termination: selfAttest(),
            },
        });

        expect(resolveNodeAction(node)).toEqual<ResolvedAction>({
            kind: 'mcp-tool',
            ref: { serverId: 'notion', toolName: 'create-page' },
            source: 'mcp-policy',
        });
    });

    it('prefers an explicit earn-url over the mcp-policy fallback', () => {
        const node = makeNode({
            stage: {
                initiation: [],
                policy: externalPolicy(),
                termination: selfAttest(),
            },
            credentialProjection: {
                achievementType: 'Certification',
                criteria: 'Pass the thing',
                earnUrl: 'https://example.org/x',
                earnUrlSource: 'sourceData',
            },
        });

        // earn-url is the richer signal for the learner (there's a URL
        // to go to). mcp-policy is for agent-driven dispatch and
        // should only win when no URL is available.
        expect(resolveNodeAction(node).source).toBe('earn-url');
    });

    it('returns none for a local-only node with no legacy signals', () => {
        const node = makeNode();

        expect(resolveNodeAction(node)).toEqual<ResolvedAction>({
            kind: 'none',
            source: 'none',
        });
    });
});

// ---------------------------------------------------------------------------
// Author-declared descriptor always wins over legacy fields.
// ---------------------------------------------------------------------------

describe('resolveNodeAction — explicit descriptor overrides legacy fields', () => {
    it('uses node.action even when earnUrl is also set', () => {
        const node = makeNode({
            action: {
                kind: 'app-listing',
                listingId: 'listing-coursera',
            },
            credentialProjection: {
                achievementType: 'Badge',
                criteria: 'Learn the thing',
                earnUrl: 'https://ignored.example',
                earnUrlSource: 'sourceData',
            },
        });

        const resolved = resolveNodeAction(node);

        expect(resolved.kind).toBe('app-listing');
        expect(resolved.source).toBe('explicit');
    });
});

// ---------------------------------------------------------------------------
// buildInAppHref — path param slot substitution vs query string fallback.
// ---------------------------------------------------------------------------

describe('buildInAppHref', () => {
    it('returns the path untouched when there are no params', () => {
        expect(
            buildInAppHref({ kind: 'in-app-route', to: '/ai-sessions', source: 'explicit' }),
        ).toBe('/ai-sessions');
    });

    it('substitutes :slot placeholders', () => {
        expect(
            buildInAppHref({
                kind: 'in-app-route',
                to: '/wallet/credentials/:credentialId',
                params: { credentialId: 'vc-42' },
                source: 'explicit',
            }),
        ).toBe('/wallet/credentials/vc-42');
    });

    it('keeps unslotted keys in the query string', () => {
        const href = buildInAppHref({
            kind: 'in-app-route',
            to: '/ai-sessions/new',
            params: { topicId: 'algebra-1', autostart: true },
            source: 'explicit',
        });

        // URLSearchParams preserves insertion order.
        expect(href).toBe('/ai-sessions/new?topicId=algebra-1&autostart=true');
    });

    it('mixes slot substitution and query params', () => {
        expect(
            buildInAppHref({
                kind: 'in-app-route',
                to: '/wallet/:category/view',
                params: { category: 'boosts', highlight: 'streak' },
                source: 'explicit',
            }),
        ).toBe('/wallet/boosts/view?highlight=streak');
    });

    it('url-encodes slot values', () => {
        expect(
            buildInAppHref({
                kind: 'in-app-route',
                to: '/wallet/:credentialId',
                params: { credentialId: 'urn:uuid:ff ee/00' },
                source: 'explicit',
            }),
        ).toBe('/wallet/urn%3Auuid%3Aff%20ee%2F00');
    });
});
