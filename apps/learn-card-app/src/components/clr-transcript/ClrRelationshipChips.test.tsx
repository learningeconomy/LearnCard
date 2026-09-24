import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { clrAchievementIdAssociations } from '../../../../../packages/credential-library/src/fixtures/clr/achievement-id-associations';
import { normalizeClrTranscriptDisplayModel } from '../../helpers/clrRenderer.helpers';

import ClrRelationshipChips from './ClrRelationshipChips';

const model = normalizeClrTranscriptDisplayModel(
    clrAchievementIdAssociations.credential as unknown as Record<string, unknown>
);

describe('ClrRelationshipChips', () => {
    it('uses plain-language labels and navigates to the canonical related credential', () => {
        const foundation = model.courses.find(
            course => course.name?.value === 'Foundations of Systems Thinking'
        )!;
        const relationships = model.relationships[foundation.sourceCredentialId];
        const onSelectRecord = vi.fn();

        render(
            <ClrRelationshipChips relationships={relationships} onSelectRecord={onSelectRecord} />
        );

        const unlocks = screen.getByRole('button', {
            name: 'Open Applied Systems Design: Unlocks Applied Systems Design',
        });
        expect(screen.queryByText('precedes')).not.toBeInTheDocument();

        fireEvent.click(unlocks);

        expect(onSelectRecord).toHaveBeenCalledWith('urn:uuid:relationship-advanced-credential');
    });
});
