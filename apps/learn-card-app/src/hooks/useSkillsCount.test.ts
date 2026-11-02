import { describe, expect, it } from 'vitest';

import { countSkillsForFrameworks } from './skillAlignment.helpers';

describe('countSkillsForFrameworks', () => {
    it('counts unique skills across all configured frameworks', () => {
        const credentials = [
            {
                boostCredential: {
                    credentialSubject: {
                        achievement: {
                            alignment: [
                                {
                                    targetName: 'Critical Thinking',
                                    targetUrl:
                                        'https://example.com/frameworks/wef-global-skills-taxonomy/skills/critical-thinking',
                                },
                                {
                                    targetName: 'Communication',
                                    targetUrl:
                                        'https://example.com/frameworks/pathsmith-durable-skills-starter-edition/skills/communication',
                                },
                            ],
                        },
                    },
                },
            },
            {
                credentialSubject: {
                    achievement: {
                        alignment: [
                            {
                                targetName: 'Critical Thinking',
                                targetUrl:
                                    'https://example.com/frameworks/wef-global-skills-taxonomy/skills/critical-thinking',
                            },
                            {
                                targetName: 'Tenant Skill',
                                frameworkId: 'tenant-framework',
                            },
                            {
                                targetName: 'Not Configured',
                                frameworkId: 'other-framework',
                            },
                        ],
                    },
                },
            },
        ];

        expect(
            countSkillsForFrameworks(credentials, [
                'wef-global-skills-taxonomy',
                'pathsmith-durable-skills-starter-edition',
                'tenant-framework',
            ])
        ).toBe(3);
    });

    it('does not count alignments from frameworks that are not configured', () => {
        const credentials = [
            {
                credentialSubject: {
                    achievement: {
                        alignment: [
                            {
                                targetName: 'Other Skill',
                                targetUrl:
                                    'https://example.com/frameworks/other-framework/skills/other-skill',
                            },
                        ],
                    },
                },
            },
        ];

        expect(countSkillsForFrameworks(credentials, ['configured-framework'])).toBe(0);
    });
});

describe('getCredentialAchievementAlignments', () => {
    it('reads alignments from bare OpenBadgeCredential credentialSubject', async () => {
        const { getCredentialAchievementAlignments } = await import('./skillAlignment.helpers');
        const alignments = getCredentialAchievementAlignments({
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            credentialSubject: {
                achievement: {
                    alignment: [
                        {
                            targetName: 'Persistence',
                            targetUrl:
                                'https://staging.network.learncard.com/frameworks/wef-global-skills-taxonomy/skills/persistence',
                        },
                    ],
                },
            },
        });

        expect(alignments).toHaveLength(1);
        expect(alignments[0]?.targetName).toBe('Persistence');
    });

    it('prefers boostCredential alignments when both are present', async () => {
        const { getCredentialAchievementAlignments } = await import('./skillAlignment.helpers');
        const alignments = getCredentialAchievementAlignments({
            boostCredential: {
                credentialSubject: {
                    achievement: {
                        alignment: [
                            {
                                targetName: 'FromBoost',
                                targetUrl:
                                    'https://x/frameworks/wef-global-skills-taxonomy/skills/a',
                            },
                        ],
                    },
                },
            },
            credentialSubject: {
                achievement: {
                    alignment: [
                        {
                            targetName: 'FromBare',
                            targetUrl: 'https://x/frameworks/wef-global-skills-taxonomy/skills/b',
                        },
                    ],
                },
            },
        });

        expect(alignments).toHaveLength(1);
        expect(alignments[0]?.targetName).toBe('FromBoost');
    });
});

describe('aggregateHubSkillAlignments', () => {
    it('skips alignments without a targetUrl instead of throwing', async () => {
        const { aggregateHubSkillAlignments } = await import('./skillAlignment.helpers');
        const bareMixed = {
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            validFrom: '2026-10-01T00:00:00Z',
            credentialSubject: {
                achievement: {
                    alignment: [
                        { targetName: 'Tenant Skill', frameworkId: 'tenant-framework' },
                        {
                            targetName: 'Persistence',
                            targetUrl:
                                'https://example.com/frameworks/wef-global-skills-taxonomy/skills/persistence',
                        },
                    ],
                },
            },
        };
        const bareNoUrlOnly = {
            credentialSubject: {
                achievement: {
                    alignment: [{ targetName: 'Only Name', frameworkId: 'tenant-framework' }],
                },
            },
        };
        const boost = {
            boostCredential: {
                issuanceDate: '2026-11-01T00:00:00Z',
                credentialSubject: {
                    achievement: {
                        alignment: [
                            {
                                type: 'Alignment',
                                targetName: 'Persistence',
                                targetUrl:
                                    'https://example.com/frameworks/wef-global-skills-taxonomy/skills/persistence',
                            },
                        ],
                    },
                },
            },
        };

        let result: ReturnType<typeof aggregateHubSkillAlignments<unknown>> = [];
        expect(() => {
            result = aggregateHubSkillAlignments<unknown>(
                [bareMixed, bareNoUrlOnly, boost],
                ['wef-global-skills-taxonomy', 'tenant-framework']
            );
        }).not.toThrow();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            type: 'Alignment',
            targetName: 'Persistence',
            frameworkId: 'wef-global-skills-taxonomy',
            skillId: 'persistence',
            count: 2,
            issuanceDate: '2026-11-01T00:00:00Z',
        });
        expect(result[0]?.credentials).toEqual([bareMixed, boost]);
    });

    it('normalizes bare alignments missing type/targetName to the hub shape', async () => {
        const { aggregateHubSkillAlignments } = await import('./skillAlignment.helpers');
        const result = aggregateHubSkillAlignments(
            [
                {
                    credentialSubject: {
                        achievement: {
                            alignment: [
                                {
                                    targetUrl:
                                        'https://example.com/frameworks/wef-global-skills-taxonomy/skills/grit',
                                },
                            ],
                        },
                    },
                },
            ],
            ['wef-global-skills-taxonomy']
        );

        expect(result).toHaveLength(1);
        expect(result[0]?.type).toBe('Alignment');
        expect(result[0]?.targetName).toBe('');
        expect(result[0]?.issuanceDate).toBe('');
    });
});
