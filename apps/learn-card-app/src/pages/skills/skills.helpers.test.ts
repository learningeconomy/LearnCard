import { describe, expect, it } from 'vitest';

import { mapBoostsToSkills } from './skills.helpers';

describe('mapBoostsToSkills', () => {
    it('aggregates framework alignments by target name', () => {
        const credentials = [
            {
                boostCredential: {
                    credentialSubject: {
                        achievement: {
                            alignment: [
                                {
                                    type: 'Alignment',
                                    targetName: 'Critical Thinking',
                                    targetFramework: 'WEF Global Skills Taxonomy',
                                    targetUrl:
                                        'https://example.com/frameworks/wef-global-skills-taxonomy/skills/critical-thinking',
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
                                type: 'Alignment',
                                targetName: 'Critical Thinking',
                                frameworkId: 'wef-global-skills-taxonomy',
                                targetUrl:
                                    'https://example.com/frameworks/wef-global-skills-taxonomy/skills/critical-thinking',
                            },
                            {
                                type: 'Alignment',
                                targetName: 'Communication',
                                frameworkId: 'pathsmith-durable-skills-starter-edition',
                            },
                        ],
                    },
                },
            },
        ];

        const result = mapBoostsToSkills(credentials as never[]);

        expect(result).not.toEqual([]);
        expect(Object.values(result).flatMap(entries => entries.map(entry => entry.skill))).toEqual(
            ['Critical Thinking', 'Critical Thinking', 'Communication']
        );
    });

    it('ignores legacy skills when alignments are absent', () => {
        const result = mapBoostsToSkills([
            {
                skills: [{ category: 'legacy', skill: 'Legacy Skill', subskills: [] }],
            },
        ] as never[]);

        expect(result).toEqual([]);
    });
});
