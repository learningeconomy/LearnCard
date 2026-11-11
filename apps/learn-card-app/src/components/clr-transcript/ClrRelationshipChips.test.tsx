import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clrAchievementIdAssociations } from '../../../../../packages/credential-library/src/fixtures/clr/achievement-id-associations';
import type { RelationshipKind } from 'learn-card-base/helpers/credentials/clr/renderer';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';

import ClrRelationshipChips from './ClrRelationshipChips';
import * as m from '../../paraglide/messages.js';
import { setLocale } from '../../paraglide/runtime.js';

const model = normalizeClrTranscriptDisplayModel(
    clrAchievementIdAssociations.credential as unknown as Record<string, unknown>
);

beforeEach(() => setLocale('en', { reload: false }));
afterEach(() => setLocale('en', { reload: false }));

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
            kind: 'unlock' as const,
            relatedRecordName: 'Applied Systems Design',
            label: 'Legacy English compatibility text',
            navigable: false,
        };
        const onSelectRecord = vi.fn();
        const { rerender } = render(
            <ClrRelationshipChips relationships={[relationship]} onSelectRecord={onSelectRecord} />
        );

        expect(screen.getByText('Unlocks Applied Systems Design')).toBeInTheDocument();
        expect(screen.queryByText(relationship.label)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument();

        rerender(<ClrRelationshipChips relationships={[{ ...relationship, navigable: true }]} />);

        expect(screen.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument();
        expect(onSelectRecord).not.toHaveBeenCalled();
    });
    it('uses the compatibility fallback for an unknown kind without breaking navigation', () => {
        setLocale('es', { reload: false });
        const source = Object.values(model.relationships).flat()[0];
        const relationship = {
            ...source,
            // Simulates a newer producer sending a kind that has no app message yet.
            kind: 'futureRelationship' as RelationshipKind,
            label: 'Supplied compatibility label',
            navigable: true,
            resolution: 'resolved' as const,
        };
        const onSelectRecord = vi.fn();
        const view = render(
            <ClrRelationshipChips relationships={[relationship]} onSelectRecord={onSelectRecord} />
        );
        const button = screen.getByRole('button', {
            name: m['clrTranscript.relationships.openRecord']({
                name: relationship.relatedRecordName,
                label: relationship.label,
            }),
        });
        expect(button).toHaveTextContent(relationship.label);
        fireEvent.click(button);
        expect(onSelectRecord).toHaveBeenCalledWith(relationship.relatedRecordId);

        view.rerender(<ClrRelationshipChips relationships={[relationship]} />);
        expect(screen.getByText(relationship.label)).toBeInTheDocument();
        expect(
            screen.queryByText('clrTranscript.relationships.futureRelationship')
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Abrir / })).not.toBeInTheDocument();
    });

    it.each([
        { locale: 'es', ambiguous: 'Destino ambiguo', unresolved: 'Destino sin resolver' },
        { locale: 'fr', ambiguous: 'Cible ambiguë', unresolved: 'Cible non résolue' },
        { locale: 'ar', ambiguous: 'الهدف ملتبس', unresolved: 'الهدف غير محدد' },
    ] as const)('localizes distinct non-navigable states when switching to $locale', expected => {
        const edge = Object.values(model.relationships).flat()[0];
        const relationships = (['ambiguous', 'unresolved'] as const).map(resolution => ({
            ...edge,
            relatedRecordId: resolution,
            resolution,
            navigable: false,
        }));
        const onSelectRecord = vi.fn();
        const view = render(
            <ClrRelationshipChips relationships={relationships} onSelectRecord={onSelectRecord} />
        );
        expect(screen.getByText('(Target ambiguous)')).toBeInTheDocument();
        expect(screen.getByText('(Target unresolved)')).toBeInTheDocument();
        setLocale(expected.locale, { reload: false });
        view.rerender(
            <ClrRelationshipChips relationships={relationships} onSelectRecord={onSelectRecord} />
        );
        for (const state of ['ambiguous', 'unresolved'] as const) {
            const label = screen.getByText(`(${expected[state]})`);
            expect(label.closest('button')).toBeNull();
            fireEvent.click(label);
        }
        expect(screen.queryByText('(Target ambiguous)')).not.toBeInTheDocument();
        expect(screen.queryByText('(Target unresolved)')).not.toBeInTheDocument();
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

describe('localized relationship kinds', () => {
    it.each(['es', 'fr', 'ar'] as const)(
        'translates every relationship and action in %s using the same model',
        locale => {
            const source = Object.values(model.relationships).flat()[0];
            const kinds = [
                'parent',
                'child',
                'prerequisite',
                'unlock',
                'peer',
                'equivalent',
                'supersededBy',
                'replacement',
                'related',
            ] as const;
            const relationships = kinds.map(kind => ({
                ...source,
                kind,
                relatedRecordName: 'Supplied record',
                relatedRecordId: kind,
                navigable: true,
                resolution: 'resolved' as const,
            }));
            const select = vi.fn();
            const view = render(
                <ClrRelationshipChips relationships={relationships} onSelectRecord={select} />
            );
            setLocale(locale, { reload: false });
            view.rerender(
                <ClrRelationshipChips relationships={relationships} onSelectRecord={select} />
            );
            for (const kind of kinds) {
                const label = m[`clrTranscript.relationships.${kind}`]({ name: 'Supplied record' });
                const button = screen.getByRole('button', {
                    name: m['clrTranscript.relationships.openRecord']({
                        name: 'Supplied record',
                        label,
                    }),
                });
                fireEvent.click(button);
                expect(select).toHaveBeenLastCalledWith(kind);
            }
        }
    );
});
