import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
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
