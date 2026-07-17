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
            const { records, vcs } = compileSamplePersona(persona, SUBJECT_DID);

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
