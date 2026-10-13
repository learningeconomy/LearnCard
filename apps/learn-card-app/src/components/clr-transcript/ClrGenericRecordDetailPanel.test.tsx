import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { setLocale } from '../../paraglide/runtime.js';
import * as m from '../../paraglide/messages.js';
import ClrGenericRecordDetailPanel from './ClrGenericRecordDetailPanel';
import { ClrOtherRecordsSection } from './ClrOtherRecordsSection';
const closeModal = vi.hoisted(() => vi.fn());
vi.mock('learn-card-base', () => ({
    useModal: () => ({ closeModal }),
    isSkillCompetencyAlignment: () => false,
    SkillCompetencyCard: () => null,
}));
vi.mock('./ClrTranscriptEvidenceList', () => ({ default: () => null }));
const credential = {
    type: ['ClrCredential'],
    credentialSubject: {
        achievement: [
            { id: 'license', achievementType: 'License', name: 'Shared title' },
            {
                id: 'volunteer',
                achievementType: 'VolunteerExperience',
                name: 'Shared title',
                alignment: [
                    {
                        targetName: 'Community framework',
                        targetUrl: 'https://example.org/community',
                    },
                ],
            },
        ],
        association: [
            {
                type: 'Association',
                associationType: 'isRelatedTo',
                sourceId: 'volunteer',
                targetId: 'license',
            },
            {
                type: 'Association',
                associationType: 'isRelatedTo',
                sourceId: 'volunteer',
                targetId: 'missing',
            },
        ],
    },
};
beforeEach(() => setLocale('en', { reload: false }));
afterEach(() => setLocale('en', { reload: false }));

describe('generic CLR record details', () => {
    it('preserves identities, renders mixed-record alignments and navigates to the associated qualification', () => {
        const model = normalizeClrTranscriptDisplayModel(credential);
        const select = vi.fn();
        render(<ClrOtherRecordsSection model={model} onSelectRecord={select} />);
        expect(screen.getByText('Community framework')).toBeInTheDocument();
        expect(screen.getByText('(Target unresolved)')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Shared title' }));
        expect(select).toHaveBeenLastCalledWith(model.otherRecords[0].sourceCredentialId);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open Shared title: Related Shared title' })
        );
        expect(select).toHaveBeenLastCalledWith(model.awards[0].sourceCredentialId);
    });
    it('renders a qualification in the shared detail panel and supports closing it', () => {
        const model = normalizeClrTranscriptDisplayModel(credential);
        render(<ClrGenericRecordDetailPanel model={model} record={model.awards[0]} />);
        expect(screen.getByRole('heading', { name: 'Shared title' })).toBeInTheDocument();
        expect(screen.getByText('License')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Close record details' }));
        expect(closeModal).toHaveBeenCalledOnce();
    });
});

describe('localized generic CLR surfaces', () => {
    it.each(['es', 'fr', 'ar'] as const)(
        'localizes other records, counts and detail accessible labels in %s',
        locale => {
            const model = normalizeClrTranscriptDisplayModel(credential);
            const view = render(<ClrOtherRecordsSection model={model} />);
            setLocale(locale, { reload: false });
            view.rerender(<ClrOtherRecordsSection model={model} />);
            expect(
                screen.getByRole('region', { name: m['clrTranscript.details.otherRecords']() })
            ).toBeInTheDocument();
            expect(
                screen.getByText(m['clrTranscript.details.itemCountOne']({ count: 1 }))
            ).toBeInTheDocument();
            const other = {
                ...model.otherRecords[0],
                sourceCredentialId: 'second',
                name: undefined,
            };
            const mixed = { ...model, otherRecords: [...model.otherRecords, other] };
            view.rerender(<ClrOtherRecordsSection model={mixed} />);
            expect(
                screen.getByText(m['clrTranscript.details.itemCountOther']({ count: 2 }))
            ).toBeInTheDocument();
            expect(
                screen.getByRole('heading', { name: m['clrTranscript.details.record']() })
            ).toBeInTheDocument();
            view.rerender(
                <ClrGenericRecordDetailPanel
                    model={model}
                    record={{ ...model.awards[0], name: undefined }}
                />
            );
            expect(
                screen.getByRole('heading', { name: m['clrTranscript.details.recordDetails']() })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('button', {
                    name: m['clrTranscript.details.closeRecordDetails'](),
                })
            ).toBeInTheDocument();
            expect(
                screen.queryByRole('button', { name: 'Close record details' })
            ).not.toBeInTheDocument();
        }
    );
});
