import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    normalize: vi.fn(),
    inferKind: vi.fn(() => 'transcript'),
    layout: 'academic',
}));

vi.mock('learn-card-base/helpers/credentials/clr/renderer', () => ({
    normalizeClrTranscriptDisplayModel: mocks.normalize,
}));

vi.mock('learn-card-base/helpers/credentials/clr/layout', () => ({
    inferClrLayout: () => ({ kind: mocks.layout }),
    groupClrRecords: () => [],
}));
vi.mock('../clr-renderer/labels', () => ({
    getClrLayoutLabel: () => 'General Record',
    getClrSectionLabel: () => '',
}));

vi.mock('learn-card-base/helpers/credentials/clr/kind', () => ({
    inferClrKindWithTitleFallback: mocks.inferKind,
}));

vi.mock('learn-card-base/svgs/wallet/SkillsIcon', () => ({ SkillsIcon: () => null }));
vi.mock('learn-card-base/svgs/wallet/StudiesIcon', () => ({ StudiesIcon: () => null }));
vi.mock('learn-card-base/components/FlatIcon', () => ({
    FlatIcon: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock('../svgs/PaperClip', () => ({ default: () => null }));

import ClrTranscriptTitleDisplay, {
    getClrCredentialDisplayTitle,
} from './ClrTranscriptTitleDisplay';

const credential = {} as VC;

const createTranscriptModel = (
    gpa?: number,
    title: string | null = 'Silverbrook College Transcript'
) => ({
    canonical: { collection: { name: { value: title ?? 'Transcript' } }, records: [] },
    courses: [],
    programs: [],
    header: { title: title ? { value: title } : undefined },
    summary: {
        gpa: gpa === undefined ? undefined : { value: gpa },
        courseCount: 4,
        explicitCompetencyCount: 0,
        evidenceCount: 0,
    },
});

describe('ClrTranscriptTitleDisplay', () => {
    beforeEach(() => {
        mocks.normalize.mockReset();
        mocks.inferKind.mockReturnValue('transcript');
        mocks.layout = 'academic';
    });

    it('shows "Transcript" label for transcript-kind credentials without GPA', () => {
        mocks.normalize.mockReturnValue(createTranscriptModel());

        render(
            <ClrTranscriptTitleDisplay
                credential={credential}
                fallbackTitle="Fallback Transcript"
            />
        );

        expect(screen.getByText('Transcript')).toBeInTheDocument();
        expect(screen.queryByText(/GPA:/)).not.toBeInTheDocument();
    });

    it('shows "Transcript" label even when GPA is available', () => {
        mocks.normalize.mockReturnValue(createTranscriptModel(3.48));

        render(
            <ClrTranscriptTitleDisplay
                credential={credential}
                fallbackTitle="Fallback Transcript"
            />
        );

        expect(screen.getByText('Transcript')).toBeInTheDocument();
        expect(screen.queryByText(/GPA:/)).not.toBeInTheDocument();
    });

    it('shows "Transcript" label regardless of missing name or GPA', () => {
        mocks.normalize.mockReturnValue(createTranscriptModel(undefined, null));

        render(
            <ClrTranscriptTitleDisplay
                credential={credential}
                fallbackTitle="Fallback Transcript"
            />
        );

        expect(screen.getByText('Transcript')).toBeInTheDocument();
        expect(screen.queryByText(/GPA:/)).not.toBeInTheDocument();
    });
});

describe('CLR primary title parity', () => {
    beforeEach(() => {
        mocks.layout = 'academic';
        mocks.normalize.mockReset();
    });

    it.each([
        ['transcript', 'Transcript'],
        ['course', 'Animation 101'],
        ['degree', 'Film Studies'],
        ['unknown', 'Record Title'],
    ])('matches tile and list selection for %s', (kind, expected) => {
        mocks.inferKind.mockReturnValue(kind);
        mocks.normalize.mockReturnValue({
            ...createTranscriptModel(undefined, 'Record Title'),
            courses: [{ name: { value: 'Animation 101' }, results: [] }],
            programs: [{ name: { value: 'Film Studies' } }],
        });
        const clr = { type: ['VerifiableCredential', 'ClrCredential'] } as VC;
        expect(getClrCredentialDisplayTitle(clr, 'School Name')).toBe(expected);
        render(<ClrTranscriptTitleDisplay credential={clr} fallbackTitle="School Name" />);
        expect(screen.getByText(expected!)).toBeInTheDocument();
        expect(screen.queryByText('School Name')).not.toBeInTheDocument();
    });

    it.each(['general', 'military'])('uses collection names for %s CLR records', layout => {
        mocks.layout = layout;
        mocks.normalize.mockReturnValue(createTranscriptModel(undefined, 'Service Record'));
        const clr = { type: ['ClrCredential'] } as VC;
        expect(getClrCredentialDisplayTitle(clr, 'Fallback')).toBe('Service Record');
        render(<ClrTranscriptTitleDisplay credential={clr} fallbackTitle="Fallback" />);
        expect(screen.getByText('Service Record')).toBeInTheDocument();
    });

    it.each(['course', 'degree', 'unknown'])('falls back when %s metadata is missing', kind => {
        mocks.inferKind.mockReturnValue(kind);
        mocks.normalize.mockReturnValue(createTranscriptModel(undefined, null));
        expect(getClrCredentialDisplayTitle({ type: ['ClrCredential'] } as VC, 'Fallback')).toBe(
            'Fallback'
        );
    });

    it('preserves fallback for malformed CLR and non-CLR credentials', () => {
        mocks.normalize.mockImplementation(() => {
            throw new Error('Invalid CLR');
        });
        expect(getClrCredentialDisplayTitle({ type: ['ClrCredential'] } as VC, 'Fallback')).toBe(
            'Fallback'
        );
        expect(
            getClrCredentialDisplayTitle({ type: ['VerifiableCredential'] } as VC, 'Original')
        ).toBe('Original');
    });
});
