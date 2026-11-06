import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { clrAchievementIdAssociations } from '../../../../../packages/credential-library/src/fixtures/clr/achievement-id-associations';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';

import ClrCourseTable from './ClrCourseTable';

const model = normalizeClrTranscriptDisplayModel(
    clrAchievementIdAssociations.credential as unknown as Record<string, unknown>
);

describe('ClrCourseTable', () => {
    it('keeps the full long-grade value available in the course row', () => {
        render(<ClrCourseTable courses={model.courses} />);

        const foundationRow = screen.getByRole('button', {
            name: /Foundations of Systems Thinking/,
        });
        const grade = within(foundationRow).getByText('Advanced');

        expect(grade).toHaveClass('max-w-full', 'truncate');
        expect(grade).toHaveAttribute('title', 'Advanced');
    });
});
