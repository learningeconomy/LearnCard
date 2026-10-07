import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { clrAchievementIdAssociations } from '../../../../../packages/credential-library/src/fixtures/clr/achievement-id-associations';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';

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
        const superseded = screen.getByRole('button', {
            name: 'Open Applied Systems Design: Superseded by Applied Systems Design',
        });
        expect(unlocks.parentElement).not.toHaveClass('opacity-60');
        expect(superseded.parentElement).toHaveClass('opacity-60');
        expect(screen.queryByText('precedes')).not.toBeInTheDocument();

        fireEvent.click(unlocks);

        expect(onSelectRecord).toHaveBeenCalledWith('urn:uuid:relationship-advanced-credential');
    });

    it('renders a static chip when the related record cannot be opened', () => {
        const foundation = model.courses.find(
            course => course.name?.value === 'Foundations of Systems Thinking'
        )!;
        const relationship = {
            ...model.relationships[foundation.sourceCredentialId][0]!,
            navigable: false,
        };
        const onSelectRecord = vi.fn();
        const { rerender } = render(
            <ClrRelationshipChips relationships={[relationship]} onSelectRecord={onSelectRecord} />
        );

        expect(screen.getByText(relationship.label)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument();

        rerender(<ClrRelationshipChips relationships={[{ ...relationship, navigable: true }]} />);

        expect(screen.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument();
        expect(onSelectRecord).not.toHaveBeenCalled();
    });
    it('explicitly labels unresolved and ambiguous targets without navigation buttons', () => {
        const edge = Object.values(model.relationships).flat()[0];
        render(
            <ClrRelationshipChips
                relationships={[
                    {
                        ...edge,
                        relatedRecordId: 'missing',
                        resolution: 'unresolved',
                        navigable: false,
                    },
                    {
                        ...edge,
                        relatedRecordId: 'duplicate',
                        resolution: 'ambiguous',
                        navigable: false,
                    },
                ]}
                onSelectRecord={vi.fn()}
            />
        );
        expect(screen.getByText('(Target unresolved)')).toBeInTheDocument();
        expect(screen.getByText('(Target ambiguous)')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument();
    });
});
