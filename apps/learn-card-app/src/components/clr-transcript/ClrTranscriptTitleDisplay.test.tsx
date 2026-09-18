import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    normalize: vi.fn(),
    inferKind: vi.fn(() => 'transcript'),
}));

vi.mock('../../helpers/clrRenderer.helpers', () => ({
    normalizeClrTranscriptDisplayModel: mocks.normalize,
}));

vi.mock('./clrKind.helpers', () => ({
    inferClrKindWithTitleFallback: mocks.inferKind,
}));

vi.mock('learn-card-base/svgs/wallet/SkillsIcon', () => ({ SkillsIcon: () => null }));
vi.mock('learn-card-base/svgs/wallet/StudiesIcon', () => ({ StudiesIcon: () => null }));
vi.mock('learn-card-base/components/FlatIcon', () => ({
    FlatIcon: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock('../svgs/PaperClip', () => ({ default: () => null }));

import ClrTranscriptTitleDisplay from './ClrTranscriptTitleDisplay';

const credential = {} as VC;

const createTranscriptModel = (
    gpa?: number,
    title: string | null = 'Silverbrook College Transcript'
) => ({
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
        mocks.inferKind.mockClear();
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
