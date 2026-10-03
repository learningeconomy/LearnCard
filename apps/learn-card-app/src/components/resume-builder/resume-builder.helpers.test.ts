import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {
        workHistory: 'Work History',
        learningHistory: 'Learning History',
        achievement: 'Achievement',
        accomplishment: 'Accomplishment',
        socialBadge: 'Social Badge',
        accommodation: 'Accommodation',
        qualifications: 'Qualifications',
        experience: 'Experience',
        workExperience: 'Work Experience',
        course: 'Course',
    },
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: (credential: { __category?: string }) =>
        credential.__category ?? 'Achievement',
}));

import type { VC } from '@learncard/types';
import { CredentialCategoryEnum } from 'learn-card-base';

import {
    getResumeCredentialRecordsForSection,
    toResumeCredentialRecords,
} from './resume-builder.helpers';

const vc = (category?: string, extra: Record<string, unknown> = {}): VC =>
    ({ __category: category, ...extra } as unknown as VC);

describe('resume-builder helpers', () => {
    it('keeps LearnCloud list records and filters records without a URI', () => {
        expect(
            toResumeCredentialRecords([
                { uri: 'resolved', vc: vc('Achievement') },
                { uri: 'list-record', category: 'Achievement', title: 'Indexed Achievement' },
                { vc: vc('Achievement') },
            ])
        ).toEqual([
            { uri: 'resolved', vc: vc('Achievement') },
            { uri: 'list-record', category: 'Achievement', title: 'Indexed Achievement' },
        ]);
    });

    it('includes alias categories for work history', () => {
        const records = getResumeCredentialRecordsForSection(
            CredentialCategoryEnum.workHistory,
            [],
            [
                { uri: 'work', vc: vc('Work History') },
                { uri: 'job', vc: vc('Job') },
                { uri: 'experience', vc: vc('Experience') },
                { uri: 'course', vc: vc('Course') },
            ]
        );

        expect(records.map(record => record.uri)).toEqual(['work', 'job', 'experience']);
    });

    it('uses indexed category metadata when exact section records are empty', () => {
        const records = getResumeCredentialRecordsForSection(
            CredentialCategoryEnum.socialBadge,
            [],
            [
                { uri: 'unknown', vc: vc(undefined) },
                { uri: 'indexed-badge', category: 'Social Badge' },
            ]
        );

        expect(records.map(record => record.uri)).toEqual(['indexed-badge']);
    });

    it('keeps qualifications in their own resume section', () => {
        const records = getResumeCredentialRecordsForSection(
            CredentialCategoryEnum.qualifications,
            [],
            [
                { uri: 'license', vc: vc('Qualifications') },
                { uri: 'certification', category: 'Qualifications' },
                { uri: 'achievement', vc: vc('Achievement') },
                { uri: 'manual-id', category: 'ID', vc: vc('Qualifications') },
            ]
        );

        expect(records.map(record => record.uri)).toEqual(['license', 'certification']);
    });
});
