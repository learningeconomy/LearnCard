import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import {
    ClrTranscriptSurface,
    normalizeClrTranscriptDisplayModel,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import ClrTranscriptFullPage from './surfaces/ClrTranscriptFullPage';

const modal = vi.hoisted(() => ({ newModal: vi.fn(), closeModal: vi.fn() }));
vi.mock('learn-card-base', () => ({
    useModal: () => modal,
    ModalTypes: { Right: 'right' },
    CredentialCategoryEnum: { learningHistory: 'learningHistory' },
    isSkillCompetencyAlignment: () => false,
    SkillCompetencyCard: () => null,
}));
vi.mock('../boost/boost-options-menu/ShareBoostLink', () => ({ default: () => null }));
vi.mock('./ClrTranscriptDetailModal', () => ({ default: () => null }));
vi.mock('./ClrTranscriptEvidenceList', () => ({ default: () => null }));
vi.mock('./ClrTranscriptSummaryHeader', () => ({ default: () => null }));
vi.mock('./ClrTranscriptWarningsPanel', () => ({ default: () => null }));
vi.mock('./ClrCourseSection', () => ({ default: () => null }));
vi.mock('./ClrAssessmentSection', () => ({ default: () => null }));
vi.mock('./ClrProgramsSection', () => ({ default: () => null }));
vi.mock('./ClrCourseDetailPanel', () => ({ default: () => null }));
vi.mock('./ClrProgramDetailPanel', () => ({ default: () => null }));
vi.mock('./ClrAssessmentDetailPanel', () => ({ default: () => null }));
vi.mock('./ClrCompetencyDetailPanel', () => ({ default: () => null }));
vi.mock('./views/CredentialSummaryView', () => ({ default: () => null }));
vi.mock('./views/SparseAcademicRecordView', () => ({ default: () => null }));

beforeEach(() => vi.clearAllMocks());

describe('duplicate CLR navigation through the full page', () => {
    it.each(['Award', 'CustomPractice'])(
        'opens both %s occurrences with their own claims',
        achievementType => {
            const boost = {
                type: ['ClrCredential'],
                name: 'Academic transcript',
                credentialSubject: {
                    verifiableCredential: ['First', 'Second'].map(name => ({
                        id: 'duplicate',
                        issuer: { name: `${name} issuer` },
                        credentialSubject: {
                            achievement: { name: `${name} record`, achievementType },
                        },
                    })),
                },
            };
            const model = normalizeClrTranscriptDisplayModel(boost);
            render(
                <ClrTranscriptFullPage
                    model={model}
                    boost={boost as unknown as VC}
                    options={{ viewer: 'admin', surface: ClrTranscriptSurface.Full }}
                />
            );
            for (const [index, name] of ['First', 'Second'].entries()) {
                fireEvent.click(screen.getByRole('button', { name: new RegExp(`${name} record`) }));
                expect(modal.newModal).toHaveBeenCalledTimes(index + 1);
                const panel = modal.newModal.mock.calls[index][0];
                expect(panel.props.record.sourceCredentialId).toBe(model.records[index].id);
                const detail = render(<div role="dialog">{panel}</div>);
                const dialog = screen.getByRole('dialog');
                expect(
                    within(dialog).getByRole('heading', { name: `${name} record` })
                ).toBeInTheDocument();
                expect(within(dialog).getByText(`${name} issuer`)).toBeInTheDocument();
                detail.unmount();
            }
        }
    );
});
