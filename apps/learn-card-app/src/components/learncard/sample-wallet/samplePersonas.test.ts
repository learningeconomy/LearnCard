import { describe, it, expect } from 'vitest';

import { DEMO_URI_PREFIX } from 'learn-card-base/stores/demoSessionStore';

import { SAMPLE_PERSONAS, compileSamplePersona, getRecommendedPersona } from './samplePersonas';

const SUBJECT_DID = 'did:key:test-subject';

describe('samplePersonas', () => {
    it('recommends a persona for every onboarding role and falls back to the first', () => {
        expect(getRecommendedPersona('teacher').id).toBe('educator');
        expect(getRecommendedPersona('learner').id).toBe('rising-graduate');
        expect(getRecommendedPersona('unknown-role').id).toBe(SAMPLE_PERSONAS[0].id);
        expect(getRecommendedPersona(null).id).toBe(SAMPLE_PERSONAS[0].id);
    });

    describe.each(SAMPLE_PERSONAS.map(persona => [persona.id, persona] as const))(
        'compileSamplePersona(%s)',
        (_id, persona) => {
            const { records, vcs, boosts } = compileSamplePersona(persona, SUBJECT_DID);

            it('uses lc:demo: uris everywhere and resolves every record uri', () => {
                records.forEach(record => {
                    expect(record.uri.startsWith(DEMO_URI_PREFIX)).toBe(true);
                    expect(vcs[record.uri]).toBeDefined();
                });
                Object.keys(vcs).forEach(uri => expect(uri.startsWith(DEMO_URI_PREFIX)).toBe(true));
            });

            it('patches the subject DID and includes a placeholder proof on every VC', () => {
                Object.values(vcs).forEach(vc => {
                    const subject = Array.isArray(vc.credentialSubject)
                        ? vc.credentialSubject[0]
                        : vc.credentialSubject;

                    expect(subject?.id).toBe(SUBJECT_DID);
                    expect((vc as { proof?: { type?: string } }).proof?.type).toBeTruthy();
                });
            });

            it('stages the AI insight credential with pathway references', () => {
                const insightRecord = records.find(record => record.id === '__ai_insight__');
                expect(insightRecord?.category).toBe('AI Insight');

                const insightVC = vcs[insightRecord!.uri] as {
                    insights?: {
                        strongestArea?: { title?: string; summary?: string };
                        weakestArea?: { summary?: string };
                        roomForGrowth?: { summary?: string };
                        suggestedPathways?: string[];
                    };
                };

                expect(insightVC.insights?.strongestArea?.summary).toBeTruthy();
                expect(insightVC.insights?.weakestArea?.summary).toBeTruthy();
                expect(insightVC.insights?.roomForGrowth?.summary).toBeTruthy();

                const pathwayUris = insightVC.insights?.suggestedPathways ?? [];
                expect(pathwayUris).toHaveLength(persona.staged.pathways.length);
                pathwayUris.forEach(uri => {
                    const pathwayVC = vcs[uri] as {
                        learningPathway?: { step?: { title?: string } };
                    };
                    expect(pathwayVC?.learningPathway?.step?.title).toBeTruthy();
                });
            });

            it('attaches Skills Hub-compatible skills to at least one credential', () => {
                const skillCarriers = Object.values(vcs).filter(vc => {
                    const skills = (vc as { skills?: { category: string }[] }).skills;
                    return Boolean(skills && skills.length > 0);
                });

                expect(skillCarriers.length).toBeGreaterThan(0);
                skillCarriers.forEach(vc => {
                    (vc as { skills: { category: string; skill: string }[] }).skills.forEach(
                        entry => {
                            expect(entry.category).toBeTruthy();
                            expect(entry.skill).toBeTruthy();
                        }
                    );
                });
            });

            it('stages an AI topic with linked session boosts', () => {
                const topicRecord = records.find(
                    record => record.category === 'AI Topic'
                ) as (typeof records)[number] & { boostUri?: string };

                expect(topicRecord?.boostUri).toBeTruthy();

                const topicVC = vcs[topicRecord!.uri] as {
                    boostId?: string;
                    boostCredential?: { topicInfo?: { title?: string } };
                };
                expect(topicVC.boostCredential?.topicInfo?.title).toBe(
                    persona.staged.aiTopic.title
                );

                const topicBoost = boosts[topicVC.boostId!];
                expect(topicBoost?.childUris).toHaveLength(persona.staged.aiTopic.sessions.length);

                topicBoost.childUris.forEach(sessionBoostUri => {
                    expect(boosts[sessionBoostUri]).toBeDefined();

                    const sessionRecord = records.find(
                        record => (record as { boostUri?: string }).boostUri === sessionBoostUri
                    );
                    expect(sessionRecord?.category).toBe('AI Summary');

                    const sessionVC = vcs[sessionRecord!.uri] as {
                        boostCredential?: { summaryInfo?: { title?: string } };
                    };
                    expect(sessionVC.boostCredential?.summaryInfo?.title).toBeTruthy();
                });
            });

            it('stages all skill-profile keys for profile completion', () => {
                const expectedKeys = [
                    'skill-profile-goals',
                    'skill-profile-professional-title',
                    'skill-profile-role-experience',
                    'skill-profile-work-history',
                    'skill-profile-salary',
                    'skill-profile-work-life-balance',
                    'skill-profile-job-stability',
                ];

                expectedKeys.forEach(key => {
                    const record = records.find(
                        r => r.id === `__verifiable_data_${key}__`
                    ) as (typeof records)[number] & { verifiableData?: unknown };

                    expect(record, key).toBeDefined();
                    expect(record?.verifiableData, key).toBeDefined();
                });
            });

            it('stages goals and professional title as verifiable-data records', () => {
                const goalsRecord = records.find(
                    record => record.id === '__verifiable_data_skill-profile-goals__'
                ) as (typeof records)[number] & { verifiableData?: { goals?: string[] } };

                expect(goalsRecord?.verifiableData?.goals).toEqual(persona.staged.goals);

                const titleRecord = records.find(
                    record => record.id === '__verifiable_data_skill-profile-professional-title__'
                ) as (typeof records)[number] & {
                    verifiableData?: { professionalTitle?: string };
                };

                expect(titleRecord?.verifiableData?.professionalTitle).toBe(
                    persona.staged.professionalTitle
                );
            });
        }
    );
});
