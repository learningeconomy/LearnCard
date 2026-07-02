import { describe, it, expect } from 'vitest';

import {
    jsonToTemplate,
    templateToJson,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import {
    ctdlToObv3Json,
    normalizeToObv3,
    isCredentialLike,
    isCtdlResource,
    readOrgProfile,
    ctdlOwnerRef,
} from './normalizeToObv3';

const CTID = 'ce-a1b2c3d4-1111-2222-3333-444455556666';

const ctdlResource = {
    '@type': 'ceterms:Certification',
    'ceterms:ctid': CTID,
    'ceterms:name': { 'en-US': 'Certified Widget Maker' },
    'ceterms:description': { 'en-US': 'Demonstrates widget mastery.' },
    'ceterms:subjectWebpage': 'https://example.org/cert',
    'ceterms:image': 'https://example.org/badge.png',
    'ceterms:credentialType': 'ceterms:Certification',
};

describe('type guards', () => {
    it('detects a CTDL resource by ceterms keys', () => {
        expect(isCtdlResource(ctdlResource)).toBe(true);
        expect(isCtdlResource({ name: 'x' })).toBe(false);
    });

    it('detects a credential-like object', () => {
        expect(isCredentialLike({ '@context': [], credentialSubject: {} })).toBe(true);
        expect(isCredentialLike({ '@context': [] })).toBe(false);
    });
});

describe('ctdlToObv3Json', () => {
    it('maps CTDL language-map fields onto an OBv3 achievement', () => {
        const { obv3Json } = ctdlToObv3Json(ctdlResource);
        const achievement = (obv3Json.credentialSubject as any).achievement;
        expect(achievement.name).toBe('Certified Widget Maker');
        expect(achievement.description).toBe('Demonstrates widget mastery.');
        expect(achievement.achievementType).toBe('Certification');
        expect(achievement.image).toBe('https://example.org/badge.png');
        expect(achievement.criteria.id).toBe('https://example.org/cert');
    });

    it('emits the canonical Credential Engine alignment for the CTID', () => {
        const { obv3Json } = ctdlToObv3Json(ctdlResource);
        const alignment = (obv3Json.credentialSubject as any).achievement.alignment[0];
        expect(alignment.targetFramework).toBe('Credential Engine Registry');
        expect(alignment.targetType).toBe('ceterms:Credential');
        expect(alignment.targetCode).toBe(CTID);
    });

    it('round-trips the CTID back into the editable ctid field via jsonToTemplate', () => {
        const { obv3Json } = ctdlToObv3Json(ctdlResource);
        const template = jsonToTemplate(obv3Json);
        expect(template.credentialSubject.achievement.ctid?.value).toBe(CTID);
    });
});

describe('ctdlToObv3Json — real registry data enrichment', () => {
    const nursing = {
        '@id': 'https://credentialengineregistry.org/resources/ce-9b314fa9-d7b5-403e-95cd-95fd6107e8a1',
        '@type': 'ceterms:Certificate',
        'ceterms:ctid': 'ce-9b314fa9-d7b5-403e-95cd-95fd6107e8a1',
        'ceterms:name': { 'en-US': 'Diploma in Practical Nursing' },
        'ceterms:description': { 'en-US': 'A program that prepares individuals…' },
        'ceterms:inLanguage': ['en-US'],
        'ceterms:subjectWebpage': 'https://www.employflorida.com/x',
        'ceterms:occupationType': [
            {
                '@type': 'ceterms:CredentialAlignmentObject',
                'ceterms:framework': 'https://www.onetcenter.org/taxonomy.html',
                'ceterms:targetNode': 'https://www.onetonline.org/link/summary/29-2061.00',
                'ceterms:codedNotation': '29-2061.00',
                'ceterms:frameworkName': { 'en-US': 'Standard Occupational Classification' },
                'ceterms:targetNodeName': { 'en-US': 'Licensed Practical and Vocational Nurses' },
                'ceterms:targetNodeDescription': { 'en-US': 'Care for patients…' },
            },
        ],
        'ceterms:instructionalProgramType': [
            {
                '@type': 'ceterms:CredentialAlignmentObject',
                'ceterms:targetNode':
                    'https://nces.ed.gov/ipeds/cipcode/cipdetail.aspx?cip=51.3901',
                'ceterms:codedNotation': '51.3901',
                'ceterms:frameworkName': { 'en-US': 'Classification of Instructional Programs' },
                'ceterms:targetNodeName': {
                    'en-US': 'Licensed Practical/Vocational Nurse Training.',
                },
            },
        ],
        'ceterms:estimatedCost': [
            {
                '@type': 'ceterms:CostProfile',
                'ceterms:directCostType': {
                    '@type': 'ceterms:CredentialAlignmentObject',
                    'ceterms:targetNode': 'costType:AggregateCost',
                    'ceterms:targetNodeName': { 'en-US': 'Aggregate Cost' },
                },
            },
        ],
    };

    it('infers achievementType from @type when credentialType is absent', () => {
        const { obv3Json } = ctdlToObv3Json(nursing);
        expect((obv3Json.credentialSubject as any).achievement.achievementType).toBe('Certificate');
    });

    it('harvests occupation and instructional-program alignments, plus the CTID alignment', () => {
        const { obv3Json } = ctdlToObv3Json(nursing);
        const alignment = (obv3Json.credentialSubject as any).achievement.alignment;
        const urls = alignment.map((a: any) => a.targetUrl);
        expect(urls).toContain('https://www.onetonline.org/link/summary/29-2061.00');
        expect(urls).toContain('https://nces.ed.gov/ipeds/cipcode/cipdetail.aspx?cip=51.3901');
        expect(alignment[0].targetFramework).toBe('Credential Engine Registry');
    });

    it('skips bare-term alignment nodes like cost type (non-URL targetNode)', () => {
        const { obv3Json } = ctdlToObv3Json(nursing);
        const alignment = (obv3Json.credentialSubject as any).achievement.alignment;
        const urls = alignment.map((a: any) => a.targetUrl);
        expect(urls).not.toContain('costType:AggregateCost');
    });

    it('maps inLanguage and uses subjectWebpage as criteria', () => {
        const { obv3Json } = ctdlToObv3Json(nursing);
        const achievement = (obv3Json.credentialSubject as any).achievement;
        expect(achievement.inLanguage).toBe('en-US');
        expect(achievement.criteria.id).toBe('https://www.employflorida.com/x');
    });

    it('sets achievement.id to the registry resource URI (@id)', () => {
        const { obv3Json } = ctdlToObv3Json({ ...nursing });
        expect((obv3Json.credentialSubject as any).achievement.id).toBe(nursing['@id']);
    });

    it('tags harvested alignments with targetType CTDL and the CTID alignment with ceterms:Credential', () => {
        const { obv3Json } = ctdlToObv3Json(nursing);
        const alignment = (obv3Json.credentialSubject as any).achievement.alignment;
        expect(alignment[0].targetType).toBe('ceterms:Credential');
        const occupation = alignment.find(
            (a: any) => a.targetUrl === 'https://www.onetonline.org/link/summary/29-2061.00'
        );
        expect(occupation.targetType).toBe('CTDL');
    });

    it('maps ceterms:requires condition profiles into criteria.narrative', () => {
        const withRequires = {
            ...nursing,
            'ceterms:requires': [
                {
                    '@type': 'ceterms:ConditionProfile',
                    'ceterms:description': { 'en-US': 'Complete 1500 clinical hours.' },
                },
            ],
        };
        const { obv3Json } = ctdlToObv3Json(withRequires);
        expect((obv3Json.credentialSubject as any).achievement.criteria.narrative).toBe(
            'Complete 1500 clinical hours.'
        );
    });

    it('emits a creator Profile from a resolved org, never as the issuer', () => {
        const { obv3Json } = ctdlToObv3Json(nursing, undefined, {
            id: 'https://credentialengineregistry.org/resources/ce-org',
            name: 'Herzing University',
            url: 'https://herzing.edu',
        });
        const creator = (obv3Json.credentialSubject as any).achievement.creator;
        expect(creator.type).toEqual(['Profile']);
        expect(creator.name).toBe('Herzing University');
        expect(obv3Json.issuer).toBe('{{issuer_did}}');
    });
});

describe('achievementType mapping — CTDL classes → OBv3 AchievementType', () => {
    const typeFor = (ctdlType: string, extra: Record<string, unknown> = {}): string => {
        const { obv3Json } = ctdlToObv3Json({
            '@type': ctdlType,
            'ceterms:name': { 'en-US': 'X' },
            ...extra,
        });
        return (obv3Json.credentialSubject as any).achievement.achievementType;
    };

    it('maps the real BA/MAEd credential (ce-9437231a) to BachelorDegree, not Achievement', () => {
        expect(typeFor('ceterms:BachelorOfArtsDegree')).toBe('BachelorDegree');
    });

    it.each([
        ['ceterms:BachelorOfArtsDegree', 'BachelorDegree'],
        ['ceterms:BachelorOfScienceDegree', 'BachelorDegree'],
        ['ceterms:AssociateOfAppliedScienceDegree', 'AssociateDegree'],
        ['ceterms:MasterOfScienceDegree', 'MasterDegree'],
        ['ceterms:ResearchDoctorate', 'ResearchDoctorate'],
        ['ceterms:ProfessionalDoctorate', 'ProfessionalDoctorate'],
        ['ceterms:SpecialistDegree', 'Degree'],
        ['ceterms:AcademicCertificate', 'Certificate'],
        ['ceterms:CertificateOfCompletion', 'CertificateOfCompletion'],
        ['ceterms:MasterCertificate', 'MasterCertificate'],
        ['ceterms:PreApprenticeshipCertificate', 'ApprenticeshipCertificate'],
        ['ceterms:SecondarySchoolDiploma', 'SecondarySchoolDiploma'],
        ['ceterms:DigitalBadge', 'Badge'],
        ['ceterms:License', 'License'],
        ['ceterms:MicroCredential', 'MicroCredential'],
        ['ceterms:LearningProgram', 'LearningProgram'],
    ])('maps %s → %s', (ctdlType, expected) => {
        expect(typeFor(ctdlType)).toBe(expected);
    });

    it('falls back on the suffix heuristic for unenumerated CTDL degree subclasses', () => {
        expect(typeFor('ceterms:BachelorOfFineArtsDegree')).toBe('BachelorDegree');
        expect(typeFor('ceterms:DoctorOfMedicineDegree')).toBe('DoctoralDegree');
    });

    it('prefers ceterms:credentialType, reading its targetNode wrapper', () => {
        expect(
            typeFor('ceterms:Credential', {
                'ceterms:credentialType': {
                    '@type': 'ceterms:CredentialAlignmentObject',
                    'ceterms:targetNode': 'credentialType:MasterDegree',
                },
            })
        ).toBe('MasterDegree');
    });

    it('defaults to Achievement when nothing resolves', () => {
        expect(typeFor('ceterms:Credential')).toBe('Achievement');
    });
});

describe('org provenance helpers', () => {
    const org = {
        '@id': 'https://credentialengineregistry.org/resources/ce-org',
        '@type': 'ceterms:CredentialOrganization',
        'ceterms:name': { 'en-US': 'Herzing University' },
        'ceterms:subjectWebpage': 'https://herzing.edu',
    };

    it('extracts the owning org reference, falling back to offeredBy', () => {
        expect(ctdlOwnerRef({ 'ceterms:ownedBy': [org['@id']] })).toBe(org['@id']);
        expect(ctdlOwnerRef({ 'ceterms:offeredBy': [org['@id']] })).toBe(org['@id']);
    });

    it('reads an org resource into a creator Profile', () => {
        expect(readOrgProfile(org)).toEqual({
            id: org['@id'],
            name: 'Herzing University',
            url: 'https://herzing.edu',
            image: undefined,
        });
    });
});

describe('creator + targetType round-trip through the template model', () => {
    it('preserves creator (without collapsing into issuer) and alignment targetType', () => {
        const { obv3Json } = ctdlToObv3Json(
            {
                '@id': 'https://credentialengineregistry.org/resources/ce-x',
                '@type': 'ceterms:Certificate',
                'ceterms:ctid': 'ce-a1b2c3d4-1111-2222-3333-444455556666',
                'ceterms:name': { 'en-US': 'Practical Nursing' },
                'ceterms:occupationType': [
                    {
                        '@type': 'ceterms:CredentialAlignmentObject',
                        'ceterms:targetNode': 'https://www.onetonline.org/link/summary/29-2061.00',
                        'ceterms:targetNodeName': { 'en-US': 'LPN' },
                    },
                ],
            },
            undefined,
            { name: 'Herzing University', url: 'https://herzing.edu' }
        );

        const template = jsonToTemplate(obv3Json);
        expect(template.credentialSubject.achievement.creator?.name?.value).toBe(
            'Herzing University'
        );

        const reSerialized = templateToJson(template);
        const achievement = (reSerialized.credentialSubject as any).achievement;
        expect(achievement.creator.name).toBe('Herzing University');
        expect(achievement.creator.type).toEqual(['Profile']);
        expect(JSON.stringify(achievement.creator)).not.toContain('issuer_did');
        const ctdlAlignment = achievement.alignment.find((a: any) => a.targetType === 'CTDL');
        expect(ctdlAlignment.targetUrl).toBe('https://www.onetonline.org/link/summary/29-2061.00');
    });
});

describe('normalizeToObv3', () => {
    it('marks CTDL imports with credential-engine provenance', () => {
        const result = normalizeToObv3(ctdlResource, {
            source: 'credential-engine',
            label: 'Credential Engine',
            ctid: CTID,
        });
        expect(result.provenance.source).toBe('credential-engine');
        expect(result.provenance.ctid).toBe(CTID);
    });

    it('passes an existing credential through untouched', () => {
        const credential = {
            '@context': ['x'],
            type: ['VerifiableCredential'],
            credentialSubject: {},
        };
        const result = normalizeToObv3(credential, { source: 'paste', label: 'pasted' });
        expect(result.obv3Json).toBe(credential);
    });

    it('unwraps a Credential Engine @graph envelope and picks the node matching the CTID', () => {
        const envelope = {
            '@context': 'https://credentialengineregistry.org/graph/v1',
            '@id': `https://credentialengineregistry.org/graph/${CTID}`,
            '@graph': [
                { '@type': 'ceterms:Organization', 'ceterms:name': { 'en-US': 'Some College' } },
                ctdlResource,
            ],
        };
        const result = normalizeToObv3(envelope, {
            source: 'credential-engine',
            label: 'Credential Engine',
            ctid: CTID,
        });
        const achievement = (result.obv3Json.credentialSubject as any).achievement;
        expect(achievement.name).toBe('Certified Widget Maker');
        expect(result.provenance.ctid).toBe(CTID);
    });

    it('throws a friendly error for unrecognized input', () => {
        expect(() => normalizeToObv3({ foo: 'bar' }, { source: 'paste', label: 'x' })).toThrow(
            /couldn't recognize/i
        );
    });
});
