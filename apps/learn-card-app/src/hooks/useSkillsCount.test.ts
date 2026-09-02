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
