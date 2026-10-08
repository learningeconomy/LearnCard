import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { clrAchievementIdAssociations } from '../../../../../packages/credential-library/src/fixtures/clr/achievement-id-associations';
import { normalizeClrTranscriptDisplayModel } from '../../helpers/clrRenderer.helpers';

import ClrCourseTable from './ClrCourseTable';

const model = normalizeClrTranscriptDisplayModel(
    clrAchievementIdAssociations.credential as unknown as Record<string, unknown>
);

describe('ClrCourseTable', () => {
    it('keeps a long grade inside its dedicated column', () => {
        render(<ClrCourseTable courses={model.courses} />);

        const foundationRow = screen.getByRole('button', {
            name: /Foundations of Systems Thinking/,
        });
        const grade = within(foundationRow).getByText('Advanced');

        expect(foundationRow).toHaveClass(
            'grid-cols-[minmax(0,1fr)_64px_72px_24px]',
            'sm:grid-cols-[minmax(0,1fr)_80px_80px_64px_80px_24px]'
        );
        expect(grade.parentElement).toHaveClass('min-w-0', 'pl-2');
        expect(grade).toHaveClass('max-w-full', 'truncate');
        expect(grade).toHaveAttribute('title', 'Advanced');
    });
});
