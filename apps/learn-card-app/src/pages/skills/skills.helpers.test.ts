import { describe, expect, it } from 'vitest';

import { aggregateCategorizedEntries, getTopSkills, mapBoostsToSkills } from './skills.helpers';

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

    it('only maps alignments from allowed frameworks', () => {
        const credentials = [
            {
                credentialSubject: {
                    achievement: {
                        alignment: [
                            {
                                type: 'Alignment',
                                targetName: 'Curiosity',
                                targetFramework: 'WEF Global Skills',
                                targetUrl:
                                    'https://example.com/frameworks/wef-global-skills-taxonomy/skills/curiosity',
                            },
                            {
                                type: 'Alignment',
                                targetName: 'A long course learning outcome',
                                targetFramework: 'Open Syllabus',
                                targetUrl: 'https://example.com/opensyllabus/outcomes/123',
                            },
                        ],
                    },
                },
            },
        ];

        const result = mapBoostsToSkills(credentials as never[], ['wef-global-skills-taxonomy']);

        expect(Object.values(result).flatMap(entries => entries.map(entry => entry.skill))).toEqual(
            ['Curiosity']
        );
    });
});

describe('getTopSkills', () => {
    it('combines the same skill name across frameworks', () => {
        const mappedSkills = mapBoostsToSkills([
            {
                credentialSubject: {
                    achievement: {
                        alignment: [
                            {
                                type: 'Alignment',
                                targetName: 'Curiosity',
                                targetFramework: 'WEF Global Skills',
                            },
                            {
                                type: 'Alignment',
                                targetName: 'Curiosity',
                                targetFramework: 'Pathsmith Durable Skills',
                            },
                        ],
                    },
                },
            },
        ] as never[]);
        const categorizedSkills = Object.entries(mappedSkills);
        const aggregatedSkills = aggregateCategorizedEntries(categorizedSkills);

        expect(getTopSkills(aggregatedSkills, 3)).toEqual([
            {
                name: 'Curiosity',
                count: 2,
                type: 'skill',
            },
        ]);
    });
});
