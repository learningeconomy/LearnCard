import { describe, it, expect } from 'vitest';

import {
    templateToJson,
    jsonToTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import {
    staticField,
    systemField,
    type OBv3CredentialTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { FIELD_DESCRIPTORS } from './fieldDescriptors';
import type { ActivityField } from './credentialTypeCatalog';
import { readResultState, writeResult, type ResultType } from './resultField';

const baseTemplate = (): OBv3CredentialTemplate => ({
    schemaType: 'obv3',
    contexts: [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    types: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: staticField('Test'),
    issuer: { id: systemField('issuer_did'), name: staticField('Issuer') },
    credentialSubject: {
        id: systemField('recipient_did'),
        achievement: {
            name: staticField('Test Achievement'),
            description: staticField('A test'),
            achievementType: staticField('Course'),
        },
    },
    validFrom: systemField('issue_date'),
    customFields: [],
});

const DESCRIPTOR_KEYS = Object.keys(FIELD_DESCRIPTORS) as ActivityField[];

describe('FieldDescriptor get/set symmetry', () => {
    const sample: Record<string, string> = {
        completionDate: '2025-06-05',
        startDate: '2025-01-10',
        creditsEarned: '3',
        creditHours: '10 hours',
        term: 'Fall 2025',
        licenseNumber: 'RN-1234567',
        role: 'Gold Member',
        humanCode: 'CS101',
        fieldOfStudy: 'Computer Science',
        specialization: 'Machine Learning',
        version: '2.1',
        expiryDate: '2030-12-31',
        memberId: 'M-00482',
    };

    DESCRIPTOR_KEYS.forEach(key => {
        it(`round-trips ${key} (set then get)`, () => {
            const descriptor = FIELD_DESCRIPTORS[key];
            const value = sample[key];
            const next = descriptor.set(baseTemplate(), value);
            expect(descriptor.get(next)).toBe(value);
        });
    });

    it('exposes a specRef for every descriptor', () => {
        DESCRIPTOR_KEYS.forEach(key => {
            expect(FIELD_DESCRIPTORS[key].specRef).toBeTruthy();
        });
    });
});

describe('OBv3 Result / ResultDescription', () => {
    it('emits a standards-pure linked pair for a letter grade', () => {
        const t = writeResult(baseTemplate(), { resultType: 'LetterGrade', value: 'A-' });
        const json = templateToJson(t) as any;

        const descriptions = json.credentialSubject.achievement.resultDescription;
        const results = json.credentialSubject.result;

        expect(descriptions).toHaveLength(1);
        expect(descriptions[0].id).toMatch(/^urn:uuid:/);
        expect(descriptions[0].name).toBe('Final Grade');
        expect(descriptions[0].resultType).toBe('LetterGrade');

        expect(results).toHaveLength(1);
        expect(results[0].value).toBe('A-');
        expect(results[0].resultDescription).toBe(descriptions[0].id);
    });

    it('uses status (not value) for Status result type', () => {
        const t = writeResult(baseTemplate(), { resultType: 'Status', value: 'Completed' });
        const json = templateToJson(t) as any;

        expect(json.credentialSubject.result[0].status).toBe('Completed');
        expect(json.credentialSubject.result[0].value).toBeUndefined();
    });

    it('keeps the ResultDescription id stable across edits', () => {
        const first = writeResult(baseTemplate(), { resultType: 'LetterGrade', value: 'A-' });
        const firstId = (templateToJson(first) as any).credentialSubject.achievement
            .resultDescription[0].id;

        const second = writeResult(first, { resultType: 'Percent', value: '95' });
        const secondId = (templateToJson(second) as any).credentialSubject.achievement
            .resultDescription[0].id;

        expect(secondId).toBe(firstId);
    });

    it('round-trips through JSON back into typed state', () => {
        const t = writeResult(baseTemplate(), { resultType: 'GradePointAverage', value: '3.8' });
        const json = templateToJson(t);
        const parsed = jsonToTemplate(json);
        const state = readResultState(parsed);

        expect(state.resultType).toBe<ResultType>('GradePointAverage');
        expect(state.value).toBe('3.8');
        expect(state.isLegacyUntyped).toBe(false);
    });

    it('flags a bare imported result as legacy untyped', () => {
        const t = baseTemplate();
        t.credentialSubject.result = [{ id: 'r', value: staticField('B+') }];
        const state = readResultState(t);

        expect(state.isLegacyUntyped).toBe(true);
        expect(state.value).toBe('B+');
    });

    it('clears the pair when value is emptied', () => {
        const filled = writeResult(baseTemplate(), { resultType: 'LetterGrade', value: 'A-' });
        const cleared = writeResult(filled, { resultType: 'LetterGrade', value: '' });

        expect(cleared.credentialSubject.result).toBeUndefined();
        expect(cleared.credentialSubject.achievement.resultDescription).toBeUndefined();
    });
});
