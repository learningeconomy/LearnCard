import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {
        workHistory: 'Work History',
        learningHistory: 'Learning History',
        achievement: 'Achievement',
        accomplishment: 'Accomplishment',
        socialBadge: 'Social Badge',
        accommodation: 'Accommodation',
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

    it('uses indexed category metadata from all records when exact achievements are empty', () => {
        const records = getResumeCredentialRecordsForSection(
            CredentialCategoryEnum.achievement,
            [],
            [
                { uri: 'unknown', vc: vc(undefined) },
                { uri: 'indexed-achievement', category: 'Achievement' },
            ]
        );

        expect(records.map(record => record.uri)).toEqual(['indexed-achievement']);
    });
});
