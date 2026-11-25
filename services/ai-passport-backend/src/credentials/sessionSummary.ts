import type { UnsignedVC } from '@learncard/types';
import type { SummaryCredentialData } from '../ai/generation-schemas';

/**
 * Factory function to create Summary credential structure with JSON-LD context
 */
export function createSummaryVCStructure(
    issuerDid: string,
    subjectDid: string,
    summaryData: SummaryCredentialData
): UnsignedVC {
    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://ctx.learncard.com/boosts/1.0.1.json',
            {
                type: '@type',
                xsd: 'https://www.w3.org/2001/XMLSchema#',
                lcn: 'https://docs.learncard.com/definitions#',
                SummaryCredential: {
                    '@id': 'lcn:summaryCredential',
                    '@context': {
                        boostId: {
                            '@id': 'lcn:boostId',
                            '@type': 'xsd:string',
                        },
                        summaryInfo: {
                            '@id': 'lcn:summaryInfo',
                            '@context': {
                                title: {
                                    '@id': 'lcn:title',
                                    '@type': 'xsd:string',
                                },
                                summary: {
                                    '@id': 'lcn:summary',
                                    '@type': 'xsd:string',
                                },
                                learned: {
                                    '@id': 'lcn:learned',
                                    '@container': '@set',
                                    '@type': 'xsd:string',
                                },
                                skills: {
                                    '@id': 'lcn:skillsSummary',
                                    '@container': '@set',
                                    '@context': {
                                        title: {
                                            '@id': 'lcn:skillsSummaryTitle',
                                            '@type': 'xsd:string',
                                        },
                                        description: {
                                            '@id': 'lcn:skillsSummaryDescription',
                                            '@type': 'xsd:string',
                                        },
                                    },
                                },
                                reflections: {
                                    '@id': 'lcn:reflections',
                                    '@container': '@set',
                                    '@context': {
                                        title: {
                                            '@id': 'lcn:reflectionTitle',
                                            '@type': 'xsd:string',
                                        },
                                        description: {
                                            '@id': 'lcn:reflectionDescription',
                                            '@type': 'xsd:string',
                                        },
                                    },
                                },
                                nextSteps: {
                                    '@id': 'lcn:nextSteps',
                                    '@container': '@set',
                                    '@context': {
                                        title: {
                                            '@id': 'lcn:nextStepsTitle',
                                            '@type': 'xsd:string',
                                        },
                                        description: {
                                            '@id': 'lcn:nextStepsDescription',
                                            '@type': 'xsd:string',
                                        },
                                        keywords: {
                                            '@id': 'lcn:nextStepsKeywords',
                                            '@context': {
                                                occupations: {
                                                    '@id': 'lcn:nextStepsOccupationKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                careers: {
                                                    '@id': 'lcn:nextStepsCareerKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                jobs: {
                                                    '@id': 'lcn:nextStepsJobKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                skills: {
                                                    '@id': 'lcn:nextStepsSkillKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                fieldOfStudy: {
                                                    '@id': 'lcn:nextStepsFieldOfStudy',
                                                    '@type': 'xsd:string',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ],
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'SummaryCredential', 'BoostCredential'],
        issuer: issuerDid,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: subjectDid },
        summaryInfo: summaryData,
    };
}
