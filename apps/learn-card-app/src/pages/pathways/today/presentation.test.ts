import { describe, expect, it } from 'vitest';

import type { Edge, Pathway, PathwayNode } from '../types';

import {
    buildIdentityBanner,
    buildJourney,
    getGreeting,
    getNodeEarnLink,
    identityPhrase,
    journeyLabel,
    policyCallToAction,
    policyLabel,
    resolveNodeCallToAction,
} from './presentation';

const NOW = '2026-04-20T12:00:00.000Z';

const node = (
    id: string,
    status: PathwayNode['progress']['status'] = 'not-started',
): PathwayNode => ({
    id,
    pathwayId: 'p1',
    title: id,
    stage: {
        initiation: [],
        policy: { kind: 'artifact', prompt: 'x', expectedArtifact: 'text' },
        termination: { kind: 'self-attest', prompt: 'done' },
    },
    endorsements: [],
    progress: {
        status,
        artifacts: [],
        reviewsDue: 0,
        streak: { current: 0, longest: 0 },
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
});

const pathway = (nodes: PathwayNode[], edges: Edge[] = []): Pathway => ({
    id: 'p1',
    ownerDid: 'did:test:learner',
    revision: 0,
    schemaVersion: 1,
    title: 'Test',
    goal: 'Test',
    nodes,
    edges,
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    createdAt: NOW,
    updatedAt: NOW,
});

// ---------------------------------------------------------------------------
// getGreeting
// ---------------------------------------------------------------------------

describe('getGreeting', () => {
    const atHour = (h: number) => {
        const d = new Date(NOW);
        d.setHours(h, 0, 0, 0);

        return d;
    };

    it('greets the morning from 5am through 11:59am', () => {
        expect(getGreeting(atHour(5))).toBe('Good morning');
        expect(getGreeting(atHour(9))).toBe('Good morning');
        expect(getGreeting(atHour(11))).toBe('Good morning');
    });

    it('greets the afternoon from noon through 4:59pm', () => {
        expect(getGreeting(atHour(12))).toBe('Good afternoon');
        expect(getGreeting(atHour(15))).toBe('Good afternoon');
        expect(getGreeting(atHour(16))).toBe('Good afternoon');
    });

    it('greets the evening from 5pm through 9:59pm', () => {
        expect(getGreeting(atHour(17))).toBe('Good evening');
        expect(getGreeting(atHour(20))).toBe('Good evening');
        expect(getGreeting(atHour(21))).toBe('Good evening');
    });

    it('uses the quiet late-night phrase from 10pm through 4:59am', () => {
        expect(getGreeting(atHour(22))).toBe('Still here');
        expect(getGreeting(atHour(23))).toBe('Still here');
        expect(getGreeting(atHour(0))).toBe('Still here');
        expect(getGreeting(atHour(3))).toBe('Still here');
        expect(getGreeting(atHour(4))).toBe('Still here');
    });
});

// ---------------------------------------------------------------------------
// buildJourney + journeyLabel
// ---------------------------------------------------------------------------

describe('buildJourney', () => {
    it('counts completed, remaining, and total across the pathway', () => {
        const p = pathway([
            node('a', 'completed'),
            node('b', 'completed'),
            node('c', 'in-progress'),
            node('d', 'not-started'),
            node('e', 'not-started'),
        ]);

        expect(buildJourney(p)).toEqual({ completed: 2, remaining: 3, total: 5 });
    });

    it('excludes skipped nodes from both completed and remaining, but keeps them in total', () => {
        const p = pathway([
            node('a', 'completed'),
            node('b', 'skipped'),
            node('c', 'not-started'),
        ]);

        expect(buildJourney(p)).toEqual({ completed: 1, remaining: 1, total: 3 });
    });

    it('returns zeros on an empty pathway', () => {
        expect(buildJourney(pathway([]))).toEqual({ completed: 0, remaining: 0, total: 0 });
    });
});

describe('journeyLabel', () => {
    it('says "First step" at the beginning of a pathway', () => {
        expect(journeyLabel({ completed: 0, remaining: 5, total: 5 })).toBe('First step');
    });

    it('says "Last one" when exactly one node remains', () => {
        expect(journeyLabel({ completed: 4, remaining: 1, total: 5 })).toBe('Last one');
    });

    it('gives a mid-pathway count when many nodes remain', () => {
        expect(journeyLabel({ completed: 2, remaining: 5, total: 7 })).toBe('2 done · 5 to go');
    });

    it('says "All done" once nothing remains and at least one node completed', () => {
        expect(journeyLabel({ completed: 5, remaining: 0, total: 5 })).toBe('All done');
    });
});

// ---------------------------------------------------------------------------
// policyLabel / policyCallToAction — sanity checks, not exhaustive
// ---------------------------------------------------------------------------

describe('policyLabel', () => {
    it('maps every policy kind to a one-word label', () => {
        expect(policyLabel('practice')).toBe('Practice');
        expect(policyLabel('review')).toBe('Recall');
        expect(policyLabel('assessment')).toBe('Check');
        expect(policyLabel('artifact')).toBe('Make');
        expect(policyLabel('external')).toBe('External');
    });
});

describe('policyCallToAction', () => {
    it('maps every policy kind to a verb-first CTA', () => {
        expect(policyCallToAction('practice')).toMatch(/^Log/);
        expect(policyCallToAction('review')).toMatch(/^Start/);
        expect(policyCallToAction('assessment')).toMatch(/^Start/);
        expect(policyCallToAction('artifact')).toMatch(/^Work/);
        expect(policyCallToAction('external')).toMatch(/^Open/);
    });
});

// ---------------------------------------------------------------------------
// resolveNodeCallToAction — the node-aware CTA resolver
// ---------------------------------------------------------------------------

describe('resolveNodeCallToAction', () => {
    // Small helpers keep tests readable — each test cares about ~2
    // fields of the node, so we start from a conservative default and
    // override what matters.
    const credentialNode = (
        achievementType: string,
        overrides?: Partial<PathwayNode['stage']>,
    ): PathwayNode => ({
        ...node('credential'),
        credentialProjection: {
            achievementType,
            criteria: 'Earn the thing.',
        },
        stage: {
            initiation: [],
            policy: {
                kind: 'artifact',
                prompt: 'Earn this credential.',
                expectedArtifact: 'link',
            },
            termination: { kind: 'endorsement', minEndorsers: 1 },
            ...overrides,
        },
    });

    it('uses "Earn this badge" for a Badge credential node with endorsement termination', () => {
        expect(resolveNodeCallToAction(credentialNode('Badge'))).toBe('Earn this badge');
    });

    it('normalizes CTDL "DigitalBadge" to "Earn this badge"', () => {
        // Real registries emit the long form. The matcher is forgiving
        // on purpose.
        expect(resolveNodeCallToAction(credentialNode('DigitalBadge'))).toBe(
            'Earn this badge',
        );
    });

    it('uses "Earn this certificate" for Certificate and Certification alike', () => {
        expect(resolveNodeCallToAction(credentialNode('Certificate'))).toBe(
            'Earn this certificate',
        );
        expect(resolveNodeCallToAction(credentialNode('Certification'))).toBe(
            'Earn this certificate',
        );
    });

    it('uses "Earn this micro-credential" for MicroCredential variants', () => {
        expect(resolveNodeCallToAction(credentialNode('MicroCredential'))).toBe(
            'Earn this micro-credential',
        );
    });

    it('falls back to "Earn this credential" for an unknown CTDL type', () => {
        // Honest fallback — never invent a noun we can't recognize.
        expect(resolveNodeCallToAction(credentialNode('SomeNovelBadgeTypeV2'))).toBe(
            'Earn this badge',
        );
        expect(resolveNodeCallToAction(credentialNode('UnrecognizedThing'))).toBe(
            'Earn this credential',
        );
    });

    it('overrides with "Take the assessment" when a credential node has assessment-score termination', () => {
        const asmt = credentialNode('Badge', {
            initiation: [],
            policy: { kind: 'assessment', rubric: { criteria: [] } },
            termination: { kind: 'assessment-score', min: 70 },
        });

        expect(resolveNodeCallToAction(asmt)).toBe('Take the assessment');
    });

    it('overrides with "Submit your proof" when a credential node has artifact-count termination', () => {
        const proof = credentialNode('Certificate', {
            initiation: [],
            policy: {
                kind: 'artifact',
                prompt: 'Attach proof.',
                expectedArtifact: 'link',
            },
            termination: {
                kind: 'artifact-count',
                count: 1,
                artifactType: 'link',
            },
        });

        expect(resolveNodeCallToAction(proof)).toBe('Submit your proof');
    });

    it('uses "Mark complete" for a self-attest termination with no credential projection', () => {
        expect(resolveNodeCallToAction(node('n1'))).toBe('Mark complete');
    });

    it('uses "Take the assessment" for assessment-score without credential projection', () => {
        const asmt: PathwayNode = {
            ...node('a'),
            stage: {
                initiation: [],
                policy: { kind: 'assessment', rubric: { criteria: [] } },
                termination: { kind: 'assessment-score', min: 80 },
            },
        };

        expect(resolveNodeCallToAction(asmt)).toBe('Take the assessment');
    });

    it('honors "Open in {MCP}" for external-policy nodes over all credential logic', () => {
        // MCP label wins because it is the most specific hint. Even if
        // the node also claims to award a credential, the action is
        // still "open the tool first."
        const external: PathwayNode = {
            ...credentialNode('Badge'),
            stage: {
                initiation: [],
                policy: {
                    kind: 'external',
                    mcp: { serverId: 'figma', toolName: 'openFile' },
                },
                termination: { kind: 'self-attest', prompt: 'done' },
            },
        };

        expect(resolveNodeCallToAction(external, 'Figma')).toBe('Open in Figma');
    });

    it('says "Learn more" when the credential has only a `subjectWebpage` earn URL', () => {
        // A landing-page URL doesn't earn anything by clicking it, so we
        // refuse to promise "Earn this badge" — better to under-promise
        // than drop the learner on a marketing page with a bait-y CTA.
        const web = credentialNode('Badge');

        web.credentialProjection = {
            ...web.credentialProjection!,
            earnUrl: 'https://issuer.example/about',
            earnUrlSource: 'subjectWebpage',
        };

        expect(resolveNodeCallToAction(web)).toBe('Learn more');
    });

    it('keeps "Earn this {noun}" when the credential has a `sourceData` earn URL', () => {
        // `sourceData` is CTDL's canonical "go here to earn it" field —
        // keeping the strongest CTA copy is honest here.
        const src = credentialNode('Badge');

        src.credentialProjection = {
            ...src.credentialProjection!,
            earnUrl: 'https://issuer.example/earn',
            earnUrlSource: 'sourceData',
        };

        expect(resolveNodeCallToAction(src)).toBe('Earn this badge');
    });

    it('falls through to policy-level copy when no sharper signal exists', () => {
        // A practice node with an endorsement termination has no
        // credential projection and no termination match — so it
        // bottoms out at the policy layer.
        const practice: PathwayNode = {
            ...node('p'),
            stage: {
                initiation: [],
                policy: {
                    kind: 'practice',
                    cadence: { frequency: 'weekly', perPeriod: 1 },
                    artifactTypes: ['text'],
                },
                termination: { kind: 'endorsement', minEndorsers: 1 },
            },
        };

        expect(resolveNodeCallToAction(practice)).toBe(policyCallToAction('practice'));
    });
});

// ---------------------------------------------------------------------------
// getNodeEarnLink — external earn-link resolver for CTA surfaces
// ---------------------------------------------------------------------------

describe('getNodeEarnLink', () => {
    it('returns null for a plain node without a credential projection', () => {
        // Author-created nodes don't carry CTDL earn links today.
        expect(getNodeEarnLink(node('x'))).toBeNull();
    });

    it('returns null when the credential projection has no earnUrl', () => {
        const n: PathwayNode = {
            ...node('x'),
            credentialProjection: {
                achievementType: 'Badge',
                criteria: 'do the thing',
            },
        };

        expect(getNodeEarnLink(n)).toBeNull();
    });

    it('returns { href, source } for a credential node with a sourceData earnUrl', () => {
        const n: PathwayNode = {
            ...node('x'),
            credentialProjection: {
                achievementType: 'Badge',
                criteria: 'do the thing',
                earnUrl: 'https://issuer.example/earn',
                earnUrlSource: 'sourceData',
            },
        };

        expect(getNodeEarnLink(n)).toEqual({
            href: 'https://issuer.example/earn',
            source: 'sourceData',
        });
    });

    it('surfaces the subjectWebpage source so callers can degrade copy', () => {
        // Callers use `source` to downgrade the button label from
        // "Earn this badge" to "Learn more" — mostly a plumbing test
        // but guards that the tag flows through untouched.
        const n: PathwayNode = {
            ...node('x'),
            credentialProjection: {
                achievementType: 'Badge',
                criteria: 'do the thing',
                earnUrl: 'https://issuer.example/about',
                earnUrlSource: 'subjectWebpage',
            },
        };

        expect(getNodeEarnLink(n)?.source).toBe('subjectWebpage');
    });

    it('returns null when earnUrl is present but earnUrlSource is missing', () => {
        // Guards against a half-populated projection surfacing a
        // sourceless link — we can't render honest copy without
        // knowing which CTDL field produced the URL.
        const n: PathwayNode = {
            ...node('x'),
            credentialProjection: {
                achievementType: 'Badge',
                criteria: 'do the thing',
                earnUrl: 'https://issuer.example/earn',
            } as PathwayNode['credentialProjection'],
        };

        expect(getNodeEarnLink(n)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// identityPhrase — past-progressive framing for the "You are becoming __" line
// ---------------------------------------------------------------------------

describe('identityPhrase', () => {
    it('turns a verb-first goal into a "someone __ing __" phrase', () => {
        expect(identityPhrase('write a novel')).toBe('someone writing a novel');
        expect(identityPhrase('ship one public-facing artifact')).toBe(
            'someone shipping one public-facing artifact',
        );
        expect(identityPhrase('build a startup')).toBe('someone building a startup');
    });

    it('accepts a bare verb with no object', () => {
        expect(identityPhrase('write')).toBe('someone writing');
    });

    it('leaves goals already in identity form untouched', () => {
        expect(identityPhrase('a better writer')).toBe('a better writer');
        expect(identityPhrase('the next CEO')).toBe('the next CEO');
        expect(identityPhrase('someone who writes fiction')).toBe(
            'someone who writes fiction',
        );
        expect(identityPhrase('an effective manager')).toBe('an effective manager');
    });

    it('falls back to the raw goal when it cannot transform it grammatically', () => {
        // Not a verb in our map — we render it verbatim rather than butchering it.
        expect(identityPhrase('foo bar baz')).toBe('foo bar baz');
    });

    it('is case-insensitive on the leading verb', () => {
        expect(identityPhrase('Write a novel')).toBe('someone writing a novel');
        expect(identityPhrase('SHIP it')).toBe('someone shipping it');
    });

    it('trims whitespace and handles empty input', () => {
        expect(identityPhrase('  write a novel  ')).toBe('someone writing a novel');
        expect(identityPhrase('')).toBe('');
        expect(identityPhrase('   ')).toBe('');
    });
});

// ---------------------------------------------------------------------------
// buildIdentityBanner — altitude-aware kicker + phrase
// ---------------------------------------------------------------------------

describe('buildIdentityBanner', () => {
    it('returns empty content for an empty goal, regardless of altitude', () => {
        expect(buildIdentityBanner('', 'aspiration')).toEqual({
            kicker: '',
            phrase: '',
        });
        expect(buildIdentityBanner('   ', 'question')).toEqual({
            kicker: '',
            phrase: '',
        });
    });

    it('treats missing altitude as aspiration (backwards compat)', () => {
        expect(buildIdentityBanner('write a novel')).toEqual({
            kicker: 'You are becoming',
            phrase: 'someone writing a novel',
        });
    });

    it('uses identity-tense for aspiration goals', () => {
        expect(buildIdentityBanner('ship one artifact', 'aspiration')).toEqual({
            kicker: 'You are becoming',
            phrase: 'someone shipping one artifact',
        });
    });

    it('preserves an already-identity aspiration phrase verbatim', () => {
        expect(buildIdentityBanner('the next CEO', 'aspiration')).toEqual({
            kicker: 'You are becoming',
            phrase: 'the next CEO',
        });
    });

    it('renders a question verbatim with a "sitting with" kicker', () => {
        expect(
            buildIdentityBanner('why do interest rates matter?', 'question'),
        ).toEqual({
            kicker: 'You are sitting with',
            phrase: 'why do interest rates matter?',
        });
    });

    it('renders an action verbatim with a "working on" kicker', () => {
        expect(buildIdentityBanner('draft my essay today', 'action')).toEqual({
            kicker: 'You are working on',
            phrase: 'draft my essay today',
        });
    });

    it('renders an exploration verbatim with an "exploring" kicker', () => {
        expect(
            buildIdentityBanner('look around climate tech', 'exploration'),
        ).toEqual({
            kicker: 'You are exploring',
            phrase: 'look around climate tech',
        });
    });

    it('does not gerund-ify non-aspiration phrases', () => {
        // Leading verb would otherwise map to "someone drafting..." via
        // identityPhrase, but at action altitude we keep the learner's
        // own words intact so the banner reads as a commitment to
        // today rather than a career identity.
        const result = buildIdentityBanner('write the intro', 'action');

        expect(result.phrase).toBe('write the intro');
        expect(result.phrase.startsWith('someone ')).toBe(false);
    });

    it('trims surrounding whitespace on the phrase', () => {
        expect(
            buildIdentityBanner('  why does this matter?  ', 'question').phrase,
        ).toBe('why does this matter?');
    });
});
